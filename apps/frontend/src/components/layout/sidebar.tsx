"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard,
  CreditCard,
  Plus,
  Upload,
  Building2,
  Users,
  Wallet,
  UserCircle,
  FileBarChart,
  Calendar,
  Search,
  PieChart,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  HandCoins,
  ScrollText,
  UserCog,
} from "lucide-react";
import { useState, useMemo, memo, useCallback } from "react";
import { useApprovalStats } from "@/hooks/use-api";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[]; // Boş = herkes görebilir
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Role erişim matrisi:
// ADMIN: Her şey
// OPERATOR: İşlemler, Hesaplar (görüntüleme), Raporlar (kısıtlı), Onaylar
// PARTNER: Dashboard, kendi işlemleri, kendi siteleri, onay talepleri
// VIEWER: Her şey (read-only) — ayarlar/kullanıcılar hariç
const ALL_ROLES = ["ADMIN", "OPERATOR", "PARTNER", "VIEWER", "USER"];
const ADMIN_ONLY = ["ADMIN"];
const ADMIN_VIEWER = ["ADMIN", "VIEWER"];
const NO_PARTNER = ["ADMIN", "OPERATOR", "VIEWER", "USER"];

const navigation: NavGroup[] = [
  {
    title: "",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }, // herkes
    ],
  },
  {
    title: "İŞLEMLER",
    items: [
      { title: "Tüm İşlemler", href: "/transactions", icon: CreditCard }, // herkes
      { title: "Bulk Import", href: "/transactions/import", icon: Upload, roles: NO_PARTNER },
    ],
  },
  {
    title: "HESAPLAR",
    items: [
      { title: "Organizasyon", href: "/organization", icon: Briefcase, roles: NO_PARTNER },
      { title: "Siteler", href: "/sites", icon: Building2 }, // herkes (partner kendi sitelerini görür)
      { title: "Partnerler", href: "/partners", icon: Users, roles: NO_PARTNER },
      { title: "Finansörler", href: "/financiers", icon: Wallet, roles: NO_PARTNER },
      { title: "Dış Kişiler", href: "/external-parties", icon: UserCircle, roles: NO_PARTNER },
      { title: "Borç/Alacak", href: "/borclar", icon: HandCoins, roles: ["ADMIN", "PARTNER", "VIEWER"] },
    ],
  },
  {
    title: "RAPORLAR",
    items: [
      { title: "Günlük Özet", href: "/reports/daily", icon: Calendar, roles: NO_PARTNER },
      { title: "Aylık Rapor", href: "/reports/monthly", icon: FileBarChart, roles: NO_PARTNER },
      { title: "Mutabakat", href: "/reports/reconciliation", icon: Search, roles: NO_PARTNER },
      { title: "Analiz", href: "/reports/analysis", icon: PieChart, roles: NO_PARTNER },
    ],
  },
  {
    title: "SİSTEM",
    items: [
      { title: "Onay Bekleyenler", href: "/approvals", icon: Clock, roles: ["ADMIN", "PARTNER", "VIEWER"] },
      { title: "Kullanıcılar", href: "/users", icon: UserCog, roles: ADMIN_ONLY },
      { title: "Audit Log", href: "/audit-log", icon: ScrollText, roles: ADMIN_VIEWER },
      { title: "Ayarlar", href: "/settings", icon: Settings, roles: ADMIN_ONLY },
    ],
  },
];

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: approvalStats } = useApprovalStats();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Role-based navigation filtering + dynamic badge
  const dynamicNavigation = useMemo(() => {
    const pendingCount = approvalStats?.pendingCount || 0;
    const userRole = user?.role || "USER";

    return navigation
      .map(group => ({
        ...group,
        items: group.items
          // Rol filtresi: roles tanımlıysa, kullanıcının rolü listede olmalı
          .filter(item => !item.roles || item.roles.includes(userRole))
          .map(item => {
            if (item.href === "/approvals" && pendingCount > 0) {
              return { ...item, badge: pendingCount };
            }
            return item;
          }),
      }))
      // Boş grupları kaldır
      .filter(group => group.items.length > 0);
  }, [approvalStats, user?.role]);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 lg:h-16 lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">FinansPro</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {dynamicNavigation.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.title && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (pathname.startsWith(item.href + "/") && !group.items.some(other => other.href !== item.href && pathname.startsWith(other.href)));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-xs font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-100 text-primary-700 text-sm font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "Kullanıcı"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role || "Rol"}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-danger-600"
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Çıkış yapmak istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Oturumunuz sonlandırılacak ve giriş sayfasına yönlendirileceksiniz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
                  Çıkış Yap
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export const Sidebar = memo(function Sidebar() {
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menüyü aç</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigasyon Menüsü</SheetTitle>
            <SheetDescription className="sr-only">Ana navigasyon menüsü</SheetDescription>
            <NavContent onNavClick={handleClose} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">FinansPro</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card lg:block">
        <NavContent />
      </aside>
    </>
  );
});

export function MobileNav() {
  return null; // Now handled by Sidebar component
}
