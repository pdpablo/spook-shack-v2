import React from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Ghost } from "lucide-react";
import { useMe } from "@/components/hooks/useMe";

export default function TopBar() {
  const { user } = useMe();
  const { pathname } = useLocation();

  return (
    <header className="relative scanlines border-b border-border/70 bg-card/40 backdrop-blur px-5 md:px-10 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Link to="/" className="md:hidden flex items-center gap-2">
          <Ghost className="w-5 h-5 text-primary" />
          <span className="font-display stencil text-sm text-primary">Spook Shack</span>
        </Link>
        <span className="hidden md:inline text-[10px] font-mono stencil text-muted-foreground">
          {pathname === "/" ? "// universal correlation deck" : `// ${pathname.replace("/", "")}`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-[11px] font-mono text-muted-foreground truncate max-w-[180px]">
          {user?.full_name || user?.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}