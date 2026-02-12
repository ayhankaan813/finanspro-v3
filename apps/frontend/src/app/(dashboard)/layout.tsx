"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuthStore } from "@/stores/auth.store";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have auth in localStorage (zustand persist)
    const checkAuth = () => {
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
    };

    checkAuth();
  }, [router]);

  // Also check when store updates
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Sidebar />
      {/* Main content - responsive padding */}
      <main className="lg:pl-64">
        {/* Desktop top bar with notification bell */}
        <header className="sticky top-0 z-30 hidden lg:flex h-14 items-center justify-end border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8">
          <NotificationBell />
        </header>
        <div className="container px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
