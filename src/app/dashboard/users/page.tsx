"use client";

import { useEffect, useRef, useState } from "react";
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
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        role: string;
        saleAccId: string | null;
        email: string;
        name: string;
        password: string;
      }
    >
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Tránh stale closure: `saveUser` phải đọc bản `drafts` mới nhất (đặc biệt `role`). */
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

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
          next[u.id] = {
            role: u.role,
            saleAccId: u.saleAccId,
            email: u.email,
            name: u.name,
            password: "",
          };
        }
      }
      return next;
    });
  }, [rows]);

  async function saveUser(id: string) {
    const d = draftsRef.current[id];
    const row = rowsRef.current.find((r) => r.id === id);
    if (!d || !row) return;
    setSaveError(null);
    setSavingId(id);
    try {
      const body: Record<string, unknown> = {
        role: d.role,
        email: d.email.trim(),
        name: d.name.trim(),
      };
      const pw = d.password.trim();
      if (pw.length > 0) {
        body.password = pw;
      }
      if (!row.saleAccId) {
        body.saleAccId = d.saleAccId?.trim() ? d.saleAccId.trim() : null;
      }
      await api.put(`/users/${id}`, body);
      const { data } = await api.get<UserRow[]>("/users");
      setRows(data);
      const fresh = data.find((u) => u.id === id);
      setDrafts((cur) => ({
        ...cur,
        [id]: fresh
          ? {
              role: fresh.role,
              email: fresh.email,
              name: fresh.name,
              saleAccId: fresh.saleAccId,
              password: "",
            }
          : { ...cur[id]!, password: "" },
      }));
    } catch (e: unknown) {
      const ax = e as {
        response?: { data?: { message?: string | string[] } };
      };
      const m = ax.response?.data?.message;
      setSaveError(
        Array.isArray(m) ? m.join(", ") : m ?? "Không lưu được. Kiểm tra dữ liệu.",
      );
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
          Chỉ quản trị viên. Chỉnh vai trò, email, tên, mật khẩu; Sale ACC ID chỉ
          nhập được một lần (đã có thì không đổi).
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
            {saveError && (
              <div className="border-b border-[#f1416c]/20 bg-[#f1416c]/8 px-5 py-3 text-sm text-[#f1416c]">
                {saveError}
              </div>
            )}
            <ul className="divide-y divide-[#eff2f5]">
              {rows.map((u) => {
                const d = drafts[u.id];
                const saleLocked = Boolean(u.saleAccId);
                return (
                  <li
                    key={u.id}
                    className="px-5 py-4 transition-colors hover:bg-[#f5f8fa]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="w-fit shrink-0 rounded-md border-0 bg-[#009ef7]/10 font-normal text-[#009ef7] hover:bg-[#009ef7]/15"
                          >
                            {roleVi[d?.role ?? u.role] ?? d?.role ?? u.role}
                          </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#a1a5b7]">Email</p>
                            <Input
                              value={d?.email ?? u.email}
                              onChange={(e) =>
                                setDrafts((cur) => ({
                                  ...cur,
                                  [u.id]: {
                                    ...(cur[u.id] ?? {
                                      role: u.role,
                                      saleAccId: u.saleAccId,
                                      email: u.email,
                                      name: u.name,
                                      password: "",
                                    }),
                                    email: e.target.value,
                                  },
                                }))
                              }
                              className="h-9 rounded-md bg-white"
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#a1a5b7]">Tên</p>
                            <Input
                              value={d?.name ?? u.name}
                              onChange={(e) =>
                                setDrafts((cur) => ({
                                  ...cur,
                                  [u.id]: {
                                    ...(cur[u.id] ?? {
                                      role: u.role,
                                      saleAccId: u.saleAccId,
                                      email: u.email,
                                      name: u.name,
                                      password: "",
                                    }),
                                    name: e.target.value,
                                  },
                                }))
                              }
                              className="h-9 rounded-md bg-white"
                            />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#a1a5b7]">
                              Mật khẩu mới (để trống nếu không đổi)
                            </p>
                            <Input
                              type="password"
                              value={d?.password ?? ""}
                              onChange={(e) =>
                                setDrafts((cur) => ({
                                  ...cur,
                                  [u.id]: {
                                    ...(cur[u.id] ?? {
                                      role: u.role,
                                      saleAccId: u.saleAccId,
                                      email: u.email,
                                      name: u.name,
                                      password: "",
                                    }),
                                    password: e.target.value,
                                  },
                                }))
                              }
                              placeholder="••••••••"
                              className="h-9 rounded-md bg-white"
                              autoComplete="new-password"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#a1a5b7]">
                              Sale ACC ID
                              {saleLocked ? (
                                <span className="ml-1 font-normal text-[#50cd89]">
                                  (đã khóa)
                                </span>
                              ) : null}
                            </p>
                            <Input
                              value={
                                saleLocked
                                  ? (u.saleAccId ?? "")
                                  : (d?.saleAccId ?? u.saleAccId) ?? ""
                              }
                              onChange={(e) =>
                                setDrafts((cur) => ({
                                  ...cur,
                                  [u.id]: {
                                    ...(cur[u.id] ?? {
                                      role: u.role,
                                      saleAccId: u.saleAccId,
                                      email: u.email,
                                      name: u.name,
                                      password: "",
                                    }),
                                    saleAccId: e.target.value ? e.target.value : null,
                                  },
                                }))
                              }
                              disabled={saleLocked}
                              placeholder="Map Ladiwork/Sepay (chỉ đặt một lần)"
                              className="h-9 rounded-md bg-white disabled:cursor-not-allowed disabled:opacity-80"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                        <select
                          value={d?.role ?? u.role}
                          onChange={(e) => {
                            const role = e.target.value;
                            setDrafts((cur) => ({
                              ...cur,
                              [u.id]: {
                                ...(cur[u.id] ?? {
                                  role: u.role,
                                  saleAccId: u.saleAccId,
                                  email: u.email,
                                  name: u.name,
                                  password: "",
                                }),
                                role,
                              },
                            }));
                          }}
                          className="h-9 min-w-[10rem] rounded-md border border-[#eff2f5] bg-white px-2 text-sm"
                        >
                          {Object.keys(roleVi).map((r) => (
                            <option key={r} value={r}>
                              {roleVi[r] ?? r}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          onClick={() => void saveUser(u.id)}
                          disabled={savingId === u.id}
                          className="h-9 rounded-md bg-[#009ef7] px-4 font-semibold text-white hover:bg-[#0095e8]"
                        >
                          {savingId === u.id ? "Đang lưu..." : "Lưu"}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
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
