import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Panel from "@/components/ui-spook/Panel";
import StatTile from "@/components/ui-spook/StatTile";
import Loader from "@/components/ui-spook/Loader";
import EmptyState from "@/components/ui-spook/EmptyState";
import ForecastCard from "@/components/forecast/ForecastCard";
import TypeBars from "@/components/charts/TypeBars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countBy } from "@/lib/correlate";
import { useMe } from "@/components/hooks/useMe";
import { Telescope, Flame, Boxes } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Forecast() {
  const qc = useQueryClient();
  const { isAdmin } = useMe();
  const [focus, setFocus] = useState("");
  const [running, setRunning] = useState(false);

  const { data: forecasts, isLoading } = useQuery({
    queryKey: ["forecasts"],
    queryFn: () => base44.entities.TechForecast.list("-created_date", 60),
  });

  const run = async () => {
    setRunning(true);
    const res = await base44.functions.invoke("forecastTech", { focus, count: 3 });
    setRunning(false);
    qc.invalidateQueries({ queryKey: ["forecasts"] });
    toast({ title: `Hermes filed ${(res.data.created || []).length} forecasts` });
  };

  if (isLoading) return <Loader label="consulting hermes" />;

  const rows = forecasts || [];
  const avg = rows.length ? (rows.reduce((s, f) => s + (Number(f.risk_score) || 0), 0) / rows.length).toFixed(1) : "—";

  return (
    <div>
      <PageHeader
        eyebrow="hermes agent"
        title="Future Attack Vectors"
        subtitle="Emerging, unreleased and research-stage technology mapped to the attack vectors of the technology it descends from — and how threat actors are likely to abuse it."
      >
        {isAdmin && (
          <div className="flex gap-2">
            <Input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="focus area (optional)"
              className="bg-card border-border font-mono text-xs w-56"
            />
            <Button disabled={running} onClick={run} className="font-mono stencil text-[10px]">
              <Telescope className={`w-3.5 h-3.5 mr-1 ${running ? "animate-spin" : ""}`} />
              {running ? "forecasting" : "run hermes"}
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatTile label="Forecasts filed" value={rows.length} icon={Boxes} />
        <StatTile label="Mean risk" value={avg} icon={Flame} hint="scale 1-10" />
        <StatTile label="Near horizon" value={rows.filter((f) => f.horizon === "0-6 months").length} hint="0-6 months" />
      </div>

      {rows.length > 0 && (
        <Panel title="technology classifications" className="mb-4">
          <TypeBars data={countBy(rows, "classification").slice(0, 8)} />
        </Panel>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="no forecasts filed"
          hint={isAdmin ? "Run Hermes to research emerging technology and predict its abuse." : "Ask an admin to run the Hermes agent."}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((f) => (
            <ForecastCard key={f.id} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}