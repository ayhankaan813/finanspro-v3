"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/use-api";
import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wallet,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

const TYPE_ICONS: Record<string, React.ElementType> = {
  TRANSACTION_PENDING: Clock,
  TRANSACTION_APPROVED: CheckCircle,
  TRANSACTION_REJECTED: XCircle,
  ADJUSTMENT_PENDING: Clock,
  ADJUSTMENT_APPROVED: CheckCircle,
  ADJUSTMENT_REJECTED: XCircle,
  SYSTEM_ALERT: AlertTriangle,
  BALANCE_ALERT: Wallet,
};

const TYPE_COLORS: Record<string, string> = {
  TRANSACTION_PENDING: "text-amber-500",
  TRANSACTION_APPROVED: "text-green-500",
  TRANSACTION_REJECTED: "text-red-500",
  ADJUSTMENT_PENDING: "text-amber-500",
  ADJUSTMENT_APPROVED: "text-green-500",
  ADJUSTMENT_REJECTED: "text-red-500",
  SYSTEM_ALERT: "text-orange-500",
  BALANCE_ALERT: "text-blue-500",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay === 1) return "Dün";
  if (diffDay < 7) return `${diffDay} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications(10);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.items || [];

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative rounded-full text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[380px] rounded-xl border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {unreadCount} yeni
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllRead}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                )}
                Tümünü Okundu İşaretle
              </Button>
            )}
          </div>

          {/* Notification List */}
          <ScrollArea className="max-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Bildiriminiz yok</p>
                <p className="text-xs mt-1">Yeni bildirimler burada görünecek</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notification: any, index: number) => {
                  const Icon = TYPE_ICONS[notification.type] || Bell;
                  const colorClass = TYPE_COLORS[notification.type] || "text-gray-500";

                  return (
                    <div key={notification.id}>
                      <button
                        className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex gap-3 ${
                          !notification.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-tight ${!notification.is_read ? "font-semibold" : "font-medium"}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            {timeAgo(notification.created_at)}
                          </p>
                        </div>
                      </button>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to a full notifications page if it exists
                }}
              >
                Tüm bildirimleri gör
              </Button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
