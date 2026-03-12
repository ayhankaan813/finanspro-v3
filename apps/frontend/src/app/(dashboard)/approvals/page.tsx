"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatTurkeyDate, formatTurkeyDateTime } from "@/lib/utils";
import {
  usePendingApprovals,
  useApprovalStats,
  useApproveTransaction_Approval,
  useRejectTransaction_Approval,
  ApprovalTransaction,
  usePendingAdjustments,
  useAdjustmentStats,
  useApproveAdjustment,
  useRejectAdjustment,
  AdjustmentItem,
  usePendingTransactions,
  usePendingTransactionCount,
  useApprovePendingTransaction,
  useRejectPendingTransaction,
  PendingTransaction,
} from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  PiggyBank,
  Send,
  Users,
  UserPlus,
  UserMinus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Inbox,
  Pencil,
  CalendarDays,
  Trash2,
  FileEdit,
  ClipboardList,
  User,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";

// Transaction type → display (backend enum names)
const TX_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  DEPOSIT: { label: "Yatırım", icon: ArrowDownCircle, color: "text-emerald-600 bg-emerald-50" },
  WITHDRAWAL: { label: "Çekim", icon: ArrowUpCircle, color: "text-rose-600 bg-rose-50" },
  DELIVERY: { label: "Teslim", icon: Package, color: "text-violet-600 bg-violet-50" },
  TOP_UP: { label: "Takviye", icon: PiggyBank, color: "text-amber-600 bg-amber-50" },
  PAYMENT: { label: "Ödeme", icon: Send, color: "text-blue-600 bg-blue-50" },
  EXTERNAL_DEBT_IN: { label: "Borç Alım", icon: UserPlus, color: "text-cyan-600 bg-cyan-50" },
  EXTERNAL_DEBT_OUT: { label: "Borç Verim", icon: UserMinus, color: "text-pink-600 bg-pink-50" },
  ORG_EXPENSE: { label: "Org Gider", icon: TrendingDown, color: "text-red-600 bg-red-50" },
  ORG_INCOME: { label: "Org Gelir", icon: TrendingUp, color: "text-green-600 bg-green-50" },
  ORG_WITHDRAW: { label: "Org Çekim", icon: Wallet, color: "text-slate-600 bg-slate-50" },
  FINANCIER_TRANSFER: { label: "Finansör Transfer", icon: ArrowLeftRight, color: "text-purple-600 bg-purple-50" },
};

// Pending transaction type → display (route-slug names)
const PENDING_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "deposit": { label: "Yatırım", icon: ArrowDownCircle, color: "text-emerald-600 bg-emerald-50" },
  "withdrawal": { label: "Çekim", icon: ArrowUpCircle, color: "text-rose-600 bg-rose-50" },
  "site-delivery": { label: "Site Teslim", icon: Package, color: "text-violet-600 bg-violet-50" },
  "delivery": { label: "Teslim", icon: Package, color: "text-violet-600 bg-violet-50" },
  "top-up": { label: "Takviye", icon: PiggyBank, color: "text-amber-600 bg-amber-50" },
  "payment": { label: "Ödeme", icon: Send, color: "text-blue-600 bg-blue-50" },
  "partner-payment": { label: "Partner Ödeme", icon: Users, color: "text-indigo-600 bg-indigo-50" },
  "external-debt": { label: "Dış Borç", icon: UserPlus, color: "text-cyan-600 bg-cyan-50" },
  "external-payment": { label: "Dış Ödeme", icon: Receipt, color: "text-orange-600 bg-orange-50" },
  "org-expense": { label: "Org Gider", icon: TrendingDown, color: "text-red-600 bg-red-50" },
  "org-income": { label: "Org Gelir", icon: TrendingUp, color: "text-green-600 bg-green-50" },
  "org-withdraw": { label: "Org Çekim", icon: Wallet, color: "text-slate-600 bg-slate-50" },
  "financier-transfer": { label: "Finansör Transfer", icon: ArrowLeftRight, color: "text-purple-600 bg-purple-50" },
};

