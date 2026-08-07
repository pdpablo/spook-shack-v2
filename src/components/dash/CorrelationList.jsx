import React from "react";
import { Link2 } from "lucide-react";

export default function CorrelationList({ rows }) {
  if (!rows?.length)
    return (
      <p className="text-xs font-mono text-muted-foreground">
        no cross-source overlaps yet — ingest more sources to build correlations
      </p>
    );
  return (
    <div className="space-y-2">
      {rows.slice(0, 12).map((r) => (
        <div key={r.pivot} className="border border-border/70 bg-background/40 rounded-sm p-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-sm text-foreground break-all">{r.pivot}</span>
            <span className="ml-auto text-[10px] font-mono text-primary">{r.count} hits</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.sources.map((s) => (
              <span key={s} className="text-[9px] font-mono stencil px-1.5 py-0.5 border border-accent/40 text-accent/90">
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}