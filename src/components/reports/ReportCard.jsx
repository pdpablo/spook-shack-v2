import React from "react";
import { FileText } from "lucide-react";

export default function ReportCard({ report, active, onSelect }) {
  return (
    <button
      onClick={() => onSelect(report)}
      className={`w-full text-left border rounded-sm p-3 transition-colors duration-300 ${
        active ? "border-primary/60 bg-primary/5" : "border-border/70 bg-card/40 hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-primary/80" />
        <span className="text-[9px] font-mono stencil text-muted-foreground">{report.period}</span>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground/70">{report.items_analyzed} items</span>
      </div>
      <p className="mt-2 text-sm text-foreground line-clamp-2">{report.title}</p>
      <p className="mt-1 text-[10px] font-mono text-muted-foreground/70">
        {String(report.period_start).slice(0, 10)} → {String(report.period_end).slice(0, 10)}
      </p>
    </button>
  );
}