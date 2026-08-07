// Shared ingestion helpers for Spook Shack intelligence sources.

export const DEFAULT_SOURCES = [
  {
    name: 'Ransomware.live',
    slug: 'ransomware_live',
    kind: 'ransomware_live',
    url: 'https://api.ransomware.live/v2/recentvictims',
    description: 'Public ransomware victim disclosures aggregated from leak sites.',
    license_note: 'Free public API. Attribution to ransomware.live required; keep polling light (twice daily).',
    min_interval_minutes: 720,
    max_items_per_run: 150,
  },
  {
    name: 'TweetFeed',
    slug: 'tweetfeed',
    kind: 'tweetfeed',
    url: 'https://api.tweetfeed.live/v1/week',
    description: 'Community IOCs (IPs, domains, URLs, hashes) curated from X/Twitter.',
    license_note: 'Free API, no key. Weekly endpoint used to avoid excessive requests.',
    min_interval_minutes: 360,
    max_items_per_run: 300,
  },
  {
    name: 'Phishunt',
    slug: 'phishunt',
    kind: 'phishunt',
    url: 'https://phishunt.io/feed.txt',
    description: 'Suspicious / phishing URLs observed in the wild.',
    license_note: 'Free public feed. Fetch at most hourly per publisher guidance.',
    min_interval_minutes: 180,
    max_items_per_run: 300,
  },
  {
    name: 'Have I Been Pwned',
    slug: 'hibp',
    kind: 'hibp',
    url: 'https://haveibeenpwned.com/api/v3/breaches',
    description: 'Catalogue of known data breaches (breach metadata only, no account lookups).',
    license_note: 'Breach catalogue is licensed CC BY 4.0 — attribution required. No API key needed for /breaches.',
    min_interval_minutes: 1440,
    max_items_per_run: 200,
  },
  {
    name: 'Telegram Leaks',
    slug: 'telegram_leaks',
    kind: 'telegram',
    url: 'https://api.telegram.org',
    description: 'Leak/ransomware announcement channels monitored via a Telegram bot.',
    license_note: 'Requires a bot token; bot must be a member of the monitored channels. Respect Telegram API limits.',
    requires_secret: 'TELEGRAM_BOT_TOKEN',
    min_interval_minutes: 60,
    max_items_per_run: 100,
    status: 'paused',
  },
  {
    name: 'CISA Known Exploited Vulnerabilities (RSS)',
    slug: 'cisa_alerts_rss',
    kind: 'rss',
    url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    description: 'CISA advisories feed, parsed into correlatable article intel.',
    license_note: 'US Government public domain feed.',
    min_interval_minutes: 360,
    max_items_per_run: 60,
  },
  {
    name: 'The Hacker News (RSS)',
    slug: 'thn_rss',
    kind: 'rss',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    description: 'Security news feed used for campaign and actor correlation.',
    license_note: 'Public RSS feed; headline + link only, full text not stored.',
    min_interval_minutes: 360,
    max_items_per_run: 60,
  },
];

export const UA = 'SpookShack-ThreatIntel/1.0 (+base44 app; contact app owner)';

export function nowIso() {
  return new Date().toISOString();
}

export function classifyIndicator(value) {
  const v = String(value || '').trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return 'ip';
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(v)) return 'hash';
  if (/^https?:\/\//i.test(v)) return 'url';
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) return 'email';
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v)) return 'domain';
  return 'other';
}

export function hostOf(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch (_e) {
    return '';
  }
}

export function stripTags(html) {
  return String(html || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseRss(xml, limit) {
  const blocks = String(xml).split(/<(?:item|entry)[\s>]/i).slice(1);
  const out = [];
  for (const block of blocks.slice(0, limit)) {
    const pick = (tag) => {
      const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
      return m ? stripTags(m[1]) : '';
    };
    let link = pick('link');
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : '';
    }
    const title = pick('title');
    if (!title) continue;
    out.push({
      title,
      link,
      summary: (pick('description') || pick('summary') || pick('content')).slice(0, 600),
      published: pick('pubDate') || pick('updated') || pick('published'),
    });
  }
  return out;
}

// Fetch existing dedupe keys for a source so ingestion stays idempotent.
export async function existingKeys(base44, sourceSlug) {
  const keys = new Set();
  const page = await base44.asServiceRole.entities.IntelItem.filter(
    { source_slug: sourceSlug },
    '-created_date',
    2000
  );
  for (const it of page || []) if (it.dedupe_key) keys.add(it.dedupe_key);
  return keys;
}

export async function saveItems(base44, source, items) {
  const seen = await existingKeys(base44, source.slug);
  const fresh = [];
  for (const raw of items) {
    const key = String(raw.dedupe_key || raw.value || '').slice(0, 240);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    fresh.push({
      source_slug: source.slug,
      source_name: source.name,
      source_kind: source.kind,
      item_type: raw.item_type || 'other',
      value: String(raw.value || '').slice(0, 500),
      title: (raw.title || '').slice(0, 300),
      summary: (raw.summary || '').slice(0, 1500),
      threat_actor: raw.threat_actor || '',
      victim_org: raw.victim_org || '',
      sector: raw.sector || '',
      country: raw.country || '',
      tags: (raw.tags || []).filter(Boolean).slice(0, 12),
      severity: raw.severity || 'medium',
      published_date: raw.published_date || nowIso(),
      link: raw.link || '',
      dedupe_key: key,
      verdict: 'unreviewed',
      raw_meta: raw.raw_meta || {},
    });
  }
  for (let i = 0; i < fresh.length; i += 100) {
    await base44.asServiceRole.entities.IntelItem.bulkCreate(fresh.slice(i, i + 100));
  }
  return fresh.length;
}