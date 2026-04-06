"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Link2, RefreshCw, Search } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type VerificationStatus = "AUTO" | "MANUAL" | "PENDING";
type LeadPipelineStage =
  | "NEW"
  | "CONTACTED"
  | "PERSUADING"
  | "PAYMENT_SUCCESS"
  | "ZALO_JOINED"
  | "REFUND";

type UnmatchedTransaction = {
  id: string;
  transactionId: string;
  amount: number;
  content: string | null;
  phoneSender: string | null;
  transactionDate: string;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
};

type LeadLite = {
  id: string;
  phone: string;
  name: string | null;
  pipelineStage: LeadPipelineStage;
  lastActivityAt: string;
};

function stageLabel(stage: LeadPipelineStage | undefined) {
  switch (stage) {
    case "NEW":
      return "Mới";
    case "CONTACTED":
      return "Tiếp cận";
    case "PERSUADING":
      return "Thuyết phục";
    case "PAYMENT_SUCCESS":
      return "Thanh toán";
    case "ZALO_JOINED":
      return "Zalo";
    case "REFUND":
      return "Hoàn tiền";
    default:
      return "—";
  }
}

export function ReconciliationBoard() {
  const [unmatched, setUnmatched] = useState<UnmatchedTransaction[]>([]);
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [txQuery, setTxQuery] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [dragTxId, setDragTxId] = useState<string | null>(null);
  const [dragOverLeadId, setDragOverLeadId] = useState<string | null>(null);

  async function refresh() {
    const [u, l] = await Promise.all([
      api
        .get<UnmatchedTransaction[]>(
          "/admin/reconciliation/unmatched-transactions",
        )
        .then((r) => r.data),
      api.get<LeadLite[]>("/leads?take=200").then((r) => r.data),
    ]);
    setUnmatched(u);
    setLeads(l);
  }

  useEffect(() => {
    refresh()
      .catch(() => {
        setUnmatched([]);
        setLeads([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUnmatched = useMemo(() => {
    const q = txQuery.trim().toLowerCase();
    if (!q) return unmatched;
    return unmatched.filter((t) => {
      const s =
        `${t.transactionId} ${t.phoneSender ?? ""} ${t.content ?? ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [txQuery, unmatched]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const s = `${lead.name ?? ""} ${lead.phone}`.toLowerCase();
      return s.includes(q);
    });
  }, [leadQuery, leads]);

  async function attachToLead(leadId: string) {
    if (!dragTxId) return;
    setSaving(true);
    try {
      await api.post("/admin/reconciliation/attach-transaction", {
        transactionId: dragTxId,
        leadId,
      });
      setDragTxId(null);
      setDragOverLeadId(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGate roles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[#181c32]">Reconciliation</h2>
            <p className="text-sm text-[#a1a5b7]">
              Kéo “unmatched transactions” vào hồ sơ lead để auto-stage (khi verified).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-[#eff2f5] bg-white"
            onClick={() => refresh().catch(() => undefined)}
            disabled={loading}
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Unmatched transactions</CardTitle>
                {loading ? (
                  <Loader2 className="size-4 animate-spin text-[#009ef7]" />
                ) : (
                  <Badge className="bg-[#009ef7]/10 text-[#009ef7] border-0">
                    {filteredUnmatched.length}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Search className="size-4 text-[#a1a5b7]" />
                <Input
                  value={txQuery}
                  onChange={(e) => setTxQuery(e.target.value)}
                  placeholder="Search transaction id / phone / content…"
                  className="h-9 rounded-lg border-[#eff2f5] bg-[#f5f8fa]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[540px]">
                <div className="space-y-2 p-4">
                  {filteredUnmatched.length === 0 && (
                    <p className="text-sm text-[#a1a5b7]">No unmatched transactions.</p>
                  )}
                  {filteredUnmatched.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        setDragTxId(t.transactionId);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", t.transactionId);
                      }}
                      className={[
                        "flex cursor-grab items-start justify-between gap-3 rounded-lg border border-[#eff2f5] bg-white p-3 transition-colors",
                        dragTxId === t.transactionId
                          ? "ring-2 ring-[#009ef7]"
                          : "hover:bg-[#f5f8fa]",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#181c32]">
                          {t.transactionId}
                        </p>
                        <p className="text-xs text-[#a1a5b7]">
                          Phone: {t.phoneSender ?? "—"}
                        </p>
                        <p className="text-xs text-[#a1a5b7]">
                          Amount: {t.amount?.toString?.() ?? t.amount}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          className="border-0 bg-[#009ef7]/10 text-[#009ef7]"
                          variant="secondary"
                        >
                          {t.verificationStatus}
                        </Badge>
                        <div className="rounded-md bg-[#f5f8fa] p-2 text-[#009ef7]">
                          <Link2 className="size-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Leads</CardTitle>
                <Badge className="bg-white text-[#181c32] border border-[#eff2f5]">
                  {filteredLeads.length}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Search className="size-4 text-[#a1a5b7]" />
                <Input
                  value={leadQuery}
                  onChange={(e) => setLeadQuery(e.target.value)}
                  placeholder="Search name / phone…"
                  className="h-9 rounded-lg border-[#eff2f5] bg-[#f5f8fa]"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[540px]">
                <div className="space-y-2 p-4">
                  {filteredLeads.length === 0 && (
                    <p className="text-sm text-[#a1a5b7]">No leads found.</p>
                  )}
                  {filteredLeads.map((lead) => {
                    const isOver = dragOverLeadId === lead.id;
                    return (
                      <div
                        key={lead.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverLeadId(lead.id);
                        }}
                        onDragLeave={() => setDragOverLeadId((cur) => (cur === lead.id ? null : cur))}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverLeadId(null);
                          void attachToLead(lead.id);
                        }}
                        className={[
                          "rounded-xl border p-4 transition-colors",
                          isOver
                            ? "border-[#f1416c] bg-[#f1416c]/5"
                            : "border-[#eff2f5] bg-white hover:bg-[#f5f8fa]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#181c32]">
                              {lead.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-[#a1a5b7]">
                              {lead.phone}
                            </p>
                          </div>
                          <Badge className="border-0 bg-[#009ef7]/10 text-[#009ef7]">
                            {stageLabel(lead.pipelineStage)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-[#a1a5b7]">
                          Last activity:{" "}
                          {lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleString() : "—"}
                        </p>
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-lg bg-[#009ef7] text-white hover:bg-[#0095e8]"
                            disabled={!dragTxId || saving}
                            onClick={() => void attachToLead(lead.id)}
                          >
                            Attach
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}

