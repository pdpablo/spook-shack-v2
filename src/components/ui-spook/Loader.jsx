import React from "react";

export default function Loader({ label = "scanning" }) {
  return (
    <div className="py-14 flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-mono stencil text-muted-foreground">{label}</p>
    </div>
  );
}