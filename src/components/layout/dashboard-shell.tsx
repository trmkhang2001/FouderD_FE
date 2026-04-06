"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  LineChart,
  Users,
  Menu,
  ChevronRight,
  PanelLeftClose,
  LayoutGrid,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useAuthStore, type Role } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const nav: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  {
    href: "/dashboard/pipeline",
    label: "Pipeline",
    icon: LayoutGrid,
  },
  {
    href: "/dashboard/analytics",
    label: "Phân tích",
    icon: LineChart,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/users",
    label: "Người dùng",
    icon: Users,
    roles: ["ADMIN"],
  },
];

function initials(name: string | undefined) {
  if (!name?.trim()) {
    return "?";
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const roleLabel: Record<Role, string> = {
  ADMIN: "Quản trị",
  MANAGER: "Quản lý",
  SALE: "Kinh doanh",
};

function pageMeta(pathname: string) {
  if (pathname.startsWith("/dashboard/analytics")) {
    return { title: "Phân tích", crumb: "Báo cáo & hiệu suất" };
  }
  if (pathname.startsWith("/dashboard/users")) {
    return { title: "Người dùng", crumb: "Quản trị hệ thống" };
  }
  if (pathname.startsWith("/dashboard/pipeline")) {
    return { title: "Pipeline", crumb: "Lead & stages" };
  }
  return { title: "Tổng quan", crumb: "Trang chủ" };
}

function SidebarNav({
  pathname,
  user,
  collapsed,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  user: {
    name?: string;
    role?: Role;
  } | null;
  collapsed: boolean;
  onNavigate?: () => void;
  onLogout: () => void | Promise<void>;
}) {
  return (
    <>
      <div
        className={cn(
          "flex h-[70px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#009ef7]/15 text-[#009ef7]">
          <LayoutGrid className="size-5" strokeWidth={1.75} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-white">
              ERP Pro
            </span>
            <span className="text-[11px] text-[#9899ac]">Workspace</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="px-3 text-[11px] font-semibold tracking-wider text-[#565674] uppercase">
              Menu
            </p>
          </div>
        )}
        <nav className={cn("flex flex-col gap-0.5 pb-6", collapsed ? "px-2 pt-4" : "px-3")}>
          {nav
            .filter((item) => {
              if (!item.roles) {
                return true;
              }
              return !!user?.role && item.roles.includes(user.role);
            })
            .map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md py-2.5 pr-3 pl-3 text-sm transition-colors",
                    collapsed && "justify-center px-2",
                    active
                      ? "bg-[#2b2b40] font-medium text-white"
                      : "text-[#9899ac] hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  {active && !collapsed && (
                    <span
                      className="absolute top-1/2 left-0 h-[60%] w-[3px] -translate-y-1/2 rounded-r bg-[#009ef7]"
                      aria-hidden
                    />
                  )}
                  <item.icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-[#009ef7]" : "opacity-90",
                    )}
                  />
                  {!collapsed && item.label}
                </Link>
              );
            })}
        </nav>
      </ScrollArea>

      <div className={cn("border-t border-white/[0.06] p-4", collapsed && "px-2")}>
        <div
          className={cn(
            "mb-3 flex items-center gap-3 rounded-lg bg-[#2b2b40]/80 p-3",
            collapsed && "justify-center p-2",
          )}
        >
          <Avatar size="sm" className="size-10 shrink-0 ring-2 ring-[#1e1e2d]">
            <AvatarFallback className="bg-[#009ef7]/20 text-xs font-semibold text-[#009ef7]">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <Badge className="mt-1 h-5 border-0 bg-white/10 px-1.5 text-[10px] font-normal text-[#9899ac] hover:bg-white/10">
                {user?.role ? roleLabel[user.role] : "—"}
              </Badge>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Đăng xuất"
          className={cn(
            "w-full border-white/10 bg-transparent text-[#9899ac] hover:bg-white/5 hover:text-white",
            collapsed && "px-2",
          )}
          onClick={() => void onLogout()}
        >
          <LogOut className={cn("size-4", !collapsed && "mr-2")} />
          {!collapsed && "Đăng xuất"}
        </Button>
      </div>
    </>
  );
}

const SIDEBAR_COLLAPSE_KEY = "erp-sidebar-collapsed";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const meta = useMemo(() => pageMeta(pathname), [pathname]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (v === "1") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f5f8fa]">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#2b2b40] bg-[#1e1e2d] transition-[width] duration-200 ease-out md:flex",
          sidebarCollapsed ? "w-[72px]" : "w-[265px]",
        )}
      >
        <SidebarNav
          pathname={pathname}
          user={user}
          collapsed={sidebarCollapsed}
          onLogout={logout}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="metronic-toolbar-shadow sticky top-0 z-20 flex h-[70px] shrink-0 items-center justify-between border-b border-[#eff2f5] bg-white px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden shrink-0 text-[#7e8299] md:inline-flex"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? "Mở sidebar" : "Thu sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <PanelLeftClose className="size-5" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-[#7e8299] md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="size-6" />
            </Button>
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-1.5 text-xs text-[#a1a5b7]">
                <span>Trang chủ</span>
                <ChevronRight className="size-3 opacity-70" />
                <span className="truncate">{meta.crumb}</span>
              </div>
              <h1 className="truncate text-lg font-semibold text-[#181c32] lg:text-xl">
                {meta.title}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-[#a1a5b7]">ERP Workspace</span>
          </div>
        </header>

        <main className="metronic-content-bg flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="flex w-[280px] flex-col border-[#2b2b40] bg-[#1e1e2d] p-0 text-white sm:max-w-[280px]"
        >
          <div className="flex h-full flex-col">
            <SidebarNav
              pathname={pathname}
              user={user}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              onLogout={async () => {
                setMobileOpen(false);
                await logout();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
