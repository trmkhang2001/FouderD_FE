"use client";

import { useEffect, useState } from "react";
import { BarChart3, Coins, MessageCircle, RefreshCw, Timer, Users } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/stores/auth-store";

type Rates = {
  total_leads: number;
  new_buyers_within_5_minutes: number;
  conversion_new_buyers_within_5_min: number | null;
  conversion_zalo_per_paid_97k: number | null;
  conversion_deposit_per_lead: number | null;
  total_deposit_amount: string;
};

type SaleMetricsRow = {
  saleId: string;
  saleName: string | null;
  saleEmail: string;
  totalLeads: number;
  dataNew: number;
  dataApproach: number;
  dataPersuade: number;
  dataPayment: number;
  ratios: {
    NEW: number;
    CONTACTED: number;
    PERSUADING: number;
    PAYMENT_SUCCESS: number;
    ZALO_JOINED: number;
    REFUND: number;
  };
};

type SalesOverviewResponse = {
  range: { from: string; to: string };
  sales: SaleMetricsRow[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Rates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [salesOverview, setSalesOverview] = useState<SalesOverviewResponse | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);

  const role = useAuthStore((s) => s.user?.role) as Role | undefined;

  async function refreshSales() {
    setSalesError(null);
    try {
      const res = await api.get<SalesOverviewResponse>(
        "/analytics/sales/overview",
      );
      setSalesOverview(res.data);
    } catch (e) {
      setSalesError("Không tải được dữ liệu sale overview.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Only ADMIN/MANAGER use conversion-rates in current backend.
        if (role && role !== "SALE") {
          const { data: res } = await api.get<Rates>("/analytics/conversion-rates");
          if (!cancelled) setData(res);
        }
      } catch {
        if (!cancelled) {
          setError("Không tải được dữ liệu phân tích.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    void refreshSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <RoleGate roles={["ADMIN", "MANAGER", "SALE"]}>
      <div className="mx-auto max-w-6xl space-y-6">
        <p className="max-w-2xl text-sm leading-relaxed text-[#a1a5b7]">
          Theo khung thời gian từ API (mặc định ~30 ngày nếu không truyền query). Tiêu đề trang
          hiển thị trên thanh công cụ.
        </p>

        {error && (
          <p className="rounded-md border border-[#f1416c]/25 bg-[#f1416c]/8 px-4 py-3 text-sm text-[#f1416c]">
            {error}
          </p>
        )}

        {data && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="metronic-card border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#a1a5b7]">
                  Tổng lead
                </CardTitle>
                <Users className="size-4 text-[#009ef7]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums text-[#181c32] lg:text-3xl">
                  {data.total_leads}
                </p>
              </CardContent>
            </Card>

            <Card className="metronic-card border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#a1a5b7]">
                  Mua trong 5 phút
                </CardTitle>
                <Timer className="size-4 text-[#50cd89]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums text-[#181c32] lg:text-3xl">
                  {data.new_buyers_within_5_minutes}
                  <span className="ml-2 text-base font-normal text-[#a1a5b7]">
                    {data.conversion_new_buyers_within_5_min != null
                      ? `${(data.conversion_new_buyers_within_5_min * 100).toFixed(1)}%`
                      : "—"}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="metronic-card border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#a1a5b7]">
                  Zalo / 97k
                </CardTitle>
                <MessageCircle className="size-4 text-[#ffc700]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums text-[#181c32] lg:text-3xl">
                  {data.conversion_zalo_per_paid_97k != null
                    ? data.conversion_zalo_per_paid_97k.toFixed(2)
                    : "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="metronic-card border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#a1a5b7]">
                  Nạp / lead
                </CardTitle>
                <Coins className="size-4 text-[#7239ea]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums text-[#181c32] lg:text-3xl">
                  {data.conversion_deposit_per_lead != null
                    ? data.conversion_deposit_per_lead.toFixed(2)
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-[#a1a5b7]">
                  Tổng nạp: {data.total_deposit_amount}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!data && !error && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#eff2f5] bg-white p-8 text-[#a1a5b7]">
            <BarChart3 className="size-8 shrink-0 text-[#009ef7]/50" />
            <p className="text-sm">Đang tải số liệu…</p>
          </div>
        )}
        <div className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#181c32]">
                Sale overview theo trạng thái
              </h3>
              <p className="text-sm text-[#a1a5b7]">
                Mới / Tiếp cận / Thuyết phục / Thanh toán + tỉ lệ.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-[#eff2f5] bg-white"
              onClick={() => void refreshSales()}
            >
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>

          {salesError && (
            <p className="rounded-md border border-[#f1416c]/25 bg-[#f1416c]/8 px-4 py-3 text-sm text-[#f1416c]">
              {salesError}
            </p>
          )}

          {salesOverview && (
            <div className="overflow-x-auto rounded-xl border border-[#eff2f5] bg-white">
              <table className="min-w-[860px] w-full text-left text-sm">
                <thead className="bg-[#f5f8fa] text-[#a1a5b7]">
                  <tr>
                    <th className="px-4 py-3">Sale</th>
                    <th className="px-4 py-3">Tổng lead</th>
                    <th className="px-4 py-3">Mới</th>
                    <th className="px-4 py-3">Tiếp cận</th>
                    <th className="px-4 py-3">Thuyết phục</th>
                    <th className="px-4 py-3">Thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOverview.sales.map((s) => (
                    <tr key={s.saleId} className="border-t border-[#eff2f5]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#181c32]">
                          {s.saleName ?? s.saleEmail}
                        </div>
                        <div className="text-xs text-[#a1a5b7]">{s.saleEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#181c32] tabular-nums">
                        {s.totalLeads}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.dataNew}{" "}
                        <span className="text-xs text-[#a1a5b7]">
                          ({(s.ratios.NEW * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.dataApproach}{" "}
                        <span className="text-xs text-[#a1a5b7]">
                          ({(s.ratios.CONTACTED * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.dataPersuade}{" "}
                        <span className="text-xs text-[#a1a5b7]">
                          ({(s.ratios.PERSUADING * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.dataPayment}{" "}
                        <span className="text-xs text-[#a1a5b7]">
                          (
                          {((s.ratios.PAYMENT_SUCCESS + s.ratios.ZALO_JOINED) * 100).toFixed(1)}%
                          )
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </RoleGate>
  );
}
