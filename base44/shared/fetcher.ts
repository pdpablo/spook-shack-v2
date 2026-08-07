// Per-source fetchers. Each returns an array of normalized item drafts.
import { UA, classifyIndicator, hostOf, parseRss, stripTags } from './intel.ts';

async function getJson(url, headers) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...(headers || {}) } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + url);
  return await res.json();
}

async function getText(url, headers) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...(headers || {}) } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' from ' + url);
  return await res.text();
}

function mapRansomwareVictim(r) {
  const victim = r.victim || r.post_title || r.name || 'unknown victim';
  const group = r.group_name || r.group || 'unknown group';
  const date = r.published || r.discovered || r.attackdate || '';
  return {
    item_type: 'victim',
    value: String(victim).toLowerCase(),
    title: victim + ' claimed by ' + group,
    summary: stripTags(r.description || r.post_title || '').slice(0, 800),
    threat_actor: group,
    victim_org: victim,
    sector: r.activity || r.sector || '',
    country: r.country || '',
    tags: ['ransomware', group].filter(Boolean),
    severity: 'high',
    published_date: date || undefined,
    link: r.post_url || r.website || '',
    dedupe_key: 'rl:' + group + ':' + victim,
    raw_meta: { website: r.website || '', discovered: r.discovered || '' },
  };
}

async function fetchRansomwareLive(source) {
  const data = await getJson(source.url || 'https://api.ransomware.live/v2/recentvictims');
  const rows = Array.isArray(data) ? data : data.victims || [];
  return rows.slice(0, source.max_items_per_run || 150).map(mapRansomwareVictim);
}

async function fetchRansomwarePro(source, apiKey) {
  if (!apiKey) throw new Error('RANSOMWARE_LIVE_PRO_API_KEY is not configured');
  const data = await getJson(source.url || 'https://api-pro.ransomware.live/v2/recentvictims', {
    'X-API-KEY': apiKey,
  });
  const rows = Array.isArray(data) ? data : data.victims || [];
  return rows.slice(0, source.max_items_per_run || 200).map(mapRansomwareVictim);
}

async function fetchTweetFeed(source) {
  const data = await getJson(source.url || 'https://api.tweetfeed.live/v1/week');
  const rows = Array.isArray(data) ? data : [];
  return rows.slice(0, source.max_items_per_run || 300).map((r) => ({
    item_type: classifyIndicator(r.value),
    value: String(r.value || '').toLowerCase(),
    title: (r.type || 'indicator') + ' — ' + r.value,
    summary: 'Reported by @' + (r.user || 'unknown') + ' on ' + (r.date || ''),
    tags: (r.tags || []).concat(['tweetfeed']),
    severity: 'medium',
    published_date: r.date || undefined,
    link: r.tweet || '',
    dedupe_key: 'tf:' + String(r.value || '').toLowerCase(),
    raw_meta: { user: r.user || '', declared_type: r.type || '' },
  }));
}

async function fetchPhishunt(source) {
  const text = await getText(source.url || 'https://phishunt.io/feed.txt');
  const urls = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l));
  return urls.slice(0, source.max_items_per_run || 300).map((u) => ({
    item_type: 'url',
    value: u.toLowerCase(),
    title: 'Suspected phishing URL — ' + hostOf(u),
    summary: 'Observed on the Phishunt suspicious URL feed.',
    tags: ['phishing', hostOf(u)].filter(Boolean),
    severity: 'high',
    link: u,
    dedupe_key: 'ph:' + u.toLowerCase(),
    raw_meta: { host: hostOf(u) },
  }));
}

async function fetchHibp(source, apiKey) {
  if (!apiKey) throw new Error('HIBP_API_KEY is not configured');
  const data = await getJson(source.url || 'https://haveibeenpwned.com/api/v3/breaches', {
    'hibp-api-key': apiKey,
  });
  const rows = Array.isArray(data) ? data : [];
  rows.sort((a, b) => String(b.AddedDate || '').localeCompare(String(a.AddedDate || '')));
  return rows.slice(0, source.max_items_per_run || 200).map((b) => ({
    item_type: 'breach',
    value: String(b.Domain || b.Name || '').toLowerCase(),
    title: b.Title + ' breach — ' + (b.PwnCount || 0).toLocaleString() + ' accounts',
    summary: stripTags(b.Description).slice(0, 900),
    victim_org: b.Title || b.Name,
    tags: ['breach'].concat(b.DataClasses || []).slice(0, 12),
    severity: (b.PwnCount || 0) > 5000000 ? 'critical' : 'high',
    published_date: b.BreachDate || b.AddedDate || undefined,
    link: b.Domain ? 'https://haveibeenpwned.com/PwnedWebsites#' + b.Name : '',
    dedupe_key: 'hibp:' + b.Name,
    raw_meta: { pwn_count: b.PwnCount || 0, verified: !!b.IsVerified, added: b.AddedDate || '' },
  }));
}

async function fetchRssSource(source) {
  const xml = await getText(source.url);
  return parseRss(xml, source.max_items_per_run || 60).map((e) => ({
    item_type: 'article',
    value: (e.title || '').toLowerCase().slice(0, 300),
    title: e.title,
    summary: e.summary,
    tags: ['rss', source.slug],
    severity: 'low',
    published_date: e.published || undefined,
    link: e.link,
    dedupe_key: 'rss:' + source.slug + ':' + (e.link || e.title),
    raw_meta: { feed: source.url },
  }));
}

async function fetchTelegram(source, channel) {
  if (!channel) throw new Error('TELEGRAM_CHANNEL is not configured');
  const handle = String(channel).replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
  const html = await getText('https://t.me/s/' + handle);
  const blocks = html.split('tgme_widget_message_wrap').slice(1);
  const out = [];
  for (const block of blocks.slice(0, source.max_items_per_run || 100)) {
    const textMatch = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    if (!textMatch) continue;
    const text = stripTags(textMatch[1]).trim();
    if (!text) continue;
    const timeMatch = block.match(/datetime="([^"]+)"/);
    const linkMatch = block.match(/tgme_widget_message_link[^>]*href="([^"]+)"/);
    const idMatch = block.match(/data-post="([^"]+)"/);
    out.push({
      item_type: 'leak',
      value: text.toLowerCase().slice(0, 300),
      title: 'Telegram post — @' + handle,
      summary: text.slice(0, 1200),
      threat_actor: handle,
      tags: ['telegram', 'leak', handle],
      severity: 'high',
      published_date: timeMatch ? timeMatch[1] : undefined,
      link: linkMatch ? linkMatch[1] : '',
      dedupe_key: 'tg:' + (idMatch ? idMatch[1] : text.slice(0, 60)),
      raw_meta: { channel: handle, post: idMatch ? idMatch[1] : '' },
    });
  }
  return out;
}

export async function fetchSource(source, opts) {
  const options = opts || {};
  switch (source.kind) {
    case 'ransomware_live':
      return await fetchRansomwareLive(source);
    case 'ransomware_pro':
      return await fetchRansomwarePro(source, options.ransomwareProKey);
    case 'tweetfeed':
      return await fetchTweetFeed(source);
    case 'phishunt':
      return await fetchPhishunt(source);
    case 'hibp':
      return await fetchHibp(source, options.hibpKey);
    case 'telegram':
      return await fetchTelegram(source, options.telegramChannel);
    case 'rss':
    case 'other':
      return await fetchRssSource(source);
    default:
      throw new Error('Unsupported source kind: ' + source.kind);
  }
}