import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Panel from "@/components/ui-spook/Panel";
import Loader from "@/components/ui-spook/Loader";
import SourceCard from "@/components/sources/SourceCard";
import SourceForm from "@/components/sources/SourceForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/hooks/useMe";
import { RefreshCw, Plus, Radar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Sources() {
  const qc = useQueryClient();
  const { isAdmin } = useMe();
  const [busy, setBusy] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [crawling, setCrawling] = useState(false);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: () => base44.entities.IntelSource.list("-created_date", 100),
  });
  const { data: runs } = useQuery({
    queryKey: ["runs"],
    queryFn: () => base44.entities.IngestionRun.list("-created_date", 12),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["sources"] });
    qc.invalidateQueries({ queryKey: ["runs"] });
    qc.invalidateQueries({ queryKey: ["items"] });
  };

  const pull = async (source) => {
    setBusy(source ? source.slug : "all");
    const res = await base44.functions.invoke("ingest", source ? { slug: source.slug, force: true } : {});
    setBusy("");
    refresh();
    const added = (res.data.results || []).reduce((s, r) => s + (r.added || 0), 0);
    toast({ title: `Ingestion complete — ${added} new records` });
  };

  const crawl = async () => {
    setCrawling(true);
    const res = await base44.functions.invoke("discoverSources", { topic });
    setCrawling(false);
    refresh();
    toast({ title: `Crawler proposed ${(res.data.created || []).length} new open sources` });
  };

  const toggle = async (s) => {
    await base44.entities.IntelSource.update(s.id, { status: s.status === "active" ? "paused" : "active" });
    refresh();
  };
  const remove = async (s) => {
    await base44.entities.IntelSource.delete(s.id);
    refresh();
  };

  if (isLoading) return <Loader label="loading sources" />;

  return (
    <div>
      <PageHeader
        eyebrow="collection"
        title="Intelligence Sources"
        subtitle="Each source is polled no more often than its own acceptable-use window allows. Attribution and licence notes travel with the data."
      >
        {isAdmin && (
          <>
            <Button variant="outline" onClick={() => setShowForm(true)} className="font-mono stencil text-[10px]">
              <Plus className="w-3.5 h-3.5 mr-1" /> add feed
            </Button>
            <Button disabled={busy === "all"} onClick={() => pull(null)} className="font-mono stencil text-[10px]">
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${busy === "all" ? "animate-spin" : ""}`} /> pull all due
            </Button>
          </>
        )}
      </PageHeader>

      {isAdmin && (
        <Panel title="open-source crawler" className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="topic to hunt for, e.g. APT infrastructure, malware IOCs, phishing kits"
              className="bg-background border-border font-mono text-xs"
            />
            <Button disabled={crawling} onClick={crawl} className="font-mono stencil text-[10px] shrink-0">
              <Radar className={`w-3.5 h-3.5 mr-1 ${crawling ? "animate-spin" : ""}`} /> hunt free sources
            </Button>
          </div>
          <p className="mt-2 text-[10px] font-mono text-muted-foreground">
            Crawls the open web for live free feeds, records their licence terms and adds them as proposed sources for review.
          </p>
        </Panel>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        {(sources || []).map((s) => (
          <SourceCard
            key={s.id}
            source={s}
            isAdmin={isAdmin}
            busy={busy === s.slug}
            onIngest={pull}
            onToggle={toggle}
            onDelete={remove}
          />
        ))}
      </div>

      <Panel title="recent ingestion runs">
        <div className="space-y-1.5">
          {(runs || []).map((r) => (
            <div key={r.id} className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              <span className="text-muted-foreground/60">{String(r.created_date).slice(5, 16).replace("T", " ")}</span>
              <span className="text-foreground">{r.source_name}</span>
              <span
                className={
                  r.status === "success" ? "text-primary" : r.status === "error" ? "text-destructive" : "text-accent"
                }
              >
                {r.status}
              </span>
              <span className="ml-auto truncate">
                {r.items_new ? `+${r.items_new} new` : ""} {r.message}
              </span>
            </div>
          ))}
          {!runs?.length && <p className="text-xs font-mono text-muted-foreground">no runs recorded yet</p>}
        </div>
      </Panel>

      <SourceForm open={showForm} onClose={() => setShowForm(false)} onSaved={refresh} />
    </div>
  );
}