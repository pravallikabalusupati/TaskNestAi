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
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects/$projectId")({ component: ProjectDetail });

const STATUSES = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "in_review", label: "In review" },
  { id: "done", label: "Done" },
] as const;

const PRIO_CHIP: Record<string, string> = {
  low: "bg-muted/60 text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

const COL_ACCENT: Record<string, string> = {
  todo: "border-t-border",
  in_progress: "border-t-info/60",
  in_review: "border-t-warning/60",
  done: "border-t-success/60",
};

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const createTask = useMutation({
    mutationFn: async (form: {
      title: string;
      description: string;
      priority: string;
      due_date: string;
    }) => {
      const { error } = await supabase.from("tasks").insert({
        title: form.title,
        description: form.description || null,
        priority: form.priority as any,
        due_date: form.due_date || null,
        project_id: projectId,
        created_by: user!.id,
        assignee_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      setOpen(false);
      toast.success("Task added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateStatus.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="font-display text-3xl font-700 tracking-tight"
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}
            >
              {project?.name ?? "…"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {project?.description || "No description"}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono text-xs uppercase tracking-wider">
                <Plus className="mr-1.5 h-4 w-4" /> New task
              </Button>
            </DialogTrigger>
            <TaskDialog onSubmit={(f) => createTask.mutate(f)} busy={createTask.isPending} />
          </Dialog>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((s) => {
          const items = (tasks ?? []).filter((t) => t.status === s.id);
          return (
            <div
              key={s.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, s.id)}
              className={`flex h-full min-h-[440px] flex-col rounded-lg border border-border border-t-2 bg-card/40 ${COL_ACCENT[s.id]}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {s.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-muted font-mono text-[10px] text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex-1 space-y-2 p-2">
                {items.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                    className="group cursor-grab rounded-md border border-border bg-card p-3.5 shadow-sm transition-all active:cursor-grabbing hover:border-border/80 hover:shadow-md"
                  >
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    {t.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {t.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${PRIO_CHIP[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                      {t.due_date && (
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {t.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded border border-dashed border-border/50 p-4 text-center">
                    <p className="font-mono text-[10px] text-muted-foreground/40">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskDialog({ onSubmit, busy }: { onSubmit: (f: any) => void; busy: boolean }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", due_date: "" });
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-display" style={{ fontFamily: "Syne, sans-serif" }}>
          New task
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Title">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Review GPT-5 jailbreak responses"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
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
          <Field label="Due date">
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </Field>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit(form)}
          disabled={!form.title || busy}
          className="font-mono text-xs uppercase tracking-wider"
        >
          {busy ? "Adding…" : "Add task"}
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
