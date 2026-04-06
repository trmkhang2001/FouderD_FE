"use client";

import { useEffect, useState } from "react";
import { UserCircle2 } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  saleAccId: string | null;
};

const roleVi: Record<string, string> = {
  ADMIN: "Quản trị",
  MANAGER: "Quản lý",
  SALE: "Kinh doanh",
};

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [createForm, setCreateForm] = useState<{
    email: string;
    password: string;
    name: string;
    saleAccId: string;
  }>({ email: "", password: "", name: "", saleAccId: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<
    string,
    { role: string; saleAccId: string | null }
  >>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<UserRow[]>("/users");
        if (!cancelled) {
          setRows(data);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    setDrafts((cur) => {
      const next = { ...cur };
      for (const u of rows) {
        if (!next[u.id]) {
          next[u.id] = { role: u.role, saleAccId: u.saleAccId };
        }
      }
      return next;
    });
  }, [rows]);

  async function saveUser(id: string) {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    try {
      await api.put(`/users/${id}`, {
        role: d.role,
        saleAccId: d.saleAccId,
      });
      const { data } = await api.get<UserRow[]>("/users");
      setRows(data);
    } finally {
      setSavingId(null);
    }
  }

  async function createSaleUser() {
    if (creating) return;
    const email = createForm.email.trim();
    const password = createForm.password;
    const name = createForm.name.trim();

    if (!email || !password.trim() || !name) {
      return;
    }
    if (password.length < 8) {
      setCreateError("Password phải có ít nhất 8 ký tự.");
      return;
    }

    setCreateError(null);
    setCreating(true);
    try {
      await api.post("/users", {
        email,
        password,
        name,
        role: "SALE",
        saleAccId: createForm.saleAccId.trim() ? createForm.saleAccId.trim() : null,
      });
      setCreateForm({ email: "", password: "", name: "", saleAccId: "" });
      setCreateError(null);
      const { data } = await api.get<UserRow[]>("/users");
      setRows(data);
    } catch (e: any) {
      const data = e?.response?.data;
      if (typeof data === "string") {
        setCreateError(data);
      } else {
        setCreateError(JSON.stringify(data ?? { message: e?.message }, null, 2));
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <RoleGate roles={["ADMIN"]}>
      <div className="mx-auto max-w-4xl space-y-6">
        <p className="text-sm text-[#a1a5b7]">
          Danh sách tài khoản — tiêu đề trang hiển thị trên thanh công cụ.
        </p>

        <Card className="metronic-card overflow-hidden border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <CardHeader className="border-b border-[#eff2f5] bg-white">
            <CardTitle className="text-base font-semibold text-[#181c32]">
              Đăng ký user SALE
            </CardTitle>
            <CardDescription className="text-[#a1a5b7]">
              Admin tạo tài khoản kinh doanh (role `SALE`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {createError && (
              <div className="rounded-lg border border-[#f1416c]/25 bg-[#f1416c]/8 px-4 py-3 text-sm text-[#f1416c]">
                {createError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Email *</p>
                <Input
                  value={createForm.email}
                  onChange={(e) => setCreateForm((c) => ({ ...c, email: e.target.value }))}
                  placeholder="sale@example.com"
                  className="h-10 rounded-md bg-white"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Password *</p>
                <Input
                  value={createForm.password}
                  type="password"
                  onChange={(e) =>
                    setCreateForm((c) => ({ ...c, password: e.target.value }))
                  }
                  placeholder="********"
                  className="h-10 rounded-md bg-white"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">Name *</p>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Tên sale"
                  className="h-10 rounded-md bg-white"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#a1a5b7]">SaleAccId (optional)</p>
                <Input
                  value={createForm.saleAccId}
                  onChange={(e) =>
                    setCreateForm((c) => ({ ...c, saleAccId: e.target.value }))
                  }
                  placeholder="Map với Ladiwork/Sepay"
                  className="h-10 rounded-md bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void createSaleUser()}
                disabled={creating}
                className="rounded-md bg-[#009ef7] px-4 font-semibold text-white hover:bg-[#0095e8]"
              >
                {creating ? "Đang tạo..." : "Create SALE"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="metronic-card overflow-hidden border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
          <CardHeader className="border-b border-[#eff2f5] bg-white">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#009ef7]/10 text-[#009ef7]">
                <UserCircle2 className="size-5" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-[#181c32]">
                  Danh sách người dùng
                </CardTitle>
                <CardDescription className="text-[#a1a5b7]">
                  Email, vai trò và mã sale (nếu có)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-[#eff2f5]">
              {rows.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[#f5f8fa] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[#181c32]">{u.name}</p>
                    <p className="text-sm text-[#a1a5b7]">{u.email}</p>
                    {u.saleAccId && (
                      <p className="mt-1 text-xs text-[#a1a5b7]">Sale ID: {u.saleAccId}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Badge
                      variant="secondary"
                      className="w-fit shrink-0 rounded-md border-0 bg-[#009ef7]/10 font-normal text-[#009ef7] hover:bg-[#009ef7]/15"
                    >
                      {roleVi[drafts[u.id]?.role ?? u.role] ??
                        drafts[u.id]?.role ??
                        u.role}
                    </Badge>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={drafts[u.id]?.role ?? u.role}
                        onChange={(e) => {
                          const role = e.target.value;
                          setDrafts((cur) => ({
                            ...cur,
                            [u.id]: { role, saleAccId: cur[u.id]?.saleAccId ?? u.saleAccId },
                          }));
                        }}
                        className="h-9 rounded-md border border-[#eff2f5] bg-white px-2 text-sm"
                      >
                        {Object.keys(roleVi).map((r) => (
                          <option key={r} value={r}>
                            {roleVi[r] ?? r}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={drafts[u.id]?.saleAccId ?? ""}
                        onChange={(e) =>
                          setDrafts((cur) => ({
                            ...cur,
                            [u.id]: {
                              role: cur[u.id]?.role ?? u.role,
                              saleAccId: e.target.value ? e.target.value : null,
                            },
                          }))
                        }
                        placeholder="SaleAccId (optional)"
                        className="h-9 w-44"
                      />
                      <Button
                        type="button"
                        onClick={() => void saveUser(u.id)}
                        disabled={savingId === u.id}
                        className="h-9 rounded-md bg-[#009ef7] px-3 font-semibold text-white hover:bg-[#0095e8]"
                      >
                        {savingId === u.id ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
              {rows.length === 0 && (
                <li className="px-5 py-12 text-center text-sm text-[#a1a5b7]">
                  Chưa có dữ liệu người dùng.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
