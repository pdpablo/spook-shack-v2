import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play, Pause, Trash2 } from "lucide-react";

const STATUS = {
  active: "text-primary border-primary/50",
  paused: "text-muted-foreground border-border",
  proposed: "text-accent border-accent/50",
  error: "text-destructive border-destructive/50",
};

export default function SourceCard({ source, isAdmin, busy, onIngest, onToggle, onDelete }) {
  return (
    <div className="relative scanlines border border-border/80 bg-card/60 rounded-sm p-4 hover:border-primary/40 transition-colors duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/sources/${source.slug}`} className="font-display text-lg text-foreground hover:text-primary transition-colors">
            {source.name}
          </Link>
          <p className="mt-1 text-[10px] font-mono text-muted-foreground/80">{source.url}</p>
        </div>
        <span className={`text-[9px] font-mono stencil px-2 py-1 border shrink-0 ${STATUS[source.status] || ""}`}>
          {source.status}
        </span>
      </div>
      {source.description && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{source.description}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground/80">
        <span>items: <span className="text-primary">{source.total_items || 0}</span></span>
        <span>every {source.min_interval_minutes || 720}m</span>
        <span className="col-span-2 truncate">
          last: {source.last_ingested_at ? String(source.last_ingested_at).slice(0, 16).replace("T", " ") : "never"}
        </span>
      </div>
      {source.license_note && (
        <p className="mt-3 text-[10px] font-mono text-accent/70 border-l border-accent/40 pl-2">{source.license_note}</p>
      )}
      {isAdmin && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onIngest(source)} className="text-[10px] font-mono stencil">
            <RefreshCw className={`w-3 h-3 mr-1 ${busy ? "animate-spin" : ""}`} /> pull
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onToggle(source)} className="text-[10px] font-mono stencil text-muted-foreground">
            {source.status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(source)} className="text-[10px] text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}