import React from "react";
import { Ghost } from "lucide-react";

export default function EmptyState({ title, hint }) {
  return (
    <div className="py-14 text-center">
      <Ghost className="w-8 h-8 mx-auto text-muted-foreground/50" />
      <p className="mt-4 text-sm font-mono stencil text-muted-foreground">{title}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground/70 max-w-sm mx-auto">{hint}</p>}
    </div>
  );
}