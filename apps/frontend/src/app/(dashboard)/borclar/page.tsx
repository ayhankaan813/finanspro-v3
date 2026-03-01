"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  HandCoins,
  TrendingDown,
  TrendingUp,
  Scale,
  Activity,
  Plus,
  List,
  Clock,
  Grid3X3,
  Loader2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { formatTurkeyDate } from "@/lib/utils";
import {
  useDebtSummary,
  useDebtFinancierSummary,
  useDebts,
  useDebt,
  useCreateDebt,
  usePayDebt,
  useCancelDebt,
  useFinanciers,
  useDebtMatrix,
  type Debt,
} from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";

// ---- Helper functions ----

function getStatusBadge(status: Debt["status"]) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
          Aktif
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          Ödenmis
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
          Iptal
        </Badge>
      );
  }
}

function calculateProgress(debt: Debt): number {
  const amount = parseFloat(debt.amount);
  const remaining = parseFloat(debt.remaining_amount);
  if (amount <= 0) return 0;
  const paid = amount - remaining;
  return Math.min(100, Math.max(0, (paid / amount) * 100));
}

function getProgressColor(percentage: number): string {
  if (percentage >= 67) return "bg-emerald-500";
  if (percentage >= 33) return "bg-amber-500";
  return "bg-rose-500";
}

// ---- Main Page Component ----

