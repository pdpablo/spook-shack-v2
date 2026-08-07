import React from "react";
import { Zap } from "lucide-react";

function List({ title, list, tone = "text-foreground/85" }) {
  if (!list?.length) return null;
  return (
    <div>
      <p className="text-[9px] font-mono stencil text-muted-foreground mb-1.5">{title}</p>
      <ul className={`space-y-1 text-xs ${tone}`}>
        {list.map((x, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-primary/70">›</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ForecastCard({ f }) {
  const risk = Number(f.risk_score) || 0;
  return (
    <div className="relative scanlines border border-border/80 bg-card/60 rounded-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-display text-xl text-foreground">{f.tech_name}</h3>
          </div>
          <p className="mt-1 text-[10px] font-mono stencil text-accent/90">
            {f.classification} · {f.maturity} · {f.horizon} · confidence {f.confidence}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-3xl text-primary neon-text">{risk}</p>
          <p className="text-[9px] font-mono stencil text-muted-foreground">risk /10</p>
        </div>
      </div>
      {f.summary && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{f.summary}</p>}
      <div className="mt-5 grid md:grid-cols-2 gap-5">
        <List title="Related existing technology" list={f.related_existing_tech} />
        <List title="Known vectors on related tech" list={f.existing_attack_vectors} />
        <List title="Predicted threat actor abuse" list={f.predicted_abuse} tone="text-primary/90" />
        <List title="Likely actors" list={f.likely_threat_actors} />
        <List title="Mitigations" list={f.mitigations} />
      </div>
      {f.evidence?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border/70">
          <p className="text-[9px] font-mono stencil text-muted-foreground mb-2">Evidence</p>
          <div className="space-y-1">
            {f.evidence.map((e, i) => (
              <a
                key={i}
                href={e.url}
                target="_blank"
                rel="noreferrer noopener"
                className="block text-[11px] font-mono text-accent/90 hover:text-primary truncate"
              >
                {e.title || e.url}
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-[9px] font-mono stencil text-muted-foreground/60">agent · {f.agent_name || "Hermes"}</p>
    </div>
  );
}