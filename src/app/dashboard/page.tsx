 "use client";

import { Copy, TrendingUp, UsersRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuthStore, type Role } from "@/stores/auth-store";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  countsFromStages,
  deriveLadipageRatios,
  formatRatio,
  type LadipageStageSummary,
} from "@/lib/ladipage-pipeline-metrics";

type ReportBatch = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type MarketingCosts = {
  znsCost: number | null;
  callCost: number | null;
  emailCost: number | null;
  totalCost: number | null;
  updatedAt: string | null;
};

function LadipageStageRow({ stages }: { stages: LadipageStageSummary[] }) {
  const counts = countsFromStages(stages);
  const ratios = deriveLadipageRatios(counts);

  return (
    <>
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max flex-nowrap gap-3 px-1">
          {stages.map((s) => (
            <div
              key={s.key}
              className="w-[148px] shrink-0 rounded-xl border border-[#eff2f5] bg-white px-3 py-3"
            >
              <div className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-[#181c32]">
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-[#009ef7] tabular-nums">
                {s.count}
              </div>
              <div className="mt-1 text-xs text-[#a1a5b7]">
                {s.ratio != null ? `${(s.ratio * 100).toFixed(1)}%` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#e4e6ef] bg-[#f9f9fb] p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#a1a5b7]">
          Tỉ lệ chuyển đổi 
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-lg border border-[#eff2f5] bg-white px-3 py-2">
            <div className="text-[11px] leading-tight text-[#a1a5b7]">
              Tỉ lệ chuyển đổi (MỚI / TT + Zalo)
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-[#181c32]">
              {formatRatio(ratios.tyLeChuyenDoiMua)}
            </div>
          </div>
          <div className="rounded-lg border border-[#eff2f5] bg-white px-3 py-2">
            <div className="text-[11px] leading-tight text-[#a1a5b7]">
              Zalo / (TT + Zalo)
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-[#181c32]">
              {formatRatio(ratios.tyLeZaloTrongNhomThanhToanZalo)}
            </div>
          </div>
          <div className="rounded-lg border border-[#eff2f5] bg-white px-3 py-2">
            <div className="text-[11px] leading-tight text-[#a1a5b7]">
              Tổng (MỚI + Zalo) / (TT + Zalo)
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-[#181c32]">
              {formatRatio(ratios.tyLeTongHaiTren)}
            </div>
          </div>
          <div className="rounded-lg border border-[#eff2f5] bg-white px-3 py-2">
            <div className="text-[11px] leading-tight text-[#a1a5b7]">
              (Tiếp cận + Thuyết phục) / MỚI
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-[#181c32]">
              {formatRatio(ratios.tyLeTuongTacTrenMoi)}
            </div>
          </div>
          <div className="rounded-lg border border-[#eff2f5] bg-white px-3 py-2 sm:col-span-2 lg:col-span-1">
            <div className="text-[11px] leading-tight text-[#a1a5b7]">
              Zalo / đã thanh toán
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-[#181c32]">
              {formatRatio(ratios.tyLeZaloTrenThanhToan)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function formatMoneyVnd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function MarketingCostsPanel({ costs }: { costs: MarketingCosts | null }) {
  return (
    <div className="rounded-xl border border-[#e4e6ef] bg-[#f9f9fb] p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#a1a5b7]">
        Chi phí marketing (theo khóa)
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#a1a5b7]">ZNS</span>
          <span className="font-semibold text-[#181c32] tabular-nums">
            {formatMoneyVnd(costs?.znsCost ?? null)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#a1a5b7]">Call</span>
          <span className="font-semibold text-[#181c32] tabular-nums">
            {formatMoneyVnd(costs?.callCost ?? null)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#a1a5b7]">Email</span>
          <span className="font-semibold text-[#181c32] tabular-nums">
            {formatMoneyVnd(costs?.emailCost ?? null)}
          </span>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[#a1a5b7]">Tổng</span>
            <span className="font-semibold text-[#181c32] tabular-nums">
              {formatMoneyVnd(costs?.totalCost ?? null)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#a1a5b7]">
            Cập nhật{" "}
            {costs?.updatedAt ? new Date(costs.updatedAt).toLocaleString() : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

type LadipageSaleStages = {
  saleId: string;
  saleName: string | null;
  saleEmail: string;
  stages: LadipageStageSummary[];
  total: number;
  updatedAt: string | null;
};

type LadipagePipelineResponse = {
  date: string;
  sales: LadipageSaleStages[];
  batchMarketingCosts: MarketingCosts | null;
};

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;
  const [ladipage, setLadipage] = useState<LadipagePipelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<ReportBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchStart, setNewBatchStart] = useState("");
  const [newBatchEnd, setNewBatchEnd] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [createBatchError, setCreateBatchError] = useState<string | null>(null);
  const [lastCreatedBatchId, setLastCreatedBatchId] = useState<string | null>(null);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );

  async function refreshBatches() {
    try {
      const { data } = await api.get<ReportBatch[]>("/report-batches");
      setBatches(data);
      setSelectedBatchId((prev) => prev ?? (data[0]?.id ?? null));
    } catch {
      // If batch list fails, fallback to "latest overall".
      setBatches([]);
      setSelectedBatchId(null);
    }
  }

  async function handleCreateReportBatch(e: FormEvent) {
    e.preventDefault();
    setCreateBatchError(null);
    const name = newBatchName.trim();
    if (!name || !newBatchStart || !newBatchEnd) {
      setCreateBatchError("Nhập đủ tên khóa và khoảng ngày (YYYY-MM-DD).");
      return;
    }
    setCreatingBatch(true);
    try {
      const { data } = await api.post<ReportBatch>("/report-batches", {
        name,
        startDate: newBatchStart,
        endDate: newBatchEnd,
      });
      setLastCreatedBatchId(data.id);
      await refreshBatches();
      setSelectedBatchId(data.id);
      setNewBatchName("");
      setNewBatchStart("");
      setNewBatchEnd("");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const m = ax.response?.data?.message;
      const msg = Array.isArray(m) ? m.join(", ") : m ?? "Không tạo được khóa.";
      setCreateBatchError(msg);
    } finally {
      setCreatingBatch(false);
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const params = selectedBatchId ? { batchId: selectedBatchId } : undefined;
      const { data } = await api.get<LadipagePipelineResponse>(
        "/ladipage/pipeline",
        { params },
      );
      setLadipage(data);
    } catch (e: any) {
      const msg =
        typeof e?.response?.data === "string"
          ? e.response.data
          : e?.message ?? "Không tải được dữ liệu Ladipage";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!role) return;
    void refreshBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!role) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, selectedBatchId]);

  const hasPipelineData =
    ladipage?.sales?.some((s) => s.stages.length > 0) ?? false;
  const hasCostData =
    (ladipage?.batchMarketingCosts?.znsCost != null ||
      ladipage?.batchMarketingCosts?.callCost != null ||
      ladipage?.batchMarketingCosts?.emailCost != null ||
      ladipage?.batchMarketingCosts?.totalCost != null) ??
    false;
  const hasAnyData = hasPipelineData || hasCostData;

  return (
    <RoleGate roles={["ADMIN", "MANAGER", "SALE"]}>
      <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[#181c32] lg:text-xl">
          Hiệu suất bán hàng
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[#a1a5b7]">
          Theo dõi xu hướng và pipeline. Kết nối API phân tích khi bạn đã có dữ liệu báo cáo.
        </p>
      </div>

      {role === "ADMIN" && (
        <Card className="metronic-card overflow-hidden border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <CardHeader className="border-b border-[#eff2f5] bg-white pb-4">
            <CardTitle className="text-base font-semibold text-[#181c32]">
              Tạo khóa báo cáo (chương trình)
            </CardTitle>
            <CardDescription className="mt-1 text-[#a1a5b7]">
              Dùng <span className="font-mono text-xs">batch_id</span> trong webhook marketing
              costs và các tích hợp khác. Chỉ tài khoản quản trị.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleCreateReportBatch} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="batch-name">Tên khóa</Label>
                  <Input
                    id="batch-name"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    placeholder="Ví dụ: Khóa tháng 4/2025"
                    className="border-[#eff2f5]"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-start">Ngày bắt đầu</Label>
                  <Input
                    id="batch-start"
                    type="date"
                    value={newBatchStart}
                    onChange={(e) => setNewBatchStart(e.target.value)}
                    className="border-[#eff2f5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-end">Ngày kết thúc</Label>
                  <Input
                    id="batch-end"
                    type="date"
                    value={newBatchEnd}
                    onChange={(e) => setNewBatchEnd(e.target.value)}
                    className="border-[#eff2f5]"
                  />
                </div>
              </div>
              {createBatchError && (
                <p className="text-sm text-[#f1416c]">{createBatchError}</p>
              )}
              {lastCreatedBatchId && (
                <div className="flex flex-col gap-2 rounded-lg border border-[#50cd89]/30 bg-[#50cd89]/8 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[#181c32]">
                    Đã tạo — ID khóa:{" "}
                    <code className="break-all rounded bg-white/80 px-1.5 py-0.5 text-xs">
                      {lastCreatedBatchId}
                    </code>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-[#50cd89]/40"
                    onClick={() => copyToClipboard(lastCreatedBatchId)}
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Sao chép ID
                  </Button>
                </div>
              )}
              <Button
                type="submit"
                disabled={creatingBatch}
                className="rounded-lg bg-[#009ef7] hover:bg-[#009ef7]/90"
              >
                {creatingBatch ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo khóa"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* <div className="grid gap-6 md:grid-cols-2">
        <Card className="metronic-card overflow-hidden border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <CardHeader className="border-b border-[#eff2f5] bg-white pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-[#181c32]">
                  Xu hướng chuyển đổi
                </CardTitle>
                <CardDescription className="mt-1 text-[#a1a5b7]">
                  Biểu đồ theo thời gian
                </CardDescription>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#009ef7]/10 text-[#009ef7]">
                <TrendingUp className="size-5" strokeWidth={1.75} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-52 items-center justify-center rounded-md border border-dashed border-[#eff2f5] bg-[#f5f8fa] text-sm text-[#a1a5b7]">
              Khu vực biểu đồ
            </div>
          </CardContent>
        </Card>

        <Card className="metronic-card overflow-hidden border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <CardHeader className="border-b border-[#eff2f5] bg-white pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-[#181c32]">
                  Pipeline theo nhân sự
                </CardTitle>
                <CardDescription className="mt-1 text-[#a1a5b7]">
                  So sánh theo đội / cá nhân
                </CardDescription>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#50cd89]/15 text-[#50cd89]">
                <UsersRound className="size-5" strokeWidth={1.75} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-52 items-center justify-center rounded-md border border-dashed border-[#eff2f5] bg-[#f5f8fa] text-sm text-[#a1a5b7]">
              Khu vực biểu đồ
            </div>
          </CardContent>
        </Card>
      </div> */}

      <Card className="metronic-card overflow-hidden border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
        <CardHeader className="border-b border-[#eff2f5] bg-white pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-[#181c32]">
                Báo cáo chuyển đổi (theo nhân viên)
              </CardTitle>
              <CardDescription className="mt-1 text-[#a1a5b7]">
                Lấy snapshot mới nhất trong DB.{" "}
                {selectedBatch ? (
                  <>
                    Khóa: <span className="font-semibold">{selectedBatch.name}</span>{" "}
                    (
                    {new Date(selectedBatch.startDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(selectedBatch.endDate).toLocaleDateString("vi-VN")}
                    )
                  </>
                ) : (
                  <>Toàn bộ thời gian</>
                )}
              </CardDescription>

              {batches.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={selectedBatchId ? "outline" : "default"}
                    className="h-8 rounded-lg border-[#eff2f5] bg-white px-3 py-1 text-xs text-[#181c32] hover:bg-white"
                    onClick={() => setSelectedBatchId(null)}
                  >
                    Toàn bộ
                  </Button>
                  {batches.map((b) => (
                    <Button
                      key={b.id}
                      type="button"
                      variant={selectedBatchId === b.id ? "default" : "outline"}
                      className="h-8 rounded-lg border-[#eff2f5] bg-white px-3 py-1 text-xs text-[#181c32] hover:bg-white"
                      onClick={() => setSelectedBatchId(b.id)}
                    >
                      {b.name}
                    </Button>
                  ))}
                </div>
              ) : null}

              {role === "ADMIN" && selectedBatch && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[#eff2f5] bg-[#f9f9fb] px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[#a1a5b7]">
                    <span className="font-semibold text-[#181c32]">ID khóa đang xem:</span>{" "}
                    <code className="break-all text-[11px] text-[#181c32]">{selectedBatch.id}</code>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 border-[#eff2f5] px-2 text-xs"
                    onClick={() => copyToClipboard(selectedBatch.id)}
                  >
                    <Copy className="mr-1 size-3" />
                    Sao chép
                  </Button>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-[#eff2f5] bg-white"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {error && (
            <p className="rounded-md border border-[#f1416c]/25 bg-[#f1416c]/8 px-4 py-3 text-sm text-[#f1416c]">
              {error}
            </p>
          )}

          {loading && !ladipage && (
            <div className="flex h-28 items-center justify-center text-sm text-[#a1a5b7]">
              Đang tải dữ liệu...
            </div>
          )}

          {ladipage && ladipage.sales.length > 0 && (
            <div className="space-y-5">
              {!hasAnyData ? (
                <div className="rounded-lg border border-dashed border-[#eff2f5] bg-[#f5f8fa] px-4 py-6 text-sm text-[#a1a5b7]">
                  Chưa có dữ liệu snapshot mới nhất trong khoảng này.
                </div>
              ) : null}

              {hasCostData && ladipage.batchMarketingCosts ? (
                <MarketingCostsPanel costs={ladipage.batchMarketingCosts} />
              ) : null}

              {hasPipelineData && (
                <>
                  {(ladipage.sales.length === 1 || role === "SALE") && (
                    <Card className="border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
                      <CardHeader className="border-b border-[#eff2f5] bg-white pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base font-semibold text-[#181c32]">
                              {ladipage.sales[0].saleName ??
                                ladipage.sales[0].saleEmail}
                            </CardTitle>
                            <CardDescription className="mt-1 text-[#a1a5b7]">
                              Cập nhật{" "}
                              {ladipage.sales[0].updatedAt
                                ? new Date(
                                    ladipage.sales[0].updatedAt,
                                  ).toLocaleString()
                                : "—"}
                            </CardDescription>
                          </div>
                          <div className="text-xs text-[#a1a5b7]">
                            Total:{" "}
                            <span className="font-semibold text-[#181c32] tabular-nums">
                              {ladipage.sales[0].total}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5">
                        <LadipageStageRow stages={ladipage.sales[0].stages} />
                      </CardContent>
                    </Card>
                  )}

                  {role !== "SALE" && ladipage.sales.length > 1 && (
                    <div className="space-y-6">
                      {ladipage.sales.map((sale) => (
                        <Card
                          key={sale.saleId}
                          className="border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]"
                        >
                          <CardHeader className="border-b border-[#eff2f5] bg-white pb-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-base font-semibold text-[#181c32]">
                                  {sale.saleName ?? sale.saleEmail}
                                </CardTitle>
                                <CardDescription className="mt-1 text-[#a1a5b7]">
                                  Cập nhật{" "}
                                  {sale.updatedAt
                                    ? new Date(sale.updatedAt).toLocaleString()
                                    : "—"}
                                </CardDescription>
                              </div>
                              <div className="text-xs text-[#a1a5b7]">
                                Total:{" "}
                                <span className="font-semibold text-[#181c32] tabular-nums">
                                  {sale.total}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-5">
                            <LadipageStageRow stages={sale.stages} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RoleGate>
  );
}
