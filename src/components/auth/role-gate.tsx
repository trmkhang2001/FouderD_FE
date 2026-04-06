"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore, type Role } from "@/stores/auth-store";

type Props = {
  children: ReactNode;
  roles: Role[];
};

export function RoleGate({ children, roles }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !user) {
      return;
    }
    if (!roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [hydrated, user, roles, router]);

  if (!hydrated || !user || !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
