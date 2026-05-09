import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/team")({ component: TeamPage });

function TeamPage() {
  const { data: members } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const rolesMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        rolesMap.set(r.user_id, [...(rolesMap.get(r.user_id) ?? []), r.role]);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesMap.get(p.id) ?? [] }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">People</p>
        <h1
          className="mt-1.5 font-display text-3xl font-700 tracking-tight"
          style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}
        >
          Team
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone in your TaskNest workspace.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Member</span>
              </th>
              <th className="px-5 py-3 text-left">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Role</span>
              </th>
              <th className="px-5 py-3 text-left">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Title</span>
              </th>
              <th className="px-5 py-3 text-left">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Joined</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(members ?? []).map((m) => {
              const initials = (m.full_name || m.email || "?")
                .split(" ")
                .map((s: string) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <tr key={m.id} className="transition-colors hover:bg-accent/20">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback
                          className="font-mono text-[10px] font-medium"
                          style={{
                            background: "oklch(0.78 0.14 68 / 18%)",
                            color: "oklch(0.78 0.14 68)",
                          }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-none">{m.full_name || "Unnamed"}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(m.roles.length ? m.roles : ["member"]).map((r: string) => (
                        <span
                          key={r}
                          className="rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                    {m.job_title || "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {(!members || members.length === 0) && (
              <tr>
                <td colSpan={4} className="p-10 text-center font-mono text-xs text-muted-foreground">
                  No teammates yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