const ADJ_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TRANSACTION_AMOUNT_CHANGE: { label: "Tutar Düzeltme", icon: Pencil, color: "text-blue-600 bg-blue-50" },
  TRANSACTION_DATE_CHANGE: { label: "Tarih Düzeltme", icon: CalendarDays, color: "text-orange-600 bg-orange-50" },
  TRANSACTION_DELETE: { label: "İşlem Silme", icon: Trash2, color: "text-rose-600 bg-rose-50" },
  BALANCE_CORRECTION: { label: "Bakiye Düzeltme", icon: FileEdit, color: "text-violet-600 bg-violet-50" },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay === 1) return "Dün";
  if (diffDay < 7) return `${diffDay} gün önce`;
  return formatTurkeyDate(dateStr);
}

const ROLE_BADGES: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  OPERATOR: "bg-blue-100 text-blue-700",
  PARTNER: "bg-amber-100 text-amber-700",
  VIEWER: "bg-gray-100 text-gray-700",
  USER: "bg-gray-100 text-gray-700",
};

export default function ApprovalsPage() {
  const { isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<'pending' | 'transactions' | 'adjustments'>('pending');

  // ==================== PENDING TRANSACTIONS (OPERATOR/PARTNER talepleri) ====================
  const [pendingFilter, setPendingFilter] = useState<string>("PENDING");
  const { data: ptData, isLoading: ptLoading } = usePendingTransactions({ status: pendingFilter, limit: 50 });
  const { data: ptCount } = usePendingTransactionCount();
  const approvePending = useApprovePendingTransaction();
  const rejectPending = useRejectPendingTransaction();

  // ==================== OLD APPROVAL SYSTEM ====================
  const { data: pendingData, isLoading: pendingLoading, error: pendingError } = usePendingApprovals();
  const { data: stats, isLoading: statsLoading } = useApprovalStats();
  const approveMutation = useApproveTransaction_Approval();
  const rejectMutation = useRejectTransaction_Approval();

  // ==================== ADJUSTMENTS ====================
  const { data: adjData, isLoading: adjLoading } = usePendingAdjustments();
  const { data: adjStats, isLoading: adjStatsLoading } = useAdjustmentStats();
  const approveAdjMutation = useApproveAdjustment();
  const rejectAdjMutation = useRejectAdjustment();

  // Dialog states
  const [dialog, setDialog] = useState<{
    type: 'approve' | 'reject';
    target: 'pending' | 'tx' | 'adj';
    item: any;
  } | null>(null);
  const [dialogNote, setDialogNote] = useState("");

  const pendingTransactions = ptData?.items || [];
  const oldPendingTx = pendingData?.items || [];
  const pendingAdjustments = adjData?.items || [];

  const ptPendingCount = ptCount?.count ?? 0;
  const txPendingCount = stats?.pendingCount ?? oldPendingTx.length;
  const adjPendingCount = adjStats?.pending ?? pendingAdjustments.length;

  // ==================== HANDLERS ====================
  const handleDialogConfirm = async () => {
    if (!dialog) return;
    const { type, target, item } = dialog;
    
    try {
      if (target === 'pending') {
        if (type === 'approve') {
          await approvePending.mutateAsync({ id: item.id, note: dialogNote || undefined });
          toast({ title: "İşlem Talebi Onaylandı ✅", description: item.description || "Talep onaylandı ve işlem oluşturuldu.", variant: "success" });
        } else {
          await rejectPending.mutateAsync({ id: item.id, note: dialogNote || undefined });
          toast({ title: "İşlem Talebi Reddedildi", description: item.description || "Talep reddedildi." });
        }
      } else if (target === 'tx') {
        if (type === 'approve') {
          await approveMutation.mutateAsync({ id: item.id, note: dialogNote || undefined });
          toast({ title: "İşlem Onaylandı ✅", description: "İşlem başarıyla onaylandı.", variant: "success" });
        } else {
          if (!dialogNote.trim()) return;
          await rejectMutation.mutateAsync({ id: item.id, reason: dialogNote });
          toast({ title: "İşlem Reddedildi", description: "İşlem reddedildi." });
        }
      } else if (target === 'adj') {
        if (type === 'approve') {
          await approveAdjMutation.mutateAsync({ id: item.id, note: dialogNote || undefined });
          toast({ title: "Düzeltme Onaylandı ✅", description: "Düzeltme uygulandı.", variant: "success" });
        } else {
          if (!dialogNote.trim()) return;
          await rejectAdjMutation.mutateAsync({ id: item.id, reason: dialogNote });
          toast({ title: "Düzeltme Reddedildi", description: "Düzeltme talebi reddedildi." });
        }
      }
      setDialog(null);
      setDialogNote("");
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "İşlem başarısız oldu.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Onay Merkezi</h1>
        <p className="text-muted-foreground text-sm">
          İşlem talepleri, onaylar ve düzeltme taleplerini yönetin
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-twilight-100 rounded-xl p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-white text-twilight-900 shadow-sm'
              : 'text-twilight-500 hover:text-twilight-700'
          }`}
        >
          <ClipboardList className="h-4 w-4 shrink-0" />
          <span>İşlem Talepleri</span>
          {ptPendingCount > 0 && (
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-[20px]">{ptPendingCount}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-white text-twilight-900 shadow-sm'
              : 'text-twilight-500 hover:text-twilight-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>İşlem Onayları</span>
          {txPendingCount > 0 && (
            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 min-w-[20px]">{txPendingCount}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'adjustments'
              ? 'bg-white text-twilight-900 shadow-sm'
              : 'text-twilight-500 hover:text-twilight-700'
          }`}
        >
          <FileEdit className="h-4 w-4 shrink-0" />
          <span>Düzeltmeler</span>
          {adjPendingCount > 0 && (
            <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 min-w-[20px]">{adjPendingCount}</Badge>
          )}
        </button>
      </div>

      {/* ==================== TAB 1: PENDING TRANSACTIONS (OPERATOR/PARTNER talepleri) ==================== */}
      {activeTab === 'pending' && (
        <>
          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "PENDING", label: "Bekleyen", color: "bg-amber-100 text-amber-700 border-amber-200" },
              { value: "APPROVED", label: "Onaylanan", color: "bg-green-100 text-green-700 border-green-200" },
              { value: "REJECTED", label: "Reddedilen", color: "bg-red-100 text-red-700 border-red-200" },
              { value: "", label: "Tümü", color: "bg-gray-100 text-gray-700 border-gray-200" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setPendingFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  pendingFilter === f.value
                    ? f.color + " ring-1 ring-offset-1"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-amber-600 font-medium">Bekleyen</p>
                <p className="text-2xl font-bold text-amber-900">{ptPendingCount}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-green-600 font-medium">Onaylanan</p>
                <p className="text-2xl font-bold text-green-900">
                  {ptData?.pagination?.total !== undefined 
                    ? (pendingFilter === "APPROVED" ? ptData.pagination.total : "—") 
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-red-600 font-medium">Reddedilen</p>
                <p className="text-2xl font-bold text-red-900">
                  {ptData?.pagination?.total !== undefined 
                    ? (pendingFilter === "REJECTED" ? ptData.pagination.total : "—")
                    : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending list */}
          {ptLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-72" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">
                  {pendingFilter === "PENDING" ? "Bekleyen talep yok" : "Sonuç bulunamadı"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pendingFilter === "PENDING" 
                    ? "Tüm işlem talepleri değerlendirilmiş." 
                    : "Bu filtrede sonuç bulunamadı."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingTransactions.map((pt) => {
                const typeInfo = PENDING_TYPE_LABELS[pt.transaction_type] || { label: pt.transaction_type, icon: Clock, color: "text-gray-600 bg-gray-50" };
                const Icon = typeInfo.icon;
                const amount = pt.payload?.amount;
                const statusBadge = pt.status === "PENDING" 
                  ? { label: "Bekliyor", color: "bg-amber-100 text-amber-700" }
                  : pt.status === "APPROVED"
                  ? { label: "Onaylandı", color: "bg-green-100 text-green-700" }
                  : { label: "Reddedildi", color: "bg-red-100 text-red-700" };

                return (
                  <Card key={pt.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4 px-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full shrink-0 ${typeInfo.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base">{typeInfo.label}</h3>
                                <Badge className={`text-[10px] ${statusBadge.color}`}>{statusBadge.label}</Badge>
                              </div>
                              {pt.description && (
                                <p className="mt-1 text-sm text-muted-foreground truncate">{pt.description}</p>
                              )}
                            </div>
                            {amount && (
                              <p className="text-lg font-bold font-mono shrink-0">
                                {formatMoney(Number(amount))}
                              </p>
                            )}
                          </div>

                          {/* Requester & time */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{pt.requester?.name || "?"}</span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] py-0 ${ROLE_BADGES[pt.requester_role] || ""}`}>
                              {pt.requester_role}
                            </Badge>
                            <span>•</span>
                            <span>{formatTimeAgo(pt.created_at)}</span>
                          </div>

                          {/* Reviewer info (if reviewed) */}
                          {pt.reviewer && (
                            <div className="mt-1.5 text-xs text-muted-foreground">
                              <span className="font-medium">{pt.status === "APPROVED" ? "Onaylayan" : "Reddeden"}:</span>{" "}
                              {pt.reviewer.name}
                              {pt.review_note && <span className="ml-2 italic">"{pt.review_note}"</span>}
                              {pt.reviewed_at && <span className="ml-2">• {formatTimeAgo(pt.reviewed_at)}</span>}
                            </div>
                          )}

                          {/* Payload summary */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {pt.payload?.site_id && (
                              <Badge variant="outline" className="text-[10px]">Site: {pt.payload.site_id.substring(0, 8)}...</Badge>
                            )}
                            {pt.payload?.financier_id && (
                              <Badge variant="outline" className="text-[10px]">Fin: {pt.payload.financier_id.substring(0, 8)}...</Badge>
                            )}
                          </div>

                          {/* Action buttons (only for PENDING + ADMIN) */}
                          {pt.status === "PENDING" && isAdmin && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                                onClick={() => { setDialog({ type: 'approve', target: 'pending', item: pt }); setDialogNote(""); }}
                              >
                                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Onayla
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                                onClick={() => { setDialog({ type: 'reject', target: 'pending', item: pt }); setDialogNote(""); }}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reddet
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== TAB 2: OLD TRANSACTION APPROVALS ==================== */}
      {activeTab === 'transactions' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-amber-600 font-medium">Bekleyen</p>
                <p className="text-2xl font-bold text-amber-900">
                  {statsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (stats?.pendingCount ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-green-600 font-medium">Onaylanan</p>
                <p className="text-2xl font-bold text-green-900">
                  {statsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (stats?.approvedCount ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-red-600 font-medium">Reddedilen</p>
                <p className="text-2xl font-bold text-red-900">
                  {statsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (stats?.rejectedCount ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="py-5"><div className="flex items-start gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-96" /></div></div></CardContent></Card>
              ))}
            </div>
          ) : pendingError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
                <h3 className="mt-4 text-lg font-medium">Veriler yüklenirken hata oluştu</h3>
              </CardContent>
            </Card>
          ) : oldPendingTx.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Bekleyen işlem onayı yok</h3>
                <p className="mt-2 text-sm text-muted-foreground">Tüm işlemler onaylanmış durumda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {oldPendingTx.map((tx) => {
                const typeInfo = TX_TYPE_LABELS[tx.type] || { label: tx.type, icon: Clock, color: "text-gray-600 bg-gray-50" };
                const TxIcon = typeInfo.icon;
                return (
                  <Card key={tx.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4 px-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full shrink-0 ${typeInfo.color}`}>
                          <TxIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base">{typeInfo.label}</h3>
                                <Badge variant="outline" className="text-xs">Onay Bekliyor</Badge>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                                {tx.site && <span className="font-medium text-foreground">{tx.site.name}</span>}
                                {tx.financier && <span>Fin: {tx.financier.name}</span>}
                              </div>
                            </div>
                            <p className="text-lg font-bold font-mono shrink-0">{formatMoney(Number(tx.gross_amount))}</p>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {tx.created_by} • {formatTimeAgo(tx.created_at)}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={() => { setDialog({ type: 'approve', target: 'tx', item: tx }); setDialogNote(""); }}>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Onayla
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => { setDialog({ type: 'reject', target: 'tx', item: tx }); setDialogNote(""); }}>
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reddet
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== TAB 3: ADJUSTMENTS ==================== */}
      {activeTab === 'adjustments' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-blue-600 font-medium">Bekleyen</p>
                <p className="text-2xl font-bold text-blue-900">
                  {adjStatsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (adjStats?.pending ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-green-600 font-medium">Onaylanan</p>
                <p className="text-2xl font-bold text-green-900">
                  {adjStatsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (adjStats?.applied ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="py-3 px-4 text-center">
                <p className="text-xs text-red-600 font-medium">Reddedilen</p>
                <p className="text-2xl font-bold text-red-900">
                  {adjStatsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (adjStats?.rejected ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {adjLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="py-5"><div className="flex items-start gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /></div></div></CardContent></Card>
              ))}
            </div>
          ) : pendingAdjustments.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Bekleyen düzeltme talebi yok</h3>
                <p className="mt-2 text-sm text-muted-foreground">Tüm düzeltme talepleri değerlendirilmiş.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingAdjustments.map((adj) => {
                const typeInfo = ADJ_TYPE_LABELS[adj.type] || { label: adj.type, icon: FileEdit, color: "text-gray-600 bg-gray-50" };
                const AdjIcon = typeInfo.icon;
                return (
                  <Card key={adj.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4 px-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full shrink-0 ${typeInfo.color}`}>
                          <AdjIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base">{typeInfo.label}</h3>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Düzeltme</Badge>
                          </div>
                          {adj.reason && (
                            <p className="mt-1 text-sm text-muted-foreground">{adj.reason}</p>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground">
                            {adj.requester?.name || "?"} • {formatTimeAgo(adj.requested_at)}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={() => { setDialog({ type: 'approve', target: 'adj', item: adj }); setDialogNote(""); }}>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Onayla
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => { setDialog({ type: 'reject', target: 'adj', item: adj }); setDialogNote(""); }}>
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reddet
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== UNIVERSAL DIALOG ==================== */}
      <AlertDialog open={!!dialog} onOpenChange={(open) => { if (!open) { setDialog(null); setDialogNote(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog?.type === 'approve' ? '✅ İşlemi Onayla' : '❌ İşlemi Reddet'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.type === 'approve'
                ? 'Bu işlemi onaylamak istediğinizden emin misiniz?'
                : 'Reddetme sebebini belirtin.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {dialog?.item?.description && (
            <div className="bg-twilight-50 rounded-lg px-4 py-3 text-sm">
              {dialog.item.description}
            </div>
          )}

          <Textarea
            placeholder={dialog?.type === 'approve' ? 'Not (opsiyonel)...' : 'Sebep yazın...'}
            value={dialogNote}
            onChange={(e) => setDialogNote(e.target.value)}
            rows={3}
          />

          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <Button
              onClick={handleDialogConfirm}
              disabled={
                (dialog?.type === 'reject' && dialog?.target !== 'pending' && !dialogNote.trim()) ||
                approvePending.isPending || rejectPending.isPending ||
                approveMutation.isPending || rejectMutation.isPending ||
                approveAdjMutation.isPending || rejectAdjMutation.isPending
              }
              className={dialog?.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {(approvePending.isPending || rejectPending.isPending || approveMutation.isPending || rejectMutation.isPending || approveAdjMutation.isPending || rejectAdjMutation.isPending)
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> İşleniyor...</>
                : dialog?.type === 'approve' ? 'Onayla' : 'Reddet'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
