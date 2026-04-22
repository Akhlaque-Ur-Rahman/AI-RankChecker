"use client";

import { useState, useRef, useEffect } from "react";

/** Saved in this browser so you do not re-paste the Web App URL every time. */
const LS_SCRIPT_URL = "rankcheck_pro_webapp_url";
const LS_SHEET_ID = "rankcheck_pro_sheet_id";

const LOCS = [
  { label: "Delhi", gl: "in", loc: "Delhi,India" },
  { label: "Dwarka (Delhi)", gl: "in", loc: "Dwarka,Delhi,India" },
  { label: "Nehru Place (Delhi)", gl: "in", loc: "Nehru Place,New Delhi,India" },
  { label: "Noida", gl: "in", loc: "Noida,Uttar Pradesh,India" },
  { label: "Gurgaon", gl: "in", loc: "Gurgaon,Haryana,India" },
  { label: "Patna", gl: "in", loc: "Patna,Bihar,India" },
  { label: "Jaipur", gl: "in", loc: "Jaipur,Rajasthan,India" },
  { label: "Mumbai", gl: "in", loc: "Mumbai,Maharashtra,India" },
  { label: "Bangalore", gl: "in", loc: "Bangalore,Karnataka,India" },
  { label: "Chennai", gl: "in", loc: "Chennai,Tamil Nadu,India" },
  { label: "Hyderabad", gl: "in", loc: "Hyderabad,Telangana,India" },
  { label: "Kolkata", gl: "in", loc: "Kolkata,West Bengal,India" },
  { label: "Lucknow", gl: "in", loc: "Lucknow,Uttar Pradesh,India" },
  { label: "Pune", gl: "in", loc: "Pune,Maharashtra,India" },
  { label: "Ahmedabad", gl: "in", loc: "Ahmedabad,Gujarat,India" },
  { label: "India (National)", gl: "in", loc: "" },
  { label: "United States", gl: "us", loc: "" },
  { label: "United Kingdom", gl: "gb", loc: "" },
  { label: "Australia", gl: "au", loc: "" },
  { label: "UAE", gl: "ae", loc: "" },
];

const BATCH_CHUNK = 35;

const HL_LANGS = [
  { value: "en", label: "English (en)" },
  { value: "hi", label: "Hindi (hi)" },
  { value: "bn", label: "Bengali (bn)" },
  { value: "ta", label: "Tamil (ta)" },
  { value: "te", label: "Telugu (te)" },
  { value: "mr", label: "Marathi (mr)" },
  { value: "gu", label: "Gujarati (gu)" },
  { value: "kn", label: "Kannada (kn)" },
  { value: "ml", label: "Malayalam (ml)" },
  { value: "pa", label: "Punjabi (pa)" },
];

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

