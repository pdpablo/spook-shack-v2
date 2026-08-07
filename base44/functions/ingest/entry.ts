import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { nowIso, saveItems } from '../../shared/intel.ts';
import { fetchSource } from '../../shared/fetcher.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const force = !!body.force;
    const slug = body.slug;

    let sources = await base44.asServiceRole.entities.IntelSource.list('-created_date', 100);
    if (slug) sources = sources.filter((s) => s.slug === slug);
    else sources = sources.filter((s) => s.status === 'active');

    const readSecret = (name) => { try { return secrets.get(name) || ''; } catch (_e) { return ''; } };
    const opts = {
      telegramChannel: readSecret('TELEGRAM_CHANNEL'),
      hibpKey: readSecret('HIBP_API_KEY'),
      ransomwareProKey: readSecret('RANSOMWARE_LIVE_PRO_API_KEY'),
    };

    const results = [];
    for (const source of sources) {
      const started = Date.now();
      const interval = (source.min_interval_minutes || 720) * 60 * 1000;
      const last = source.last_ingested_at ? new Date(source.last_ingested_at).getTime() : 0;
      if (!force && last && Date.now() - last < interval) {
        const msg = 'Skipped — rate limit window not elapsed';
        await base44.asServiceRole.entities.IngestionRun.create({
          source_slug: source.slug,
          source_name: source.name,
          status: 'skipped',
          message: msg,
          duration_ms: Date.now() - started,
        });
        results.push({ slug: source.slug, status: 'skipped', message: msg });
        continue;
      }

      try {
        const drafts = await fetchSource(source, opts);
        const added = await saveItems(base44, source, drafts);
        await base44.asServiceRole.entities.IntelSource.update(source.id, {
          last_ingested_at: nowIso(),
          last_status: 'ok — ' + added + ' new of ' + drafts.length,
          status: source.status === 'error' ? 'active' : source.status,
          total_items: (source.total_items || 0) + added,
        });
        await base44.asServiceRole.entities.IngestionRun.create({
          source_slug: source.slug,
          source_name: source.name,
          status: 'success',
          items_fetched: drafts.length,
          items_new: added,
          message: 'Ingested successfully',
          duration_ms: Date.now() - started,
        });
        results.push({ slug: source.slug, status: 'success', fetched: drafts.length, added });
      } catch (err) {
        await base44.asServiceRole.entities.IntelSource.update(source.id, {
          last_ingested_at: nowIso(),
          last_status: 'error — ' + err.message,
        });
        await base44.asServiceRole.entities.IngestionRun.create({
          source_slug: source.slug,
          source_name: source.name,
          status: 'error',
          message: String(err.message).slice(0, 500),
          duration_ms: Date.now() - started,
        });
        results.push({ slug: source.slug, status: 'error', message: err.message });
      }
    }

    return Response.json({ ran: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}