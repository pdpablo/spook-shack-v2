import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Panel from "@/components/ui-spook/Panel";
import StatTile from "@/components/ui-spook/StatTile";
import Loader from "@/components/ui-spook/Loader";
import TypeBars from "@/components/charts/TypeBars";
import VolumeArea from "@/components/charts/VolumeArea";
import CorrelationList from "@/components/dash/CorrelationList";
import ItemRow from "@/components/intel/ItemRow";
import { correlations, countBy, dailyVolume } from "@/lib/correlate";
import { Link } from "react-router-dom";
import { Database, Rss, ShieldAlert, Link2 } from "lucide-react";

export default function Overview() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["items", "overview"],
    queryFn: () => base44.entities.IntelItem.list("-created_date", 1000),
  });
  const { data: sources } = useQuery({
    queryKey: ["sources"],
    queryFn: () => base44.entities.IntelSource.list("-created_date", 100),
  });

  if (isLoading) return <Loader label="loading correlation deck" />;

  const all = items || [];
  const corr = correlations(all);
  const critical = all.filter((i) => ["high", "critical"].includes(i.severity)).length;

  return (
    <div>
      <PageHeader
        eyebrow="universal deck"
        title="Correlation Overview"
        subtitle="Every source normalised into one correlatable picture — pivots that appear across multiple feeds surface first."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile label="Intel records" value={all.length} icon={Database} hint="normalised & correlatable" />
        <StatTile
          label="Active sources"
          value={(sources || []).filter((s) => s.status === "active").length}
          icon={Rss}
          hint={`${(sources || []).length} registered`}
        />
        <StatTile label="High / critical" value={critical} icon={ShieldAlert} hint="severity weighted" />
        <StatTile label="Cross-source pivots" value={corr.length} icon={Link2} hint="seen in 2+ feeds" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="ingest volume · 14 days">
          <VolumeArea data={dailyVolume(all)} />
        </Panel>
        <Panel title="records by source">
          <TypeBars data={countBy(all, "source_name").slice(0, 7)} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="indicator types">
          <TypeBars data={countBy(all, "item_type").slice(0, 8)} />
        </Panel>
        <Panel title="top threat actors">
          <TypeBars data={countBy(all.filter((i) => i.threat_actor), "threat_actor").slice(0, 8)} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="cross-source correlations">
          <CorrelationList rows={corr} />
        </Panel>
        <Panel
          title="latest intake"
          action={
            <Link to="/feed" className="text-[10px] font-mono stencil text-muted-foreground hover:text-primary">
              full feed →
            </Link>
          }
        >
          <div className="space-y-2">
            {all.slice(0, 6).map((i) => (
              <ItemRow key={i.id} item={i} onOpen={() => {}} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}