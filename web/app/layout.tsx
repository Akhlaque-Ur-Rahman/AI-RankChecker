import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RankCheck Pro",
  description: "SEO rank checker via Serper + Google Apps Script",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
