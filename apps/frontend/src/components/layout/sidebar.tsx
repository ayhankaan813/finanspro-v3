"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
} from "lucide-react";
import { useState, useMemo } from "react";
import { useApprovalStats } from "@/hooks/use-api";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "İŞLEMLER",
    items: [
      { title: "Tüm İşlemler", href: "/transactions", icon: CreditCard },
      { title: "Bulk Import", href: "/transactions/import", icon: Upload },
    ],
  },
  {
    title: "HESAPLAR",
    items: [
      { title: "Organizasyon", href: "/organization", icon: Briefcase },
      { title: "Siteler", href: "/sites", icon: Building2 },
      { title: "Partnerler", href: "/partners", icon: Users },
      { title: "Finansörler", href: "/financiers", icon: Wallet },
      { title: "Dış Kişiler", href: "/external-parties", icon: UserCircle },
    ],
  },
  {
    title: "RAPORLAR",
    items: [
      { title: "Günlük Özet", href: "/reports/daily", icon: Calendar },
      { title: "Aylık Rapor", href: "/reports/monthly", icon: FileBarChart },
      { title: "Mutabakat", href: "/reports/reconciliation", icon: Search },
      { title: "Analiz", href: "/reports/analysis", icon: PieChart },
    ],
  },
  {
    title: "SİSTEM",
    items: [
      { title: "Onay Bekleyenler", href: "/approvals", icon: Clock },
      { title: "Ayarlar", href: "/settings", icon: Settings },
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

  // Inject dynamic badge for "Onay Bekleyenler"
  const dynamicNavigation = useMemo(() => {
    const pendingCount = approvalStats?.pendingCount || 0;
    return navigation.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.href === "/approvals" && pendingCount > 0) {
          return { ...item, badge: pendingCount };
        }
        return item;
      }),
    }));
  }, [approvalStats]);

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
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

export function Sidebar() {
  const [open, setOpen] = useState(false);

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
            <NavContent onNavClick={() => setOpen(false)} />
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
}

export function MobileNav() {
  return null; // Now handled by Sidebar component
}
