"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/utils";
import {
  useFinanciers,
  useFinancierCommissionRates,
  useCreateFinancierCommissionRate,
  useUpdateFinancierCommissionRate,
  useCreateFinancier,
  useUpdateFinancier,
  useDeleteFinancier,
  Financier,
  CommissionRate,
} from "@/hooks/use-api";
import {
  Wallet,
  Plus,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Percent,
  Settings,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Save,
  Trash2,
  MoreVertical,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRANSACTION_TYPES = [
  { value: "DEPOSIT", label: "Yatırım", icon: ArrowDownToLine, color: "text-emerald-600", bgColor: "bg-emerald-100", borderColor: "border-emerald-200" },
  { value: "WITHDRAWAL", label: "Çekim", icon: ArrowUpFromLine, color: "text-rose-600", bgColor: "bg-rose-100", borderColor: "border-rose-200" },
];

function CreateFinancierModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; description?: string }) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Finansör adı zorunludur";
    } else if (formData.name.length < 2) {
      newErrors.name = "Finansör adı en az 2 karakter olmalı";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Finansör kodu zorunludur";
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = "Sadece büyük harf, rakam ve tire kullanılabilir";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

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
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all border border-twilight-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Premium Gradient */}
          <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 px-6 py-5 flex justify-between items-center text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

            <div className="relative flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                <Wallet className="h-6 w-6 text-amber-50" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">Yeni Finansör Ekle</h2>
                <p className="text-sm text-amber-100/80 font-medium">Kasa veya banka hesabı tanımlayın</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg shadow-black/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Finansör Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    // Auto-generate code
                    if (!formData.code || formData.code.startsWith("FIN-")) {
                      const autoCode = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 8);
                      if (autoCode) {
                        setFormData(prev => ({ ...prev, name: e.target.value, code: `FIN-${autoCode}` }));
                      }
                    }
                  }}
                  placeholder="Örn: Kuveyt Türk Hesap"
                  className={`h-12 rounded-xl ${errors.name ? "border-red-300" : ""}`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Finansör Kodu</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="FIN-001"
                  className={`h-12 rounded-xl font-mono ${errors.code ? "border-red-300" : ""}`}
                />
                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Açıklama (Opsiyonel)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Finansör hakkında ek bilgiler..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 bg-twilight-50/50 border-t border-twilight-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl"
                disabled={isPending}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Finansör Oluştur
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

function CommissionModal({
  financier,
  onClose,
}: {
  financier: Financier;
  onClose: () => void;
}) {
  const { data: rates, isLoading } = useFinancierCommissionRates(financier.id);
  const createRate = useCreateFinancierCommissionRate();
  const updateRate = useUpdateFinancierCommissionRate();

  const [newRates, setNewRates] = useState<Record<string, string>>({
    DEPOSIT: "",
    WITHDRAWAL: "",
  });
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  // Get current rates by transaction type
  const currentRates: Record<string, CommissionRate | undefined> = {};
  rates?.forEach((rate) => {
    if (!currentRates[rate.transaction_type] || rate.is_active) {
      currentRates[rate.transaction_type] = rate;
    }
  });

  const handleCreateRate = async (transactionType: string) => {
    const rateValue = newRates[transactionType];
    if (!rateValue) return;

    const decimalRate = (parseFloat(rateValue) / 100).toFixed(5);

    try {
      await createRate.mutateAsync({
        financierId: financier.id,
        transaction_type: transactionType,
        rate: decimalRate,
      });
      setNewRates({ ...newRates, [transactionType]: "" });
    } catch (err) {
      console.error("Failed to create rate:", err);
    }
  };

  const handleUpdateRate = async (rateId: string, transactionType: string) => {
    const rateValue = editingRates[rateId];
    if (!rateValue) return;

    const decimalRate = (parseFloat(rateValue) / 100).toFixed(5);

    try {
      await updateRate.mutateAsync({
        financierId: financier.id,
        rateId,
        rate: decimalRate,
      });
      setEditingRates((prev) => {
        const newState = { ...prev };
        delete newState[rateId];
        return newState;
      });
    } catch (err) {
      console.error("Failed to update rate:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-twilight-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all border border-twilight-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header - Premium Gradient */}
          <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 px-6 py-5 flex justify-between items-center text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

            <div className="relative flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                <Percent className="h-6 w-6 text-amber-50" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">{financier.name}</h2>
                <p className="text-sm text-amber-100/80 font-medium">Finansör Komisyonları</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg shadow-black/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
              </div>
            ) : (
              <>
                {TRANSACTION_TYPES.map((type) => {
                  const existingRate = currentRates[type.value];
                  const Icon = type.icon;
                  const isEditing = existingRate && editingRates[existingRate.id] !== undefined;

                  return (
                    <div
                      key={type.value}
                      className={`rounded-xl border ${type.borderColor} bg-white p-5 hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${type.bgColor}`}>
                          <Icon className={`h-6 w-6 ${type.color}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-twilight-900 text-lg">{type.label} Komisyonu</h4>
                          <p className="text-xs text-twilight-500 font-medium">
                            {type.value === "DEPOSIT"
                              ? "Yatırım işlemlerinden düşülecek"
                              : "Çekim işlemlerinden alınacak"}
                          </p>
                        </div>
                      </div>

                      {existingRate ? (
                        <div className="flex items-center gap-3 bg-twilight-50/50 p-3 rounded-xl border border-twilight-100">
                          {isEditing ? (
                            <>
                              <div className="flex-1 relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={editingRates[existingRate.id] || ""}
                                  onChange={(e) =>
                                    setEditingRates({
                                      ...editingRates,
                                      [existingRate.id]: e.target.value,
                                    })
                                  }
                                  className="pr-8 h-10 font-bold text-lg"
                                  placeholder="0.00"
                                  autoFocus
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateRate(existingRate.id, type.value)}
                                disabled={updateRate.isPending}
                                className="h-10 w-10 p-0 bg-emerald-500 hover:bg-emerald-600 rounded-lg"
                              >
                                {updateRate.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                                ) : (
                                  <Save className="h-4 w-4 text-white" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingRates((prev) => {
                                    const newState = { ...prev };
                                    delete newState[existingRate.id];
                                    return newState;
                                  });
                                }}
                                className="h-10 w-10 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className={`text-3xl font-bold ${type.color} tracking-tight`}>
                                  %{(parseFloat(existingRate.rate) * 100).toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Aktif</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setEditingRates({
                                    ...editingRates,
                                    [existingRate.id]: (parseFloat(existingRate.rate) * 100).toFixed(2),
                                  })
                                }
                                className="h-10 px-4 rounded-xl border-twilight-200 hover:bg-twilight-50 text-twilight-600"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Düzenle
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-twilight-50/30 p-3 rounded-xl border border-dashed border-twilight-200">
                          <div className="flex-1 relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={newRates[type.value]}
                              onChange={(e) =>
                                setNewRates({ ...newRates, [type.value]: e.target.value })
                              }
                              className="pr-8 h-10 border-transparent bg-transparent focus:bg-white transition-all font-medium"
                              placeholder="Oran girin (örn: 2.0)"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCreateRate(type.value)}
                            disabled={!newRates[type.value] || createRate.isPending}
                            className={`h-10 px-4 rounded-xl text-white font-medium shadow-sm ${type.value === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                          >
                            {createRate.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Ekle
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Info Box */}
                <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                      <Coins className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Finansör Komisyonu Hakkında</h4>
                      <p className="mt-1 text-sm text-amber-800/80 leading-relaxed">
                        Finansör komisyonu, fiziki paradan doğrudan düşülür ve net bakiye kasaya yansır.
                        Tüm hesaplamalar otomatiktir.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function FinanciersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commissionFinancier, setCommissionFinancier] = useState<Financier | null>(null);
  const [editingFinancier, setEditingFinancier] = useState<Financier | null>(null);
  const [deletingFinancier, setDeletingFinancier] = useState<Financier | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading, error } = useFinanciers({ page, limit: 20, search });
  const createFinancier = useCreateFinancier();
  const updateFinancier = useUpdateFinancier();
  const deleteFinancier = useDeleteFinancier();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleCreateFinancier = async (financierData: {
    name: string;
    code: string;
    description?: string;
  }) => {
    try {
      await createFinancier.mutateAsync(financierData);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create financier:", err);
    }
  };

  const handleUpdateFinancier = async (financierData: {
    name: string;
    description?: string;
    is_active: boolean;
  }) => {
    if (!editingFinancier) return;
    try {
      await updateFinancier.mutateAsync({
        id: editingFinancier.id,
        ...financierData,
      });
      setEditingFinancier(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to update financier:", err);
    }
  };

  const handleDeleteFinancier = async () => {
    if (!deletingFinancier) return;
    try {
      await deleteFinancier.mutateAsync(deletingFinancier.id);
      setDeletingFinancier(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete financier:", err);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Glass Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white shadow-2xl shadow-twilight-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 font-bold text-amber-300">
                <Wallet className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Finansörler</h1>
            </div>
            <p className="text-twilight-200/80 text-lg max-w-xl font-light">
              Kasa ve banka hesaplarını yönetin, blokeleri ve komisyon oranlarını takip edin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-twilight-400 group-focus-within:text-amber-400 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-amber-100 placeholder-twilight-400 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 sm:text-sm transition-all"
                placeholder="Finansör ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-6 py-6 shadow-lg shadow-amber-900/20 text-base font-medium transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" />
              Yeni Finansör
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <h3 className="text-lg font-bold text-red-800 mb-2">Veri Yüklenemedi</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => window.location.reload()}>
            Yeniden Dene
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="text-twilight-400 font-medium animate-pulse">Finansörler yükleniyor...</p>
          </div>
        </div>
      ) : (
        <>
          {data?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-twilight-200">
              <div className="h-20 w-20 bg-twilight-50 rounded-full flex items-center justify-center mb-6">
                <Wallet className="h-10 w-10 text-twilight-300" />
              </div>
              <h3 className="text-xl font-bold text-twilight-900 mb-2">Henüz Finansör Yok</h3>
              <p className="text-twilight-500 max-w-md text-center mb-8">
                Sisteme henüz hiç finansör eklenmemiş. İlk finansörünüzü ekleyerek başlayın.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Finansör Oluştur
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {data?.items.map((financier) => {
                const balance = parseFloat(financier.account?.balance || "0");
                const blocked = parseFloat(financier.account?.blocked_amount || "0");
                const available = parseFloat(financier.available_balance || "0");
                const hasBlocks = financier.active_blocks_count > 0;

                return (
                  <motion.div
                    key={financier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="group h-full border-0 shadow-lg shadow-twilight-100/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100 hover:ring-amber-500/50">
                      <CardHeader className="p-0">
                        {/* Card Banner */}
                        <div className={`h-24 relative overflow-hidden ${hasBlocks
                            ? "bg-gradient-to-r from-amber-50 to-orange-50"
                            : "bg-gradient-to-r from-amber-50 to-yellow-50"
                          }`}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

                          <div className="absolute top-4 right-4 flex gap-2">
                            {financier.is_active ? (
                              <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-600 shadow-sm border border-green-100 flex items-center gap-1.5">
                                <CheckCircle className="h-3 w-3" />
                                AKTİF
                              </div>
                            ) : (
                              <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-red-500 shadow-sm border border-red-100 flex items-center gap-1.5">
                                <XCircle className="h-3 w-3" />
                                PASİF
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="px-6 flex gap-4 -mt-10">
                          <div className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                            <div className={`h-full w-full rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-inner ${hasBlocks
                                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                : "bg-gradient-to-br from-amber-400 to-yellow-500"
                              }`}>
                              {hasBlocks ? <Lock className="h-8 w-8" /> : <Wallet className="h-8 w-8" />}
                            </div>
                          </div>
                          <div className="pt-11 flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-twilight-900 truncate group-hover:text-amber-700 transition-colors">
                              {financier.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-mono text-twilight-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-twilight-300" />
                              {financier.code}
                            </div>
                          </div>
                          <div className="relative mt-11">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-twilight-400 hover:text-twilight-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === financier.id ? null : financier.id);
                              }}
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                            {openMenuId === financier.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-twilight-100 py-2 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFinancier(financier);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-twilight-700 hover:bg-twilight-50 flex items-center gap-2"
                                >
                                  <Settings className="h-4 w-4" />
                                  Düzenle
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingFinancier(financier);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Sil
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 space-y-5">
                        {/* Balance Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl bg-twilight-50/50 border border-twilight-100/50">
                            <p className="text-xs font-bold text-twilight-400 uppercase tracking-widest mb-1.5">Toplam</p>
                            <p className="text-lg font-bold text-twilight-900 font-amount">{formatMoney(balance)}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/30">
                            <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-1.5">Müsait</p>
                            <p className={`text-lg font-bold font-amount ${available > 0 ? "text-emerald-600" : "text-twilight-400"}`}>
                              {formatMoney(available)}
                            </p>
                          </div>
                        </div>

                        {/* Blocked Warning */}
                        <AnimatePresence>
                          {hasBlocks && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="rounded-xl bg-orange-50 p-3 border border-orange-100 flex items-start gap-3"
                            >
                              <div className="p-1.5 bg-orange-100 rounded-lg shrink-0 mt-0.5">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-bold text-orange-800 text-sm">{financier.active_blocks_count} Aktif Bloke</p>
                                <p className="text-orange-600 text-xs mt-0.5">{formatMoney(blocked)} blokeli tutar</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {financier.description && (
                          <p className="text-xs text-twilight-400 line-clamp-2 px-1">
                            {financier.description}
                          </p>
                        )}

                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-10 rounded-xl border-twilight-200 text-twilight-600 hover:border-amber-200 hover:text-amber-700 hover:bg-amber-50/50 font-semibold text-xs"
                            onClick={() => setCommissionFinancier(financier)}
                          >
                            <Percent className="mr-2 h-3.5 w-3.5" />
                            Komisyon
                          </Button>
                          <Button className="flex-1 h-10 rounded-xl bg-twilight-900 text-white hover:bg-twilight-800 shadow-lg shadow-twilight-900/10 font-semibold text-xs" asChild>
                            <Link href={`/financiers/${financier.id}`}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              Detay
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 bg-white p-4 rounded-full shadow-lg border border-twilight-100 max-w-md mx-auto">
              <Button
                variant="ghost"
                size="sm"
                disabled={!data.hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full w-10 h-10 p-0 hover:bg-twilight-50"
              >
                &larr;
              </Button>
              <span className="text-sm font-medium text-twilight-600">
                Sayfa <span className="text-amber-600 font-bold">{data.page}</span> / {data.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!data.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full w-10 h-10 p-0 hover:bg-twilight-50"
              >
                &rarr;
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Financier Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFinancierModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateFinancier}
            isPending={createFinancier.isPending}
          />
        )}
      </AnimatePresence>

      {/* Commission Modal Wrapper */}
      <AnimatePresence>
        {commissionFinancier && (
          <CommissionModal
            financier={commissionFinancier}
            onClose={() => setCommissionFinancier(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit Financier Modal */}
      <AnimatePresence>
        {editingFinancier && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-twilight-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setEditingFinancier(null)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all border border-twilight-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 px-6 py-5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-4 z-10">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                      <Settings className="h-6 w-6 text-amber-50" />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-white">Finansör Düzenle</h2>
                      <p className="text-sm text-amber-100/80">{editingFinancier.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingFinancier(null)}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateFinancier({
                      name: formData.get("name") as string,
                      description: formData.get("description") as string,
                      is_active: formData.get("is_active") === "true",
                    });
                  }}
                >
                  <div className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label>Finansör Adı</Label>
                      <Input
                        name="name"
                        defaultValue={editingFinancier.name}
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Açıklama</Label>
                      <Textarea
                        name="description"
                        defaultValue={editingFinancier.description || ""}
                        className="rounded-xl"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="is_active"
                        value="true"
                        defaultChecked={editingFinancier.is_active}
                        className="h-5 w-5 rounded border-twilight-300"
                      />
                      <Label>Aktif</Label>
                    </div>
                  </div>

                  <div className="flex gap-3 p-6 bg-twilight-50/50 border-t border-twilight-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingFinancier(null)}
                      className="flex-1 h-11 rounded-xl"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={updateFinancier.isPending}
                    >
                      {updateFinancier.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Kaydet
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingFinancier && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-twilight-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setDeletingFinancier(null)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-red-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative bg-gradient-to-br from-red-600 to-rose-700 px-6 py-5 flex items-center gap-4 text-white">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl">Finansörü Sil</h2>
                    <p className="text-sm text-red-100/80">Bu işlem geri alınamaz</p>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-twilight-700 mb-2">
                    <span className="font-bold">{deletingFinancier.name}</span> finansörünü silmek istediğinizden emin misiniz?
                  </p>
                  <p className="text-sm text-twilight-500">
                    Bu işlem geri alınamaz ve finansöre ait tüm veriler silinecektir.
                  </p>
                </div>

                <div className="flex gap-3 p-6 bg-twilight-50/50 border-t border-twilight-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeletingFinancier(null)}
                    className="flex-1 h-11 rounded-xl"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleDeleteFinancier}
                    className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleteFinancier.isPending}
                  >
                    {deleteFinancier.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Siliniyor...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Evet, Sil
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
