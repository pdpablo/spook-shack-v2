import { jsPDF } from "jspdf";

function safeName(value) {
  return String(value || "export")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "export";
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename, data) {
  const body = JSON.stringify(data, null, 2);
  downloadBlob(filename, new Blob([body], { type: "application/json;charset=utf-8" }));
}

export function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([String(text ?? "")], { type: mime }));
}

function chunkLines(doc, lines, x, y, lineHeight, bottom) {
  let cursorY = y;
  for (const line of lines) {
    const safeLine = String(line ?? "");
    const wrapped = doc.splitTextToSize(safeLine, 180);
    for (const part of wrapped) {
      if (cursorY > bottom) {
        doc.addPage();
        cursorY = 18;
      }
      doc.text(part, x, cursorY);
      cursorY += lineHeight;
    }
  }
  return cursorY;
}

export function reportToPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 14;
  const bottom = 285;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  chunkLines(doc, [report.title || "Threat intelligence report"], left, y, 7, bottom);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = chunkLines(
    doc,
    [
      `${report.period || "period"} report · confidence ${report.confidence || "n/a"} · ${report.items_analyzed || 0} records`,
      `${String(report.period_start || "").slice(0, 10)} → ${String(report.period_end || "").slice(0, 10)} · prepared by ${report.author_name || "Hermes"}`,
    ],
    left,
    y,
    6,
    bottom,
  );
  y += 4;

  const sections = [
    ["Executive summary", report.executive_summary],
    ["Key findings", (report.key_findings || []).map((x) => `• ${x}`).join("\n")],
    ["Threat landscape overview", report.threat_landscape],
    ["Notable threat actors & campaigns", (report.notable_actors || []).map((x) => `• ${x}`).join("\n")],
    ["Targeted sectors", (report.targeted_sectors || []).map((x) => `• ${x}`).join("\n")],
    ["Targeted geographies", (report.targeted_geographies || []).map((x) => `• ${x}`).join("\n")],
    ["Indicators of compromise", (report.indicators || []).map((x) => `• ${x}`).join("\n")],
    ["Assessment & outlook", report.assessment_outlook],
    ["Recommendations", (report.recommendations || []).map((x) => `• ${x}`).join("\n")],
    ["Sources & methodology", report.sources_methodology],
  ];

  for (const [heading, body] of sections) {
    if (!body) continue;
    if (y > bottom - 20) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(heading, left, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    y = chunkLines(doc, String(body).split("\n"), left, y, 5.2, bottom);
    y += 4;
  }

  return doc;
}

export function downloadReportPdf(report) {
  if (!report) return;
  const doc = reportToPdf(report);
  doc.save(`${safeName(report.title || `${report.period || "report"}-intel`)}.pdf`);
}

function stixIndicatorPattern(item) {
  const value = String(item.value || "").trim();
  switch (item.item_type) {
    case "ip":
      return value ? `[ipv4-addr:value = '${value.replace(/'/g, "\\'")}']` : "";
    case "domain":
      return value ? `[domain-name:value = '${value.replace(/'/g, "\\'")}']` : "";
    case "email":
      return value ? `[email-addr:value = '${value.replace(/'/g, "\\'")}']` : "";
    case "url":
      return value ? `[url:value = '${value.replace(/'/g, "\\'")}']` : "";
    case "hash": {
      const key = value.length === 64 ? "SHA-256" : value.length === 40 ? "SHA-1" : "MD5";
      return value ? `[file:hashes.'${key}' = '${value.replace(/'/g, "\\'")}']` : "";
    }
    default:
      return value ? `[x-spook-shack:value = '${value.replace(/'/g, "\\'")}']` : "";
  }
}

export function itemsToStixBundle({ source, items = [], label = "Spook Shack IOC export" } = {}) {
  const created = new Date().toISOString();
  const objects = [];
  const identityId = `identity--${cryptoRandomId()}`;
  objects.push({
    type: "identity",
    spec_version: "2.1",
    id: identityId,
    created,
    modified: created,
    name: label,
    identity_class: "organization",
  });

  for (const item of items) {
    const pattern = stixIndicatorPattern(item);
    if (!pattern) continue;
    const indicatorId = `indicator--${cryptoRandomId()}`;
    const object = {
      type: "indicator",
      spec_version: "2.1",
      id: indicatorId,
      created,
      modified: created,
      name: item.title || item.value || "Indicator",
      description: [item.summary, item.source_name, item.severity].filter(Boolean).join(" · "),
      pattern_type: "stix",
      pattern,
      valid_from: item.published_date || item.created_date || created,
      labels: [
        item.item_type || "other",
        item.source_kind || source?.kind || "spook-shack",
        ...(Array.isArray(item.tags) ? item.tags.slice(0, 5) : []),
      ].filter(Boolean),
      external_references: item.link
        ? [{ source_name: item.source_name || source?.name || "Spook Shack", url: item.link }]
        : undefined,
    };
    objects.push(object);
  }

  if (source) {
    objects.push({
      type: "note",
      spec_version: "2.1",
      id: `note--${cryptoRandomId()}`,
      created,
      modified: created,
      object_refs: objects.filter((o) => o.type === "indicator").map((o) => o.id),
      content: `${source.name || source.slug} IOC export`,
      authors: [label],
    });
  }

  return {
    type: "bundle",
    id: `bundle--${cryptoRandomId()}`,
    objects,
  };
}

export function downloadItemsStix({ source, items = [] } = {}) {
  const bundle = itemsToStixBundle({ source, items });
  const filename = `${safeName(source?.slug || source?.name || "source")}-stix.json`;
  downloadJson(filename, bundle);
}

export function itemsToCsv(items = []) {
  const headers = [
    "created_date",
    "source_name",
    "source_slug",
    "item_type",
    "value",
    "title",
    "severity",
    "verdict",
    "published_date",
    "link",
    "threat_actor",
    "victim_org",
    "sector",
    "country",
    "tags",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [headers.map(esc).join(",")];
  for (const item of items) {
    rows.push(
      [
        item.created_date,
        item.source_name,
        item.source_slug,
        item.item_type,
        item.value,
        item.title,
        item.severity,
        item.verdict,
        item.published_date,
        item.link,
        item.threat_actor,
        item.victim_org,
        item.sector,
        item.country,
        Array.isArray(item.tags) ? item.tags.join(" | ") : "",
      ].map(esc).join(","),
    );
  }
  return rows.join("\n");
}

export function downloadItemsCsv({ source, items = [] } = {}) {
  const csv = itemsToCsv(items);
  const filename = `${safeName(source?.slug || source?.name || "source")}-iocs.csv`;
  downloadText(filename, csv, "text/csv;charset=utf-8");
}

function cryptoRandomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
