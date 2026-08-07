import React from "react";

export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[10px] font-mono stencil text-primary/70 mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}