// ================================================================
//  RANK CHECKER — Google Apps Script
//  Repo copy: web/apps-script/gsc-rank-checker-v2.gs (Next.js project ke andar)
//  Paste this entire file into script.google.com → Deploy as Web App
//
//  Handles Serper.dev (any keyword) + optional GSC (owned sites)
//
//  SETUP:
//  1. Go to https://script.google.com → open your project (or create new)
//  2. Paste this entire file, replacing old code
//  3. Click ⚙ Project Settings → Script Properties → Add property:
//       Name:  SERPER_KEY
//       Value: your key from serper.dev (free: 2500 searches)
//     Optional: RANKINGS_SHEET_ID = Google Sheet ID for default append target
//  4. For GSC support: click Services (+) → add "Search Console API"
//  5. Deploy → New Deployment → Web App
//       Execute as: Me | Who has access: Anyone
//  6. Copy the Web App URL → paste into RankCheck Pro (npm run dev in /web)
// ================================================================

function doGet(e) {
  return buildResponse({ status: "ok", message: "Rank Checker API running" });
}

function parseSerperResponse_(res) {
  var code = res.getResponseCode();
  var text = res.getContentText() || "";
  if (code < 200 || code >= 300) {
    throw new Error("Serper HTTP " + code + ": " + text.substring(0, 280));
  }
  return JSON.parse(text);
}

/** Serper JSON body: q, gl, hl, num, location; device=mobile when requested (omit on desktop). */
function buildSerperPayload_(q, opts) {
  var payload = {
    q: q,
    gl: opts.gl || "in",
    hl: opts.hl || "en",
    num: Math.min(opts.num || 100, 100)
  };
  if (opts.location) payload.location = opts.location;
  if (opts.device === "mobile") payload.device = "mobile";
  return payload;
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    switch (params.action) {
      case "serper_search": return serperSearch(params);
      case "serper_batch":  return serperBatch(params);
      case "append_rankings": return appendRankingsToSheet(params);
      case "list_sites":    return listGSCSites();
      case "gsc_keywords":  return getGSCKeywords(params);
      case "ping":          return pingSerper();
      default: return buildResponse({ error: "Unknown action: " + params.action });
    }
  } catch (err) {
    return buildResponse({ error: err.toString() });
  }
}

// ── Test Serper connection ─────────────────────────────────────────────────
function pingSerper() {
  const key = PropertiesService.getScriptProperties().getProperty("SERPER_KEY");
  if (!key) {
    return buildResponse({
      error: "SERPER_KEY not found. Go to ⚙ Project Settings → Script Properties → add SERPER_KEY = your key from serper.dev"
    });
  }
  const res = UrlFetchApp.fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    payload: JSON.stringify({ q: "test", gl: "in", num: 1 }),
    muteHttpExceptions: true
  });
  const data = parseSerperResponse_(res);
  if (data.error) return buildResponse({ error: "Serper error: " + data.error });
  return buildResponse({ ok: true, message: "Serper.dev connected successfully" });
}

