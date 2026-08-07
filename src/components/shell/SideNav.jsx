import React from "react";
import { NavLink } from "react-router-dom";
import { Ghost, Radar, Rss, FileText, Database, Telescope, Users } from "lucide-react";
import { useMe } from "@/components/hooks/useMe";

const links = [
  { to: "/", label: "Overview", icon: Radar },
  { to: "/feed", label: "Intel Feed", icon: Database },
  { to: "/sources", label: "Sources", icon: Rss },
  { to: "/forecast", label: "Forecast", icon: Telescope },
  { to: "/reports", label: "Reports", icon: FileText },
];

export default function SideNav() {
  const { user } = useMe();
  const all = user?.role === "admin" ? [...links, { to: "/admin", label: "Ops", icon: Users }] : links;

  return (
    <aside className="hidden md:flex w-[236px] shrink-0 flex-col border-r border-border/70 bg-sidebar min-h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-border/70">
        <div className="flex items-center gap-2">
          <Ghost className="w-6 h-6 text-primary flicker" />
          <div>
            <div className="font-display text-lg leading-none stencil neon-text text-primary">Spook</div>
            <div className="font-display text-lg leading-none stencil text-foreground">Shack</div>
          </div>
        </div>
        <p className="mt-3 text-[10px] font-mono text-muted-foreground stencil">Threat Intel Unit</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {all.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-xs font-mono stencil rounded transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 text-primary neon-ring"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border/70 text-[10px] font-mono text-muted-foreground/70">
        <p className="stencil">Clearance</p>
        <p className="mt-1 text-primary/80">{user?.role === "admin" ? "ADMIN // FULL" : "ANALYST // READ+NOTE"}</p>
      </div>
    </aside>
  );
}