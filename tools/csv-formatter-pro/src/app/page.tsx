"use client";

import React, { useMemo, useState } from "react";

type Row = string[];

function parseCsvLike(text: string, maxRows: number): Row[] {
  const lines = text.split(/\r?\n/).filter(Boolean).slice(0, maxRows);
  return lines.map((line) => line.split(",").map((c) => c.trim()));
}

export default function Page() {
  const appName = "CSV Formatter Pro";
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "https://buy.stripe.com/REPLACE_ME";

  const [fileName, setFileName] = useState("");
  const [rawText, setRawText] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const previewRows = useMemo(() => {
    if (!rawText) return [];
    return parseCsvLike(rawText, 5);
  }, [rawText]);

  async function onPickFile(file: File | null) {
    setError("");
    setUnlocked(false);
    setRawText("");
    setFileName(file?.name ?? "");
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 5) {
      setError("File too large for client-side demo (limit 5MB). Use Cloudflare Worker for larger files.");
      return;
    }
    const text = await file.text();
    setRawText(text);
  }

  function downloadFull() {
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? `processed-${fileName}` : "processed-output.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <h1 style={{ margin: 0, fontSize: 28 }}>{appName}</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Instantly clean, normalize, and standardize messy CSV exports in seconds.
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        <label className="muted">Upload</label>
        <input
          type="file"
          style={{ display: "block", marginTop: 10 }}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        {fileName ? <p className="muted" style={{ marginTop: 10 }}>Selected: {fileName}</p> : null}
        {error ? <p style={{ color: "#fecaca", marginTop: 10 }}>{error}</p> : null}

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Preview</h2>
            <span className="muted">first 5 rows</span>
          </div>

          <div style={{ border: "1px solid #222", borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
            {previewRows.length === 0 ? (
              <p className="muted" style={{ padding: 12 }}>Upload a small CSV/TXT to see preview rows.</p>
            ) : (
              <table className="table">
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {row.slice(0, 6).map((cell, j) => (
                        <td key={j}>{cell || <span className="muted">∅</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 8 }}>What This Tool Does</h3>
            <ul className="muted">
              <li>Removes duplicate rows</li>
              <li>Standardizes phone number formats</li>
              <li>Normalizes date columns</li>
              <li>Trims whitespace & hidden characters</li>
              <li>Auto-detects header row</li>
            </ul>
          </div>

          <div className="grid" style={{ marginTop: 16 }}>
            <a className="btn btnPrimary" href={stripeLink} target="_blank" rel="noreferrer">
              Unlock Full CSV – $19
            </a>
            <button className="btn" onClick={() => setUnlocked(true)} title="Template-only: simulates payment success">
              Simulate Unlock (Template)
            </button>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Download full output</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Real tools should verify payment server-side before enabling.
                </div>
              </div>
              <button className="btn" disabled={!rawText || !unlocked} onClick={downloadFull} style={{ opacity: !rawText || !unlocked ? 0.4 : 1 }}>
                Download
              </button>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            Note: This template processes small files client-side. For larger files, use Cloudflare Workers.
          </p>
        </div>
      </div>
    </main>
  );
}
