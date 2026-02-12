"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/utils";
import {
  usePendingApprovals,
  useApprovalStats,
  useApproveTransaction_Approval,
  useRejectTransaction_Approval,
  ApprovalTransaction,
} from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
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
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Transaction type labels
const TX_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  DEPOSIT: { label: "Yatırım", icon: ArrowDownCircle, color: "text-emerald-600 bg-emerald-50" },
  WITHDRAWAL: { label: "Çekim", icon: ArrowUpCircle, color: "text-rose-600 bg-rose-50" },
  DELIVERY: { label: "Teslim", icon: Package, color: "text-violet-600 bg-violet-50" },
  TOP_UP: { label: "Takviye", icon: PiggyBank, color: "text-amber-600 bg-amber-50" },
  PAYMENT: { label: "Ödeme", icon: Send, color: "text-blue-600 bg-blue-50" },
  PARTNER_PAYMENT: { label: "Partner Ödemesi", icon: Users, color: "text-indigo-600 bg-indigo-50" },
  EXTERNAL_DEBT_IN: { label: "Borç Alım", icon: UserPlus, color: "text-cyan-600 bg-cyan-50" },
  EXTERNAL_DEBT_OUT: { label: "Borç Verim", icon: UserMinus, color: "text-pink-600 bg-pink-50" },
  EXTERNAL_PAYMENT: { label: "Borç Kapama", icon: Receipt, color: "text-orange-600 bg-orange-50" },
  ORG_EXPENSE: { label: "Org Gider", icon: TrendingDown, color: "text-red-600 bg-red-50" },
  ORG_INCOME: { label: "Org Gelir", icon: TrendingUp, color: "text-green-600 bg-green-50" },
  ORG_WITHDRAW: { label: "Org Çekim", icon: Wallet, color: "text-slate-600 bg-slate-50" },
  FINANCIER_TRANSFER: { label: "Finansör Transfer", icon: ArrowLeftRight, color: "text-purple-600 bg-purple-50" },
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
  return format(date, "d MMM yyyy", { locale: tr });
}

export default function ApprovalsPage() {
  const { data: pendingData, isLoading: pendingLoading, error: pendingError } = usePendingApprovals();
  const { data: stats, isLoading: statsLoading } = useApprovalStats();
  const approveMutation = useApproveTransaction_Approval();
  const rejectMutation = useRejectTransaction_Approval();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState<ApprovalTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveNote, setApproveNote] = useState("");

  const pendingTransactions = pendingData?.items || [];

  const handleApprove = async () => {
    if (!selectedTx) return;
    try {
      await approveMutation.mutateAsync({ id: selectedTx.id, note: approveNote || undefined });
      toast({
        title: "İşlem Onaylandı ✓",
        description: `${TX_TYPE_LABELS[selectedTx.type]?.label || selectedTx.type} işlemi başarıyla onaylandı.`,
        variant: "success",
      });
      setShowApproveDialog(false);
      setSelectedTx(null);
      setApproveNote("");
    } catch (err: any) {
      toast({
        title: "Onaylama Hatası",
        description: err.message || "İşlem onaylanamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedTx || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: selectedTx.id, reason: rejectReason });
      toast({
        title: "İşlem Reddedildi",
        description: `${TX_TYPE_LABELS[selectedTx.type]?.label || selectedTx.type} işlemi reddedildi.`,
      });
      setShowRejectDialog(false);
      setSelectedTx(null);
      setRejectReason("");
    } catch (err: any) {
      toast({
        title: "Reddetme Hatası",
        description: err.message || "İşlem reddedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onay Bekleyenler</h1>
          <p className="text-muted-foreground">
            Onay gerektiren işlemleri inceleyin ve yönetin
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase">Bekleyen</p>
                <div className="text-2xl font-bold text-amber-900">
                  {statsLoading ? <Skeleton className="h-8 w-12" /> : (stats?.pendingCount ?? pendingTransactions.length)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 uppercase">Onaylanan</p>
                <div className="text-2xl font-bold text-green-900">
                  {statsLoading ? <Skeleton className="h-8 w-12" /> : (stats?.approvedCount ?? 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 uppercase">Reddedilen</p>
                <div className="text-2xl font-bold text-red-900">
                  {statsLoading ? <Skeleton className="h-8 w-12" /> : (stats?.rejectedCount ?? 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions List */}
      {pendingLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pendingError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <h3 className="mt-4 text-lg font-medium">Veriler yüklenirken hata oluştu</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Lütfen sayfayı yenileyerek tekrar deneyin
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sayfayı Yenile
            </Button>
          </CardContent>
        </Card>
      ) : pendingTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Bekleyen onay yok
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Tüm işlemler onaylanmış durumda. Yeni onay gerektiren işlemler burada görünecek.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingTransactions.map((tx) => {
            const typeInfo = TX_TYPE_LABELS[tx.type] || { label: tx.type, icon: Clock, color: "text-gray-600 bg-gray-50" };
            const Icon = typeInfo.icon;

            return (
              <Card key={tx.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${typeInfo.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{typeInfo.label}</h3>
                            <Badge variant="outline" className="text-xs">
                              {tx.status === "PENDING" ? "Onay Bekliyor" : tx.status}
                            </Badge>
                          </div>

                          {/* Details */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {tx.site && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-foreground">{tx.site.name}</span>
                              </span>
                            )}
                            {tx.partner && (
                              <span>Partner: {tx.partner.name}</span>
                            )}
                            {tx.financier && (
                              <span>Finansör: {tx.financier.name}</span>
                            )}
                            {tx.external_party && (
                              <span>Dış Kişi: {tx.external_party.name}</span>
                            )}
                          </div>

                          {tx.description && (
                            <p className="mt-1 text-sm text-muted-foreground truncate max-w-lg">
                              {tx.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Oluşturan: {tx.created_by}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(tx.created_at)}</span>
                            <span>•</span>
                            <span>{format(new Date(tx.transaction_date), "d MMM yyyy", { locale: tr })}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold font-mono">
                            {formatMoney(Number(tx.gross_amount))}
                          </p>
                          {tx.net_amount !== tx.gross_amount && (
                            <p className="text-xs text-muted-foreground font-mono">
                              Net: {formatMoney(Number(tx.net_amount))}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedTx(tx);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setSelectedTx(tx);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Reddet
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşlemi Onaylıyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTx && (
                <>
                  <strong>{TX_TYPE_LABELS[selectedTx.type]?.label || selectedTx.type}</strong> işlemi
                  {" "}<strong>{formatMoney(Number(selectedTx.gross_amount))}</strong> tutarında onaylanacak.
                  Bu işlem geri alınamaz, bakiyeler otomatik güncellenir.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-muted-foreground">
              Not (isteğe bağlı)
            </label>
            <Input
              placeholder="Onay notu ekleyin..."
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setApproveNote(""); setSelectedTx(null); }}>
              Vazgeç
            </AlertDialogCancel>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Onaylanıyor...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Onayla</>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşlemi Reddetmek İstediğinize Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTx && (
                <>
                  <strong>{TX_TYPE_LABELS[selectedTx.type]?.label || selectedTx.type}</strong> işlemi
                  {" "}<strong>{formatMoney(Number(selectedTx.gross_amount))}</strong> tutarında reddedilecek.
                  Red nedenini aşağıya yazınız.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">
              Red Nedeni <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="İşlemin neden reddedildiğini açıklayın..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRejectReason(""); setSelectedTx(null); }}>
              Vazgeç
            </AlertDialogCancel>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reddediliyor...</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" /> Reddet</>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
