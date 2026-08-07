import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function FeedFilters({ q, setQ, type, setType, verdict, setVerdict, source, setSource, sources }) {
  const sel =
    "bg-card border border-border text-[11px] font-mono stencil px-3 py-2 rounded-sm text-muted-foreground focus:outline-none focus:border-primary/60";
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search indicator, actor, victim..."
          className="pl-9 bg-card border-border font-mono text-xs"
        />
      </div>
      <select className={sel} value={source} onChange={(e) => setSource(e.target.value)}>
        <option value="">all sources</option>
        {sources.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
      <select className={sel} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">all types</option>
        {["ip", "domain", "url", "hash", "email", "victim", "breach", "leak", "vulnerability", "article", "other"].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select className={sel} value={verdict} onChange={(e) => setVerdict(e.target.value)}>
        <option value="">all verdicts</option>
        {["unreviewed", "true_positive", "false_positive", "needs_info"].map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}