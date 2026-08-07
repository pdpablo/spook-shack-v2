import React from "react";

function Section({ title, children }) {
  if (!children) return null;
  return (
    <div className="mb-7">
      <h3 className="text-[10px] font-mono stencil text-primary/80 mb-2">{title}</h3>
      <div className="text-sm text-foreground/85 leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

function Bullets({ list }) {
  if (!list?.length) return null;
  return (
    <ul className="space-y-1.5">
      {list.map((x, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-primary">›</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportView({ report }) {
  if (!report) return null;
  return (
    <article>
      <header className="mb-7 pb-5 border-b border-border/70">
        <p className="text-[10px] font-mono stencil text-muted-foreground">
          {report.period} report · confidence {report.confidence} · {report.items_analyzed} records
        </p>
        <h2 className="mt-2 font-display text-2xl text-foreground">{report.title}</h2>
        <p className="mt-1 text-[11px] font-mono text-muted-foreground/80">
          {String(report.period_start).slice(0, 10)} → {String(report.period_end).slice(0, 10)} · prepared by{" "}
          {report.author_name}
        </p>
      </header>
      <Section title="1 · Executive summary">{report.executive_summary}</Section>
      <Section title="2 · Key findings"><Bullets list={report.key_findings} /></Section>
      <Section title="3 · Threat landscape overview">{report.threat_landscape}</Section>
      <Section title="4 · Notable threat actors & campaigns"><Bullets list={report.notable_actors} /></Section>
      <Section title="5 · Targeted sectors"><Bullets list={report.targeted_sectors} /></Section>
      <Section title="6 · Targeted geographies"><Bullets list={report.targeted_geographies} /></Section>
      <Section title="7 · Indicators of compromise">
        {report.indicators?.length ? (
          <div className="font-mono text-xs space-y-1 max-h-72 overflow-auto border border-border/70 p-3 rounded-sm bg-background/50">
            {report.indicators.map((i, k) => (
              <p key={k} className="break-all text-muted-foreground">{i}</p>
            ))}
          </div>
        ) : null}
      </Section>
      <Section title="8 · Assessment & outlook">{report.assessment_outlook}</Section>
      <Section title="9 · Recommendations"><Bullets list={report.recommendations} /></Section>
      <Section title="10 · Sources & methodology">{report.sources_methodology}</Section>
    </article>
  );
}