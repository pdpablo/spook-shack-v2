import React from "react";
import { NavLink } from "react-router-dom";
import { Radar, Database, Rss, Telescope, FileText } from "lucide-react";

const links = [
  { to: "/", label: "deck", icon: Radar },
  { to: "/feed", label: "feed", icon: Database },
  { to: "/sources", label: "src", icon: Rss },
  { to: "/forecast", label: "next", icon: Telescope },
  { to: "/reports", label: "docs", icon: FileText },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-card/95 backdrop-blur flex">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-mono stencil transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}