import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { user, profile } = useAuth();
  const uid = user!.id;

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", uid],
    queryFn: async () => {
      const [projects, openTasks, myTasks, evals, overdue, activity] = await Promise.all([
        supabase.from("projects").select("id,status", { count: "exact" }),
        supabase.from("tasks").select("id", { count: "exact" }).neq("status", "done"),
        supabase.from("tasks").select("id,title,status,due_date,priority,project_id").eq("assignee_id", uid).neq("status", "done").order("due_date", { ascending: true }).limit(6),
        supabase.from("evaluations").select("verdict"),
        supabase.from("tasks").select("id", { count: "exact" }).lt("due_date", new Date().toISOString().slice(0, 10)).neq("status", "done"),
        supabase.from("activity_logs").select("id,action,created_at,metadata,user_id").order("created_at", { ascending: false }).limit(8),
      ]);
      const approved = (evals.data ?? []).filter((e) => e.verdict === "approved").length;
      const pending = (evals.data ?? []).filter((e) => e.verdict === "pending").length;
      return {
        projectsCount: projects.count ?? 0,
        activeProjects: (projects.data ?? []).filter((p) => p.status === "active").length,
        openTasks: openTasks.count ?? 0,
        overdue: overdue.count ?? 0,
        myTasks: myTasks.data ?? [],
        evals: { approved, pending, total: evals.data?.length ?? 0 },
        activity: activity.data ?? [],
      };
    },
  });

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Overview</p>
          <h1 className="mt-1.5 font-display text-3xl font-700 leading-tight tracking-tight" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
            {firstName ? `Hey, ${firstName}.` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's moving across your AI ops workspace.
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active projects" value={stats?.activeProjects ?? 0} sub={`of ${stats?.projectsCount ?? 0} total`} icon={FolderKanban} colorClass="text-info" />
        <Kpi label="Open tasks" value={stats?.openTasks ?? 0} sub="across all projects" icon={Clock} colorClass="text-primary" />
        <Kpi label="Overdue" value={stats?.overdue ?? 0} sub="needs attention" icon={TrendingUp} colorClass="text-destructive" />
        <Kpi label="Evals approved" value={stats?.evals.approved ?? 0} sub={`${stats?.evals.pending ?? 0} pending`} icon={Sparkles} colorClass="text-success" />
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Assigned tasks */}
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
              Assigned to you
            </h2>
            <Link
              to="/projects"
              className="group inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {(!stats?.myTasks || stats.myTasks.length === 0) ? (
            <EmptyState title="No tasks assigned" hint="When teammates assign you work, it'll show up here." />
          ) : (
            <ul className="divide-y divide-border">
              {stats.myTasks.map((t) => (
                <li key={t.id} className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {t.due_date ? `Due ${t.due_date}` : "No due date"} · {t.priority}
                    </p>
                  </div>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: t.project_id }}
                    className="ml-4 shrink-0 rounded border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
              Activity
            </h2>
          </div>

          {(!stats?.activity || stats.activity.length === 0) ? (
            <EmptyState title="Quiet in here" hint="Activity from your projects will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {stats.activity.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-3 transition-colors hover:bg-accent/20">
                  <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground/80 leading-snug">{a.action}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* AI Eval health */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <h3 className="font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
            AI evaluation health
          </h3>
        </div>
        <div className="grid gap-px bg-border md:grid-cols-3">
          <Stat label="Total evaluations" value={stats?.evals.total ?? 0} />
          <Stat label="Approved" value={stats?.evals.approved ?? 0} />
          <Stat label="Pending review" value={stats?.evals.pending ?? 0} />
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label, value, sub, icon: Icon, colorClass,
}: {
  label: string; value: number | string; sub?: string; icon: any; colorClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-colors hover:border-border/70">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground leading-snug">{label}</p>
        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${colorClass ?? "text-muted-foreground"}`} />
      </div>
      <p className="mt-4 font-display text-4xl font-700 leading-none tracking-tight" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-700 tracking-tight" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
