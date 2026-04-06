"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  PencilLine,
  User,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore, type Role } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type LeadPipelineStage =
  | "NEW"
  | "CONTACTED"
  | "PERSUADING"
  | "PAYMENT_SUCCESS"
  | "ZALO_JOINED"
  | "REFUND";

type Lead = {
  id: string;
  phone: string;
  name: string | null;
  source?: string | null;
  tag?: string | null;
  status?: string | null;
  pipelineStage: LeadPipelineStage;
  dealAmount?: string | null;
  lastActivityAt: string;
  saleId: string | null;
  sale?: { id: string; name: string; email: string } | null;
};

type LeadCreateInput = {
  phone: string;
  name?: string | null;
  source?: string | null;
  tag?: string | null;
  status?: string | null;
  saleId?: string | null;
  dealAmount?: string | null;
};

type CreateResponse = Lead;

const STAGES: {
  key: LeadPipelineStage;
  title: string;
  headerBg: string;
}[] = [
  { key: "NEW", title: "MỚI", headerBg: "bg-[#fff0e0]" },
  { key: "CONTACTED", title: "TIẾP CẬN", headerBg: "bg-[#f1f1f2]" },
  { key: "PERSUADING", title: "THUYẾT PHỤC", headerBg: "bg-[#f1f1f2]" },
  {
    key: "PAYMENT_SUCCESS",
    title: "THANH TOÁN THÀNH CÔNG",
    headerBg: "bg-[#e8f5ee]",
  },
  { key: "ZALO_JOINED", title: "VÀO NHÓM ZALO", headerBg: "bg-[#e8f2fc]" },
  { key: "REFUND", title: "HOÀN TIỀN", headerBg: "bg-[#dfe0e6]" },
];

function parseDealAmount(lead: Lead): number {
  if (lead.dealAmount == null) return 0;
  const n = Number(lead.dealAmount);
  return Number.isFinite(n) ? n : 0;
}

function formatVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(n))}đ`;
}

function dealBadgeLabel(lead: Lead) {
  const t = lead.tag?.trim();
  if (t && /^deal/i.test(t)) return t.toUpperCase();
  return `DEAL-${lead.id.slice(0, 5).toUpperCase()}`;
}

function isStale(lead: Pick<Lead, "pipelineStage" | "lastActivityAt">) {
  const stageOk =
    lead.pipelineStage === "NEW" ||
    lead.pipelineStage === "CONTACTED" ||
    lead.pipelineStage === "PERSUADING";
  if (!stageOk) return false;
  const last = new Date(lead.lastActivityAt).getTime();
  const hours = (Date.now() - last) / (1000 * 60 * 60);
  return hours > 24;
}

export function PipelineEditorKanban() {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;
  const authUser = useAuthStore((s) => s.user);
  const userId = authUser?.id;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyLeadIds, setBusyLeadIds] = useState<Record<string, boolean>>({});
  const [saleUsers, setSaleUsers] = useState<{ id: string; name: string | null; email: string; role: Role; saleAccId: string | null }[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string | null;
    source: string | null;
    tag: string | null;
    status: string | null;
    dealAmount: string | null;
  }>({ name: null, source: null, tag: null, status: null, dealAmount: null });

  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<LeadPipelineStage | null>(null);

  const [txQuery, setTxQuery] = useState("");

  const [form, setForm] = useState<LeadCreateInput>({
    phone: "",
    name: null,
    source: "Manual",
    tag: null,
    status: null,
    saleId: null,
    dealAmount: null,
  });

  const canWrite = role === "ADMIN" || role === "SALE";
  const canAddLead = role === "ADMIN" || role === "SALE";
  const canDeleteLead = role === "ADMIN" || role === "SALE";

  useEffect(() => {
    if (role !== "ADMIN") return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<
          { id: string; email: string; name: string | null; role: Role; saleAccId: string | null }[]
        >("/users");
        const sales = data.filter((u) => u.role === "SALE");
        if (!cancelled) {
          setSaleUsers(sales);
          setForm((cur) => ({
            ...cur,
            saleId: cur.saleId ?? sales[0]?.id ?? null,
          }));
        }
      } catch {
        if (!cancelled) setSaleUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canAddLead]);

  const saleLookup = useMemo(() => {
    const m = new Map<string, { name: string | null; email: string }>();
    for (const u of saleUsers) {
      m.set(u.id, { name: u.name, email: u.email });
    }
    return m;
  }, [saleUsers]);

  function saleResponsibleLabel(lead: Lead): string {
    if (lead.sale?.name?.trim()) return lead.sale.name.trim();
    if (lead.sale?.email?.trim()) return lead.sale.email;
    if (lead.saleId) {
      if (userId && lead.saleId === userId) {
        return (
          authUser?.name?.trim() ||
          authUser?.email?.trim() ||
          "—"
        );
      }
      const u = saleLookup.get(lead.saleId);
      if (u?.name?.trim()) return u.name.trim();
      if (u?.email?.trim()) return u.email;
    }
    return "—";
  }

  // SALE luôn tạo lead cho chính họ (không cho chọn sale khác)
  useEffect(() => {
    if (role !== "SALE") return;
    if (!userId) return;
    setForm((cur) => ({
      ...cur,
      saleId: userId,
    }));
  }, [role, userId]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Lead[]>("/leads?take=200");
      setLeads(data);
    } catch (e) {
      setError("Không tải được danh sách lead.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function readInputValue(e: any) {
    // base-ui may call onChange with either a DOM-like event or a raw value.
    return e?.target?.value ?? e?.currentTarget?.value ?? e ?? "";
  }

  const filteredLeads = useMemo(() => {
    const q = txQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const s = `${l.phone} ${l.name ?? ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [leads, txQuery]);

  const leadsByStage = useMemo(() => {
    const map = new Map<LeadPipelineStage, Lead[]>();
    for (const s of STAGES) map.set(s.key, []);
    for (const l of filteredLeads) map.get(l.pipelineStage)?.push(l);
    return map;
  }, [filteredLeads]);

  async function addLead() {
    if (!canAddLead) return;
    const dealRaw = form.dealAmount?.trim();
    const payload = {
      phone: String(form.phone ?? ""),
      name: form.name ?? null,
      source: form.source ?? "Manual",
      tag: form.tag ?? null,
      status: form.status ?? null,
      saleId: form.saleId ?? null,
      pipelineStage: "NEW",
      dealAmount:
        dealRaw && !Number.isNaN(Number(dealRaw.replace(/,/g, "")))
          ? Number(dealRaw.replace(/,/g, ""))
          : null,
    };

    if (!payload.phone.trim()) {
      setError("Vui lòng nhập phone.");
      return;
    }
    if (!payload.saleId) {
      setError(role === "SALE" ? "Không xác định sale của bạn." : "Vui lòng chọn sale.");
      return;
    }
    setBusyLeadIds((prev) => ({ ...prev, "add": true }));
    setError(null);
    try {
      await api.post("/pipeline/leads", payload);
      setForm((cur) => ({
        ...cur,
        phone: "",
        name: null,
        tag: null,
        status: null,
        dealAmount: null,
      }));
      await refresh();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : JSON.stringify(data ?? { message: e?.message }, null, 2);
      setError(msg);
    } finally {
      setBusyLeadIds((prev) => ({ ...prev, "add": false }));
    }
  }

  function isStageDropAllowed(stage: LeadPipelineStage) {
    if (!canWrite) return false;
    return true;
  }

  async function updateStage(leadId: string, stage: LeadPipelineStage) {
    if (!canWrite) return;

    setBusyLeadIds((prev) => ({ ...prev, [leadId]: true }));
    setError(null);
    try {
      await api.put(`/pipeline/leads/${leadId}/stage`, {
        pipelineStage: stage,
      });
      await refresh();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : JSON.stringify(data ?? { message: e?.message }, null, 2);
      setError(msg);
    } finally {
      setBusyLeadIds((prev) => ({ ...prev, [leadId]: false }));
    }
  }

  async function performDeleteLead(leadId: string) {
    if (!canDeleteLead) return;
    setBusyLeadIds((prev) => ({ ...prev, [leadId]: true }));
    setError(null);
    try {
      await api.delete(`/leads/${leadId}`);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : JSON.stringify(data ?? { message: e?.message }, null, 2);
      setError(msg);
    } finally {
      setBusyLeadIds((prev) => ({ ...prev, [leadId]: false }));
    }
  }

  async function saveEditLead() {
    if (!editTarget) return;
    if (!(role === "ADMIN" || role === "SALE")) return;
    setError(null);
    const leadId = editTarget.id;
    setBusyLeadIds((prev) => ({ ...prev, [leadId]: true }));
    try {
      await api.put(`/leads/${leadId}`, {
        name: editDraft.name,
        source: editDraft.source,
        tag: editDraft.tag,
        status: editDraft.status,
        dealAmount:
          editDraft.dealAmount?.trim() &&
          !Number.isNaN(Number(editDraft.dealAmount.replace(/,/g, "")))
            ? Number(editDraft.dealAmount.replace(/,/g, ""))
            : null,
      });
      setEditTarget(null);
      await refresh();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : JSON.stringify(data ?? { message: e?.message }, null, 2);
      setError(msg);
    } finally {
      setBusyLeadIds((prev) => ({ ...prev, [leadId]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#181c32]">Pipeline Kanban</h2>
          <p className="text-sm text-[#a1a5b7]">
            Kéo thả lead giữa các cột. Lead “stale” (Mới / Tiếp cận / Thuyết phục &gt; 24h không
            cập nhật) có viền đỏ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a1a5b7]" />
            <Input
              value={txQuery}
              onChange={(e) => setTxQuery(String(readInputValue(e)))}
              placeholder="Tìm phone / name..."
              className="h-9 w-[320px] rounded-lg border-[#eff2f5] bg-[#f5f8fa] pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-[#eff2f5] bg-white"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[#f1416c]/25 bg-[#f1416c]/8 px-4 py-3 text-sm text-[#f1416c]">
          <XCircle className="mt-0.5 size-4" />
          <span>{error}</span>
        </div>
      )}

      {canAddLead && (
        <Card className="border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thêm lead thủ công</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#a1a5b7]">Phone *</p>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((cur) => ({
                    ...cur,
                    phone: String(readInputValue(e) ?? ""),
                  }))
                }
                placeholder="+84..."
                className="h-10 rounded-md bg-white"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#a1a5b7]">Name</p>
              <Input
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((cur) => ({
                    ...cur,
                    name: readInputValue(e) ? String(readInputValue(e)) : null,
                  }))
                }
                placeholder="Tên khách hàng"
                className="h-10 rounded-md bg-white"
              />
            </div>
            {role === "ADMIN" ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Sale (nhân viên) *</p>
                <select
                  value={form.saleId ?? ""}
                  onChange={(e) =>
                    setForm((cur) => ({
                      ...cur,
                      saleId: e.target.value ? String(e.target.value) : null,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-[#eff2f5] bg-white px-3 text-sm outline-none"
                >
                  <option value="" disabled>
                    Chọn sale
                  </option>
                  {saleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Sale (nhân viên) *</p>
                <div className="flex h-10 items-center rounded-md border border-[#eff2f5] bg-[#f5f8fa] px-3 text-sm text-[#181c32]">
                  {authUser?.name ?? authUser?.email ?? "—"}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-[#a1a5b7]">Giá trị (đ)</p>
              <Input
                value={form.dealAmount ?? ""}
                onChange={(e) =>
                  setForm((cur) => ({
                    ...cur,
                    dealAmount: e.target.value ? e.target.value : null,
                  }))
                }
                placeholder="97000"
                className="h-10 rounded-md bg-white"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                className="rounded-lg bg-[#009ef7] font-semibold text-white hover:bg-[#0095e8]"
                onClick={() => void addLead()}
                disabled={!!busyLeadIds["add"]}
              >
                <Plus className="mr-2 size-4" />
                {busyLeadIds["add"] ? "Đang thêm..." : "Thêm lead"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-visible p-4 [-webkit-overflow-scrolling:touch]">
            <div className="flex w-max min-w-full gap-3 pb-1">
                {STAGES.map((stage) => {
                  const stageLeads = leadsByStage.get(stage.key) ?? [];
                  const isDropAllowed = isStageDropAllowed(stage.key);
                  const isOver = dropStage === stage.key;
                  const columnTotal = stageLeads.reduce(
                    (s, l) => s + parseDealAmount(l),
                    0,
                  );
                  return (
                    <div
                      key={stage.key}
                      className="flex w-[272px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#e4e6ef] bg-white shadow-sm"
                    >
                      <div>
                        <div
                          className={cn(
                            "px-3 py-2.5",
                            stage.headerBg,
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="line-clamp-2 min-h-[2.25rem] text-[11px] font-semibold uppercase leading-tight text-[#181c32]">
                              {stage.title}
                            </span>
                            <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#181c32] shadow-sm">
                              {stageLeads.length}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#7e8299]">
                            {formatVnd(columnTotal)}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "min-h-[360px] flex-1 border-t border-[#eff2f5] p-2 transition-colors",
                          isOver && isDropAllowed
                            ? "bg-[#009ef7]/5 ring-1 ring-inset ring-[#009ef7]/40"
                            : "bg-[#fafbfc]",
                          !isDropAllowed ? "opacity-70" : "",
                        )}
                        onDragOver={(e) => {
                          if (!dragLeadId) return;
                          if (!isDropAllowed) return;
                          e.preventDefault();
                          setDropStage(stage.key);
                        }}
                        onDragLeave={() =>
                          setDropStage((cur) =>
                            cur === stage.key ? null : cur,
                          )
                        }
                        onDrop={(e) => {
                          e.preventDefault();
                          setDropStage(null);
                          if (!dragLeadId) return;
                          void updateStage(dragLeadId, stage.key);
                        }}
                      >
                        {stageLeads.length === 0 && (
                          <div className="rounded-lg border border-dashed border-[#eff2f5] bg-white p-3 text-center text-xs text-[#a1a5b7]">
                            Trống
                          </div>
                        )}

                        {stageLeads.map((lead) => {
                          const stale = isStale(lead);
                          const busy = !!busyLeadIds[lead.id];
                          const draggable =
                            canWrite && (role === "ADMIN" || role === "SALE");
                          const amt = parseDealAmount(lead);
                          const titleLine = [
                            lead.status ?? lead.tag ?? "—",
                            lead.name ?? "—",
                            lead.phone,
                          ].join(" - ");
                          return (
                            <div
                              key={lead.id}
                              draggable={draggable}
                              onDragStart={(e) => {
                                setDragLeadId(lead.id);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", lead.id);
                              }}
                              onDragEnd={() => {
                                setDragLeadId(null);
                                setDropStage(null);
                              }}
                              className={cn(
                                "mb-2 rounded-lg border bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow",
                                stale
                                  ? "border-2 border-[#f1416c] bg-[#f1416c]/5"
                                  : "border-[#eff2f5] hover:bg-[#f9fafb]",
                                busy ? "opacity-80" : "",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded bg-[#f5f8fa] px-1.5 py-0.5 text-[10px] font-medium text-[#7e8299]">
                                  {dealBadgeLabel(lead)}
                                </span>
                                {stale && (
                                  <CheckCircle2 className="size-3.5 shrink-0 text-[#f1416c]" />
                                )}
                              </div>
                              <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-[#181c32]">
                                {titleLine}
                              </p>
                              {lead.name && (
                                <p className="mt-0.5 text-[11px] text-[#a1a5b7]">
                                  {lead.name}
                                </p>
                              )}
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#009ef7] tabular-nums">
                                  {amt > 0 ? formatVnd(amt) : "—"}
                                </span>
                                <div className="flex items-center gap-1 text-[#a1a5b7]">
                                  <User className="size-3.5" />
                                  <MessageCircle className="size-3.5" />
                                </div>
                              </div>
                              <div className="mt-2 flex items-start justify-between gap-2 border-t border-[#eff2f5] pt-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#a1a5b7]">
                                    Phụ trách
                                  </p>
                                  <p className="mt-0.5 truncate text-xs font-semibold text-[#181c32]">
                                    {saleResponsibleLabel(lead)}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {(role === "ADMIN" || role === "SALE") && (
                                    <button
                                      type="button"
                                      className="rounded p-0.5 text-[#a1a5b7] hover:bg-[#f5f8fa] hover:text-[#009ef7]"
                                      aria-label="Edit lead"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditTarget(lead);
                                        setEditDraft({
                                          name: lead.name ?? null,
                                          source: lead.source ?? null,
                                          tag: lead.tag ?? null,
                                          status: lead.status ?? null,
                                          dealAmount: lead.dealAmount ?? null,
                                        });
                                      }}
                                      onDragStart={(e) => e.preventDefault()}
                                    >
                                      <PencilLine className="size-3.5" />
                                    </button>
                                  )}
                                  {canDeleteLead && (
                                    <button
                                      type="button"
                                      className="rounded p-0.5 text-[#a1a5b7] hover:bg-[#f5f8fa] hover:text-[#f1416c]"
                                      aria-label="Delete lead"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteTarget(lead);
                                      }}
                                      onDragStart={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {busy && (
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#009ef7]">
                                  <Loader2 className="size-3 animate-spin" />
                                  Đang cập nhật…
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
              {loading && (
                <div className="mt-4 text-center text-sm text-[#a1a5b7]">
                  Đang tải lead…
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-[0_0_30px_rgba(0,0,0,0.2)]">
            <div className="border-b border-[#eff2f5] bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#181c32]">
                    Xác nhận xóa lead
                  </p>
                  <p className="mt-1 text-xs text-[#a1a5b7]">
                    Lead: <span className="text-[#181c32]">{deleteTarget.phone}</span>
                    {deleteTarget.name ? ` - ${deleteTarget.name}` : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-[#a1a5b7]">
                Hành động này không thể hoàn tác.
              </p>
              {busyLeadIds[deleteTarget.id] && (
                <p className="mt-3 text-sm text-[#009ef7]">Đang xóa…</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#eff2f5] px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border-[#eff2f5] bg-white text-[#181c32] hover:bg-[#f5f8fa]"
                onClick={() => setDeleteTarget(null)}
                disabled={!!busyLeadIds[deleteTarget.id]}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className="rounded-md bg-[#f1416c] font-semibold text-white hover:bg-[#d92a58]"
                onClick={() => void performDeleteLead(deleteTarget.id)}
                disabled={!!busyLeadIds[deleteTarget.id]}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-[0_0_30px_rgba(0,0,0,0.2)]">
            <div className="border-b border-[#eff2f5] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#181c32]">Edit lead</p>
              <p className="mt-1 text-xs text-[#a1a5b7]">
                Phone: <span className="text-[#181c32]">{editTarget.phone}</span>
              </p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Name</p>
                <Input
                  value={editDraft.name ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      name: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="h-10 rounded-md bg-white"
                  placeholder="Tên khách hàng"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Source</p>
                <Input
                  value={editDraft.source ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      source: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="h-10 rounded-md bg-white"
                  placeholder="Ví dụ: Ladiwork / Sepay / Manual"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Tag</p>
                <Input
                  value={editDraft.tag ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      tag: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="h-10 rounded-md bg-white"
                  placeholder="Tag (optional)"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Status</p>
                <Input
                  value={editDraft.status ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      status: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="h-10 rounded-md bg-white"
                  placeholder="Status (optional)"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Giá trị (đ)</p>
                <Input
                  value={editDraft.dealAmount ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      dealAmount: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="h-10 rounded-md bg-white"
                  placeholder="97000"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#eff2f5] px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-md border-[#eff2f5] bg-white text-[#181c32] hover:bg-[#f5f8fa]"
                onClick={() => setEditTarget(null)}
                disabled={!!busyLeadIds[editTarget.id]}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className="rounded-md bg-[#009ef7] font-semibold text-white hover:bg-[#0095e8]"
                onClick={() => void saveEditLead()}
                disabled={!!busyLeadIds[editTarget.id]}
              >
                {busyLeadIds[editTarget.id] ? "Đang lưu..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

