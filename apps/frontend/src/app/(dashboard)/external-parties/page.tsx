"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
import {
  UserCircle,
  Plus,
  Search,
  Phone,
  Mail,
  Loader2,
  X,
  Globe,
  MoreVertical,
  CheckCircle,
  XCircle,
  CreditCard,
  Building,
  User
} from "lucide-react";
import { useExternalParties, useCreateExternalParty } from "@/hooks/use-api";
import { motion, AnimatePresence } from "framer-motion";

function CreateExternalPartyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const createParty = useCreateExternalParty();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      await createParty.mutateAsync(formData);
      onClose();
      setFormData({ name: "", phone: "", email: "", description: "" });
    } catch (err) {
      console.error("Failed to create external party:", err);
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
          onClick={e => e.stopPropagation()}
        >
          {/* Header - Premium Gradient */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 px-6 py-5 flex justify-between items-center text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                <Globe className="h-6 w-6 text-indigo-50" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">Yeni Dış Kişi</h2>
                <p className="text-sm text-indigo-100/80 font-medium">Harici hesap veya kişi tanımlayın</p>
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
                <Label className="text-sm font-medium text-twilight-900">İsim / Unvan *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti."
                    className="pl-10 h-12 rounded-xl border-twilight-200 focus:ring-indigo-500 font-medium"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-twilight-900">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-twilight-400" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05..."
                      className="pl-9 h-11 rounded-xl border-twilight-200 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-twilight-900">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-twilight-400" />
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      type="email"
                      placeholder="ornek@mail.com"
                      className="pl-9 h-11 rounded-xl border-twilight-200 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-twilight-900">Açıklama</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="İsteğe bağlı not..."
                  className="h-11 rounded-xl border-twilight-200 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 bg-twilight-50/50 border-t border-twilight-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border-twilight-200 text-twilight-600 hover:text-twilight-900"
                disabled={createParty.isPending}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                disabled={createParty.isPending}
              >
                {createParty.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Oluştur
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

export default function ExternalPartiesPage() {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data, isLoading, error } = useExternalParties({ search });

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Glass Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white shadow-2xl shadow-twilight-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 font-bold text-indigo-300">
                <Globe className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Dış Kişiler</h1>
            </div>
            <p className="text-twilight-200/80 text-lg max-w-xl font-light">
              Sistem dışı kişi ve kurumlarla olan hesaplaşmalarınızı yönetin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-twilight-400 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full sm:w-64 pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-indigo-100 placeholder-twilight-400 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all"
                placeholder="İsim veya telefon ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-6 shadow-lg shadow-indigo-900/20 text-base font-medium transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" />
              Yeni Dış Kişi
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <h3 className="text-lg font-bold text-red-800 mb-2">Veri Yüklenemedi</h3>
          <p className="text-red-600 mb-4">{(error as Error).message}</p>
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => window.location.reload()}>
            Yeniden Dene
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-twilight-400 font-medium animate-pulse">Kişiler yükleniyor...</p>
          </div>
        </div>
      ) : (
        <>
          {data?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-twilight-200">
              <div className="h-20 w-20 bg-twilight-50 rounded-full flex items-center justify-center mb-6">
                <UserCircle className="h-10 w-10 text-twilight-300" />
              </div>
              <h3 className="text-xl font-bold text-twilight-900 mb-2">Henüz Dış Kişi Yok</h3>
              <p className="text-twilight-500 max-w-md text-center mb-8">
                Sisteme henüz dış kişi eklenmemiş. Ödeme ve tahsilat yapmak için ekleyebilirsiniz.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Kişi Ekle
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.items.map((party) => (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group h-full border-0 shadow-lg shadow-twilight-100/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100 hover:ring-indigo-500/50">
                    <div className="h-20 bg-gradient-to-r from-indigo-50 to-violet-50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/5 rounded-full blur-xl -mr-8 -mt-8"></div>
                      <div className="absolute top-4 right-4">
                        {party.is_active ? (
                          <div className="bg-white/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            AKTİF
                          </div>
                        ) : (
                          <div className="bg-white/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100 flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            PASİF
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 relative">
                      <div className="h-16 w-16 -mt-8 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 mx-auto lg:mx-0">
                        <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-inner">
                          {party.name.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 pt-4">
                      <div className="text-center lg:text-left mb-6">
                        <h3 className="font-bold text-lg text-twilight-900 truncate group-hover:text-indigo-700 transition-colors">
                          {party.name}
                        </h3>
                        {party.description && (
                          <p className="text-xs text-twilight-400 line-clamp-1 mt-1">
                            {party.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        {(party.phone || party.email) ? (
                          <>
                            {party.phone && (
                              <div className="flex items-center gap-3 text-sm text-twilight-500 bg-twilight-50/50 p-2.5 rounded-xl border border-twilight-100/50">
                                <Phone className="h-4 w-4 text-indigo-400" />
                                <span className="font-medium">{party.phone}</span>
                              </div>
                            )}
                            {party.email && (
                              <div className="flex items-center gap-3 text-sm text-twilight-500 bg-twilight-50/50 p-2.5 rounded-xl border border-twilight-100/50">
                                <Mail className="h-4 w-4 text-indigo-400" />
                                <span className="truncate font-medium">{party.email}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-xs text-twilight-300 italic h-[88px] border border-dashed border-twilight-100 rounded-xl">
                            İletişim bilgisi yok
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-twilight-100">
                        <div className="flex justify-between items-center bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/30">
                          <span className="text-xs font-bold text-indigo-900/60 uppercase tracking-wide">Bakiye</span>
                          <span className={`font-amount text-lg font-bold ${parseFloat(party.account?.balance || "0") >= 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                            }`}>
                            {formatMoney(parseFloat(party.account?.balance || "0"))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateExternalPartyModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
