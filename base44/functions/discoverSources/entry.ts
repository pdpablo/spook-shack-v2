import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic || 'general cyber threat intelligence').slice(0, 200);

    const existing = await base44.asServiceRole.entities.IntelSource.list('-created_date', 100);
    const known = existing.map((s) => s.name + ' (' + (s.url || '') + ')').join('; ');

    const schema = {
      type: 'object',
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              kind: { type: 'string', enum: ['rss', 'other'] },
              description: { type: 'string' },
              license_note: { type: 'string' },
              suggested_interval_minutes: { type: 'number' },
            },
          },
        },
      },
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a threat intelligence source scout. Find up to 6 CURRENTLY LIVE, free and openly accessible ' +
        'threat intelligence sources about: ' + topic + '. Strongly prefer public RSS/Atom feeds or free no-key ' +
        'JSON/text feeds from reputable vendors, CERTs, national agencies or research teams. ' +
        'For each, give the exact feed URL (not the homepage), what data it provides, and its acceptable-use / ' +
        'licensing note including any documented polling limit. Suggest a polite polling interval in minutes ' +
        'that respects that policy (never less than 60). Exclude anything requiring payment, registration or an API key. ' +
        'Do NOT return sources already tracked: ' + (known || 'none') + '.',
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: schema,
    });

    const candidates = (result && result.candidates) || [];
    const created = [];
    for (const c of candidates.slice(0, 6)) {
      if (!c.url || !c.name) continue;
      const slug = String(c.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
      if (existing.some((s) => s.slug === slug || s.url === c.url)) continue;
      const rec = await base44.asServiceRole.entities.IntelSource.create({
        name: String(c.name).slice(0, 120),
        slug,
        kind: c.kind === 'other' ? 'other' : 'rss',
        url: c.url,
        description: String(c.description || '').slice(0, 600),
        license_note: String(c.license_note || '').slice(0, 600),
        status: 'proposed',
        min_interval_minutes: Math.max(60, Number(c.suggested_interval_minutes) || 360),
        max_items_per_run: 60,
        discovered_by_crawler: true,
      });
      created.push({ id: rec.id, name: rec.name, url: rec.url });
    }

    return Response.json({ found: candidates.length, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}