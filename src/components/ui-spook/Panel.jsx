import React from "react";

export default function Panel({ title, action, children, className = "" }) {
  return (
    <section
      className={`relative scanlines border border-border/80 bg-card/70 rounded-sm overflow-hidden ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70">
          <h2 className="text-[11px] font-mono stencil text-primary/90">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4 relative z-10">{children}</div>
    </section>
  );
}