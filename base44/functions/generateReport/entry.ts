import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PERIOD_DAYS = { weekly: 7, monthly: 30, quarterly: 91, annually: 365 };

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const period = PERIOD_DAYS[body.period] ? body.period : 'weekly';
    const days = PERIOD_DAYS[period];
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);

    const all = await base44.asServiceRole.entities.IntelItem.list('-published_date', 1200);
    const items = all.filter((i) => {
      const d = new Date(i.published_date || i.created_date);
      return !isNaN(d) && d >= start && d <= end;
    });
    const scoped = items.length ? items : all.slice(0, 300);

    const digest = scoped.slice(0, 400).map((i) =>
      [i.source_name, i.item_type, i.value, i.threat_actor, i.victim_org, i.sector, i.country, i.verdict]
        .filter(Boolean)
        .join(' | ')
    );

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        executive_summary: { type: 'string' },
        key_findings: { type: 'array', items: { type: 'string' } },
        threat_landscape: { type: 'string' },
        notable_actors: { type: 'array', items: { type: 'string' } },
        targeted_sectors: { type: 'array', items: { type: 'string' } },
        targeted_geographies: { type: 'array', items: { type: 'string' } },
        indicators: { type: 'array', items: { type: 'string' } },
        assessment_outlook: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        sources_methodology: { type: 'string' },
        confidence: { type: 'string', enum: ['low', 'moderate', 'high'] },
      },
    };

    const report = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a senior cyber threat intelligence analyst writing a ' + period + ' threat intelligence report ' +
        'following the Zeltser Cyber Threat Intel Report template (Executive Summary; Key Findings; Threat ' +
        'Landscape Overview; Notable Threat Actors and Campaigns; Targeted Sectors and Geographies; Indicators ' +
        'of Compromise; Assessment and Outlook; Recommendations; Sources and Methodology).\n' +
        'Reporting window: ' + start.toISOString().slice(0, 10) + ' to ' + end.toISOString().slice(0, 10) + '.\n' +
        'Write for a mixed executive/technical audience: concise, evidence-led, use estimative language ' +
        '(likely, probably, highly likely) and state confidence. Only assert what the data supports; ' +
        'note gaps explicitly. Include at most 25 of the most relevant indicators verbatim.\n\n' +
        'INTELLIGENCE RECORDS (source | type | value | actor | victim | sector | country | analyst verdict):\n' +
        digest.join('\n'),
      response_json_schema: schema,
    });

    const created = await base44.entities.IntelReport.create({
      title: report.title || 'Spook Shack ' + period + ' Threat Intelligence Report',
      period,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      executive_summary: report.executive_summary || '',
      key_findings: report.key_findings || [],
      threat_landscape: report.threat_landscape || '',
      notable_actors: report.notable_actors || [],
      targeted_sectors: report.targeted_sectors || [],
      targeted_geographies: report.targeted_geographies || [],
      indicators: (report.indicators || []).slice(0, 40),
      assessment_outlook: report.assessment_outlook || '',
      recommendations: report.recommendations || [],
      sources_methodology: report.sources_methodology || '',
      confidence: report.confidence || 'moderate',
      items_analyzed: scoped.length,
      author_name: user.full_name || user.email,
    });

    return Response.json({ report: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}