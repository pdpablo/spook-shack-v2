import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Panel from "@/components/ui-spook/Panel";
import StatTile from "@/components/ui-spook/StatTile";
import Loader from "@/components/ui-spook/Loader";
import TypeBars from "@/components/charts/TypeBars";
import VolumeArea from "@/components/charts/VolumeArea";
import CorrelationList from "@/components/dash/CorrelationList";
import ItemRow from "@/components/intel/ItemRow";
import NoteDialog from "@/components/intel/NoteDialog";
import { countBy, dailyVolume, correlations } from "@/lib/correlate";
import { downloadItemsCsv, downloadItemsStix } from "@/lib/intelExports";
import { ArrowLeft, Database, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SourceDashboard() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const [active, setActive] = useState(null);
  const [q, setQ] = useState("");
  const [dateRange, setDateRange] = useState("30d");

  const { data: sources } = useQuery({
    queryKey: ["sources"],
    queryFn: () => base44.entities.IntelSource.list("-created_date", 100),
  });
  const { data: items, isLoading } = useQuery({
    queryKey: ["items", "source", slug],
    queryFn: () => base44.entities.IntelItem.filter({ source_slug: slug }, "-created_date", 600),
  });
  const { data: all } = useQuery({
    queryKey: ["items", "overview"],
    queryFn: () => base44.entities.IntelItem.list("-created_date", 1000),
  });

  const source = (sources || []).find((s) => s.slug === slug);
  const rows = items || [];

  const crossSource = useMemo(() => {
    const values = new Set(rows.map((r) => String(r.value || "").toLowerCase()));
    const pool = (all || []).filter((i) => i.source_slug === slug || values.has(String(i.value || "").toLowerCase()));
    return correlations(pool).filter((c) => c.sources.length > 1);
  }, [rows, all, slug]);

  const filteredRows = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const cutoff = dateRange === "all" ? 0 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const since = cutoff ? Date.now() - cutoff * 86400000 : 0;
    return rows.filter((row) => {
      if (cutoff) {
        const when = Date.parse(row.published_date || row.created_date || "");
        if (Number.isNaN(when) || when < since) return false;
      }
      if (!needle) return true;
      return [row.value, row.title, row.summary, row.threat_actor, row.victim_org, row.sector, row.country, (row.tags || []).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, q, dateRange]);

  if (isLoading) return <Loader label="loading source deck" />;

  return (
    <div>
      <Link to="/sources" className="inline-flex items-center gap-1.5 text-[10px] font-mono stencil text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> sources
      </Link>
      <PageHeader
        eyebrow={source?.kind || "source"}
        title={source?.name || slug}
        subtitle={source?.description}
      />
      {source?.kind === "telegram" && source?.telegram_channel && (
        <p className="mb-4 text-[11px] font-mono text-accent/80 border-l border-accent/40 pl-3">
          telegram channel: {source.telegram_channel}
        </p>
      )}
      {source?.license_note && (
        <p className="mb-6 text-[11px] font-mono text-accent/80 border-l border-accent/40 pl-3">{source.license_note}</p>
      )}

      <div className="mb-5 flex flex-col xl:flex-row xl:items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter by keyword, actor, IOC, sector or geography"
          className="bg-card border-border font-mono text-xs xl:max-w-md"
        />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-card border border-border text-[11px] font-mono stencil px-3 py-2 rounded-sm text-muted-foreground"
        >
          <option value="7d">last 7 days</option>
          <option value="30d">last 30 days</option>
          <option value="90d">last 90 days</option>
          <option value="all">all time</option>
        </select>
        <div className="flex flex-wrap gap-2 xl:ml-auto">
          <Button variant="outline" onClick={() => downloadItemsCsv({ source, items: filteredRows })} className="font-mono stencil text-[10px]">
            csv
          </Button>
          <Button variant="outline" onClick={() => downloadItemsStix({ source, items: filteredRows })} className="font-mono stencil text-[10px]">
            stix
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile label="Records" value={filteredRows.length} icon={Database} />
        <StatTile
          label="True positive"
          value={filteredRows.filter((r) => r.verdict === "true_positive").length}
          icon={CheckCircle2}
        />
        <StatTile
          label="False positive"
          value={filteredRows.filter((r) => r.verdict === "false_positive").length}
          icon={XCircle}
        />
        <StatTile label="Last pull" value={source?.last_ingested_at ? String(source.last_ingested_at).slice(5, 10) : "—"} hint={source?.last_status} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="volume · 14 days">
          <VolumeArea data={dailyVolume(filteredRows)} />
        </Panel>
        <Panel title="record types">
          <TypeBars data={countBy(filteredRows, "item_type").slice(0, 8)} />
        </Panel>
      </div>

      <Panel title="overlaps with other sources" className="mb-4">
        <CorrelationList rows={crossSource} />
      </Panel>

      <Panel title="records">
        <div className="space-y-2">
          {filteredRows.slice(0, 40).map((i) => (
            <ItemRow key={i.id} item={i} onOpen={setActive} />
          ))}
        </div>
      </Panel>

      <NoteDialog item={active} onClose={() => setActive(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["items"] })} />
    </div>
  );
}