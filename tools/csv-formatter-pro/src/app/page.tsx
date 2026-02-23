"use client";

import React, { useMemo, useState } from "react";

type Row = string[];

/**
 * Minimal CSV parser that supports:
 * - comma-separated values
 * - quoted values with commas
 * - double-quote escaping ("")
 */
function parseCsv(text: string): Row[] {
  const result: Row[] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : "";

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentField);
        // Only add non-empty rows
        if (currentRow.some(c => c.trim() !== "")) {
          result.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r" && nextChar === "\n") i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentRow.length > 0 || currentField !== "") {
    currentRow.push(currentField);
    if (currentRow.some(c => c.trim() !== "")) {
      result.push(currentRow);
    }
  }

  return result;
}

function cleanData(rows: Row[]): Row[] {
  if (rows.length === 0) return [];

  // 1. Trim whitespace & hidden characters
  const trimmed = rows.map(row => row.map(cell => cell.replace(/[\u200B-\u200D\uFEFF]/g, "").trim()));

  // 2. Remove duplicate rows
  const seen = new Set<string>();
  const unique: Row[] = [];
  for (const row of trimmed) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }

  // 3. Standardize formats (Phones & Dates)
  return unique.map(row => row.map(cell => {
    const digits = cell.replace(/\D/g, "");
    if (/^\+?[\d\s\-()]{7,20}$/.test(cell) && digits.length >= 10 && digits.length <= 15) {
      const last10 = digits.slice(-10);
      return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
    }

    if (
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(cell) ||
      /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(cell)
    ) {
      const date = new Date(cell);
      if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
    }
    return cell;
  }));
}

export default function Page() {
  const appName = "CSV Formatter Pro";
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "https://buy.stripe.com/REPLACE_ME";

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const processedRows = useMemo(() => {
    return cleanData(rows);
  }, [rows]);

  const previewRows = useMemo(() => {
    return processedRows.slice(0, 6); // Header + 5 rows
  }, [processedRows]);

  async function onPickFile(file: File | null) {
    setError("");
    setUnlocked(false);
    setRows([]);
    setFileName(file?.name ?? "");
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 5) {
      setError("File too large for client-side demo (limit 5MB). Use Cloudflare Worker for larger files.");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      setRows(parsed);
    } catch (err) {
      setError("Failed to read file. Please ensure it's a valid CSV or text file.");
    }
  }

  function downloadFull() {
    const csvContent = processedRows.map(row =>
      row.map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")
          ? `"${escaped}"`
          : escaped;
      }).join(",")
    ).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? `processed-${fileName}` : "processed-output.csv";
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
        <label className="muted">Upload CSV</label>
        <input
          type="file"
          accept=".csv,.txt"
          style={{ display: "block", marginTop: 10 }}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        {fileName ? <p className="muted" style={{ marginTop: 10 }}>Selected: {fileName}</p> : null}
        {error ? <p style={{ color: "#fecaca", marginTop: 10 }}>{error}</p> : null}

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Preview</h2>
            <span className="muted">first 5 rows (cleaned)</span>
          </div>

          <div style={{ border: "1px solid #222", borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
            {previewRows.length === 0 ? (
              <p className="muted" style={{ padding: 12 }}>Upload a small CSV to see a cleaned preview.</p>
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
              <li>Trims whitespace & hidden characters</li>
              <li>Removes duplicate rows</li>
              <li>Standardizes phone numbers (US format)</li>
              <li>Normalizes date columns (YYYY-MM-DD)</li>
              <li>Supports quoted CSV fields</li>
            </ul>
          </div>

          <div className="grid" style={{ marginTop: 16 }}>
            <a className="btn btnPrimary" href={stripeLink} target="_blank" rel="noreferrer">
              Unlock Full CSV – $19
            </a>
            {process.env.NODE_ENV !== "production" ? (
              <button className="btn" onClick={() => setUnlocked(true)} title="Dev-only: simulates payment success">
                Simulate Unlock (Dev)
              </button>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>Download full output</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Enable this button by paying {process.env.NODE_ENV !== "production" ? 'or clicking "Simulate Unlock"' : ''}.
                </div>
              </div>
              <button
                className="btn"
                disabled={processedRows.length === 0 || !unlocked}
                onClick={downloadFull}
                style={{ opacity: processedRows.length === 0 || !unlocked ? 0.4 : 1 }}
              >
                Download
              </button>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            Note: This template processes files client-side. For 100MB+ files, consider a Cloudflare Worker backend.
          </p>
        </div>
      </div>
    </main>
  );
}