import { createFileRoute } from "@tanstack/react-router";
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
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/evaluations")({ component: EvalsPage });

const VERDICT_STYLES: Record<string, string> = {
  pending: "bg-warning/12 text-warning border-warning/25",
  approved: "bg-success/12 text-success border-success/25",
  rejected: "bg-destructive/12 text-destructive border-destructive/25",
  needs_revision: "bg-info/12 text-info border-info/25",
};

function EvalsPage() {
  const { user, hasRole } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const canReview = hasRole("admin") || hasRole("reviewer");

  const { data: projects } = useQuery({
    queryKey: ["projects-min"],
    queryFn: async () => (await supabase.from("projects").select("id,name")).data ?? [],
  });

  const { data: evals } = useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (f: any) => {
      const { error } = await supabase.from("evaluations").insert({
        project_id: f.project_id,
        prompt: f.prompt,
        response: f.response,
        model_name: f.model_name || null,
        accuracy: Number(f.accuracy),
        relevance: Number(f.relevance),
        consistency: Number(f.consistency),
        notes: f.notes || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      setOpen(false);
      toast.success("Evaluation submitted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setVerdict = useMutation({
    mutationFn: async ({ id, verdict }: { id: string; verdict: string }) => {
      const { error } = await supabase
        .from("evaluations")
        .update({ verdict: verdict as any, reviewer_id: user!.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evaluations"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Quality</p>
          <h1
            className="mt-1.5 font-display text-3xl font-700 tracking-tight"
            style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}
          >
            AI Evaluations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Score model outputs and route them for approval.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono text-xs uppercase tracking-wider">
              <Plus className="mr-1.5 h-4 w-4" /> Submit evaluation
            </Button>
          </DialogTrigger>
          <EvalDialog
            projects={projects ?? []}
            onSubmit={(f) => create.mutate(f)}
            busy={create.isPending}
          />
        </Dialog>
      </div>

      {/* Empty state */}
      {(!evals || evals.length === 0) ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-14 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-muted-foreground/40" />
          <p className="mt-3 font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
            No evaluations yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submit a prompt-response pair to start scoring AI outputs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {evals.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-lg border border-border bg-card">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${VERDICT_STYLES[e.verdict]}`}
                  >
                    {e.verdict.replace("_", " ")}
                  </span>
                  {e.model_name && (
                    <span className="font-mono text-[11px] text-muted-foreground">{e.model_name}</span>
                  )}
                </div>
                {/* Score pills */}
                <div className="flex items-center gap-3">
                  <ScorePill label="Acc" value={e.accuracy} />
                  <ScorePill label="Rel" value={e.relevance} />
                  <ScorePill label="Con" value={e.consistency} />
                </div>
              </div>

              {/* Body */}
              <div className="grid gap-0 md:grid-cols-2">
                <div className="border-b border-r border-border px-5 py-4 md:border-b-0">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    Prompt
                  </p>
                  <p className="text-sm leading-relaxed">{e.prompt}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    Response
                  </p>
                  <p className="whitespace-pre-wrap rounded border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                    {e.response}
                  </p>
                </div>
              </div>

              {/* Notes + actions */}
              {(e.notes || (canReview && e.verdict === "pending")) && (
                <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
                  {e.notes && (
                    <p className="text-xs italic text-muted-foreground">{e.notes}</p>
                  )}
                  {canReview && e.verdict === "pending" && (
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 font-mono text-[10px] uppercase tracking-wider text-destructive hover:text-destructive"
                        onClick={() => setVerdict.mutate({ id: e.id, verdict: "rejected" })}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 font-mono text-[10px] uppercase tracking-wider"
                        onClick={() => setVerdict.mutate({ id: e.id, verdict: "needs_revision" })}
                      >
                        Revise
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 font-mono text-[10px] uppercase tracking-wider"
                        onClick={() => setVerdict.mutate({ id: e.id, verdict: "approved" })}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-medium text-foreground">{v}/5</span>
    </div>
  );
}

function EvalDialog({
  projects,
  onSubmit,
  busy,
}: {
  projects: { id: string; name: string }[];
  onSubmit: (f: any) => void;
  busy: boolean;
}) {
  const [f, setF] = useState({
    project_id: projects[0]?.id ?? "",
    prompt: "",
    response: "",
    model_name: "",
    accuracy: "4",
    relevance: "4",
    consistency: "4",
    notes: "",
  });
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="font-display" style={{ fontFamily: "Syne, sans-serif" }}>
          Submit AI evaluation
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project">
            <Select value={f.project_id} onValueChange={(v) => setF({ ...f, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Model">
            <Input
              value={f.model_name}
              onChange={(e) => setF({ ...f, model_name: e.target.value })}
              placeholder="gpt-5 / gemini-2.5-pro"
            />
          </Field>
        </div>
        <Field label="Prompt">
          <Textarea rows={2} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
        </Field>
        <Field label="Response">
          <Textarea rows={5} value={f.response} onChange={(e) => setF({ ...f, response: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          {(["accuracy", "relevance", "consistency"] as const).map((k) => (
            <Field key={k} label={k}>
              <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </div>
        <Field label="Notes">
          <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit(f)}
          disabled={!f.project_id || !f.prompt || !f.response || busy}
          className="font-mono text-xs uppercase tracking-wider"
        >
          {busy ? "Submitting…" : "Submit"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground capitalize">
        {label}
      </Label>
      {children}
    </div>
  );
}
