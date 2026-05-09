import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted/40 border-t-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Loading…
          </p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60">
              TaskNest AI
            </span>
          </header>
          <main className="flex-1 overflow-y-auto px-6 py-7">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
