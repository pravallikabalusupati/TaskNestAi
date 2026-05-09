import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your AI ops workspace">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Work email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="bg-muted/40 border-border placeholder:text-muted-foreground/50"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-muted/40 border-border placeholder:text-muted-foreground/50"
          />
        </Field>
        <Button
          type="submit"
          className="w-full font-mono text-xs uppercase tracking-wider"
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign in →"}
        </Button>
      </form>
      <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40" />

      {/* Amber top-left glow */}
      <div
        className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "oklch(0.78 0.14 68)" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
        {/* Wordmark */}
        <Link to="/" className="mb-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-primary">
            <span
              className="text-base leading-none text-primary-foreground"
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}
            >
              TN
            </span>
          </div>
          <div>
            <span
              className="block text-base font-semibold leading-none tracking-tight text-foreground"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              TaskNest AI
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Ops Platform
            </span>
          </div>
        </Link>

        {/* Card */}
        <div className="rounded-lg border border-border bg-card p-7">
          <div className="mb-6">
            <h1
              className="text-2xl font-700 tracking-tight"
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}
            >
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
