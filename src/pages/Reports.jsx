import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Panel from "@/components/ui-spook/Panel";
import Loader from "@/components/ui-spook/Loader";
import EmptyState from "@/components/ui-spook/EmptyState";
import ReportCard from "@/components/reports/ReportCard";
import ReportView from "@/components/reports/ReportView";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const PERIODS = ["weekly", "monthly", "quarterly", "annually"];

export default function Reports() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.IntelReport.list("-created_date", 50),
  });

  useEffect(() => {
    if (!selected && reports?.length) setSelected(reports[0]);
  }, [reports, selected]);

  const generate = async (period) => {
    setGenerating(period);
    const res = await base44.functions.invoke("generateReport", { period });
    setGenerating("");
    qc.invalidateQueries({ queryKey: ["reports"] });
    if (res.data.report) setSelected(res.data.report);
    toast({ title: `${period} report drafted` });
  };

  if (isLoading) return <Loader label="loading reports" />;

  return (
    <div>
      <PageHeader
        eyebrow="production"
        title="Threat Intelligence Reports"
        subtitle="Drafted from the ingested corpus using the Zeltser cyber threat intel report structure, with estimative language and stated confidence."
      >
        {PERIODS.map((p) => (
          <Button
            key={p}
            variant={p === "weekly" ? "default" : "outline"}
            disabled={!!generating}
            onClick={() => generate(p)}
            className="font-mono stencil text-[10px]"
          >
            {generating === p ? "drafting" : p}
          </Button>
        ))}
      </PageHeader>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        <div className="space-y-2">
          {(reports || []).map((r) => (
            <ReportCard key={r.id} report={r} active={selected?.id === r.id} onSelect={setSelected} />
          ))}
          {!reports?.length && <p className="text-xs font-mono text-muted-foreground">no reports yet</p>}
        </div>
        <Panel title="report">
          {selected ? (
            <ReportView report={selected} />
          ) : (
            <EmptyState title="no report selected" hint="Generate a weekly, monthly, quarterly or annual report." />
          )}
        </Panel>
      </div>
    </div>
  );
}