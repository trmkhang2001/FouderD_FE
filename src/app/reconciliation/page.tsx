"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReconciliationBoard } from "@/components/reconciliation/reconciliation-board";

export default function ReconciliationPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <DashboardShell>
        <ReconciliationBoard />
      </DashboardShell>
    </ProtectedRoute>
  );
}

