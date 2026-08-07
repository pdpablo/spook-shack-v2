import React from "react";
import { ExternalLink, MessageSquare } from "lucide-react";
import { VERDICT_STYLE, VERDICT_LABEL, SEVERITY_STYLE } from "./verdictStyles";

export default function ItemRow({ item, onOpen }) {
  return (
    <div className="group border border-border/70 bg-card/40 rounded-sm p-3.5 hover:border-primary/40 transition-colors duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono stencil px-1.5 py-0.5 border border-border/80 text-muted-foreground">
              {item.item_type}
            </span>
            <span className={`text-[9px] font-mono stencil ${SEVERITY_STYLE[item.severity] || ""}`}>
              {item.severity}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/70">{item.source_name}</span>
          </div>
          <p className="mt-2 font-mono text-sm text-foreground break-all">{item.value}</p>
          {item.title && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.title}</p>}
          <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-muted-foreground/70 flex-wrap">
            {item.threat_actor && <span>actor: {item.threat_actor}</span>}
            {item.sector && <span>sector: {item.sector}</span>}
            {item.country && <span>geo: {item.country}</span>}
            {item.published_date && <span>{String(item.published_date).slice(0, 10)}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[9px] font-mono stencil px-2 py-1 border ${VERDICT_STYLE[item.verdict || "unreviewed"]}`}>
            {VERDICT_LABEL[item.verdict || "unreviewed"]}
          </span>
          <div className="flex gap-1.5">
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="p-1.5 border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => onOpen(item)}
              className="p-1.5 border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}