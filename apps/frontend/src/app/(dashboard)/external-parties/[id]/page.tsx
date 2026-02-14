"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
import {
  useExternalParty,
  useExternalPartyStatistics,
  useExternalPartyMonthlyStatistics,
  useExternalPartyTransactions,
  useFinanciers,
  useCreateExternalDebt,
  useCreateExternalPayment,
} from "@/hooks/use-api";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Phone,
  Mail,
  Clock,
  Globe,
  X,
  Plus,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// ==================== QUICK ACTION MODAL ====================
function QuickActionModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconColor,
  gradientFrom,
  gradientTo,
  externalPartyId,
  externalPartyName,
  actionType,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: any;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  externalPartyId: string;
  externalPartyName: string;
  actionType: "debt_in" | "debt_out" | "payment";
}) {
  const queryClient = useQueryClient();
  const createDebt = useCreateExternalDebt();
  const createPayment = useCreateExternalPayment();
  const { data: financiersData } = useFinanciers({ limit: 100 });

  const [amount, setAmount] = useState("");
  const [financierId, setFinancierId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !financierId) return;

    try {
      if (actionType === "payment") {
        await createPayment.mutateAsync({
          external_party_id: externalPartyId,
          financier_id: financierId,
          amount: amount,
          description: description || undefined,
        });
      } else {
        await createDebt.mutateAsync({
          external_party_id: externalPartyId,
          financier_id: financierId,
          amount: amount,
          direction: actionType === "debt_in" ? "in" : "out",
          description: description || undefined,
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["external-party", externalPartyId] });
      queryClient.invalidateQueries({ queryKey: ["external-party-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["external-party-monthly-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["external-party-transactions"] });

      onClose();
      setAmount("");
      setFinancierId("");
      setDescription("");
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  const isPending = createDebt.isPending || createPayment.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-twilight-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-twilight-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} px-6 py-5 flex justify-between items-center text-white`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl tracking-tight">{title}</h2>
                <p className="text-sm opacity-80 font-medium">{externalPartyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Tutar *</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 h-12 rounded-xl border-twilight-200 text-lg font-bold"
                    required
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-twilight-400 font-medium">TL</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Finansor *</Label>
                <select
                  value={financierId}
                  onChange={(e) => setFinancierId(e.target.value)}
                  className="w-full h-12 rounded-xl border border-twilight-200 px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Finansor secin...</option>
                  {financiersData?.items?.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Aciklama</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Istege bagli not..."
                  className="h-11 rounded-xl border-twilight-200"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 bg-twilight-50/50 border-t border-twilight-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border-twilight-200"
                disabled={isPending}
              >
                Iptal
              </Button>
              <Button
                type="submit"
                className={`flex-1 h-11 rounded-xl text-white shadow-lg ${iconColor}`}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Isleniyor...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Onayla
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function ExternalPartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const externalPartyId = params.id as string;

  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear] = useState<number>(new Date().getFullYear());
  const [showDebtOutModal, setShowDebtOutModal] = useState(false);
  const [showDebtInModal, setShowDebtInModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: party, isLoading: isLoadingParty } = useExternalParty(externalPartyId);
  const { data: statistics, isLoading: isLoadingStats } = useExternalPartyStatistics(externalPartyId, selectedYear);
  const { data: monthlyStats, isLoading: isLoadingMonthlyStats } = useExternalPartyMonthlyStatistics(
    externalPartyId,
    selectedYear,
    selectedMonth
  );
  const { data: recentTxData } = useExternalPartyTransactions(externalPartyId, { page: 1, limit: 10 });

  if (isLoadingParty || isLoadingStats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-twilight-400 font-medium">Kisi detaylari yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-twilight-900 mb-2">Kisi Bulunamadi</h2>
          <p className="text-twilight-500 mb-6">Bu kisi mevcut degil veya silinmis olabilir.</p>
          <Button onClick={() => router.push("/external-parties")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dis Kisilere Don
          </Button>
        </div>
      </div>
    );
  }

  const balance = parseFloat(party.account?.balance || "0");

  // Determine debt direction
  const debtDirection = balance > 0 ? "we_owe" : balance < 0 ? "they_owe" : "none";

  // Monthly data from API
  const monthlyData = statistics?.monthlyData?.map((data: any) => ({
    month: data.month,
    monthName: MONTHS[data.month - 1],
    debtIn: parseFloat(data.debtIn || "0"),
    debtOut: parseFloat(data.debtOut || "0"),
    payment: parseFloat(data.payment || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTHS[i],
    debtIn: 0,
    debtOut: 0,
    payment: 0,
    balance: 0,
  }));

  // Daily data from API
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dailyData = monthlyStats?.dailyData?.map((data: any) => ({
    day: data.day,
    date: `${data.day} ${MONTHS[selectedMonth - 1]}`,
    debtIn: parseFloat(data.debtIn || "0"),
    debtOut: parseFloat(data.debtOut || "0"),
    payment: parseFloat(data.payment || "0"),
    balance: parseFloat(data.balance || "0"),
  })) || Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    date: `${i + 1} ${MONTHS[selectedMonth - 1]}`,
    debtIn: 0,
    debtOut: 0,
    payment: 0,
    balance: 0,
  }));

  // Stats for daily view summary
  const totalDebtOut = dailyData.reduce((sum: number, d: any) => sum + d.debtOut, 0);
  const totalDebtIn = dailyData.reduce((sum: number, d: any) => sum + d.debtIn, 0);
  const totalPayment = dailyData.reduce((sum: number, d: any) => sum + d.payment, 0);
  const netChange = totalDebtIn - totalDebtOut - totalPayment;

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setViewMode("daily");
  };

  const handlePrevMonth = () => {
    if (selectedMonth > 1) setSelectedMonth(selectedMonth - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) setSelectedMonth(selectedMonth + 1);
  };

  // Transaction type labels and colors
  const getTxTypeInfo = (type: string) => {
    switch (type) {
      case "EXTERNAL_DEBT_OUT":
        return { label: "Borc Verildi", color: "text-rose-600", bgColor: "bg-rose-50", icon: ArrowUpRight };
      case "EXTERNAL_DEBT_IN":
        return { label: "Borc Alindi", color: "text-violet-600", bgColor: "bg-violet-50", icon: ArrowDownLeft };
      case "EXTERNAL_PAYMENT":
        return { label: "Odeme", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: HandCoins };
      default:
        return { label: type, color: "text-twilight-600", bgColor: "bg-twilight-50", icon: Wallet };
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative z-10 p-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/external-parties")}
            className="mb-4 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dis Kisilere Don
          </Button>

          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <span className="text-3xl font-bold text-indigo-50">
                  {party.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{party.name}</h1>
                <div className="flex items-center gap-4 text-indigo-100/80">
                  {party.phone && (
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Phone className="h-4 w-4" /> {party.phone}
                    </span>
                  )}
                  {party.email && (
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Mail className="h-4 w-4" /> {party.email}
                    </span>
                  )}
                </div>
                {party.description && (
                  <p className="text-indigo-100/60 text-sm mt-2 max-w-2xl">{party.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Balance + Debt Direction */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/20">
              <p className="text-indigo-100/70 text-sm font-bold uppercase tracking-wider mb-2">Toplam Bakiye</p>
              <p className={`text-3xl font-bold ${balance === 0 ? "text-white" : balance > 0 ? "text-orange-300" : "text-emerald-300"}`}>
                {formatMoney(Math.abs(balance))}
              </p>
            </div>
            <div className={`rounded-2xl backdrop-blur-sm p-5 border ${debtDirection === "they_owe" ? "bg-emerald-500/20 border-emerald-400/30" : "bg-white/5 border-white/10"}`}>
              <p className="text-emerald-100/70 text-sm font-bold uppercase tracking-wider mb-2">Bize Borclu</p>
              <p className="text-3xl font-bold text-white">
                {debtDirection === "they_owe" ? formatMoney(Math.abs(balance)) : formatMoney(0)}
              </p>
              {debtDirection === "they_owe" && (
                <p className="text-emerald-200/60 text-xs mt-1 font-medium">Bu kisi bize borclu</p>
              )}
            </div>
            <div className={`rounded-2xl backdrop-blur-sm p-5 border ${debtDirection === "we_owe" ? "bg-orange-500/20 border-orange-400/30" : "bg-white/5 border-white/10"}`}>
              <p className="text-orange-100/70 text-sm font-bold uppercase tracking-wider mb-2">Bizim Borcumuz</p>
              <p className="text-3xl font-bold text-white">
                {debtDirection === "we_owe" ? formatMoney(Math.abs(balance)) : formatMoney(0)}
              </p>
              {debtDirection === "we_owe" && (
                <p className="text-orange-200/60 text-xs mt-1 font-medium">Biz bu kisiye borcluyuz</p>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowDebtOutModal(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-6 py-5 shadow-lg shadow-rose-900/30 text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              <ArrowUpRight className="mr-2 h-5 w-5" />
              Borc Ver
            </Button>
            <Button
              onClick={() => setShowDebtInModal(true)}
              className="bg-violet-500 hover:bg-violet-600 text-white rounded-xl px-6 py-5 shadow-lg shadow-violet-900/30 text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              <ArrowDownLeft className="mr-2 h-5 w-5" />
              Borc Al
            </Button>
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 py-5 shadow-lg shadow-emerald-900/30 text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              <HandCoins className="mr-2 h-5 w-5" />
              Odeme Yap
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle & Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 shadow-sm border border-twilight-100">
          <Button
            variant={viewMode === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("monthly")}
            className={`rounded-lg ${viewMode === "monthly" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-twilight-600"}`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Aylik Gorunum
          </Button>
          <Button
            variant={viewMode === "daily" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("daily")}
            className={`rounded-lg ${viewMode === "daily" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-twilight-600"}`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Gunluk Gorunum
          </Button>
        </div>

        {viewMode === "daily" && (
          <div className="flex items-center gap-3 bg-white rounded-xl p-2 shadow-sm border border-twilight-100">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth} disabled={selectedMonth === 1} className="h-8 w-8 p-0 rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-twilight-900 min-w-[100px] text-center">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextMonth} disabled={selectedMonth === 12} className="h-8 w-8 p-0 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards - Only in Daily View */}
      {viewMode === "daily" && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-rose-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Borc Verilen</p>
              </div>
              <p className="text-2xl font-bold text-rose-900">{formatMoney(totalDebtOut)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-violet-500 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Borc Alinan</p>
              </div>
              <p className="text-2xl font-bold text-violet-900">{formatMoney(totalDebtIn)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <HandCoins className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Odeme</p>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{formatMoney(totalPayment)}</p>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg ${netChange >= 0 ? "bg-gradient-to-br from-violet-50 to-violet-100/50" : "bg-gradient-to-br from-rose-50 to-rose-100/50"}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${netChange >= 0 ? "bg-violet-500" : "bg-rose-500"} flex items-center justify-center`}>
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <p className={`text-xs font-bold ${netChange >= 0 ? "text-violet-700" : "text-rose-700"} uppercase tracking-wider`}>Net Degisim</p>
              </div>
              <p className={`text-2xl font-bold ${netChange >= 0 ? "text-violet-900" : "text-rose-900"}`}>{formatMoney(netChange)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-twilight-50 to-twilight-100/50 border-b-2 border-twilight-200">
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Tarih</span>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ArrowUpRight className="h-4 w-4 text-rose-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Borc Verilen</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-violet-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Borc Alinan</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <HandCoins className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Odeme</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Wallet className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-twilight-600 uppercase tracking-wider">Bakiye</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-twilight-100">
              {viewMode === "monthly" ? (
                monthlyData.map((row: any, idx: number) => (
                  <motion.tr
                    key={row.month}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleMonthClick(row.month)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-twilight-900 group-hover:text-indigo-700 transition-colors">
                        {row.monthName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-600">{formatMoney(row.debtOut)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-violet-600">{formatMoney(row.debtIn)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">{formatMoney(row.payment)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${row.balance >= 0 ? "text-orange-600" : "text-emerald-600"}`}>
                        {row.balance > 0 ? "-" : row.balance < 0 ? "+" : ""}{formatMoney(Math.abs(row.balance))}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : isLoadingMonthlyStats ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                      <span className="text-twilight-500 font-medium">Gunluk veriler yukleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                dailyData.map((row: any, idx: number) => (
                  <motion.tr
                    key={row.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="hover:bg-indigo-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-twilight-900">{row.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-rose-600">{formatMoney(row.debtOut)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-violet-600">{formatMoney(row.debtIn)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">{formatMoney(row.payment)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${row.balance >= 0 ? "text-orange-600" : "text-emerald-600"}`}>
                        {row.balance > 0 ? "-" : row.balance < 0 ? "+" : ""}{formatMoney(Math.abs(row.balance))}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Transactions */}
      {recentTxData?.items && recentTxData.items.length > 0 && (
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-twilight-900">Son Islemler</h3>
                  <p className="text-sm text-twilight-500">Son {recentTxData.items.length} islem</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {recentTxData.items.map((tx: any) => {
                const txInfo = getTxTypeInfo(tx.type);
                const TxIcon = txInfo.icon;
                const txDate = new Date(tx.transaction_date);

                return (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${txInfo.bgColor} border border-twilight-100/50 hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl ${txInfo.bgColor} flex items-center justify-center`}>
                        <TxIcon className={`h-5 w-5 ${txInfo.color}`} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${txInfo.color}`}>{txInfo.label}</p>
                        <p className="text-xs text-twilight-400 mt-0.5">
                          {txDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-twilight-500 mt-1">{tx.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${txInfo.color}`}>
                      {formatMoney(parseFloat(tx.gross_amount || tx.amount || "0"))}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info Card */}
      <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-twilight-900 mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            Iletisim & Bilgi
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {party.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-twilight-900">Telefon:</span>
                  <span className="text-twilight-600 ml-1">{party.phone}</span>
                </div>
              </div>
            )}
            {party.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-twilight-900">E-posta:</span>
                  <span className="text-twilight-600 ml-1">{party.email}</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Kayit:</span>
                <span className="text-twilight-600 ml-1">
                  {new Date(party.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-twilight-900 mb-4 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-indigo-600"></span>
            Aciklama
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <ArrowUpRight className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Borc Verilen:</span>
                <span className="text-twilight-600 ml-1">Bu kisiye verdigimiz borc (onlar bize borclanir)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowDownLeft className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Borc Alinan:</span>
                <span className="text-twilight-600 ml-1">Bu kisiden aldigimiz borc (biz onlara borclaniz)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HandCoins className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-twilight-900">Odeme:</span>
                <span className="text-twilight-600 ml-1">Borcumuzu odedigimiz tutar</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Modals */}
      <AnimatePresence>
        {showDebtOutModal && (
          <QuickActionModal
            isOpen={showDebtOutModal}
            onClose={() => setShowDebtOutModal(false)}
            title="Borc Ver"
            icon={ArrowUpRight}
            iconColor="bg-rose-500 hover:bg-rose-600"
            gradientFrom="from-rose-500"
            gradientTo="to-rose-700"
            externalPartyId={externalPartyId}
            externalPartyName={party.name}
            actionType="debt_out"
          />
        )}
        {showDebtInModal && (
          <QuickActionModal
            isOpen={showDebtInModal}
            onClose={() => setShowDebtInModal(false)}
            title="Borc Al"
            icon={ArrowDownLeft}
            iconColor="bg-violet-500 hover:bg-violet-600"
            gradientFrom="from-violet-500"
            gradientTo="to-violet-700"
            externalPartyId={externalPartyId}
            externalPartyName={party.name}
            actionType="debt_in"
          />
        )}
        {showPaymentModal && (
          <QuickActionModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            title="Odeme Yap"
            icon={HandCoins}
            iconColor="bg-emerald-500 hover:bg-emerald-600"
            gradientFrom="from-emerald-500"
            gradientTo="to-emerald-700"
            externalPartyId={externalPartyId}
            externalPartyName={party.name}
            actionType="payment"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
