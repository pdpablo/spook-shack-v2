import React from "react";

export default function StatTile({ label, value, hint, icon: Icon }) {
  return (
    <div className="relative scanlines border border-border/80 bg-card/60 rounded-sm p-4 hover:border-primary/40 transition-colors duration-300">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-mono stencil text-muted-foreground">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-primary/70" />}
      </div>
      <p className="mt-3 font-display text-3xl text-primary neon-text">{value}</p>
      {hint && <p className="mt-1 text-[11px] font-mono text-muted-foreground/80">{hint}</p>}
    </div>
  );
}