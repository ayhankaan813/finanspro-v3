"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuthStore } from "@/stores/auth.store";
import { canAccessPage } from "@/lib/permissions";
import { Loader2, ShieldAlert } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait a tick for zustand persist hydration to complete
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("finanspro-auth");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.isAuthenticated && parsed.state?.accessToken) {
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Invalid stored data
        }
      }

      // No valid auth, redirect to login
      router.replace("/login");
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Also check when store updates (skip while still loading/hydrating)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Double-check localStorage before redirecting (zustand might not have hydrated yet)
      const stored = localStorage.getItem("finanspro-auth");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.isAuthenticated && parsed.state?.accessToken) {
            return; // Still valid in storage, don't redirect
          }
        } catch (e) { /* ignore */ }
      }
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Route-level permission check
  const hasAccess = user?.role ? canAccessPage(pathname, user.role) : true;
  const isViewer = user?.role === "VIEWER";

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 overflow-x-clip">
      <Sidebar />
      {/* Main content - responsive padding */}
      <main className="lg:pl-64">
        {/* Desktop top bar with notification bell */}
        <header className="sticky top-0 z-30 hidden lg:flex h-14 items-center justify-end border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8">
          {isViewer && (
            <div className="flex items-center gap-1.5 mr-auto px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>İzleyici Modu — Sadece Görüntüleme</span>
            </div>
          )}
          <NotificationBell />
        </header>
        {/* Mobile viewer banner */}
        {isViewer && (
          <div className="lg:hidden flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium border-b">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>İzleyici Modu</span>
          </div>
        )}
        <div className="container px-3 py-1 sm:py-6 lg:px-8 lg:py-8">
          {hasAccess ? children : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
              <ShieldAlert className="h-16 w-16 mb-4 text-red-300" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Erişim Engellendi</h2>
              <p className="text-sm">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-4 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Dashboard'a Dön
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
