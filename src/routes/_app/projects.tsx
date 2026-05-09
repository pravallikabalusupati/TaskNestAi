import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects")({ component: ProjectsPage });

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-muted-foreground/50",
  medium: "bg-info",
  high: "bg-warning",
  urgent: "bg-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

function ProjectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (projects ?? []).filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const createProject = useMutation({
    mutationFn: async (form: {
      name: string;
      description: string;
      priority: string;
      due_date: string | null;
      status: string;
    }) => {
      const { error } = await supabase.from("projects").insert({
        name: form.name,
        description: form.description || null,
        priority: form.priority as any,
        status: form.status as any,
        due_date: form.due_date || null,
        owner_id: user!.id,
      });
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        user_id: user!.id,
        action: `Created project "${form.name}"`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      toast.success("Project created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Workspace</p>
          <h1 className="mt-1.5 font-display text-3xl font-700 tracking-tight" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize annotation, evaluation, and review workstreams.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono text-xs uppercase tracking-wider">
              <Plus className="mr-1.5 h-4 w-4" /> New project
            </Button>
          </DialogTrigger>
          <ProjectDialog onSubmit={(f) => createProject.mutate(f)} busy={createProject.isPending} />
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="pl-8 bg-muted/40 border-border font-mono text-sm placeholder:text-muted-foreground/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-muted/40 border-border font-mono text-xs uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-14 text-center">
          <p className="font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
            No projects yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first project to start tracking AI evaluation work.
          </p>
          <Button
            className="mt-5 font-mono text-xs uppercase tracking-wider"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New project
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-accent/20"
            >
              {/* Priority stripe */}
              <div className={`absolute left-0 top-0 h-full w-0.5 ${PRIORITY_DOT[p.priority]} opacity-60`} />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[p.priority]}`} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>

              <h3 className="mt-3 font-display text-base font-semibold leading-snug" style={{ fontFamily: "Syne, sans-serif" }}>
                {p.name}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                {p.description || "No description"}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/60">
                  <Calendar className="h-3 w-3" />
                  {p.due_date || "No due date"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  {p.priority}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectDialog({ onSubmit, busy }: { onSubmit: (f: any) => void; busy: boolean }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "medium",
    status: "planning",
    due_date: "",
  });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-display" style={{ fontFamily: "Syne, sans-serif" }}>
          Create project
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Q4 RAG Eval Sprint" />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Due date">
          <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </Field>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit(form)}
          disabled={!form.name || busy}
          className="font-mono text-xs uppercase tracking-wider"
        >
          {busy ? "Creating…" : "Create project"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-card" />
      ))}
    </div>
  );
}