// ── Single keyword search via Serper.dev ──────────────────────────────────
function serperSearch(params) {
  const key = PropertiesService.getScriptProperties().getProperty("SERPER_KEY");
  if (!key) return buildResponse({ error: "SERPER_KEY not set in Script Properties" });

  const { keyword, gl, location, num, targetDomain, hl, device } = params;
  const payload = buildSerperPayload_(keyword, { gl: gl, hl: hl, location: location, num: num, device: device });

  const res = UrlFetchApp.fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const data = parseSerperResponse_(res);
  if (data.error) return buildResponse({ error: "Serper: " + data.error });

  if (targetDomain) {
    const clean = targetDomain.replace(/^www\./, "").toLowerCase();
    const organic = data.organic || [];
    let position = null, url = null, title = null;
    for (const item of organic) {
      const host = (item.link || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
      if (host === clean || host.endsWith("." + clean)) {
        position = item.position; url = item.link; title = item.title; break;
      }
    }
    return buildResponse({
      keyword, position, url, title,
      totalScanned: organic.length,
      found: position !== null
    });
  }

  return buildResponse(data);
}

// ── Batch: check multiple keywords in one call ────────────────────────────
function serperBatch(params) {
  const key = PropertiesService.getScriptProperties().getProperty("SERPER_KEY");
  if (!key) return buildResponse({ error: "SERPER_KEY not set in Script Properties" });

  const { keywords, targetDomain, gl, location, hl, device, gapMs } = params;
  if (!keywords || !keywords.length) return buildResponse({ error: "keywords required" });

  var gap = gapMs;
  if (typeof gap !== "number" || isNaN(gap)) gap = 280;
  gap = Math.max(0, Math.min(2000, Math.round(gap)));

  const clean = (targetDomain || "").replace(/^www\./, "").toLowerCase();
  const results = [];
  const list = keywords.slice(0, 100);

  for (var i = 0; i < list.length; i++) {
    var keyword = list[i];
    try {
      const payload = buildSerperPayload_(keyword, { gl: gl, hl: hl, location: location, num: 100, device: device });

      const res = UrlFetchApp.fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const data = parseSerperResponse_(res);
      if (data.error) { results.push({ keyword: keyword, error: data.error }); continue; }

      const organic = data.organic || [];
      let position = null, url = null, title = null;

      for (const item of organic) {
        const host = (item.link || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
        if (host === clean || host.endsWith("." + clean)) {
          position = item.position; url = item.link; title = item.title; break;
        }
      }

      results.push({ keyword: keyword, position: position, url: url, title: title, totalScanned: organic.length, found: position !== null });
      if (i < list.length - 1 && gap > 0) Utilities.sleep(gap);
    } catch (e) {
      results.push({ keyword: keyword, error: e.message });
    }
  }

  return buildResponse({ results: results, total: results.length });
}

/**
 * Append one ranking run to a Sheet (share the Sheet with the Apps Script Google account).
 * Optional Script Property RANKINGS_SHEET_ID if spreadsheetId omitted in request.
 */
function appendRankingsToSheet(params) {
  var id = params.spreadsheetId || PropertiesService.getScriptProperties().getProperty("RANKINGS_SHEET_ID");
  if (!id) return buildResponse({ error: "spreadsheetId missing (or set RANKINGS_SHEET_ID in Script Properties)" });

  var rows = params.rows;
  if (!rows || !rows.length) return buildResponse({ error: "rows required" });

  var sheetName = params.sheetName || "Monthly_Ranks";
  var runDate = params.runDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  var header = ["RunDate", "Client", "Domain", "Location", "HL", "Device", "Keyword", "Position", "URL", "Title", "ResultsScanned", "Status"];
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]);
  }

  var client = params.client || "";
  var domain = params.domain || "";
  var locLabel = params.locationLabel || "";
  var hl = params.hl || "en";
  var device = params.device || "desktop";

  var values = rows.map(function (r) {
    return [
      runDate,
      client,
      domain,
      locLabel,
      hl,
      device,
      r.keyword || "",
      r.position != null ? r.position : "",
      r.url || "",
      r.title || "",
      r.totalScanned != null ? r.totalScanned : "",
      r.status || ""
    ];
  });

  var startRow = sh.getLastRow() + 1;
  sh.getRange(startRow, 1, startRow + values.length - 1, header.length).setValues(values);
  return buildResponse({ ok: true, appended: values.length, sheetName: sheetName });
}

/**
 * Optional automation: Apps Script → Triggers → Add trigger → Time-driven (e.g. monthly),
 * then implement reading keywords/domain from a "Config" sheet and call serperBatch,
 * then appendRankingsToSheet with the results.
 */
function monthlyRankJobPlaceholder() {
  // Example only: SpreadsheetApp.openById(...); Range.getValues(); serperBatch(...); appendRankingsToSheet(...);
}

// ── List GSC sites ─────────────────────────────────────────────────────────
function listGSCSites() {
  try {
    const res = UrlFetchApp.fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    const data = JSON.parse(res.getContentText());
    if (data.error) return buildResponse({ sites: [], note: "GSC not configured: " + data.error.message });
    return buildResponse({ sites: (data.siteEntry || []).map(s => ({ url: s.siteUrl, level: s.permissionLevel })) });
  } catch (e) {
    return buildResponse({ sites: [], note: "GSC unavailable: " + e.message });
  }
}

// ── GSC keyword positions ─────────────────────────────────────────────────
function getGSCKeywords(params) {
  const { siteUrl, keywords, startDate, endDate, country } = params;
  const sd = startDate || getDateOffset(-31);
  const ed = endDate   || getDateOffset(-3);

  const body = { startDate: sd, endDate: ed, dimensions: ["query"], rowLimit: 25000, dataState: "final" };
  if (country) body.dimensionFilterGroups = [{ filters: [{ dimension: "COUNTRY", operator: "equals", expression: country }] }];

  const res = UrlFetchApp.fetch(
    "https://searchconsole.googleapis.com/webmasters/v3/sites/" + encodeURIComponent(siteUrl) + "/searchAnalytics/query",
    { method: "POST", headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken(), "Content-Type": "application/json" }, payload: JSON.stringify(body), muteHttpExceptions: true }
  );

  const data = JSON.parse(res.getContentText());
  if (data.error) return buildResponse({ error: data.error.message });

  const lookup = {};
  for (const row of (data.rows || [])) {
    lookup[row.keys[0].toLowerCase()] = { position: Math.round(row.position * 10) / 10, clicks: row.clicks, impressions: row.impressions, ctr: parseFloat((row.ctr * 100).toFixed(1)) };
  }

  const results = keywords.map(kw => {
    const m = lookup[kw.toLowerCase().trim()];
    if (m) return { keyword: kw, position: Math.round(m.position), avgPosition: m.position, clicks: m.clicks, impressions: m.impressions, ctr: m.ctr, source: "gsc" };
    return { keyword: kw, position: null, found: false, source: "gsc" };
  });

  return buildResponse({ results, dateRange: { startDate: sd, endDate: ed } });
}

// ── Utils ──────────────────────────────────────────────────────────────────
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, "UTC", "yyyy-MM-dd");
}

function buildResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
