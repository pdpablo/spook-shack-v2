import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Loader from "@/components/ui-spook/Loader";
import EmptyState from "@/components/ui-spook/EmptyState";
import FeedFilters from "@/components/intel/FeedFilters";
import ItemRow from "@/components/intel/ItemRow";
import NoteDialog from "@/components/intel/NoteDialog";

export default function Feed() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [verdict, setVerdict] = useState("");
  const [source, setSource] = useState("");
  const [active, setActive] = useState(null);
  const [limit, setLimit] = useState(60);

  const { data: items, isLoading } = useQuery({
    queryKey: ["items", "feed"],
    queryFn: () => base44.entities.IntelItem.list("-created_date", 1000),
  });
  const { data: sources } = useQuery({
    queryKey: ["sources"],
    queryFn: () => base44.entities.IntelSource.list("-created_date", 100),
  });

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (items || []).filter((i) => {
      if (type && i.item_type !== type) return false;
      if (verdict && (i.verdict || "unreviewed") !== verdict) return false;
      if (source && i.source_slug !== source) return false;
      if (!needle) return true;
      return [i.value, i.title, i.threat_actor, i.victim_org, i.sector, (i.tags || []).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, q, type, verdict, source]);

  if (isLoading) return <Loader label="loading intel feed" />;

  return (
    <div>
      <PageHeader
        eyebrow="intake"
        title="Intel Feed"
        subtitle="Normalised records from every source. Mark true or false positives and leave your reasoning for the next analyst."
      />
      <FeedFilters
        q={q}
        setQ={setQ}
        type={type}
        setType={setType}
        verdict={verdict}
        setVerdict={setVerdict}
        source={source}
        setSource={setSource}
        sources={sources || []}
      />
      <p className="text-[10px] font-mono stencil text-muted-foreground mb-3">{filtered.length} records</p>
      {filtered.length === 0 ? (
        <EmptyState title="no records match" hint="Adjust the filters, or pull the sources from the Sources deck." />
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, limit).map((i) => (
            <ItemRow key={i.id} item={i} onOpen={setActive} />
          ))}
        </div>
      )}
      {filtered.length > limit && (
        <button
          onClick={() => setLimit((l) => l + 60)}
          className="mt-5 w-full border border-border/70 py-3 text-[10px] font-mono stencil text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          load more
        </button>
      )}
      <NoteDialog
        item={active}
        onClose={() => setActive(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["items"] })}
      />
    </div>
  );
}