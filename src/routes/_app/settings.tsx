import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { profile, refresh, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, job_title: jobTitle })
      .eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refresh();
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle("light");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Account</p>
        <h1
          className="mt-1.5 font-display text-3xl font-700 tracking-tight"
          style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}
        >
          Settings
        </h1>
      </div>

      {/* Profile */}
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
            Profile
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Update how you appear to your teammates.
          </p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <Field label="Email">
            <Input value={user?.email ?? ""} disabled className="text-muted-foreground" />
          </Field>
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Job title">
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="AI Operations Lead"
            />
          </Field>
          <Button
            onClick={save}
            disabled={busy}
            className="font-mono text-xs uppercase tracking-wider"
          >
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
            Appearance
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Switch between dark and light mode.
          </p>
        </div>
        <div className="px-5 py-5">
          <Button
            variant="outline"
            className="font-mono text-xs uppercase tracking-wider"
            onClick={toggleTheme}
          >
            Toggle theme
          </Button>
        </div>
      </section>
    </div>
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
