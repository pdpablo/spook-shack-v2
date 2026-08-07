// Turn raw intel items into reusable, correlatable pivots.

function hostOf(v) {
  try {
    return new URL(v).hostname.toLowerCase();
  } catch (_e) {
    return "";
  }
}

export function pivotsFor(item) {
  const out = new Set();
  const v = String(item.value || "").toLowerCase().trim();
  if (!v) return [];
  if (item.item_type === "url") {
    const h = hostOf(v);
    if (h) out.add(h);
  } else if (["ip", "domain", "hash", "email"].includes(item.item_type)) {
    out.add(v);
  }
  if (item.threat_actor) out.add(String(item.threat_actor).toLowerCase().trim());
  if (item.victim_org) out.add(String(item.victim_org).toLowerCase().trim());
  (item.tags || []).forEach((t) => {
    const tag = String(t).toLowerCase().trim();
    if (tag.length > 3 && !["rss", "breach", "phishing", "ransomware", "telegram", "leak", "tweetfeed", "vulnerability"].includes(tag))
      out.add(tag);
  });
  return [...out].filter((p) => p.length > 3);
}

// Pivots seen in more than one source = a cross-source correlation.
export function correlations(items, minSources = 2) {
  const map = new Map();
  for (const item of items) {
    for (const p of pivotsFor(item)) {
      if (!map.has(p)) map.set(p, { pivot: p, sources: new Set(), items: [] });
      const e = map.get(p);
      e.sources.add(item.source_name || item.source_slug);
      e.items.push(item);
    }
  }
  return [...map.values()]
    .filter((e) => e.sources.size >= minSources)
    .map((e) => ({ pivot: e.pivot, sources: [...e.sources], count: e.items.length, items: e.items.slice(0, 8) }))
    .sort((a, b) => b.sources.length - a.sources.length || b.count - a.count);
}

export function countBy(items, key) {
  const map = new Map();
  for (const i of items) {
    const k = i[key] || "unknown";
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function dailyVolume(items, days = 14) {
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
    buckets.set(d, 0);
  }
  for (const it of items) {
    const raw = it.published_date || it.created_date;
    const d = new Date(raw);
    if (isNaN(d)) continue;
    const key = d.toISOString().slice(5, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
  }
  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}