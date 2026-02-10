"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { login } from "@/lib/auth-api";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      setAuth(response.user, response.accessToken, response.refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4 sm:p-6">
      {/* Mobile Logo - Visible only on small screens */}
      <div className="mb-6 flex flex-col items-center sm:hidden">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
          <Wallet className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-3 text-xl font-bold text-white">FinansPro V3</h1>
      </div>

      <Card className="w-full max-w-[400px] shadow-xl">
        <CardHeader className="space-y-1 text-center pb-4 sm:pb-6">
          {/* Desktop Logo - Hidden on mobile */}
          <div className="hidden sm:flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            <span className="hidden sm:inline">FinansPro V3</span>
            <span className="sm:hidden">Giriş Yap</span>
          </CardTitle>
          <CardDescription className="text-sm">
            Hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600 border border-danger-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Demo Hesap:</p>
            <p className="text-xs sm:text-sm">
              <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">admin@finanspro.com</code>
            </p>
            <p className="text-xs sm:text-sm mt-1">
              <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">admin123</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-xs text-white/60 text-center">
        © 2024 FinansPro. Tüm hakları saklıdır.
      </p>
    </div>
  );
}