const C = {
  bg: "#080b10",
  bgElev: "#0c1018",
  card: "#111820",
  card2: "#151d28",
  border: "#263041",
  faint: "#1a2431",
  text: "#d8dee9",
  bright: "#f0f6fc",
  muted: "#8b9aaf",
  dim: "#5c6b82",
  green: "#3fb950",
  greenBg: "#0a1f12",
  greenHi: "#56d364",
  blue: "#6eb6ff",
  blueBg: "#0c1828",
  yellow: "#e3b341",
  yellowBg: "#221a08",
  red: "#f85149",
  redBg: "#2d0806",
  cyan: "#39c5cf",
  cyanBg: "#071a1f",
  orange: "#d29922",
  orangeBg: "#1f1606",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-thumb{background:#334155;border-radius:6px}
  input,textarea,select{outline:none;color:#f0f6fc;font-family:'IBM Plex Mono',monospace;transition:border .18s,box-shadow .18s,background .18s}
  input:hover,textarea:hover,select:hover{border-color:#3d4f66!important}
  input:focus,textarea:focus,select:focus{border-color:#6eb6ff!important;box-shadow:0 0 0 3px rgba(110,182,255,.12)!important}
  .btn{border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;border-radius:8px;transition:transform .12s,background .15s,opacity .15s,border-color .15s}
  .btn:active:not(:disabled){transform:scale(.985)}
  .btn:disabled{opacity:.35;cursor:not-allowed!important}
  .btn-g{background:linear-gradient(165deg,#4bdc6a,#2ea043);color:#031008;padding:11px 22px;font-size:14px;box-shadow:0 1px 0 rgba(255,255,255,.12) inset,0 8px 20px -6px rgba(63,185,80,.45)}
  .btn-g:hover:not(:disabled){filter:brightness(1.06)}
  .btn-o{background:rgba(255,255,255,.02);border:1px solid #334155;color:#9aa8bc;padding:8px 16px;font-size:13px;border-radius:8px}
  .btn-o:hover:not(:disabled){border-color:#5c6b82;color:#e6edf3;background:rgba(255,255,255,.04)}
  .btn-r{background:transparent;border:1px solid #4a1520;color:#f85149;padding:8px 16px;border-radius:8px}
  .btn-r:hover:not(:disabled){background:#2d0806}
  .row td{transition:background .12s}
  .row:hover td{background:rgba(110,182,255,.04)}
  .spin{animation:spin .65s linear infinite;display:inline-block}@keyframes spin{to{transform:rotate(360deg)}}
  .pulse{animation:pulse 1.25s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .fade{animation:fade .22s ease}@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  select option{background:#121820;color:#f0f6fc}
  .link{color:#6eb6ff;text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s,color .15s}
  .link:hover{color:#9dc8ff;border-bottom-color:rgba(110,182,255,.45)}
  .tab-pill{border-radius:8px}
  thead th{backdrop-filter:blur(8px)}
`;

function PosBadge({ row }) {
  if (!row) return null;
  const { status, position } = row;
  if (status === "pending")  return <span style={{ color: C.dim, fontFamily: "IBM Plex Mono", fontSize: 12 }}>—</span>;
  if (status === "checking") return <span style={{ color: C.blue, fontFamily: "IBM Plex Mono", fontSize: 13 }}><span className="spin">◌</span></span>;
  if (status === "error")    return <span style={{ background: C.redBg, color: C.red, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontFamily: "IBM Plex Mono" }}>error</span>;
  if (!position) return (
    <span style={{ background: C.yellowBg, color: C.yellow, border: `1px solid ${C.yellow}25`, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontFamily: "IBM Plex Mono" }}>
      not in top 100
    </span>
  );
  const page = Math.ceil(position / 10);
  const [bg, col, bd] =
    position <= 3  ? [C.greenBg,  C.greenHi, C.green]  :
    position <= 10 ? [C.blueBg,   C.blue,    C.blue]   :
    position <= 20 ? [C.cyanBg,   C.cyan,    C.cyan]   :
    position <= 50 ? [C.orangeBg, C.orange,  C.orange] :
                     [C.faint,    C.muted,   C.border];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ background: bg, color: col, border: `1px solid ${bd}35`, padding: "2px 12px", borderRadius: 20, fontSize: 12, fontFamily: "IBM Plex Mono", fontWeight: 500 }}>#{position}</span>
      <span style={{ background: C.faint, color: C.dim, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontFamily: "IBM Plex Mono" }}>P{page}</span>
    </div>
  );
}

export default function App() {
  const [phase, setPhase]         = useState("setup");
  const [scriptUrl, setScriptUrl] = useState("");
  const [domain, setDomain]       = useState("");
  const [client, setClient]       = useState("");
  const [kwRaw, setKwRaw]         = useState("");
  const [locIdx, setLocIdx]       = useState(0);
  const [rows, setRows]           = useState([]);
  const [prog, setProg]           = useState({ n: 0, total: 0 });
  const [paused, setPaused]       = useState(false);
  const [tab, setTab]             = useState("all");
  const [connMsg, setConnMsg]     = useState("");
  const [testing, setTesting]     = useState(false);
  const [hl, setHl]               = useState("en");
  const [deviceMode, setDeviceMode] = useState("desktop");
  const [serperGapMs, setSerperGapMs] = useState(280);
  const [sheetId, setSheetId]     = useState("");
  const [appendToSheet, setAppendToSheet] = useState(false);
  const [sheetMsg, setSheetMsg]   = useState("");
  const [prefsReady, setPrefsReady] = useState(false);
  const pauseRef = useRef(false);
  const stopRef  = useRef(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem(LS_SCRIPT_URL);
      const sid = localStorage.getItem(LS_SHEET_ID);
      if (u) setScriptUrl(u);
      if (sid) setSheetId(sid);
    } catch {
      /* private mode / blocked */
    }
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!prefsReady || typeof window === "undefined") return;
    try {
      const t = scriptUrl.trim();
      if (t) localStorage.setItem(LS_SCRIPT_URL, t);
      else localStorage.removeItem(LS_SCRIPT_URL);
    } catch {
      /* ignore */
    }
  }, [scriptUrl, prefsReady]);

  useEffect(() => {
    if (!prefsReady || typeof window === "undefined") return;
    try {
      const t = sheetId.trim();
      if (t) localStorage.setItem(LS_SHEET_ID, t);
      else localStorage.removeItem(LS_SHEET_ID);
    } catch {
      /* ignore */
    }
  }, [sheetId, prefsReady]);

  function forgetSavedUrl() {
    try {
      localStorage.removeItem(LS_SCRIPT_URL);
      localStorage.removeItem(LS_SHEET_ID);
    } catch {
      /* ignore */
    }
    setScriptUrl("");
    setSheetId("");
    setConnMsg("");
  }

  const loc  = LOCS[locIdx];
  const kws  = kwRaw.split("\n").filter(k => k.trim()).length;
  const pct  = prog.total ? Math.round((prog.n / prog.total) * 100) : 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function cleanDomain(raw) {
    return raw.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }

  // ── Call Apps Script ──────────────────────────────────────────────────────
  async function callScript(body) {
    const res = await fetch(scriptUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} — is the Web App deployed?`);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("Bad response — redeploy the Apps Script"); }
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Test connection ───────────────────────────────────────────────────────
  async function testConnection() {
    setTesting(true);
    setConnMsg("");
    try {
      const d = await callScript({ action: "ping" });
      setConnMsg("✓ " + (d.message || "Connected"));
    } catch (e) {
      setConnMsg("✗ " + e.message);
    }
    setTesting(false);
  }

  // ── Start checking: chunked serper_batch (one Apps Script round trip per chunk) ──
  async function startCheck() {
    const keywords = kwRaw.split("\n").map(k => k.trim()).filter(Boolean);
    const d        = cleanDomain(domain);

    const init = keywords.map((kw, i) => ({
      id: i, keyword: kw, domain: d,
      position: null, url: null, title: null, totalScanned: 0,
      status: "pending", checkedAt: null, error: null,
    }));

    let work = init.map(r => ({ ...r }));
    setRows(init);
    setSheetMsg("");
    setProg({ n: 0, total: keywords.length });
    setPhase("check");
    pauseRef.current = false;
    stopRef.current  = false;

    for (let chunkStart = 0; chunkStart < keywords.length; chunkStart += BATCH_CHUNK) {
      if (stopRef.current) break;
      while (pauseRef.current) { await sleep(300); if (stopRef.current) break; }
      if (stopRef.current) break;

      const chunkKws = keywords.slice(chunkStart, chunkStart + BATCH_CHUNK);
      const chunkIds = chunkKws.map((_, j) => chunkStart + j);

      setRows(w => w.map(r => (chunkIds.includes(r.id) ? { ...r, status: "checking" } : r)));

      const checkedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      try {
        const data = await callScript({
          action: "serper_batch",
          keywords: chunkKws,
          targetDomain: d,
          gl: loc.gl,
          location: loc.loc || undefined,
          hl,
          device: deviceMode,
          gapMs: Math.max(0, Math.min(2000, Math.round(serperGapMs))),
        });

        const list = data.results || [];
        for (let j = 0; j < chunkKws.length; j++) {
          const id = chunkStart + j;
          const item = list[j];
          const cur = work[id];
          if (!item) {
            work[id] = { ...cur, status: "error", error: "Missing result from batch", checkedAt };
            continue;
          }
          if (item.error) {
            work[id] = { ...cur, status: "error", error: String(item.error), checkedAt };
            continue;
          }
          work[id] = {
            ...cur,
            position:     item.position ?? null,
            url:          item.url ?? null,
            title:        item.title ?? null,
            totalScanned: item.totalScanned || 0,
            status:       item.position ? "done" : "not found",
            checkedAt,
          };
        }
        setRows(work.map(r => ({ ...r })));
      } catch (e) {
        for (let j = 0; j < chunkKws.length; j++) {
          const id = chunkStart + j;
          work[id] = { ...work[id], status: "error", error: e.message, checkedAt };
        }
        setRows(work.map(r => ({ ...r })));
      }

      setProg({ n: Math.min(chunkStart + chunkKws.length, keywords.length), total: keywords.length });
    }

    if (!stopRef.current && appendToSheet && sheetId.trim()) {
      try {
        await callScript({
          action: "append_rankings",
          spreadsheetId: sheetId.trim(),
          sheetName: "Monthly_Ranks",
          runDate: new Date().toISOString().split("T")[0],
          client: client.trim(),
          domain: d,
          locationLabel: loc.label,
          hl,
          device: deviceMode,
          rows: work.map(r => ({
            keyword: r.keyword,
            position: r.position,
            url: r.url,
            title: r.title,
            totalScanned: r.totalScanned,
            status: r.status,
          })),
        });
        setSheetMsg("✓ Appended run to Google Sheet (Monthly_Ranks tab).");
      } catch (err) {
        setSheetMsg("✗ Sheet append failed: " + err.message);
      }
    }

    setPhase("done");
  }

  function exportCSV() {
    const hdr = ["Keyword", "Domain", "Location", "HL", "Device", "Position", "Page", "Status", "Ranking URL", "Page Title", "Results Scanned", "Checked At"].join(",");
    const body = rows.map(r => {
      const page = r.position ? Math.ceil(r.position / 10) : "";
      return [
        csvEscape(r.keyword),
        csvEscape(r.domain),
        csvEscape(loc.label),
        csvEscape(hl),
        csvEscape(deviceMode),
        csvEscape(r.position ?? ""),
        csvEscape(page),
        csvEscape(r.status),
        csvEscape(r.url ?? ""),
        csvEscape(r.title ?? ""),
        csvEscape(r.totalScanned ?? ""),
        csvEscape(r.checkedAt ?? ""),
      ].join(",");
    }).join("\n");
    const a = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([hdr + "\n" + body], { type: "text/csv" }));
    a.download = `rankings_${(client || domain).replace(/[^a-z0-9]/gi, "_")}_${loc.label.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const hasPos = r => typeof r.position === "number" && r.position >= 1;
  const top3   = rows.filter(r => hasPos(r) && r.position <= 3).length;
  const top10  = rows.filter(r => hasPos(r) && r.position > 3 && r.position <= 10).length;
  const p2     = rows.filter(r => r.position > 10 && r.position <= 20).length;
  const beyond = rows.filter(r => r.position > 20).length;
  const nf     = rows.filter(r => r.status === "not found").length;
  const errors = rows.filter(r => r.status === "error").length;

  const visible =
    tab === "top3"   ? rows.filter(r => hasPos(r) && r.position <= 3) :
    tab === "top10"  ? rows.filter(r => hasPos(r) && r.position > 3 && r.position <= 10) :
    tab === "p2"     ? rows.filter(r => r.position > 10 && r.position <= 20) :
    tab === "beyond" ? rows.filter(r => r.position > 20) :
    tab === "nf"     ? rows.filter(r => r.status === "not found") :
    rows;

  const lbl = { display: "block", fontSize: 11, fontWeight: 500, color: C.muted, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 7, letterSpacing: "0.03em" };
  const inp = (x = {}) => ({ background: C.bgElev, border: `1px solid ${C.border}`, color: C.bright, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontFamily: "IBM Plex Mono, monospace", ...x });
  const isOk = connMsg.startsWith("✓");
  const gapMsClamped = Math.max(0, Math.min(2000, serperGapMs));
  const approxPerKw = Math.max(0.8, gapMsClamped / 1000 + 1.1);
  const cardShadow = "0 1px 0 rgba(255,255,255,.04) inset, 0 22px 50px -18px rgba(0,0,0,.58)";
  const sectionTitle = { fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: C.dim, fontFamily: "'Plus Jakarta Sans',sans-serif", textTransform: "uppercase", marginBottom: 10, marginTop: 4 };
  const divider = { border: "none", height: 1, background: `linear-gradient(90deg,transparent,${C.border},transparent)`, margin: "18px 0" };
  const pageShell = { minHeight: "100vh", backgroundColor: C.bg, backgroundImage: `radial-gradient(ellipse 80% 55% at 50% -12%, rgba(110,182,255,.11), transparent 50%),radial-gradient(ellipse 40% 30% at 100% 0%, rgba(63,185,80,.07), transparent)` };

  const stepRow = (n, children) => (
    <li style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: 13, color: C.text, lineHeight: 1.55, listStyle: "none" }}>
      <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 9, background: C.card2, border: `1px solid ${C.border}`, color: C.blue, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span style={{ paddingTop: 3 }}>{children}</span>
    </li>
  );

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div style={{ ...pageShell, display: "flex", justifyContent: "center", padding: "36px 20px 56px" }}>
      <style>{css}</style>
      <div style={{ width: "100%", maxWidth: 620 }}>

        <header style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ width: 48, height: 48, background: `linear-gradient(145deg,${C.green},${C.blue})`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 10px 28px -6px rgba(63,185,80,.4)` }}>⌖</div>
            <div style={{ textAlign: "left", maxWidth: 420 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 28, color: C.bright, letterSpacing: "-0.03em" }}>RankCheck Pro</span>
                <span style={{ background: `${C.green}20`, color: C.greenHi, fontSize: 10, fontWeight: 600, padding: "5px 11px", borderRadius: 100, fontFamily: "'Plus Jakarta Sans',sans-serif", border: `1px solid ${C.green}38`, letterSpacing: "0.04em" }}>SERP · TOP 100</span>
              </div>
              <p style={{ color: C.muted, fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>Google organic positions by keyword—batched through Apps Script and Serper, with optional logging to Sheets.</p>
            </div>
          </div>
        </header>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 26px", marginBottom: 20, boxShadow: cardShadow }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 600, color: C.bright, marginBottom: 4 }}>Getting started</h2>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>One-time setup. Script (Next project ke andar): <code style={{ background: C.faint, padding: "2px 8px", borderRadius: 4, color: C.cyan, fontSize: 11 }}>web/apps-script/gsc-rank-checker-v2.gs</code></p>
          <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {stepRow(1, <>Get an API key from <a className="link" href="https://serper.dev" target="_blank" rel="noopener noreferrer">serper.dev</a> (free tier includes 2,500 searches).</>)}
            {stepRow(2, <>Open <a className="link" href="https://script.google.com" target="_blank" rel="noopener noreferrer">Google Apps Script</a>, create a project, paste the contents of <code style={{ background: C.faint, padding: "2px 6px", borderRadius: 4, color: C.cyan, fontSize: 11 }}>web/apps-script/gsc-rank-checker-v2.gs</code>, then <strong style={{ color: C.bright }}>Deploy → Web app</strong> (Execute as: Me, Anyone can access).</>)}
            {stepRow(3, <>In Script Properties add <code style={{ background: C.faint, padding: "2px 6px", borderRadius: 4, color: C.cyan, fontSize: 11 }}>SERPER_KEY</code> with your Serper key. Optionally <code style={{ background: C.faint, padding: "2px 6px", borderRadius: 4, color: C.cyan, fontSize: 11 }}>RANKINGS_SHEET_ID</code> for default Sheet append.</>)}
            {stepRow(4, <>Paste the Web App <code style={{ background: C.faint, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>/exec</code> URL below and run <strong style={{ color: C.bright }}>Test connection</strong>.</>)}
            {stepRow(5, <>Optional: share a Google Sheet with the same Google account as the script, enable <em>Append to Sheet</em>, and use tab <code style={{ background: C.faint, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>Monthly_Ranks</code>.</>)}
            {stepRow(6, <>For scheduled runs: Apps Script → Triggers → Time-driven, and extend <code style={{ background: C.faint, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>monthlyRankJobPlaceholder</code> in the script.</>)}
          </ul>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "26px 28px", boxShadow: cardShadow, display: "flex", flexDirection: "column", gap: 4 }}>

          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 600, color: C.bright, marginBottom: 6 }}>Run configuration</h2>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Connection and search parameters for this check.</p>

          <div style={sectionTitle}>Connection</div>
          <div>
            <label style={lbl}>APPS SCRIPT WEB APP URL *</label>
            <p style={{ fontSize: 11, color: C.dim, marginBottom: 8, lineHeight: 1.45 }}>
              Same browser me save ho jata hai — dubara paste karne ki zarurat nahi. Dusre browser / PC par dubara URL lagana padega.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={scriptUrl} onChange={e => { setScriptUrl(e.target.value); setConnMsg(""); }}
                placeholder="https://script.google.com/macros/s/.../exec"
                style={{ ...inp(), flex: "1 1 220px", minWidth: 0 }} />
              <button type="button" className="btn btn-o" onClick={testConnection}
                disabled={!scriptUrl.trim() || testing}
                style={{ whiteSpace: "nowrap", padding: "0 16px", fontFamily: "IBM Plex Mono", fontSize: 12 }}>
                {testing ? <span className="spin">◌</span> : "Test"}
              </button>
              <button type="button" className="btn btn-o" onClick={forgetSavedUrl}
                disabled={!scriptUrl.trim() && !sheetId.trim()}
                style={{ whiteSpace: "nowrap", padding: "0 12px", fontSize: 12, color: C.dim }}>
                Clear saved
              </button>
            </div>
            {connMsg && (
              <p style={{ fontSize: 13, marginTop: 10, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 500, color: isOk ? C.greenHi : C.red, padding: "10px 12px", borderRadius: 8, background: isOk ? `${C.green}12` : `${C.red}10`, border: `1px solid ${isOk ? `${C.green}28` : `${C.red}25`}` }}>
                {connMsg}
              </p>
            )}
          </div>

          <hr style={divider} />
          <div style={sectionTitle}>Target site</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>WEBSITE DOMAIN *</label>
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="exellercomputer.com" style={{ ...inp(), width: "100%" }} />
            </div>
            <div>
              <label style={lbl}>CLIENT NAME</label>
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client / project" style={{ ...inp(), width: "100%" }} />
            </div>
          </div>

          <div>
            <label style={lbl}>SEARCH LOCATION</label>
            <select value={locIdx} onChange={e => setLocIdx(+e.target.value)} style={{ ...inp(), width: "100%" }}>
              {LOCS.map((l, i) => <option key={i} value={i}>{l.label}</option>)}
            </select>
          </div>

          <hr style={divider} />
          <div style={sectionTitle}>SERP options</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>GOOGLE UI LANGUAGE (HL)</label>
              <select value={hl} onChange={e => setHl(e.target.value)} style={{ ...inp(), width: "100%" }}>
                {HL_LANGS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>SERP DEVICE</label>
              <select value={deviceMode} onChange={e => setDeviceMode(e.target.value)} style={{ ...inp(), width: "100%" }}>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
              <p style={{ fontSize: 11, color: C.dim, marginTop: 6, lineHeight: 1.45 }}>
                If mobile requests fail, use Desktop—Serper may treat <code style={{ fontSize: 10 }}>device</code> differently by account.
              </p>
            </div>
          </div>

          <div>
            <label style={lbl}>DELAY BETWEEN SERPER CALLS (MS)</label>
            <input type="number" min={0} max={2000} step={10} value={serperGapMs}
              onChange={e => setSerperGapMs(Math.max(0, Math.min(2000, +e.target.value || 0)))}
              style={{ ...inp(), width: "100%" }} />
            <p style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>0–2000 · default 280. Lower is faster; respect Serper rate limits. Pause applies between batches of {BATCH_CHUNK}.</p>
          </div>

          <hr style={divider} />
          <div style={sectionTitle}>Reporting</div>
          <div style={{ background: C.bgElev, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 10 }}>
              <input type="checkbox" checked={appendToSheet} onChange={e => setAppendToSheet(e.target.checked)} style={{ width: 17, height: 17, accentColor: C.green }} />
              <span style={{ color: C.text, fontWeight: 500 }}>Append this run to Google Sheet when finished</span>
            </label>
            <label style={lbl}>GOOGLE SHEET ID</label>
            <input value={sheetId} onChange={e => setSheetId(e.target.value)} placeholder="Spreadsheet ID from the /d/___/ part of the URL"
              disabled={!appendToSheet}
              style={{ ...inp(), width: "100%", opacity: appendToSheet ? 1 : 0.42 }} />
          </div>

          <hr style={divider} />
          <div style={sectionTitle}>Keywords</div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "baseline" }}>
              <label style={lbl}>ONE KEYWORD PER LINE *</label>
              <span style={{ fontSize: 11, color: C.dim, fontFamily: "IBM Plex Mono" }}>{kws} keywords</span>
            </div>
            <textarea rows={10} value={kwRaw} onChange={e => setKwRaw(e.target.value)}
              placeholder={"laptop repair delhi\nlaptop repair in dwarka\nbuy refurbished laptop\nhp laptop service center patna\nlaptop screen replacement cost\ndell laptop repair near me\n..."}
              style={{ ...inp(), width: "100%", resize: "vertical", lineHeight: 1.75 }} />
            <p style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>Paste from Sheets or Excel. Up to 100 organic results per keyword.</p>
          </div>

          <button className="btn btn-g" onClick={startCheck}
            disabled={!scriptUrl.trim() || !domain.trim() || !kwRaw.trim() || (appendToSheet && !sheetId.trim())}
            style={{ width: "100%", padding: "14px 18px", fontSize: 15, marginTop: 8 }}>
            Run check · {kws} keyword{kws !== 1 ? "s" : ""} · {loc.label}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.dim }}>
          Batches of {BATCH_CHUNK} · hl={hl} · {deviceMode} · Serper + Apps Script
        </p>
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...pageShell, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{css}</style>

      <header style={{ background: `linear-gradient(180deg,${C.card}f2,${C.card}ee)`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 99, boxShadow: `0 12px 32px -20px rgba(0,0,0,.5)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", minHeight: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden", minWidth: 0 }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(145deg,${C.green},${C.blue})`, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: `0 4px 14px -4px rgba(63,185,80,.4)` }}>⌖</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: C.bright, letterSpacing: "-0.02em" }}>RankCheck Pro</span>
                {client && <span style={{ background: C.faint, color: C.muted, padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace", border: `1px solid ${C.border}` }}>{client}</span>}
              </div>
              <div style={{ color: C.dim, fontSize: 11, fontFamily: "IBM Plex Mono, monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {rows[0]?.domain} · {loc.label} · {hl} · {deviceMode}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
            {phase === "check" && (
              <>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "IBM Plex Mono, monospace", fontWeight: 500 }}>
                  <span className="pulse" style={{ color: C.green }}>●</span> {prog.n}/{prog.total}
                </span>
                <button type="button" className="btn btn-o" onClick={() => { pauseRef.current = !pauseRef.current; setPaused(p => !p); }}>
                  {paused ? "Resume" : "Pause"}
                </button>
                <button type="button" className="btn btn-r" onClick={() => { stopRef.current = true; pauseRef.current = false; setPaused(false); setPhase("done"); }}>
                  Stop
                </button>
              </>
            )}
            {phase === "done" && (
              <>
                <button type="button" className="btn btn-o" onClick={() => { setPhase("setup"); setRows([]); }}>New check</button>
                <button type="button" className="btn btn-g" style={{ fontSize: 13, padding: "8px 18px" }} onClick={exportCSV}>Export CSV</button>
              </>
            )}
          </div>
        </div>
        {phase === "check" && (
          <div style={{ height: 3, background: C.faint }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${C.blue},${C.green})`, transition: "width .35s ease" }} />
          </div>
        )}
      </header>

      <div style={{ padding: "16px 22px 12px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch", borderBottom: `1px solid ${C.border}` }}>
        {[
          ["Total", rows.length, C.bright],
          ["Top 3", top3, C.green],
          ["Page 1 (4–10)", top10, C.blue],
          ["Page 2", p2, C.cyan],
          ["Page 3+", beyond, C.orange],
          ["Not found", nf, C.yellow],
          ...(errors > 0 ? [["Errors", errors, C.red]] : []),
        ].map(([label, val, col]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", minWidth: 88, boxShadow: "0 1px 0 rgba(255,255,255,.03) inset" }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, fontWeight: 600, color: col, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
        {phase === "check" && (
          <div style={{ marginLeft: "auto", alignSelf: "center", fontSize: 12, color: C.dim, fontFamily: "IBM Plex Mono, monospace" }}>
            {pct}% · ~{Math.round((prog.total - prog.n) * approxPerKw)}s
          </div>
        )}
      </div>

      {sheetMsg && phase === "done" && (
        <div style={{ padding: "12px 22px", fontSize: 13, fontWeight: 500, color: sheetMsg.startsWith("✓") ? C.greenHi : C.red, borderBottom: `1px solid ${C.border}`, background: sheetMsg.startsWith("✓") ? `${C.green}0d` : `${C.red}0c` }}>
          {sheetMsg}
        </div>
      )}

      <div style={{ padding: "12px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, overflowX: "auto", background: C.bgElev }}>
        {[
          ["all",    `All (${rows.length})`],
          ["top3",   `Top 3 (${top3})`],
          ["top10",  `Page 1 · 4–10 (${top10})`],
          ["p2",     `Page 2 (${p2})`],
          ["beyond", `Page 3+ (${beyond})`],
          ["nf",     `Not found (${nf})`],
        ].map(([id, label]) => (
          <button type="button" key={id} className="tab-pill" onClick={() => setTab(id)} style={{
            border: `1px solid ${tab === id ? `${C.green}50` : C.border}`,
            background: tab === id ? `${C.green}18` : C.card,
            color: tab === id ? C.bright : C.muted,
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: tab === id ? 600 : 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: "background .15s,border-color .15s,color .15s",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "0 22px 32px", overflowX: "auto" }}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginTop: 16, background: C.card, boxShadow: cardShadow }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                {["#", "Keyword", "Position", "Ranking URL", "Page title", "Scanned", "Time"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: h === "Scanned" ? "center" : "left", fontSize: 10, fontWeight: 600, color: C.dim, fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, background: C.card2, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="row fade" style={{ borderBottom: `1px solid ${C.faint}`, background: row.id % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)" }}>
                  <td style={{ padding: "12px 16px", width: 40, fontSize: 12, color: C.dim, fontFamily: "IBM Plex Mono, monospace" }}>{row.id + 1}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.text, maxWidth: 260, fontWeight: 500 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.keyword}>{row.keyword}</span>
                    {row.error && <span style={{ color: C.red, fontSize: 11, fontFamily: "IBM Plex Mono, monospace", display: "block", marginTop: 4 }}>{row.error}</span>}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}><PosBadge row={row} /></td>
                  <td style={{ padding: "12px 16px", maxWidth: 240 }}>
                    {row.url
                      ? <a className="link" href={row.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.url}>{row.url.replace(/^https?:\/\//, "")}</a>
                      : <span style={{ color: C.dim, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.title || <span style={{ color: C.dim }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: C.dim, fontFamily: "IBM Plex Mono, monospace", textAlign: "center" }}>
                    {row.totalScanned || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: C.dim, fontFamily: "IBM Plex Mono, monospace", whiteSpace: "nowrap" }}>
                    {row.checkedAt || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {visible.length === 0 && phase === "done" && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted, fontSize: 14 }}>No keywords match this filter.</div>
      )}
    </div>
  );
}
