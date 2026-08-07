import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SourceForm({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", url: "", kind: "rss", description: "", min_interval_minutes: 360 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.IntelSource.create({
      ...form,
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40),
      min_interval_minutes: Number(form.min_interval_minutes) || 360,
      max_items_per_run: 60,
      status: "active",
    });
    setSaving(false);
    setForm({ name: "", url: "", kind: "rss", description: "", min_interval_minutes: 360 });
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xs stencil text-primary">Add RSS / feed source</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Source name" className="bg-background border-border font-mono text-xs" />
          <Input required value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com/feed.xml" className="bg-background border-border font-mono text-xs" />
          <Input type="number" min="60" value={form.min_interval_minutes} onChange={(e) => set("min_interval_minutes", e.target.value)} placeholder="Minimum minutes between pulls" className="bg-background border-border font-mono text-xs" />
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What intelligence does this provide?" className="bg-background border-border font-mono text-xs" />
          <Button type="submit" disabled={saving} className="w-full font-mono stencil text-[11px]">
            {saving ? "saving" : "register source"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}