export default function BorclarPage() {
  // Summary data (same as 06-01)
  const { data: summary, isLoading: isLoadingSummary } = useDebtSummary();
  const { data: financierSummary, isLoading: isLoadingFinancier } = useDebtFinancierSummary();

  // Calculated totals
  const totalReceivable = financierSummary
    ? financierSummary.reduce((acc, f) => acc + f.total_receivable, 0)
    : 0;
  const totalOwed = financierSummary
    ? financierSummary.reduce((acc, f) => acc + f.total_owed, 0)
    : 0;
  const netPosition = totalReceivable - totalOwed;
  const isLoading = isLoadingSummary || isLoadingFinancier;

  // Filter / pagination state
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [financierFilter, setFinancierFilter] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Row expansion
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Dialog open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  // Create form state
  const [newDebt, setNewDebt] = useState({
    lender_id: "",
    borrower_id: "",
    amount: "",
    description: "",
  });
  const [createError, setCreateError] = useState("");

  // Payment form state
  const [paymentData, setPaymentData] = useState({ amount: "", description: "" });

  // Cancel form state
  const [cancelReason, setCancelReason] = useState("");

  // Data hooks
  const { data: debtsData, isLoading: isLoadingDebts } = useDebts({
    status: statusFilter,
    financier_id: financierFilter,
    page: currentPage,
    limit: 20,
  });
  const { data: historyData, isLoading: isLoadingHistory } = useDebts({
    page: historyPage,
    limit: 30,
  });
  const { data: expandedDebt, isLoading: isLoadingExpanded } = useDebt(expandedDebtId);
  const { data: financiersData } = useFinanciers({ limit: 100 });

  // Matrix data
  const { data: matrixData, isLoading: isLoadingMatrix } = useDebtMatrix();

  // Build matrix lookup: matrixMap[lender_id][borrower_id] = amount
  const matrixMap = new Map<string, Map<string, number>>();
  const matrixFinanciers = matrixData?.financiers ?? [];
  const matrixEntries = matrixData?.matrix ?? [];

  for (const entry of matrixEntries) {
    if (!matrixMap.has(entry.lender.id)) {
      matrixMap.set(entry.lender.id, new Map());
    }
    matrixMap.get(entry.lender.id)!.set(entry.borrower.id, entry.amount);
  }

  // Find max amount for heat map scaling
  const maxMatrixAmount =
    matrixEntries.length > 0 ? Math.max(...matrixEntries.map((e) => e.amount)) : 0;

  // Heat map color function
  const getHeatMapColor = (amount: number): string => {
    if (amount === 0 || maxMatrixAmount === 0) return "";
    const ratio = amount / maxMatrixAmount;
    if (ratio <= 0.2) return "bg-sky-50 text-sky-700";
    if (ratio <= 0.4) return "bg-sky-100 text-sky-800";
    if (ratio <= 0.6) return "bg-blue-100 text-blue-800";
    if (ratio <= 0.8) return "bg-blue-200 text-blue-900";
    return "bg-blue-300 text-blue-900";
  };

  // Calculate row totals (total alacak per lender)
  const rowTotals = new Map<string, number>();
  for (const f of matrixFinanciers) {
    let total = 0;
    const row = matrixMap.get(f.id);
    if (row) {
      for (const amount of row.values()) {
        total += amount;
      }
    }
    rowTotals.set(f.id, total);
  }

  // Calculate column totals (total borc per borrower)
  const colTotals = new Map<string, number>();
  for (const f of matrixFinanciers) {
    let total = 0;
    for (const [, row] of matrixMap) {
      total += row.get(f.id) || 0;
    }
    colTotals.set(f.id, total);
  }

  // Mutations
  const createDebtMutation = useCreateDebt();
  const payDebtMutation = usePayDebt();
  const cancelDebtMutation = useCancelDebt();

  // ---- Handlers ----

  function handleToggleRow(debtId: string) {
    setExpandedDebtId((prev) => (prev === debtId ? null : debtId));
  }

  function openPaymentDialog(debtId: string) {
    setSelectedDebtId(debtId);
    setPaymentData({ amount: "", description: "" });
    setIsPaymentOpen(true);
  }

  function openCancelDialog(debtId: string) {
    setSelectedDebtId(debtId);
    setCancelReason("");
    setIsCancelOpen(true);
  }

  function closeCreateDialog() {
    setIsCreateOpen(false);
    setNewDebt({ lender_id: "", borrower_id: "", amount: "", description: "" });
    setCreateError("");
  }

  function closePaymentDialog() {
    setIsPaymentOpen(false);
    setPaymentData({ amount: "", description: "" });
    setSelectedDebtId(null);
  }

  function closeCancelDialog() {
    setIsCancelOpen(false);
    setCancelReason("");
    setSelectedDebtId(null);
  }

  async function handleCreateDebt(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");

    if (!newDebt.lender_id || !newDebt.borrower_id) {
      setCreateError("Borc veren ve borc alan secilmelidir.");
      return;
    }
    if (newDebt.lender_id === newDebt.borrower_id) {
      setCreateError("Borc veren ve borc alan ayni kisi olamaz.");
      return;
    }
    const amount = parseFloat(newDebt.amount);
    if (!newDebt.amount || isNaN(amount) || amount <= 0) {
      setCreateError("Gecerli bir tutar girilmelidir.");
      return;
    }

    try {
      await createDebtMutation.mutateAsync({
        lender_id: newDebt.lender_id,
        borrower_id: newDebt.borrower_id,
        amount: newDebt.amount,
        description: newDebt.description || undefined,
      });
      toast({ title: "Basarili", description: "Borc basariyla olusturuldu.", variant: "success" });
      closeCreateDialog();
    } catch {
      toast({ title: "Hata", description: "Borc olusturulamadi.", variant: "destructive" });
    }
  }

  async function handlePayDebt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDebtId) return;

    const amount = parseFloat(paymentData.amount);
    if (!paymentData.amount || isNaN(amount) || amount <= 0) {
      toast({ title: "Hata", description: "Gecerli bir tutar girilmelidir.", variant: "destructive" });
      return;
    }

    try {
      await payDebtMutation.mutateAsync({
        debtId: selectedDebtId,
        amount: paymentData.amount,
        description: paymentData.description || undefined,
      });
      toast({ title: "Basarili", description: "Odeme basariyla kaydedildi.", variant: "success" });
      closePaymentDialog();
    } catch {
      toast({ title: "Hata", description: "Odeme kaydedilemedi.", variant: "destructive" });
    }
  }

  async function handleCancelDebt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDebtId) return;

    try {
      await cancelDebtMutation.mutateAsync({
        debtId: selectedDebtId,
        cancellation_reason: cancelReason || undefined,
      });
      toast({ title: "Basarili", description: "Borc iptal edildi.", variant: "success" });
      closeCancelDialog();
      if (expandedDebtId === selectedDebtId) {
        setExpandedDebtId(null);
      }
    } catch {
      toast({ title: "Hata", description: "Iptal islemi basarisiz.", variant: "destructive" });
    }
  }

  // Get selected debt for payment dialog info
  const selectedDebt = debtsData?.items.find((d) => d.id === selectedDebtId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <HandCoins className="h-6 w-6" />
              Borc/Alacak Yonetimi
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Finansorler arasi borc ve alacak takibi
            </p>
          </div>
          <Button
            className="bg-white text-slate-900 hover:bg-slate-100 font-semibold"
            size="default"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Borc
          </Button>
        </div>
      </div>

      {/* Summary Cards (PAGE-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Borc */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-100 p-3 shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Toplam Borc</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 font-mono truncate">
                    {formatMoney(summary?.total_active_debt ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Toplam Alacak */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-100 p-3 shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Toplam Alacak</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 font-mono truncate">
                    {formatMoney(totalReceivable)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Durum */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3 shrink-0">
                  <Scale className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Net Durum</p>
                  <p
                    className={`text-xl sm:text-2xl font-bold font-mono truncate ${
                      netPosition >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatMoney(netPosition)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktif Borc Sayisi */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-amber-100 p-3 shrink-0">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Aktif Borc</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono">
                    {summary?.active_debt_count ?? 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="open" className="flex items-center gap-1.5 min-h-[44px]">
            <List className="h-4 w-4" />
            <span>Acik Borclar</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 min-h-[44px]">
            <Clock className="h-4 w-4" />
            <span>Islem Gecmisi</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-1.5 min-h-[44px]">
            <Grid3X3 className="h-4 w-4" />
            <span>Finansor Matrix</span>
          </TabsTrigger>
        </TabsList>

        {/* ======== ACIK BORCLAR TAB ======== */}
        <TabsContent value="open" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select
                    value={financierFilter ?? "all"}
                    onValueChange={(val) => {
                      setFinancierFilter(val === "all" ? undefined : val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tum Finansorler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tum Finansorler</SelectItem>
                      {financiersData?.items.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select
                    value={statusFilter ?? "all"}
                    onValueChange={(val) => {
                      setStatusFilter(val === "all" ? undefined : val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tum Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tum Durumlar</SelectItem>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="PAID">Odenmis</SelectItem>
                      <SelectItem value="CANCELLED">Iptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Debt Table */}
              {isLoadingDebts ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !debtsData?.items.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <HandCoins className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-base font-medium">Borc kaydi bulunamadi</p>
                  <p className="text-sm mt-1">Filtreleri degistirmeyi ya da yeni borc eklemeyi deneyin.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Borc Veren</TableHead>
                          <TableHead className="whitespace-nowrap">Borc Alan</TableHead>
                          <TableHead className="whitespace-nowrap">Baslangic Tutari</TableHead>
                          <TableHead className="whitespace-nowrap">Kalan Bakiye</TableHead>
                          <TableHead className="whitespace-nowrap w-32">Ilerleme</TableHead>
                          <TableHead className="whitespace-nowrap">Tarih</TableHead>
                          <TableHead className="whitespace-nowrap">Durum</TableHead>
                          <TableHead className="whitespace-nowrap w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debtsData.items.map((debt) => {
                          const progress = calculateProgress(debt);
                          const progressColor = getProgressColor(progress);
                          const isExpanded = expandedDebtId === debt.id;

                          return (
                            <>
                              <TableRow
                                key={debt.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleToggleRow(debt.id)}
                              >
                                <TableCell className="whitespace-nowrap font-medium">
                                  {debt.lender.name}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {debt.borrower.name}
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-mono">
                                  {formatMoney(parseFloat(debt.amount))}
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-mono">
                                  {formatMoney(parseFloat(debt.remaining_amount))}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24">
                                      <div
                                        className={`h-full rounded-full ${progressColor}`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-8 text-right">
                                      {Math.round(progress)}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                  {formatTurkeyDate(debt.created_at)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {getStatusBadge(debt.status)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                              </TableRow>

                              {/* Expandable row content */}
                              {isExpanded && (
                                <TableRow key={`${debt.id}-expanded`} className="bg-muted/30">
                                  <TableCell colSpan={8} className="px-4 sm:px-6 py-4">
                                    <div className="space-y-4">
                                      {/* Payment history */}
                                      <div>
                                        <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                                          Odeme Gecmisi
                                        </p>
                                        {isLoadingExpanded ? (
                                          <Skeleton className="h-8 w-full" />
                                        ) : !expandedDebt?.payments?.length ? (
                                          <p className="text-sm text-muted-foreground italic">
                                            Henuz odeme yapilmadi.
                                          </p>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="whitespace-nowrap text-xs">Tarih</TableHead>
                                                  <TableHead className="whitespace-nowrap text-xs">Tutar</TableHead>
                                                  <TableHead className="whitespace-nowrap text-xs">Aciklama</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {expandedDebt.payments.map((p) => (
                                                  <TableRow key={p.id}>
                                                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                      {formatTurkeyDate(p.created_at)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap font-mono text-sm text-green-700">
                                                      +{formatMoney(parseFloat(p.amount))}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                      {p.description ?? "-"}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        )}
                                      </div>

                                      {/* Action buttons (only for ACTIVE) */}
                                      {debt.status === "ACTIVE" && (
                                        <div className="flex gap-2 pt-1">
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPaymentDialog(debt.id);
                                            }}
                                          >
                                            <CreditCard className="h-4 w-4 mr-1.5" />
                                            Odeme Yap
                                          </Button>
                                          {/* Cancel only if no payments */}
                                          {(!expandedDebt?.payments?.length || isLoadingExpanded) &&
                                            debt.status === "ACTIVE" && (
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openCancelDialog(debt.id);
                                                }}
                                              >
                                                <XCircle className="h-4 w-4 mr-1.5" />
                                                Iptal Et
                                              </Button>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {debtsData.pagination && debtsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        Sayfa {debtsData.pagination.page} / {debtsData.pagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={debtsData.pagination.page <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                          Onceki
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={debtsData.pagination.page >= debtsData.pagination.totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== ISLEM GECMISI TAB ======== */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {isLoadingHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !historyData?.items.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Clock className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-base font-medium">Henuz islem yok</p>
                  <p className="text-sm mt-1">Borc olusturuldugunda burada gorunecek.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Tarih</TableHead>
                          <TableHead className="whitespace-nowrap">Islem Tipi</TableHead>
                          <TableHead className="whitespace-nowrap">Borc Veren</TableHead>
                          <TableHead className="whitespace-nowrap">Borc Alan</TableHead>
                          <TableHead className="whitespace-nowrap">Tutar</TableHead>
                          <TableHead className="whitespace-nowrap">Kalan</TableHead>
                          <TableHead className="whitespace-nowrap">Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.items.map((debt) => (
                          <TableRow key={debt.id}>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatTurkeyDate(debt.created_at)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                Borc Verme
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium">
                              {debt.lender.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {debt.borrower.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono">
                              {formatMoney(parseFloat(debt.amount))}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-muted-foreground">
                              {formatMoney(parseFloat(debt.remaining_amount))}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getStatusBadge(debt.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {historyData.pagination && historyData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        Sayfa {historyData.pagination.page} / {historyData.pagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={historyData.pagination.page <= 1}
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        >
                          Onceki
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={historyData.pagination.page >= historyData.pagination.totalPages}
                          onClick={() => setHistoryPage((p) => p + 1)}
                        >
                          Sonraki
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== FINANSOR MATRIX TAB ======== */}
        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              {isLoadingMatrix ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : matrixFinanciers.length === 0 || matrixEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Matrix Verisi Yok</p>
                  <p className="text-sm">
                    Aktif borc kaydi bulunmadiginda matrix tablosu goruntulenememektedir.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Finansor Borc/Alacak Matrisi</h3>
                    <p className="text-sm text-muted-foreground">
                      Satirlar: Borc veren (alacakli) &middot; Sutunlar: Borc alan (borclu) &middot; Degerler: Kalan borc tutari
                    </p>
                  </div>
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-white z-10 whitespace-nowrap font-semibold min-w-[120px]">
                            Alacakli \ Borclu
                          </TableHead>
                          {matrixFinanciers.map((f) => (
                            <TableHead
                              key={f.id}
                              className="whitespace-nowrap text-center min-w-[100px] font-semibold"
                            >
                              {f.name}
                            </TableHead>
                          ))}
                          <TableHead className="whitespace-nowrap text-center min-w-[120px] font-bold bg-slate-50">
                            Toplam Alacak
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matrixFinanciers.map((lender) => (
                          <TableRow key={lender.id}>
                            <TableCell className="sticky left-0 bg-white z-10 whitespace-nowrap font-medium">
                              {lender.name}
                            </TableCell>
                            {matrixFinanciers.map((borrower) => {
                              const isDiagonal = lender.id === borrower.id;
                              const amount =
                                matrixMap.get(lender.id)?.get(borrower.id) || 0;

                              if (isDiagonal) {
                                return (
                                  <TableCell
                                    key={borrower.id}
                                    className="text-center bg-slate-100"
                                  >
                                    <span className="text-slate-400">&mdash;</span>
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell
                                  key={borrower.id}
                                  className={`text-center font-mono whitespace-nowrap ${getHeatMapColor(amount)}`}
                                >
                                  {amount > 0 ? formatMoney(amount) : ""}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-mono font-bold whitespace-nowrap bg-slate-50">
                              {(rowTotals.get(lender.id) || 0) > 0
                                ? formatMoney(rowTotals.get(lender.id) || 0)
                                : ""}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="bg-slate-50 font-bold">
                          <TableCell className="sticky left-0 bg-slate-50 z-10 whitespace-nowrap font-bold">
                            Toplam Borc
                          </TableCell>
                          {matrixFinanciers.map((borrower) => (
                            <TableCell
                              key={borrower.id}
                              className="text-center font-mono whitespace-nowrap"
                            >
                              {(colTotals.get(borrower.id) || 0) > 0
                                ? formatMoney(colTotals.get(borrower.id) || 0)
                                : ""}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-mono whitespace-nowrap bg-slate-100">
                            {matrixEntries.reduce((sum, e) => sum + e.amount, 0) > 0
                              ? formatMoney(
                                  matrixEntries.reduce((sum, e) => sum + e.amount, 0)
                                )
                              : ""}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded bg-slate-100 border"></span>
                      Kendisi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded bg-sky-50 border"></span>
                      Dusuk
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded bg-blue-100 border"></span>
                      Orta
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 rounded bg-blue-300 border"></span>
                      Yuksek
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======== CREATE DEBT DIALOG ======== */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeCreateDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Borc Olustur</DialogTitle>
            <DialogDescription>
              Iki finansor arasinda borc iliskisi tanimlayin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDebt}>
            <div className="space-y-4">
              {/* Lender */}
              <div>
                <Label htmlFor="lender">Borc Veren</Label>
                <Select
                  value={newDebt.lender_id}
                  onValueChange={(val) => setNewDebt((prev) => ({ ...prev, lender_id: val }))}
                >
                  <SelectTrigger id="lender" className="mt-1">
                    <SelectValue placeholder="Finansor secin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {financiersData?.items.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Borrower */}
              <div>
                <Label htmlFor="borrower">Borc Alan</Label>
                <Select
                  value={newDebt.borrower_id}
                  onValueChange={(val) => setNewDebt((prev) => ({ ...prev, borrower_id: val }))}
                >
                  <SelectTrigger id="borrower" className="mt-1">
                    <SelectValue placeholder="Finansor secin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {financiersData?.items.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="create-amount">Tutar</Label>
                <Input
                  id="create-amount"
                  type="text"
                  placeholder="0.00"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt((prev) => ({ ...prev, amount: e.target.value }))}
                  className="mt-1 font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="create-desc">Aciklama (opsiyonel)</Label>
                <Textarea
                  id="create-desc"
                  placeholder="Borc aciklamasi..."
                  value={newDebt.description}
                  onChange={(e) => setNewDebt((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>

              {/* Inline validation error */}
              {createError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeCreateDialog}>
                Vazgec
              </Button>
              <Button type="submit" disabled={createDebtMutation.isPending}>
                {createDebtMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Olustur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======== PAYMENT DIALOG ======== */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => { if (!open) closePaymentDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Odeme Yap
            </DialogTitle>
            <DialogDescription>
              {selectedDebt && (
                <span>
                  {selectedDebt.lender.name} &rarr; {selectedDebt.borrower.name} &bull; Kalan:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {formatMoney(parseFloat(selectedDebt.remaining_amount))}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayDebt}>
            <div className="space-y-4">
              {/* Amount */}
              <div>
                <Label htmlFor="pay-amount">Odeme Tutari</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="pay-amount"
                    type="text"
                    placeholder="0.00"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="font-mono"
                  />
                  {selectedDebt && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        setPaymentData((prev) => ({
                          ...prev,
                          amount: selectedDebt.remaining_amount,
                        }))
                      }
                    >
                      Tamami Ode
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="pay-desc">Aciklama (opsiyonel)</Label>
                <Textarea
                  id="pay-desc"
                  placeholder="Odeme aciklamasi..."
                  value={paymentData.description}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closePaymentDialog}>
                Vazgec
              </Button>
              <Button type="submit" disabled={payDebtMutation.isPending}>
                {payDebtMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Odemeyi Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======== CANCEL DIALOG ======== */}
      <Dialog open={isCancelOpen} onOpenChange={(open) => { if (!open) closeCancelDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Borc Iptal
            </DialogTitle>
            <DialogDescription>
              Bu borcu iptal etmek istediginize emin misiniz? Bu islem geri alinamaz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCancelDebt}>
            <div className="space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Iptal islemi yalnizca odeme yapilmamis aktif borclar icin gecerlidir.
                </span>
              </div>

              {/* Cancel reason */}
              <div>
                <Label htmlFor="cancel-reason">Iptal Sebebi (opsiyonel)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Iptal sebebini aciklayin..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeCancelDialog}>
                Vazgec
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelDebtMutation.isPending}>
                {cancelDebtMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Iptal Et
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
