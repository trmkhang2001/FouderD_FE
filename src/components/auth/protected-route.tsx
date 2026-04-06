"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore, type Role } from "@/stores/auth-store";

type Props = {
  children: ReactNode;
  roles?: Role[];
};

export function ProtectedRoute({ children, roles }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{
          id: string;
          email: string;
          name: string;
          role: Role;
          saleAccId: string | null;
        }>("/auth/me");
        if (!cancelled) {
          setUser(data);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setHydrated, setUser]);

  useEffect(() => {
    if (!hydrated || !user || !roles?.length) {
      return;
    }
    if (!roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [hydrated, user, roles, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8fa] p-6">
        <div className="metronic-card flex flex-col items-center gap-4 rounded-lg border border-[#eff2f5] bg-white px-12 py-10 shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <Loader2 className="size-9 animate-spin text-[#009ef7]" strokeWidth={1.75} />
          <p className="text-sm font-medium text-[#a1a5b7]">Đang tải phiên làm việc…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
