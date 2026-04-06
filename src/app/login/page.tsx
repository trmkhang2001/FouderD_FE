"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{
        user: {
          id: string;
          email: string;
          name: string;
          role: "ADMIN" | "MANAGER" | "SALE";
          saleAccId: string | null;
        };
      }>("/auth/login", { email, password });
      setUser(data.user);
      useAuthStore.getState().setHydrated(true);
      router.replace("/dashboard");
    } catch {
      setError("Email hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f8fa] lg:flex-row">
      {/* Metronic-style brand column */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[#1e1e2d] px-12 py-14 text-white lg:flex lg:max-w-[42%] xl:max-w-[45%]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#009ef7]/20 text-[#009ef7] ring-1 ring-[#009ef7]/30">
              <LayoutGrid className="size-7" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ERP Pro</p>
              <p className="text-sm text-[#9899ac]">Workspace</p>
            </div>
          </div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Quản lý lead &amp; báo cáo trong một bảng điều khiển.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#9899ac]">
            Sidebar tối, vùng làm việc sáng, điểm nhấn xanh dương — phong cách admin dashboard hiện đại.
          </p>
        </div>
        <p className="relative z-10 text-xs text-[#565674]">
          © {new Date().getFullYear()} ERP Workspace
        </p>
      </div>

      {/* Form column */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-[#009ef7]/10 text-[#009ef7]">
                <LayoutGrid className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-[#181c32]">ERP Pro</p>
                <p className="text-xs text-[#a1a5b7]">Đăng nhập</p>
              </div>
            </div>
          </div>

          <Card className="metronic-card border-[#eff2f5] shadow-[0_0_20px_rgba(76,87,125,0.06)]">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xl font-semibold text-[#181c32]">
                Đăng nhập
              </CardTitle>
              <CardDescription className="text-[#a1a5b7]">
                Nhập email và mật khẩu do quản trị viên cấp.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#181c32]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 rounded-md border-[#eff2f5] bg-[#f5f8fa] px-3 text-[#181c32] placeholder:text-[#a1a5b7] focus-visible:border-[#009ef7] focus-visible:ring-[#009ef7]/25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#181c32]">
                    Mật khẩu
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-md border-[#eff2f5] bg-[#f5f8fa] px-3 text-[#181c32] placeholder:text-[#a1a5b7] focus-visible:border-[#009ef7] focus-visible:ring-[#009ef7]/25"
                  />
                </div>
                {error && (
                  <p className="text-sm font-medium text-[#f1416c]" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-md bg-[#009ef7] font-semibold text-white shadow-sm hover:bg-[#0095e8]"
                  disabled={loading}
                >
                  {loading ? "Đang đăng nhập…" : "Đăng nhập"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
