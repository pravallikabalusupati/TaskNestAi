import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "AI Evaluations", url: "/evaluations", icon: Sparkles },
  { title: "Team", url: "/team", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { profile, user, roles, signOut } = useAuth();

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link to="/dashboard" className="flex items-center gap-3">
          {/* Logo mark: amber square with monogram */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary">
            <span className="font-display text-sm font-800 text-primary-foreground leading-none" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}>
              TN
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold text-sidebar-foreground tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
                TaskNest
              </span>
              <span className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                AI Ops
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <p className="mb-1.5 px-2 text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60">
              Workspace
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV.map((item) => {
                const active = path === item.url || path.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={[
                        "group relative h-9 rounded-md px-2.5 text-sm transition-all duration-150",
                        active
                          ? "bg-primary/12 text-primary font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      ].join(" ")}
                    >
                      <Link to={item.url} className="flex items-center gap-2.5">
                        {/* Active indicator bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                        )}
                        <item.icon
                          className={[
                            "h-4 w-4 shrink-0 transition-colors",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground",
                          ].join(" ")}
                        />
                        {!collapsed && (
                          <span style={{ fontFamily: "DM Sans, sans-serif" }}>
                            {item.title}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback
                className="text-[10px] font-mono font-medium"
                style={{ background: "oklch(0.78 0.14 68 / 20%)", color: "oklch(0.78 0.14 68)" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {profile?.full_name || user?.email}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {roles[0] ?? "member"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
