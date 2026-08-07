import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/hooks/useMe";

const OPTIONS = [
  { key: "true_positive", label: "True positive" },
  { key: "false_positive", label: "False positive" },
  { key: "needs_info", label: "Needs info" },
];

export default function NoteDialog({ item, onClose, onSaved }) {
  const { user, isAdmin } = useMe();
  const [verdict, setVerdict] = useState("true_positive");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setVerdict(item.verdict === "unreviewed" ? "true_positive" : item.verdict);
    setNote("");
    base44.entities.ItemNote.filter({ item_id: item.id }, "-created_date", 20).then(setNotes);
  }, [item]);

  const save = async () => {
    setSaving(true);
    await base44.entities.ItemNote.create({
      item_id: item.id,
      item_value: item.value,
      verdict,
      note,
      analyst_name: user?.full_name || user?.email,
    });
    if (isAdmin) await base44.entities.IntelItem.update(item.id, { verdict });
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-xs stencil text-primary">Analyst assessment</DialogTitle>
        </DialogHeader>
        <p className="font-mono text-sm break-all text-foreground">{item?.value}</p>
        <div className="flex gap-2 flex-wrap">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setVerdict(o.key)}
              className={`text-[10px] font-mono stencil px-3 py-2 border transition-colors ${
                verdict === o.key
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reasoning, corroborating evidence, related indicators..."
          className="bg-background border-border font-mono text-xs min-h-[110px]"
        />
        {notes.length > 0 && (
          <div className="max-h-40 overflow-auto space-y-2 border-t border-border pt-3">
            {notes.map((n) => (
              <div key={n.id} className="text-[11px] font-mono text-muted-foreground">
                <span className="text-primary/80">{n.verdict}</span> — {n.analyst_name}: {n.note}
              </div>
            ))}
          </div>
        )}
        <Button onClick={save} disabled={saving} className="w-full font-mono stencil text-[11px]">
          {saving ? "saving" : "record assessment"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}