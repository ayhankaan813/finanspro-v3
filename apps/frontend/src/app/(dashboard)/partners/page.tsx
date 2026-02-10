"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
import {
  usePartners,
  useCreatePartner,
  useSites,
  usePartnerCommissionRates,
  useCreatePartnerCommissionRate,
  useUpdatePartnerCommissionRate,
  Partner,
  CommissionRate,
} from "@/hooks/use-api";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Percent,
  Settings,
  ArrowDownToLine,
  X,
  Save,
  Building2,
  Trash2,
  MoreVertical,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function CommissionModal({
  partner,
  onClose,
}: {
  partner: Partner;
  onClose: () => void;
}) {
  const { data: rates, isLoading } = usePartnerCommissionRates(partner.id);
  const { data: sitesData } = useSites({ limit: 100 });
  const createRate = useCreatePartnerCommissionRate();
  const updateRate = useUpdatePartnerCommissionRate();

  const [selectedSite, setSelectedSite] = useState<string>("");
  const [newRate, setNewRate] = useState<string>("");
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  // Group rates by site
  const ratesBySite: Record<string, CommissionRate> = {};
  rates?.forEach((rate) => {
    if (rate.related_site_id && rate.is_active) {
      ratesBySite[rate.related_site_id] = rate;
    }
  });

  // Get a default rate (for all sites)
  const defaultRate = rates?.find(
    (r) => !r.related_site_id && r.is_active
  );

  const handleCreateRate = async () => {
    if (!newRate) return;

    const decimalRate = (parseFloat(newRate) / 100).toFixed(5);

    try {
      await createRate.mutateAsync({
        partnerId: partner.id,
        transaction_type: "DEPOSIT",
        rate: decimalRate,
        related_site_id: selectedSite || undefined,
      });
      setNewRate("");
      setSelectedSite("");
    } catch (err) {
      console.error("Failed to create rate:", err);
    }
  };

  const handleUpdateRate = async (rateId: string) => {
    const rateValue = editingRates[rateId];
    if (!rateValue) return;

    const decimalRate = (parseFloat(rateValue) / 100).toFixed(5);

    try {
      await updateRate.mutateAsync({
        partnerId: partner.id,
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
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all border border-twilight-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header - Premium Gradient */}
          <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 px-6 py-5 flex justify-between items-center text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                <Percent className="h-6 w-6 text-emerald-50" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">{partner.name}</h2>
                <p className="text-sm text-emerald-200/80 font-medium">Komisyon Oranları</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg shadow-black/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              </div>
            ) : (
              <>
                {/* Add New Rate */}
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 transition-all hover:bg-emerald-50">
                  <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Plus className="h-3.5 w-3.5 text-emerald-700" />
                    </div>
                    Yeni Komisyon Oranı Ekle
                  </h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs text-emerald-700 font-medium ml-1">Site Seçin (Boş = Genel)</Label>
                      <select
                        className="w-full h-11 px-3 rounded-xl border border-emerald-200/60 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all"
                        value={selectedSite}
                        onChange={(e) => setSelectedSite(e.target.value)}
                      >
                        <option value="">Tüm Siteler (Genel Oran)</option>
                        {sitesData?.items.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-40 space-y-1.5">
                      <Label className="text-xs text-emerald-700 font-medium ml-1">Oran (%)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          placeholder="6.0"
                          className="h-11 pr-8 rounded-xl border-emerald-200/60 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-lg"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">%</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleCreateRate}
                        disabled={!newRate || createRate.isPending}
                        className="h-11 w-full md:w-auto px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
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
                  </div>
                </div>

                {/* Default Rate */}
                {defaultRate && (
                  <div className="group rounded-xl border border-twilight-100 p-4 hover:shadow-md transition-all bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-twilight-50 flex items-center justify-center text-twilight-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <ArrowDownToLine className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-twilight-900 text-lg">Genel Komisyon Oranı</h4>
                          <p className="text-sm text-twilight-400 font-medium">
                            Özel tanım yapılmamış siteler için geçerli
                          </p>
                        </div>
                      </div>
                      {editingRates[defaultRate.id] !== undefined ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                          <div className="relative w-28">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={editingRates[defaultRate.id]}
                              onChange={(e) =>
                                setEditingRates({
                                  ...editingRates,
                                  [defaultRate.id]: e.target.value,
                                })
                              }
                              className="h-10 pr-7 font-bold text-center text-lg"
                              autoFocus
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRate(defaultRate.id)}
                            disabled={updateRate.isPending}
                            className="h-10 w-10 p-0 rounded-lg bg-emerald-500 hover:bg-emerald-600"
                          >
                            <Save className="h-4 w-4 text-white" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRates((prev) => {
                                const newState = { ...prev };
                                delete newState[defaultRate.id];
                                return newState;
                              });
                            }}
                            className="h-10 w-10 p-0 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100">
                            <span className="text-3xl font-bold text-emerald-600 tracking-tight">
                              %{(parseFloat(defaultRate.rate) * 100).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0 rounded-xl border-twilight-200 text-twilight-400 hover:text-twilight-700 hover:border-twilight-300"
                            onClick={() =>
                              setEditingRates({
                                ...editingRates,
                                [defaultRate.id]: (parseFloat(defaultRate.rate) * 100).toFixed(2),
                              })
                            }
                          >
                            <Settings className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Site-specific Rates */}
                {sitesData?.items && sitesData.items.length > 0 && (
                  <div>
                    <h4 className="font-bold text-twilight-800 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-twilight-400" />
                      Site Bazlı Özel Oranlar
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {sitesData.items.map((site) => {
                        const rate = ratesBySite[site.id];
                        const isEditing = rate && editingRates[rate.id] !== undefined;

                        if (!rate) return null; // Only show sites with specific rates to reduce clutter

                        return (
                          <div
                            key={site.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-twilight-100 bg-white hover:shadow-sm hover:border-emerald-200 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                <span className="font-bold text-indigo-600 text-sm">{site.name.substring(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-twilight-900">{site.name}</p>
                                <p className="text-xs text-twilight-400 font-mono">{site.code}</p>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <div className="relative w-20">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editingRates[rate.id]}
                                    onChange={(e) =>
                                      setEditingRates({
                                        ...editingRates,
                                        [rate.id]: e.target.value,
                                      })
                                    }
                                    className="h-9 pr-6 text-sm font-bold"
                                    autoFocus
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-9 w-9 p-0 bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => handleUpdateRate(rate.id)}
                                  disabled={updateRate.isPending}
                                >
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50"
                                  onClick={() => {
                                    setEditingRates((prev) => {
                                      const newState = { ...prev };
                                      delete newState[rate.id];
                                      return newState;
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                  %{(parseFloat(rate.rate) * 100).toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-twilight-400 hover:text-twilight-700"
                                  onClick={() =>
                                    setEditingRates({
                                      ...editingRates,
                                      [rate.id]: (parseFloat(rate.rate) * 100).toFixed(2),
                                    })
                                  }
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Show unconfigured sites hint */}
                      {sitesData.items.filter(s => !ratesBySite[s.id]).length > 0 && (
                        <div className="mt-2 p-3 bg-twilight-50 rounded-lg border border-dashed border-twilight-200 text-center text-sm text-twilight-400">
                          Diğer {sitesData.items.filter(s => !ratesBySite[s.id]).length} site için Genel Oran (%{(defaultRate ? (parseFloat(defaultRate.rate) * 100).toFixed(2) : "0.00")}) kullanılmaktadır.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commissionPartner, setCommissionPartner] = useState<Partner | null>(null);
  const [newPartner, setNewPartner] = useState({ name: "", code: "", description: "" });

  const { data, isLoading, error } = usePartners({ page, limit: 20, search });
  const createPartner = useCreatePartner();

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPartner.mutateAsync(newPartner);
      setShowCreateModal(false);
      setNewPartner({ name: "", code: "", description: "" });
    } catch (err) {
      console.error("Failed to create partner:", err);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Glass Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white shadow-2xl shadow-twilight-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 font-bold text-emerald-300">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Partnerler</h1>
            </div>
            <p className="text-twilight-200/80 text-lg max-w-xl font-light">
              Komisyon ortaklarınızı yönetin, hak edişlerini ve performanslarını takip edin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-twilight-400 group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-emerald-100 placeholder-twilight-400 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 sm:text-sm transition-all"
                placeholder="Partner ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 py-6 shadow-lg shadow-emerald-900/20 text-base font-medium transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" />
              Yeni Partner
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
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-twilight-400 font-medium animate-pulse">Partnerler yükleniyor...</p>
          </div>
        </div>
      ) : (
        <>
          {data?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-twilight-200">
              <div className="h-20 w-20 bg-twilight-50 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-twilight-300" />
              </div>
              <h3 className="text-xl font-bold text-twilight-900 mb-2">Henüz Partner Yok</h3>
              <p className="text-twilight-500 max-w-md text-center mb-8">
                Sisteme henüz hiç partner eklenmemiş. İlk partnerinizi ekleyerek başlayın.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Partner Oluştur
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {data?.items.map((partner) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group h-full border-0 shadow-lg shadow-twilight-100/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100 hover:ring-emerald-500/50">
                    <CardHeader className="p-0">
                      {/* Card Banner */}
                      <div className="h-24 bg-gradient-to-r from-emerald-50 to-teal-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

                        <div className="absolute top-4 right-4 flex gap-2">
                          {partner.is_active ? (
                            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              AKTİF
                            </div>
                          ) : (
                            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-100 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                              PASİF
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 flex gap-4 -mt-10">
                        <div className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                          <div className="h-full w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-inner">
                            {partner.name.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="pt-11 flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-twilight-900 truncate group-hover:text-emerald-700 transition-colors">
                            {partner.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-mono text-twilight-400">
                            <Briefcase className="h-3 w-3" />
                            {partner.code}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="mt-11 text-twilight-400 hover:text-twilight-600">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="py-5 text-center bg-twilight-50/50 rounded-2xl mb-5 border border-twilight-100/50 group-hover:bg-emerald-50/30 group-hover:border-emerald-100/50 transition-colors">
                        <p className="text-xs font-bold text-twilight-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                          Hak Ediş Bakiyesi
                        </p>
                        <p className={`text-3xl font-bold tracking-tight ${parseFloat(partner.account?.balance || "0") >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                          }`}>
                          {formatMoney(parseFloat(partner.account?.balance || "0"))}
                        </p>
                      </div>

                      {partner.description && (
                        <p className="text-sm text-twilight-500 mb-6 bg-white p-3 rounded-xl border border-twilight-100 italic">
                          "{partner.description}"
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 rounded-xl border-twilight-200 text-twilight-600 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50/50 font-semibold text-xs"
                          onClick={() => setCommissionPartner(partner)}
                        >
                          <Percent className="mr-2 h-3.5 w-3.5" />
                          Komisyon
                        </Button>
                        <Button className="flex-1 h-10 rounded-xl bg-twilight-900 text-white hover:bg-twilight-800 shadow-lg shadow-twilight-900/10 font-semibold text-xs" asChild>
                          <Link href={`/partners/${partner.id}`}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Detay
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                Sayfa <span className="text-emerald-600 font-bold">{data.page}</span> / {data.totalPages}
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

      {/* Create Partner Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-twilight-900/60 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-twilight-100"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-100" />
                  Yeni Partner Ekle
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-emerald-100 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-twilight-700 font-medium">Partner Adı</Label>
                    <Input
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      placeholder="Örnek: Ahmet Bey"
                      className="h-11 rounded-xl border-twilight-200 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-twilight-700 font-medium">Partner Kodu</Label>
                    <Input
                      value={newPartner.code}
                      onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value.toUpperCase() })}
                      placeholder="Örnek: PARTNER-001"
                      className="h-11 rounded-xl border-twilight-200 focus:ring-emerald-500 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-twilight-700 font-medium">Açıklama</Label>
                    <Input
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      placeholder="Opsiyonel açıklama"
                      className="h-11 rounded-xl border-twilight-200 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 h-11 rounded-xl border-twilight-200">
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPartner.isPending}
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    >
                      {createPartner.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Oluştur"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Commission Modal Wrapper */}
      <AnimatePresence>
        {commissionPartner && (
          <CommissionModal
            partner={commissionPartner}
            onClose={() => setCommissionPartner(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
