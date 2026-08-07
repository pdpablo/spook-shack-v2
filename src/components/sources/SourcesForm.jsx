import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const KIND_OPTIONS = [
  { value: "rss", label: "RSS / Atom" },
  { value: "telegram", label: "Telegram channel" },
  { value: "ransomware_live", label: "Ransomware.live" },
  { value: "ransomware_pro", label: "Ransomware.live Pro" },
  { value: "tweetfeed", label: "TweetFeed" },
  { value: "phishunt", label: "Phishunt" },
  { value: "hibp", label: "Have I Been Pwned" },
  { value: "other", label: "Other" },
];

function normalizeTelegramHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/t\.me\/(?:s\/)?/i, "")
    .replace(/^@/, "")
    .replace(/\?.*$/, "")
    .replace(/\/+$/, "")
    .trim();
}

const INITIAL_FORM = {
  name: "",
  url: "",
  telegram_channel: "",
  kind: "rss",
  description: "",
  min_interval_minutes: 360,
};

export default function SourceForm({ open, onClose, onSaved }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isTelegram = form.kind === "telegram";
  const telegramHandle = useMemo(() => normalizeTelegramHandle(form.telegram_channel), [form.telegram_channel]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const telegramChannel = isTelegram ? telegramHandle : "";
    const url = isTelegram
      ? form.url || (telegramChannel ? `https://t.me/s/${telegramChannel}` : "")
      : form.url;

    await base44.entities.IntelSource.create({
      ...form,
      url,
      telegram_channel: telegramChannel,
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40),
      min_interval_minutes: Number(form.min_interval_minutes) || 360,
      max_items_per_run: isTelegram ? 100 : 60,
      status: "active",
    });
    setSaving(false);
    setForm(INITIAL_FORM);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xs stencil text-primary">Add source</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Source name"
            className="bg-background border-border font-mono text-xs"
          />
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value)}
            className="w-full bg-background border border-border text-[11px] font-mono stencil px-3 py-2 rounded-sm text-muted-foreground focus:outline-none focus:border-primary/60"
          >
            {KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {isTelegram ? (
            <>
              <Input
                required
                value={form.telegram_channel}
                onChange={(e) => set("telegram_channel", e.target.value)}
                placeholder="@channelhandle or https://t.me/channelhandle"
                className="bg-background border-border font-mono text-xs"
              />
              <Input
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="Optional public t.me URL override"
                className="bg-background border-border font-mono text-xs"
              />
            </>
          ) : (
            <Input
              required
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://example.com/feed.xml"
              className="bg-background border-border font-mono text-xs"
            />
          )}
          <Input
            type="number"
            min="60"
            value={form.min_interval_minutes}
            onChange={(e) => set("min_interval_minutes", e.target.value)}
            placeholder="Minimum minutes between pulls"
            className="bg-background border-border font-mono text-xs"
          />
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={isTelegram ? "What does this channel report on?" : "What intelligence does this provide?"}
            className="bg-background border-border font-mono text-xs"
          />
          <Button type="submit" disabled={saving} className="w-full font-mono stencil text-[11px]">
            {saving ? "saving" : "register source"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
