import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui-spook/PageHeader";
import Panel from "@/components/ui-spook/Panel";
import Loader from "@/components/ui-spook/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/hooks/useMe";
import { UserPlus, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Ops() {
  const qc = useQueryClient();
  const { isAdmin, isLoading: loadingMe } = useMe();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date", 100),
    enabled: isAdmin,
  });

  if (loadingMe || isLoading) return <Loader label="loading ops" />;
  if (!isAdmin)
    return (
      <Panel title="restricted">
        <p className="text-sm text-muted-foreground font-mono">Admin clearance required.</p>
      </Panel>
    );

  const invite = async (e) => {
    e.preventDefault();
    setInviting(true);
    await base44.users.inviteUser(email, role);
    setInviting(false);
    setEmail("");
    qc.invalidateQueries({ queryKey: ["users"] });
    toast({ title: `Invite sent to ${email}` });
  };

  const setUserRole = async (u, next) => {
    await base44.entities.User.update(u.id, { role: next });
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  return (
    <div>
      <PageHeader
        eyebrow="access control"
        title="Unit Operations"
        subtitle="Admins manage sources, ingestion, forecasts and users. Analysts read intelligence and record assessments."
      />
      <Panel title="invite analyst" className="mb-4">
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-2">
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analyst@agency.gov"
            className="bg-background border-border font-mono text-xs"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-background border border-border text-[11px] font-mono stencil px-3 py-2 rounded-sm text-muted-foreground"
          >
            <option value="user">analyst</option>
            <option value="admin">admin</option>
          </select>
          <Button type="submit" disabled={inviting} className="font-mono stencil text-[10px] shrink-0">
            <UserPlus className="w-3.5 h-3.5 mr-1" /> {inviting ? "sending" : "invite"}
          </Button>
        </form>
      </Panel>

      <Panel title="personnel">
        <div className="space-y-1.5">
          {(users || []).map((u) => (
            <div key={u.id} className="flex items-center gap-3 border border-border/60 rounded-sm px-3 py-2">
              <ShieldCheck className={`w-3.5 h-3.5 ${u.role === "admin" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{u.full_name || u.email}</p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className="ml-auto text-[9px] font-mono stencil text-muted-foreground">{u.role}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUserRole(u, u.role === "admin" ? "user" : "admin")}
                className="text-[9px] font-mono stencil text-muted-foreground hover:text-primary"
              >
                {u.role === "admin" ? "demote" : "promote"}
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}