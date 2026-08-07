// @ts-nocheck
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { DEFAULT_SOURCES, nowIso } from "../base44/shared/intel.ts";
import { fetchSource } from "../base44/shared/fetcher.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "spook-shack.json");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT || 8787);
const DEMO_PASSWORD = process.env.SPOOK_SHACK_DEMO_PASSWORD || "SpookShack123!";
const DEMO_ADMIN_EMAIL = process.env.SPOOK_SHACK_ADMIN_EMAIL || "admin@spook.shack";
const DEMO_USER_EMAIL = process.env.SPOOK_SHACK_USER_EMAIL || "analyst@spook.shack";

const ENTITY_MAP = {
  IntelSource: "sources",
  IntelItem: "items",
  IngestionRun: "runs",
  ItemNote: "notes",
  IntelReport: "reports",
  TechForecast: "forecasts",
  User: "users",
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || `item_${Date.now().toString(36)}`;
}

function makeId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const digest = crypto.pbkdf2Sync(String(password), salt, 120_000, 32, "sha256").toString("hex");
  return `${salt}$${digest}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes("$")) return false;
  const [salt, digest] = stored.split("$");
  const check = crypto.pbkdf2Sync(String(password), salt, 120_000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(check, "hex"));
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seededItems() {
  const now = new Date();
  const iso = (daysAgo) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
  return [
    {
      id: makeId("item"),
      created_date: iso(0),
      source_slug: "telegram_leaks",
      source_name: "Telegram Leaks",
      source_kind: "telegram",
      item_type: "vulnerability",
      value: "CVE-2024-3094",
      title: "CVE-2024-3094 — Telegram alert @teleleaks",
      summary: "Telegram leak channel highlighted a potential supply-chain backdoor and urged immediate patch verification.",
      threat_actor: "teleleaks",
      victim_org: "",
      sector: "software supply chain",
      country: "",
      tags: ["telegram", "vulnerability", "CVE-2024-3094", "supply-chain"],
      severity: "critical",
      published_date: iso(0),
      link: "https://t.me/s/teleleaks",
      dedupe_key: "tg:teleleaks:cve-2024-3094",
      verdict: "unreviewed",
      raw_meta: { channel: "teleleaks", post: "seed-1", cves: ["CVE-2024-3094"] },
    },
    {
      id: makeId("item"),
      created_date: iso(1),
      source_slug: "ransomware_live",
      source_name: "Ransomware.live",
      source_kind: "ransomware_live",
      item_type: "victim",
      value: "northbridge manufacturing",
      title: "Northbridge Manufacturing claimed by BlackCat",
      summary: "Public ransomware leak entry announcing a victim claim with stated evidence of data theft.",
      threat_actor: "BlackCat",
      victim_org: "Northbridge Manufacturing",
      sector: "manufacturing",
      country: "US",
      tags: ["ransomware", "BlackCat", "victim"],
      severity: "high",
      published_date: iso(1),
      link: "https://api.ransomware.live/",
      dedupe_key: "rl:blackcat:northbridge-manufacturing",
      verdict: "unreviewed",
      raw_meta: { website: "northbridge.example", discovered: iso(1) },
    },
    {
      id: makeId("item"),
      created_date: iso(2),
      source_slug: "phishunt",
      source_name: "Phishunt",
      source_kind: "phishunt",
      item_type: "url",
      value: "https://login-verification-support.example/",
      title: "Suspected phishing URL — login-verification-support.example",
      summary: "Observed in a suspicious URL feed with brand impersonation traits and credential-harvesting indicators.",
      threat_actor: "",
      victim_org: "",
      sector: "",
      country: "",
      tags: ["phishing", "login-verification-support.example"],
      severity: "high",
      published_date: iso(2),
      link: "https://login-verification-support.example/",
      dedupe_key: "ph:https://login-verification-support.example/",
      verdict: "false_positive",
      raw_meta: { host: "login-verification-support.example" },
    },
    {
      id: makeId("item"),
      created_date: iso(3),
      source_slug: "hibp",
      source_name: "Have I Been Pwned",
      source_kind: "hibp",
      item_type: "breach",
      value: "examplecorp.com",
      title: "ExampleCorp breach — 1,250,000 accounts",
      summary: "Breach catalogue record used to populate the intelligence deck and correlation views.",
      threat_actor: "",
      victim_org: "ExampleCorp",
      sector: "technology",
      country: "US",
      tags: ["breach", "email", "password"],
      severity: "medium",
      published_date: iso(3),
      link: "https://haveibeenpwned.com/",
      dedupe_key: "hibp:examplecorp",
      verdict: "needs_info",
      raw_meta: { pwn_count: 1250000, verified: true, added: iso(3) },
    },
    {
      id: makeId("item"),
      created_date: iso(4),
      source_slug: "cisa_alerts_rss",
      source_name: "CISA Known Exploited Vulnerabilities (RSS)",
      source_kind: "rss",
      item_type: "article",
      value: "cisa advisory zero-day patch guidance",
      title: "CISA advisory recommends urgent patching for actively exploited flaws",
      summary: "Advisory article summarizing exploited vulnerabilities and recommended mitigations.",
      threat_actor: "",
      victim_org: "",
      sector: "",
      country: "",
      tags: ["rss", "cisa_alerts_rss", "vulnerability"],
      severity: "low",
      published_date: iso(4),
      link: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
      dedupe_key: "rss:cisa_alerts_rss:seed-1",
      verdict: "unreviewed",
      raw_meta: { feed: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
    },
  ];
}

function seededReports() {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 86400000).toISOString();
  const end = now.toISOString();
  return [
    {
      id: makeId("report"),
      created_date: nowIso(),
      period: "weekly",
      confidence: "moderate",
      items_analyzed: 4,
      title: "Weekly threat intel brief — ransomware, phishing, and Telegram vulnerability chatter",
      period_start: start,
      period_end: end,
      author_name: "Hermes",
      executive_summary: "This week’s corpus is dominated by a Telegram vulnerability post, a ransomware victim claim, and a phishing URL that likely warrants analyst review.",
      key_findings: [
        "Telegram leak channels continue to publish vulnerability chatter with CVE references.",
        "Ransomware victim claims remain the clearest high-confidence signal in the corpus.",
        "Phishing URL traffic and breach metadata continue to create reusable pivots for correlation.",
      ],
      threat_landscape: "The observed landscape is a blend of opportunistic credential theft, public victim naming, and fast-moving exploit discussion.",
      notable_actors: ["BlackCat", "teleleaks"],
      targeted_sectors: ["manufacturing", "technology"],
      targeted_geographies: ["US"],
      indicators: ["CVE-2024-3094", "https://login-verification-support.example/", "northbridge manufacturing"],
      assessment_outlook: "Expect exploit-chatter channels to remain the fastest route from disclosure to abuse, with ransomware actors amplifying perceived urgency.",
      recommendations: [
        "Prioritize Telegram-derived vulnerability alerts for enrichment and verification.",
        "Review phishing URLs against brand and credential-harvesting heuristics.",
        "Correlate breach records with victims and infrastructure observed in leak feeds.",
      ],
      sources_methodology: "Generated from the current local corpus by aggregating records across Telegram, ransomware, phishing, breach, and advisory sources.",
    },
  ];
}

function seededForecasts() {
  const now = nowIso();
  return [
    {
      id: makeId("forecast"),
      created_date: now,
      tech_name: "AI agentic security workflows",
      classification: "AI/ML",
      maturity: "prototype",
      summary: "Autonomous orchestration layers will become attractive targets for prompt injection, credential theft, and abuse of delegated toolchains.",
      related_existing_tech: ["LLM copilots", "automation runbooks", "SOAR playbooks"],
      existing_attack_vectors: ["tool poisoning", "prompt injection", "privilege escalation through automation"],
      predicted_abuse: ["malicious tool invocation", "model-assisted phishing", "workflow hijacking"],
      likely_threat_actors: ["crimeware groups", "initial access brokers", "disinformation operators"],
      mitigations: ["tool allowlists", "human approval for sensitive actions", "content and prompt validation"],
      risk_score: 8,
      horizon: "0-6 months",
      confidence: "moderate",
      evidence: [{ title: "Internal corpus trend", url: "/feed", kind: "local" }],
      agent_name: "Hermes",
    },
    {
      id: makeId("forecast"),
      created_date: now,
      tech_name: "Post-quantum service migration",
      classification: "cryptography",
      maturity: "research",
      summary: "Hybrid cryptography migration will create configuration drift and downgrade risk before organizations complete endpoint and service coverage.",
      related_existing_tech: ["TLS 1.3", "VPN gateways", "PKI"],
      existing_attack_vectors: ["certificate confusion", "downgrade paths", "misconfiguration"],
      predicted_abuse: ["phishing infrastructure persistence", "legacy crypto fallback abuse"],
      likely_threat_actors: ["advanced persistent threats", "credential thieves"],
      mitigations: ["inventory crypto dependencies", "stage hybrid deployments", "monitor downgrade events"],
      risk_score: 6,
      horizon: "6-18 months",
      confidence: "moderate",
      evidence: [{ title: "NIST PQC migration guidance", url: "https://csrc.nist.gov/Projects/post-quantum-cryptography", kind: "external" }],
      agent_name: "Hermes",
    },
    {
      id: makeId("forecast"),
      created_date: now,
      tech_name: "Edge identity appliances",
      classification: "networking",
      maturity: "early_release",
      summary: "Identity-aware edge appliances will concentrate policy enforcement and create attractive lateral-movement and config-abuse targets.",
      related_existing_tech: ["ZTNA", "SASE", "reverse proxies"],
      existing_attack_vectors: ["config tampering", "relay abuse", "token theft"],
      predicted_abuse: ["policy bypass", "admin interface exploitation", "session replay"],
      likely_threat_actors: ["ransomware operators", "initial access brokers"],
      mitigations: ["MFA everywhere", "management plane isolation", "continuous config drift checks"],
      risk_score: 7,
      horizon: "18-36 months",
      confidence: "low",
      evidence: [{ title: "Internal foresight model", url: "/forecast", kind: "local" }],
      agent_name: "Hermes",
    },
  ];
}

function seededSources() {
  return DEFAULT_SOURCES.map((source) => ({
    id: makeId("src"),
    created_date: nowIso(),
    status: source.status || "active",
    total_items: 0,
    last_ingested_at: "",
    last_status: "",
    discovered_by_crawler: false,
    ...deepClone(source),
  }));
}

function seedState() {
  const admin = {
    id: makeId("usr"),
    created_date: nowIso(),
    email: DEMO_ADMIN_EMAIL,
    full_name: "Spook Shack Admin",
    role: "admin",
    status: "active",
    password_hash: hashPassword(DEMO_PASSWORD),
  };
  const analyst = {
    id: makeId("usr"),
    created_date: nowIso(),
    email: DEMO_USER_EMAIL,
    full_name: "Field Analyst",
    role: "user",
    status: "active",
    password_hash: hashPassword(DEMO_PASSWORD),
  };
  return {
    users: [admin, analyst],
    sessions: {},
    pendingOtps: {},
    passwordResets: {},
    sources: seededSources(),
    items: seededItems(),
    runs: [],
    notes: [],
    reports: seededReports(),
    forecasts: seededForecasts(),
  };
}

function ensureStateShape(raw) {
  const state = raw && typeof raw === "object" ? raw : {};
  for (const key of ["users", "sessions", "pendingOtps", "passwordResets", "sources", "items", "runs", "notes", "reports", "forecasts"]) {
    if (!(key in state)) state[key] = key === "sessions" || key === "pendingOtps" || key === "passwordResets" ? {} : [];
  }
  return state;
}

function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const state = seedState();
      persistState(state);
      return state;
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const state = ensureStateShape(parsed);
    if (!state.users?.length) {
      const seeded = seedState();
      state.users = seeded.users;
      state.sources ||= seeded.sources;
      state.items ||= seeded.items;
      state.reports ||= seeded.reports;
      state.forecasts ||= seeded.forecasts;
    }
    return state;
  } catch (_err) {
    const state = seedState();
    persistState(state);
    return state;
  }
}

function persistState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

let state = loadState();

function save() {
  persistState(state);
}

function getCollectionName(name) {
  return ENTITY_MAP[name] || null;
}

function currentUserFromRequest(req) {
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const token = bearer || req.headers["x-spook-token"] || "";
  if (!token) return null;
  const userId = state.sessions[token];
  if (!userId) return null;
  return state.users.find((u) => u.id === userId && u.status !== "disabled") || null;
}

function requireAuth(req, res) {
  const user = currentUserFromRequest(req);
  if (!user) {
    sendJson(res, 401, { error: "authentication_required" });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    sendJson(res, 403, { error: "admin_required" });
    return null;
  }
  return user;
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sortItems(items, sort) {
  if (!sort) return items;
  const desc = String(sort).startsWith("-");
  const key = desc ? String(sort).slice(1) : String(sort);
  return [...items].sort((a, b) => {
    const av = a?.[key] ?? "";
    const bv = b?.[key] ?? "";
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    return desc ? -cmp : cmp;
  });
}

function matchesQuery(item, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (value === undefined || value === null || value === "") return true;
    const actual = item?.[key];
    if (Array.isArray(actual)) return actual.includes(value);
    return String(actual ?? "") === String(value);
  });
}

function queryCollection(name, { query = {}, sort = "-created_date", limit = 1000 } = {}) {
  const col = state[getCollectionName(name) || ""] || [];
  const filtered = col.filter((item) => matchesQuery(item, query));
  return sortItems(filtered, sort).slice(0, Number(limit) || 1000);
}

function createEntity(name, payload, createdBy) {
  const collectionName = getCollectionName(name);
  if (!collectionName) throw new Error(`unknown entity: ${name}`);
  const now = nowIso();
  const item = {
    id: makeId(name.slice(0, 3).toLowerCase()),
    created_date: now,
    ...deepClone(payload),
  };
  if (createdBy) item.created_by_id = createdBy.id;
  state[collectionName].unshift(item);
  save();
  return item;
}

function updateEntity(name, id, patch, currentUser) {
  const collectionName = getCollectionName(name);
  if (!collectionName) throw new Error(`unknown entity: ${name}`);
  const col = state[collectionName];
  const idx = col.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("not_found");
  const existing = col[idx];
  const next = { ...existing, ...deepClone(patch), updated_date: nowIso() };
  if (name === "User" && currentUser?.role !== "admin" && currentUser?.id !== id) throw new Error("forbidden");
  col[idx] = next;
  save();
  return next;
}

function deleteEntity(name, id) {
  const collectionName = getCollectionName(name);
  if (!collectionName) throw new Error(`unknown entity: ${name}`);
  const col = state[collectionName];
  const idx = col.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("not_found");
  const [removed] = col.splice(idx, 1);
  save();
  return removed;
}

function normalizeTelegramHandle(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/^https?:\/\/t\.me\/(?:s\/)?/i, "")
    .replace(/^@/, "")
    .replace(/\?.*$/, "")
    .replace(/\/+$/, "")
    .trim();
  return /^[a-z0-9_]{3,64}$/i.test(normalized) ? normalized : "";
}

function clampText(value, max) {
  return String(value || "").slice(0, max);
}

function normalizeDraft(source, draft) {
  return {
    source_slug: source.slug,
    source_name: source.name,
    source_kind: source.kind,
    item_type: draft.item_type || "other",
    value: clampText(draft.value || "", 500),
    title: clampText(draft.title || "", 300),
    summary: clampText(draft.summary || "", 1500),
    threat_actor: clampText(draft.threat_actor || "", 120),
    victim_org: clampText(draft.victim_org || "", 120),
    sector: clampText(draft.sector || "", 120),
    country: clampText(draft.country || "", 80),
    tags: Array.isArray(draft.tags) ? draft.tags.filter(Boolean).slice(0, 12) : [],
    severity: draft.severity || "medium",
    published_date: draft.published_date || nowIso(),
    link: clampText(draft.link || "", 1000),
    dedupe_key: clampText(draft.dedupe_key || draft.value || `${source.slug}:${draft.title || draft.value || "item"}`, 240),
    verdict: draft.verdict || "unreviewed",
    raw_meta: draft.raw_meta || {},
  };
}

function ingestSource(source, options = {}) {
  if (!source) throw new Error("source_not_found");
  const now = Date.now();
  const last = source.last_ingested_at ? Date.parse(source.last_ingested_at) : 0;
  const minMs = Number(source.min_interval_minutes || 0) * 60_000;
  const due = options.force || !last || now - last >= minMs;
  if (!due) {
    const run = {
      id: makeId("run"),
      created_date: nowIso(),
      source_slug: source.slug,
      source_name: source.name,
      status: "skipped",
      items_fetched: 0,
      items_new: 0,
      message: "Not due yet",
      duration_ms: 0,
    };
    state.runs.unshift(run);
    save();
    return { run, added: 0, fetched: 0, skipped: true };
  }

  const started = Date.now();
  return fetchSource(source, {
    ransomwareProKey: process.env.RANSOMWARE_LIVE_PRO_API_KEY,
    hibpKey: process.env.HIBP_API_KEY,
    telegramChannel: process.env.TELEGRAM_CHANNEL,
  })
    .then((drafts) => {
      const existing = new Set(state.items.map((item) => item.dedupe_key).filter(Boolean));
      const fresh = [];
      for (const draft of drafts || []) {
        const item = normalizeDraft(source, draft);
        if (!item.dedupe_key || existing.has(item.dedupe_key)) continue;
        existing.add(item.dedupe_key);
        item.id = makeId("item");
        item.created_date = nowIso();
        state.items.unshift(item);
        fresh.push(item);
      }
      source.last_ingested_at = nowIso();
      source.last_status = "success";
      source.total_items = Number(source.total_items || 0) + fresh.length;
      const run = {
        id: makeId("run"),
        created_date: nowIso(),
        source_slug: source.slug,
        source_name: source.name,
        status: "success",
        items_fetched: Array.isArray(drafts) ? drafts.length : 0,
        items_new: fresh.length,
        message: fresh.length ? `Added ${fresh.length} new records` : "No new items",
        duration_ms: Date.now() - started,
      };
      state.runs.unshift(run);
      save();
      return { run, added: fresh.length, fetched: Array.isArray(drafts) ? drafts.length : 0, items: fresh };
    })
    .catch((err) => {
      source.last_ingested_at = nowIso();
      source.last_status = "error";
      const run = {
        id: makeId("run"),
        created_date: nowIso(),
        source_slug: source.slug,
        source_name: source.name,
        status: "error",
        items_fetched: 0,
        items_new: 0,
        message: err?.message || "Ingestion failed",
        duration_ms: Date.now() - started,
      };
      state.runs.unshift(run);
      save();
      return { run, added: 0, fetched: 0, error: err?.message || "Ingestion failed" };
    });
}

function pickSourcesForTopic(topic) {
  const t = String(topic || "").toLowerCase();
  const picked = [];
  if (!t || /(vuln|cve|exploit|patch|rce|zero|day)/i.test(t)) picked.push("telegram", "rss");
  if (/ransom|leak|breach/i.test(t)) picked.push("ransomware_live", "hibp");
  if (/phish|credential|brand/i.test(t)) picked.push("phishunt", "tweetfeed");
  if (!picked.length) picked.push("rss", "telegram");
  return [...new Set(picked)];
}

function discoverSources(topic) {
  const topicSlug = slugify(topic || "general");
  const chosenKinds = pickSourcesForTopic(topic);
  const existingSlugs = new Set(state.sources.map((s) => s.slug));
  const created = [];
  for (const [index, kind] of chosenKinds.entries()) {
    const template = DEFAULT_SOURCES.find((s) => s.kind === kind) || DEFAULT_SOURCES[0];
    const source = {
      id: makeId("src"),
      created_date: nowIso(),
      name: `${topic ? topic.trim() : "General"} ${template.name}`.slice(0, 100),
      slug: `${topicSlug}_${template.slug}_${index + 1}`.slice(0, 64),
      kind: template.kind,
      url: template.url,
      telegram_channel: template.telegram_channel || (kind === "telegram" ? "<channel>" : ""),
      description: topic
        ? `Crawler proposal for ${topic}. Mirrors the ${template.name} pattern.`
        : `Crawler proposal based on ${template.name}.`,
      status: "proposed",
      license_note: template.license_note,
      min_interval_minutes: template.min_interval_minutes,
      max_items_per_run: template.max_items_per_run,
      requires_secret: template.requires_secret,
      total_items: 0,
      last_ingested_at: "",
      last_status: "",
      discovered_by_crawler: true,
    };
    if (existingSlugs.has(source.slug)) continue;
    existingSlugs.add(source.slug);
    state.sources.unshift(source);
    created.push(source);
  }
  save();
  return created;
}

function summarizeItems(items) {
  const byType = new Map();
  const byActor = new Map();
  const bySector = new Map();
  for (const item of items) {
    const type = item.item_type || "other";
    byType.set(type, (byType.get(type) || 0) + 1);
    if (item.threat_actor) byActor.set(item.threat_actor, (byActor.get(item.threat_actor) || 0) + 1);
    if (item.sector) bySector.set(item.sector, (bySector.get(item.sector) || 0) + 1);
  }
  return {
    typeList: [...byType.entries()].sort((a, b) => b[1] - a[1]),
    actorList: [...byActor.entries()].sort((a, b) => b[1] - a[1]),
    sectorList: [...bySector.entries()].sort((a, b) => b[1] - a[1]),
  };
}

function generateReport(period) {
  const now = new Date();
  const windows = { weekly: 7, monthly: 30, quarterly: 90, annually: 365 };
  const days = windows[period] || 7;
  const start = new Date(now.getTime() - days * 86400000);
  const items = state.items.filter((item) => {
    const when = new Date(item.published_date || item.created_date || item.created_date);
    return !Number.isNaN(when.getTime()) && when >= start && when <= now;
  });
  const data = items.length ? items : state.items.slice(0, 25);
  const { typeList, actorList, sectorList } = summarizeItems(data);
  const vulnCount = data.filter((item) => item.item_type === "vulnerability").length;
  const highCount = data.filter((item) => ["high", "critical"].includes(item.severity)).length;
  const title = `${period[0].toUpperCase() + period.slice(1)} threat intelligence brief — ${data.length} records analyzed`;
  const report = {
    id: makeId("report"),
    created_date: nowIso(),
    period,
    confidence: data.length > 10 ? "high" : data.length > 4 ? "moderate" : "low",
    items_analyzed: data.length,
    title,
    period_start: start.toISOString(),
    period_end: now.toISOString(),
    author_name: "Hermes",
    executive_summary: `The ${period} corpus contains ${data.length} records with ${highCount} high/critical entries and ${vulnCount} direct vulnerability signals. Telegram and RSS continue to drive the fastest-moving findings.`,
    key_findings: [
      `${vulnCount} vulnerability-tagged items were observed across the selected window.`,
      `${highCount} items are high or critical severity.`,
      actorList[0] ? `Most visible actor pivot: ${actorList[0][0]}.` : "No dominant actor pivot emerged.",
    ],
    threat_landscape: `The landscape spans ransomware claims, phishing infrastructure, breach metadata, and vulnerability discussion. ${data.length ? "The cross-source mix supports pivoting on repeated values and shared actors." : "No recent records matched the requested period."}`,
    notable_actors: actorList.slice(0, 5).map(([name]) => name),
    targeted_sectors: sectorList.slice(0, 5).map(([name]) => name),
    targeted_geographies: [...new Set(data.map((item) => item.country).filter(Boolean))].slice(0, 5),
    indicators: data
      .flatMap((item) => [item.value, item.threat_actor, item.victim_org, ...(item.tags || [])])
      .filter(Boolean)
      .slice(0, 12),
    assessment_outlook: `Expect continued exploit-chatter and opportunistic credential theft. ${data.some((item) => item.item_type === "vulnerability") ? "Vulnerability-centric Telegram posts are likely to remain the fastest lead source." : "The corpus is currently weighted toward non-vulnerability signals."}`,
    recommendations: [
      "Triage the highest-severity items first and enrich with external verification.",
      "Convert repeated actor, victim, and domain pivots into detection content.",
      "Review Telegram-derived posts for CVE references and patch timing.",
    ],
    sources_methodology: "Generated locally from the current ingested corpus using date-window filtering, simple aggregation, and analyst-oriented summarisation.",
  };
  state.reports.unshift(report);
  save();
  return report;
}

function generateForecasts({ focus = "", count = 3 }) {
  const base = [
    {
      tech_name: `${focus ? focus + " " : ""}agentic orchestration`,
      classification: "AI/ML",
      maturity: "prototype",
      summary: "Autonomous orchestration layers will attract prompt injection and delegated tool abuse.",
      related_existing_tech: ["SOAR", "automation runbooks", "LLM copilots"],
      existing_attack_vectors: ["tool poisoning", "prompt injection", "workflow hijacking"],
      predicted_abuse: ["malicious tool invocation", "phishing automation", "session theft"],
      likely_threat_actors: ["crimeware groups", "initial access brokers"],
      mitigations: ["tool allowlists", "human approval for sensitive actions", "prompt validation"],
      risk_score: 8,
      horizon: "0-6 months",
      confidence: "moderate",
    },
    {
      tech_name: `${focus ? focus + " " : ""}identity edge appliances`,
      classification: "networking",
      maturity: "early_release",
      summary: "Identity-aware edge devices will concentrate policy and create high-value admin surfaces.",
      related_existing_tech: ["ZTNA", "SASE", "reverse proxies"],
      existing_attack_vectors: ["config tampering", "token replay", "session abuse"],
      predicted_abuse: ["policy bypass", "admin interface exploitation", "session replay"],
      likely_threat_actors: ["ransomware operators", "credential thieves"],
      mitigations: ["MFA everywhere", "management plane isolation", "config drift checks"],
      risk_score: 7,
      horizon: "18-36 months",
      confidence: "low",
    },
    {
      tech_name: `${focus ? focus + " " : ""}hybrid cryptography migration`,
      classification: "cryptography",
      maturity: "research",
      summary: "Hybrid crypto rollouts will create downgrade paths and configuration drift before coverage is complete.",
      related_existing_tech: ["TLS 1.3", "PKI", "VPN gateways"],
      existing_attack_vectors: ["certificate confusion", "downgrade paths", "misconfiguration"],
      predicted_abuse: ["fallback abuse", "phishing infrastructure persistence"],
      likely_threat_actors: ["advanced persistent threats", "credential thieves"],
      mitigations: ["inventory crypto dependencies", "stage deployments", "monitor downgrade events"],
      risk_score: 6,
      horizon: "6-18 months",
      confidence: "moderate",
    },
  ];
  const created = [];
  for (let i = 0; i < Math.max(1, Math.min(Number(count) || 3, 6)); i += 1) {
    const template = base[i % base.length];
    const forecast = {
      id: makeId("forecast"),
      created_date: nowIso(),
      ...deepClone(template),
      evidence: [{ title: `Local corpus reference ${i + 1}`, url: "/overview", kind: "local" }],
      agent_name: "Hermes",
    };
    state.forecasts.unshift(forecast);
    created.push(forecast);
  }
  save();
  return created;
}

function findUserByEmail(email) {
  return state.users.find((user) => user.email.toLowerCase() === String(email || "").toLowerCase()) || null;
}

function createSessionForUser(user) {
  const token = createToken();
  state.sessions[token] = user.id;
  save();
  return token;
}

async function handleAuth(req, res, action, body) {
  if (action === "login") {
    const user = findUserByEmail(body.email);
    if (!user || !verifyPassword(body.password, user.password_hash)) {
      return sendJson(res, 401, { error: "invalid_credentials" });
    }
    if (user.status === "pending") {
      return sendJson(res, 403, { error: "email_not_verified" });
    }
    const access_token = createSessionForUser(user);
    return sendJson(res, 200, { access_token, user: publicUser(user) });
  }

  if (action === "provider") {
    const email = DEMO_USER_EMAIL;
    let user = findUserByEmail(email);
    if (!user) {
      user = {
        id: makeId("usr"),
        created_date: nowIso(),
        email,
        full_name: "Google SSO User",
        role: "user",
        status: "active",
        password_hash: hashPassword(createToken()),
      };
      state.users.push(user);
    }
    const access_token = createSessionForUser(user);
    return sendJson(res, 200, { access_token, user: publicUser(user), redirect_url: body.returnTo || "/" });
  }

  if (action === "register") {
    if (!body.email || !body.password) return sendJson(res, 400, { error: "email_and_password_required" });
    if (findUserByEmail(body.email)) return sendJson(res, 409, { error: "user_exists" });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const user = {
      id: makeId("usr"),
      created_date: nowIso(),
      email: body.email,
      full_name: body.full_name || body.email.split("@")[0],
      role: "user",
      status: "pending",
      password_hash: hashPassword(body.password),
    };
    state.users.push(user);
    state.pendingOtps[body.email.toLowerCase()] = {
      code: otp,
      expires_at: Date.now() + 15 * 60_000,
      user_id: user.id,
    };
    save();
    return sendJson(res, 200, { needsVerification: true, email: body.email });
  }

  if (action === "resend-otp") {
    const pending = state.pendingOtps[String(body.email || "").toLowerCase()];
    if (!pending) return sendJson(res, 404, { error: "no_pending_verification" });
    pending.code = String(Math.floor(100000 + Math.random() * 900000));
    pending.expires_at = Date.now() + 15 * 60_000;
    save();
    return sendJson(res, 200, { sent: true });
  }

  if (action === "verify-otp") {
    const key = String(body.email || "").toLowerCase();
    const pending = state.pendingOtps[key];
    if (!pending || pending.expires_at < Date.now() || pending.code !== String(body.otpCode || "")) {
      return sendJson(res, 400, { error: "invalid_code" });
    }
    const user = state.users.find((u) => u.id === pending.user_id);
    if (!user) return sendJson(res, 404, { error: "user_not_found" });
    user.status = "active";
    delete state.pendingOtps[key];
    const access_token = createSessionForUser(user);
    return sendJson(res, 200, { access_token, user: publicUser(user) });
  }

  if (action === "forgot-password") {
    const user = findUserByEmail(body.email);
    if (!user) return sendJson(res, 200, { sent: true });
    const resetToken = createToken();
    state.passwordResets[resetToken] = { user_id: user.id, expires_at: Date.now() + 60 * 60_000 };
    save();
    return sendJson(res, 200, { sent: true, resetToken });
  }

  if (action === "reset-password") {
    const token = String(body.resetToken || "");
    const reset = state.passwordResets[token];
    if (!reset || reset.expires_at < Date.now()) return sendJson(res, 400, { error: "invalid_reset_token" });
    const user = state.users.find((u) => u.id === reset.user_id);
    if (!user) return sendJson(res, 404, { error: "user_not_found" });
    user.password_hash = hashPassword(body.newPassword);
    delete state.passwordResets[token];
    save();
    return sendJson(res, 200, { success: true });
  }

  if (action === "logout") {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (token && state.sessions[token]) delete state.sessions[token];
    save();
    return sendJson(res, 200, { success: true });
  }

  if (action === "me") {
    const user = requireAuth(req, res);
    if (!user) return;
    return sendJson(res, 200, publicUser(user));
  }

  return sendJson(res, 404, { error: "unknown_auth_action" });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    status: user.status,
    created_date: user.created_date,
  };
}

async function handleEntityQuery(req, res, entityName, body) {
  const user = requireAuth(req, res);
  if (!user) return;
  const query = body?.query || {};
  const sort = body?.sort || "-created_date";
  const limit = body?.limit || 1000;
  const results = queryCollection(entityName, { query, sort, limit });
  return sendJson(res, 200, results.map((item) => deepClone(item)));
}

async function handleEntityCreate(req, res, entityName, body) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (["IntelSource", "IntelItem", "IngestionRun", "IntelReport", "TechForecast"].includes(entityName) && user.role !== "admin") {
    return sendJson(res, 403, { error: "admin_required" });
  }
  if (entityName === "User" && user.role !== "admin") {
    return sendJson(res, 403, { error: "admin_required" });
  }
  const created = createEntity(entityName, body, user);
  return sendJson(res, 200, deepClone(created));
}

async function handleEntityUpdate(req, res, entityName, id, body) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (["IntelSource", "IntelItem", "IngestionRun", "IntelReport", "TechForecast"].includes(entityName) && user.role !== "admin") {
    return sendJson(res, 403, { error: "admin_required" });
  }
  try {
    const updated = updateEntity(entityName, id, body, user);
    return sendJson(res, 200, deepClone(updated));
  } catch (err) {
    if (String(err?.message) === "forbidden") return sendJson(res, 403, { error: "forbidden" });
    return sendJson(res, 404, { error: "not_found" });
  }
}

async function handleEntityDelete(req, res, entityName, id) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (["IntelSource", "IntelItem", "IngestionRun", "IntelReport", "TechForecast"].includes(entityName) && user.role !== "admin") {
    return sendJson(res, 403, { error: "admin_required" });
  }
  if (entityName === "User" && user.role !== "admin") {
    return sendJson(res, 403, { error: "admin_required" });
  }
  try {
    const deleted = deleteEntity(entityName, id);
    return sendJson(res, 200, deepClone(deleted));
  } catch {
    return sendJson(res, 404, { error: "not_found" });
  }
}

async function handleInviteUser(req, res, body) {
  const user = requireAdmin(req, res);
  if (!user) return;
  const email = String(body.email || "").toLowerCase();
  if (!email) return sendJson(res, 400, { error: "email_required" });
  const role = body.role === "admin" ? "admin" : "user";
  let existing = findUserByEmail(email);
  if (!existing) {
    existing = {
      id: makeId("usr"),
      created_date: nowIso(),
      email,
      full_name: email.split("@")[0],
      role,
      status: "active",
      password_hash: hashPassword(createToken()),
    };
    state.users.push(existing);
  } else {
    existing.role = role;
    existing.status = "active";
  }
  save();
  return sendJson(res, 200, { user: publicUser(existing) });
}

async function handleFunction(req, res, name, body) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (name === "ingest") {
    if (user.role !== "admin") return sendJson(res, 403, { error: "admin_required" });
    const sources = body?.slug ? state.sources.filter((s) => s.slug === body.slug) : state.sources.filter((s) => s.status === "active");
    const results = [];
    for (const source of sources) results.push(await ingestSource(source, { force: !!body?.force }));
    return sendJson(res, 200, { results });
  }
  if (name === "discoverSources") {
    if (user.role !== "admin") return sendJson(res, 403, { error: "admin_required" });
    const created = discoverSources(body?.topic || "");
    return sendJson(res, 200, { created });
  }
  if (name === "generateReport") {
    if (user.role !== "admin") return sendJson(res, 403, { error: "admin_required" });
    const report = generateReport(body?.period || "weekly");
    return sendJson(res, 200, { report });
  }
  if (name === "forecastTech") {
    if (user.role !== "admin") return sendJson(res, 403, { error: "admin_required" });
    const created = generateForecasts({ focus: body?.focus || "", count: body?.count || 3 });
    return sendJson(res, 200, { created });
  }
  return sendJson(res, 404, { error: "unknown_function" });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
  }[ext] || "application/octet-stream";
}

function tryServeStatic(req, res, pathname) {
  if (pathname === "/" || pathname === "") pathname = "/index.html";
  const safePath = path.normalize(pathname).replace(/^\.{2,}/, "");
  const filePath = path.join(DIST_DIR, safePath);
  if (!filePath.startsWith(DIST_DIR)) return false;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { "Content-Type": contentType(filePath), "Cache-Control": pathname === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable" });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  const indexPath = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    fs.createReadStream(indexPath).pipe(res);
    return true;
  }
  return false;
}

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || `localhost:${PORT}`}`);
  const { pathname } = url;

  if (pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, time: nowIso() });
  }

  try {
    if (pathname.startsWith("/api/auth/")) {
      const body = req.method === "GET" ? {} : await parseJsonBody(req);
      return handleAuth(req, res, pathname.split("/").pop() || "", body);
    }

    if (pathname === "/api/users/invite" && req.method === "POST") {
      return handleInviteUser(req, res, await parseJsonBody(req));
    }

    if (pathname.startsWith("/api/functions/") && req.method === "POST") {
      const name = pathname.split("/").pop() || "";
      return handleFunction(req, res, name, await parseJsonBody(req));
    }

    if (pathname.startsWith("/api/entities/") && pathname.endsWith("/query") && req.method === "POST") {
      const entityName = pathname.split("/")[3];
      return handleEntityQuery(req, res, entityName, await parseJsonBody(req));
    }

    if (pathname.startsWith("/api/entities/") && req.method === "POST") {
      const entityName = pathname.split("/")[3];
      return handleEntityCreate(req, res, entityName, await parseJsonBody(req));
    }

    if (pathname.startsWith("/api/entities/") && req.method === "PUT") {
      const [, , , entityName, id] = pathname.split("/");
      return handleEntityUpdate(req, res, entityName, id, await parseJsonBody(req));
    }

    if (pathname.startsWith("/api/entities/") && req.method === "DELETE") {
      const [, , , entityName, id] = pathname.split("/");
      return handleEntityDelete(req, res, entityName, id);
    }

    if (req.method === "GET" || req.method === "HEAD") {
      if (tryServeStatic(req, res, pathname)) return;
    }

    sendJson(res, 404, { error: "not_found" });
  } catch (err) {
    sendJson(res, 500, { error: err?.message || "server_error" });
  }
}

const server = http.createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`[spook-shack] server listening on http://127.0.0.1:${PORT}`);
});
