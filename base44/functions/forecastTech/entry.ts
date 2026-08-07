import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const focus = String(body.focus || '').slice(0, 200);
    const count = Math.min(Math.max(Number(body.count) || 3, 1), 5);

    const items = await base44.asServiceRole.entities.IntelItem.list('-published_date', 250);
    const digest = items
      .slice(0, 200)
      .map((i) => [i.item_type, i.threat_actor, i.victim_org, i.sector, i.title].filter(Boolean).join(' | '));

    const schema = {
      type: 'object',
      properties: {
        forecasts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tech_name: { type: 'string' },
              classification: { type: 'string' },
              maturity: { type: 'string', enum: ['research', 'prototype', 'unreleased', 'early_release'] },
              summary: { type: 'string' },
              related_existing_tech: { type: 'array', items: { type: 'string' } },
              existing_attack_vectors: { type: 'array', items: { type: 'string' } },
              predicted_abuse: { type: 'array', items: { type: 'string' } },
              likely_threat_actors: { type: 'array', items: { type: 'string' } },
              mitigations: { type: 'array', items: { type: 'string' } },
              risk_score: { type: 'number' },
              horizon: { type: 'string', enum: ['0-6 months', '6-18 months', '18-36 months', '3+ years'] },
              confidence: { type: 'string', enum: ['low', 'moderate', 'high'] },
              evidence: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { title: { type: 'string' }, url: { type: 'string' }, kind: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    };

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are Hermes, an emerging-technology threat forecasting agent for the Spook Shack threat intel unit. ' +
        'Research genuinely NEW, unreleased or research-stage technologies' + (focus ? ' related to: ' + focus : '') +
        '. Use published research papers, preprints, vendor previews, standards drafts and conference releases as evidence. ' +
        'Produce exactly ' + count + ' forecasts. For each: name the technology, classify it, note maturity, ' +
        'list the existing technologies it relates to or builds on, the KNOWN attack vectors against those existing ' +
        'technologies, and then predict concretely how threat actors would likely abuse the new technology (attack ' +
        'vectors, tradecraft, monetisation). Add likely actor types, mitigations, a risk score 1-10, a time horizon, ' +
        'confidence, and evidence links with real URLs. Ground your actor reasoning in the current observed activity below.\n\n' +
        'CURRENT OBSERVED THREAT ACTIVITY:\n' + digest.join('\n'),
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: schema,
    });

    const forecasts = (llm && llm.forecasts) || [];
    const created = [];
    for (const f of forecasts.slice(0, count)) {
      if (!f.tech_name) continue;
      const rec = await base44.asServiceRole.entities.TechForecast.create({
        tech_name: String(f.tech_name).slice(0, 160),
        classification: f.classification || 'emerging',
        maturity: f.maturity || 'research',
        summary: String(f.summary || '').slice(0, 2000),
        related_existing_tech: f.related_existing_tech || [],
        existing_attack_vectors: f.existing_attack_vectors || [],
        predicted_abuse: f.predicted_abuse || [],
        likely_threat_actors: f.likely_threat_actors || [],
        mitigations: f.mitigations || [],
        risk_score: Math.min(10, Math.max(1, Number(f.risk_score) || 5)),
        horizon: f.horizon || '6-18 months',
        confidence: f.confidence || 'moderate',
        evidence: (f.evidence || []).slice(0, 8),
        agent_name: 'Hermes',
      });
      created.push({ id: rec.id, tech_name: rec.tech_name });
    }

    return Response.json({ created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}