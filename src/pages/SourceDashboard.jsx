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
import { ArrowLeft, Database, CheckCircle2, XCircle } from "lucide-react";

export default function SourceDashboard() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const [active, setActive] = useState(null);

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
      {source?.license_note && (
        <p className="mb-6 text-[11px] font-mono text-accent/80 border-l border-accent/40 pl-3">{source.license_note}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile label="Records" value={rows.length} icon={Database} />
        <StatTile
          label="True positive"
          value={rows.filter((r) => r.verdict === "true_positive").length}
          icon={CheckCircle2}
        />
        <StatTile
          label="False positive"
          value={rows.filter((r) => r.verdict === "false_positive").length}
          icon={XCircle}
        />
        <StatTile label="Last pull" value={source?.last_ingested_at ? String(source.last_ingested_at).slice(5, 10) : "—"} hint={source?.last_status} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="volume · 14 days">
          <VolumeArea data={dailyVolume(rows)} />
        </Panel>
        <Panel title="record types">
          <TypeBars data={countBy(rows, "item_type").slice(0, 8)} />
        </Panel>
      </div>

      <Panel title="overlaps with other sources" className="mb-4">
        <CorrelationList rows={crossSource} />
      </Panel>

      <Panel title="records">
        <div className="space-y-2">
          {rows.slice(0, 40).map((i) => (
            <ItemRow key={i.id} item={i} onOpen={setActive} />
          ))}
        </div>
      </Panel>

      <NoteDialog item={active} onClose={() => setActive(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["items"] })} />
    </div>
  );
}