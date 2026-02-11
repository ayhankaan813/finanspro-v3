"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/utils";
import {
  useSites,
  useCreateSite,
  useSiteCommissionRates,
  useCreateSiteCommissionRate,
  useUpdateSiteCommissionRate,
  Site,
  CommissionRate,
} from "@/hooks/use-api";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Percent,
  Settings,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Save,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Globe,
  Shield,
  Zap,
  ChevronRight,
  Hash,
  FileText,
  Info,
  AlertCircle,
  MoreVertical,
  Wallet,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Stats will come from real API data - no mock values

const TRANSACTION_TYPES = [
  { value: "DEPOSIT", label: "Yatırım", icon: ArrowDownToLine, color: "text-emerald-600", bg: "bg-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
  { value: "WITHDRAWAL", label: "Çekim", icon: ArrowUpFromLine, color: "text-rose-600", bg: "bg-rose-500", gradient: "from-rose-500 to-rose-600" },
];

// Sortable Item Wrapper
function SortableSiteCard({
  site,
  setCommissionSite,
}: {
  site: Site;
  setCommissionSite: (site: Site) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id });

  const { data: rates } = useSiteCommissionRates(site.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.9 : 1,
  };

  // Site is a LIABILITY account - positive balance means we owe money to customers
  // Display as-is (no sign flip needed)
  const accountBalance = parseFloat(site.account?.balance || "0");
  const displayBalance = accountBalance; // Show as-is: 94 TL stays 94 TL

  const depositRate = rates?.find(r => r.transaction_type === "DEPOSIT" && r.is_active);
  const withdrawalRate = rates?.find(r => r.transaction_type === "WITHDRAWAL" && r.is_active);

  const formatRate = (rate?: CommissionRate) => {
    return rate ? `${(parseFloat(rate.rate) * 100).toFixed(2)}%` : "-";
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? "shadow-2xl scale-105" : ""}`}>
      <Card className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden rounded-3xl ring-1 ring-twilight-100">
        <CardHeader className="p-0 relative">
          <div className="h-2 bg-gradient-to-r from-twilight-400 to-twilight-600"></div>
          {/* Drag Handle Overlay - shows on hover of the header area */}
          <div className="px-6 pt-5 pb-2 flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-move p-2 -ml-2 text-twilight-300 hover:text-twilight-600 hover:bg-twilight-50 rounded-lg transition-colors"
                title="Sıralamak için sürükleyin"
              >
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="h-12 w-12 rounded-2xl bg-twilight-50 flex items-center justify-center text-twilight-700 font-bold text-xl shadow-inner">
                {site.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-twilight-900 group-hover:text-twilight-600 transition-colors">
                  {site.name}
                </h3>
                <div className="flex items-center gap-2">
                  <BadgeCode code={site.code} />
                  {site.is_active && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-twilight-300 hover:text-twilight-600">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          {/* Main Balance */}
          <div className="py-4 text-center bg-twilight-50/50 rounded-2xl mb-4 border border-twilight-100/50">
            <p className="text-xs font-semibold text-twilight-400 uppercase tracking-widest mb-1">Mevcut Bakiye</p>
            <p className={`text-3xl font-bold font-mono tracking-tight ${displayBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatMoney(displayBalance)}
            </p>
          </div>

          {/* Mini Stats Grid - will show real transaction totals when available */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <MiniStat
              label="Toplam Giriş"
              val={formatMoney(0)}
              trend="up"
              icon={ArrowDownToLine}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <MiniStat
              label="Toplam Çıkış"
              val={formatMoney(0)}
              trend="down"
              icon={ArrowUpFromLine}
              color="text-rose-600"
              bg="bg-rose-50"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-twilight-50">
            <div className="flex-1 text-xs text-twilight-400 font-medium flex items-center gap-1">
              Komisyon:
              <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded ml-1" title="Yatırım">{formatRate(depositRate)}</span> /
              <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded" title="Çekim">{formatRate(withdrawalRate)}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCommissionSite(site)} className="rounded-xl h-9 text-xs border-twilight-200 text-twilight-600">
                Komisyon
              </Button>
              <Button size="sm" asChild className="rounded-xl h-9 text-xs bg-twilight-900 text-white hover:bg-twilight-800 shadow-md shadow-twilight-900/10">
                <Link href={`/sites/${site.id}`}>Detay</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Premium Create Modal Component
function CreateSiteModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    code: string;
    description: string;
    deposit_commission_rate?: string;
    withdrawal_commission_rate?: string;
  }) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    deposit_commission_rate: "4.00",
    withdrawal_commission_rate: "3.00",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        code: "",
        description: "",
        deposit_commission_rate: "4.00",
        withdrawal_commission_rate: "3.00",
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.name && !formData.code) {
      const autoCode = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
      if (autoCode) {
        setFormData(prev => ({ ...prev, code: `SITE-${autoCode}` }));
      }
    }
  }, [formData.name]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Site adı zorunludur";
    } else if (formData.name.length < 2) {
      newErrors.name = "Site adı en az 2 karakter olmalı";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Site kodu zorunludur";
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = "Sadece büyük harf, rakam ve tire kullanılabilir";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
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
        <div
          className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-twilight-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 px-6 py-6">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-twilight-50" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Yeni Site Ekle</h2>
                  <p className="text-sm text-twilight-200/70">Site bilgilerini ve komisyon oranlarını girin</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-5">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-twilight-900 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-twilight-400" />
                      Site Adı
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Örn: Casino Royal"
                      className={`h-12 rounded-xl border-twilight-100 focus:ring-2 focus:ring-twilight-400 focus:border-twilight-400 transition-all ${errors.name ? "border-red-300 focus:ring-red-200" : ""
                        }`}
                      autoFocus
                    />
                    {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-twilight-900 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-twilight-400" />
                      Site Kodu
                    </Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SITE-001"
                      className="h-12 rounded-xl border-twilight-100 font-mono uppercase focus:ring-2 focus:ring-twilight-400 focus:border-twilight-400 transition-all"
                    />
                    {errors.code && <p className="text-xs text-red-500 font-medium">{errors.code}</p>}
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-twilight-50 p-4 border border-twilight-100">
                    <Sparkles className="h-5 w-5 text-twilight-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-twilight-700">
                      Site adını girdikten sonra kod otomatik oluşturulur. Benzersiz bir kod seçtiğinizden emin olun.
                    </p>
                  </div>
                </div>

                {/* Komisyon Oranları */}
                <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Percent className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-twilight-900">Komisyon Oranları</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Deposit Rate */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-twilight-700 flex items-center gap-1.5">
                        <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" />
                        Yatırım (DEPOSIT)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.deposit_commission_rate}
                          onChange={(e) => setFormData({ ...formData, deposit_commission_rate: e.target.value })}
                          className="h-11 rounded-xl border-twilight-100 pr-8 text-center font-semibold"
                          placeholder="4.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-twilight-400 font-bold text-sm">%</span>
                      </div>
                    </div>

                    {/* Withdrawal Rate */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-twilight-700 flex items-center gap-1.5">
                        <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-600" />
                        Çekim (WITHDRAWAL)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.withdrawal_commission_rate}
                          onChange={(e) => setFormData({ ...formData, withdrawal_commission_rate: e.target.value })}
                          className="h-11 rounded-xl border-twilight-100 pr-8 text-center font-semibold"
                          placeholder="3.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-twilight-400 font-bold text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-100 mt-3">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Bu oranlar daha sonra değiştirilebilir. Komisyon ayarları site detay sayfasından güncellenebilir.
                    </p>
                  </div>
                </div>

                {/* Açıklama */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-twilight-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-twilight-400" />
                    Açıklama <span className="text-twilight-300 font-normal">(opsiyonel)</span>
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Site hakkında notlar..."
                    className="min-h-[70px] rounded-xl border-twilight-100 focus:ring-2 focus:ring-twilight-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-twilight-100 bg-twilight-50/30 px-6 py-4 flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl border-twilight-200">
                İptal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1 h-11 rounded-xl bg-twilight-600 hover:bg-twilight-700 text-white shadow-lg">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Site Oluştur"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Premium Commission Modal
function CommissionModal({
  site,
  onClose,
}: {
  site: Site;
  onClose: () => void;
}) {
  const { data: rates, isLoading } = useSiteCommissionRates(site.id);
  const createRate = useCreateSiteCommissionRate();
  const updateRate = useUpdateSiteCommissionRate();

  const [newRates, setNewRates] = useState<Record<string, string>>({ DEPOSIT: "", WITHDRAWAL: "" });
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  const getCurrentRate = (type: string) => rates?.find(r => r.transaction_type === type && r.is_active);

  const handleSave = async (type: string, rateVal: string, rateId?: string) => {
    if (!rateVal) return;
    const decimal = (parseFloat(rateVal) / 100).toFixed(5);
    try {
      if (rateId) {
        await updateRate.mutateAsync({ siteId: site.id, rateId, rate: decimal });
        setEditingRates(prev => { const n = { ...prev }; delete n[rateId]; return n; });
      } else {
        await createRate.mutateAsync({ siteId: site.id, transaction_type: type, rate: decimal });
        setNewRates(prev => ({ ...prev, [type]: "" }));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-twilight-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all border border-twilight-100" onClick={e => e.stopPropagation()}>
          {/* Header - consistently using the premium gradient */}
          <div className="relative bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 px-6 py-5 flex justify-between items-center text-white">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-twilight-400/10 blur-3xl" />

            <div className="relative flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                <Percent className="h-6 w-6 text-twilight-50" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">{site.name}</h2>
                <p className="text-sm text-twilight-200/80 font-medium">Komisyon Ayarları</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all shadow-lg shadow-black/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-twilight-600" /></div>
            ) : (
              TRANSACTION_TYPES.map(type => {
                const current = getCurrentRate(type.value);
                const isEditing = current && editingRates[current.id] !== undefined;
                const val = isEditing ? editingRates[current.id]! : newRates[type.value];

                return (
                  <div key={type.value} className="border border-twilight-100 rounded-xl overflow-hidden">
                    <div className="bg-twilight-50/50 px-4 py-3 flex items-center justify-between border-b border-twilight-100">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${type.bg} text-white`}>
                          <type.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-twilight-900">{type.label}</span>
                      </div>
                      {current && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingRates({ ...editingRates, [current.id]: (parseFloat(current.rate) * 100).toFixed(2) })} className="h-8 text-twilight-600 hover:text-twilight-900 hover:bg-twilight-100">
                          <Settings className="h-3.5 w-3.5 mr-1" /> Düzenle
                        </Button>
                      )}
                    </div>
                    <div className="p-4 flex items-center gap-4">
                      {current && !isEditing ? (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${type.color}`}>%{(parseFloat(current.rate) * 100).toFixed(2)}</span>
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Aktif</span>
                        </div>
                      ) : (
                        <div className="flex-1 flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pr-8 font-semibold text-lg"
                              value={isEditing ? editingRates[current!.id] || "" : newRates[type.value]}
                              onChange={e => isEditing ? setEditingRates({ ...editingRates, [current!.id]: e.target.value }) : setNewRates({ ...newRates, [type.value]: e.target.value })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                          </div>
                          <Button
                            onClick={() => handleSave(type.value, isEditing ? editingRates[current!.id] : newRates[type.value], current?.id)}
                            disabled={createRate.isPending || updateRate.isPending}
                            className="bg-twilight-600 hover:bg-twilight-700 text-white"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          {isEditing && (
                            <Button variant="outline" onClick={() => { const n = { ...editingRates }; delete n[current!.id]; setEditingRates(n); }}>İptal</Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SitesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commissionSite, setCommissionSite] = useState<Site | null>(null);
  const [orderedSites, setOrderedSites] = useState<Site[]>([]);


  const { data, isLoading, error } = useSites({ page, limit: 20, search });
  const createSite = useCreateSite();

  // Sync data to local sorted state when fetched
  useEffect(() => {
    if (data?.items) {
      setOrderedSites(data.items);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedSites((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      // Here you would typically also call an API to save the new order
    }
  };

  const handleCreateSite = async (siteData: {
    name: string;
    code: string;
    description: string;
    deposit_commission_rate?: string;
    withdrawal_commission_rate?: string;
  }) => {
    try {
      await createSite.mutateAsync(siteData);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create site:", err);
    }
  };

  const stats = {
    total: data?.total || 0,
    active: data?.items.filter(s => s.is_active).length || 0,
    // Site is LIABILITY - positive balance means we owe customers
    // Show as-is (no sign flip)
    totalBalance: data?.items.reduce((acc, s) => acc + parseFloat(s.account?.balance || "0"), 0) || 0,
    totalIn: 0, // Will come from real transaction data
    totalOut: 0, // Will come from real transaction data
  };

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 opacity-50" />
        <div>
          <h3 className="font-bold text-lg text-twilight-900">Bir hata oluştu</h3>
          <p className="text-twilight-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Glass Header & Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white shadow-2xl shadow-twilight-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-twilight-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-twilight-400/10 blur-3xl"></div>

        <div className="relative z-10 p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <GripVertical className="h-8 w-8 text-twilight-200" />
                Site Yönetimi
              </h1>
              <p className="text-twilight-200/80 text-lg max-w-xl">
                Bahis sitelerini ve finansal verilerini profesyonelce yönetin.
                Kartları sürükleyerek sıralayabilirsiniz.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-twilight-900 hover:bg-twilight-50 font-bold px-6 py-6 rounded-2xl shadow-xl transition-transform hover:scale-105"
            >
              <Plus className="mr-2 h-5 w-5" />
              Yeni Site Ekle
            </Button>
          </div>

          {/* Glass Stats Cards Overlay */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Toplam Site", val: stats.total, sub: `${stats.active} aktif`, icon: Globe },
              { label: "Toplam Bakiye", val: formatMoney(stats.totalBalance), sub: "Anlık Durum", icon: Wallet, highlight: true },
              { label: "Toplam Giriş", val: formatMoney(stats.totalIn), sub: "Bu Ay", icon: ArrowDownToLine, color: "text-emerald-300" },
              { label: "Toplam Çıkış", val: formatMoney(stats.totalOut), sub: "Bu Ay", icon: ArrowUpFromLine, color: "text-rose-300" }
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-4 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10 ${stat.highlight ? 'bg-white/15' : 'bg-white/5'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    <stat.icon className={`h-5 w-5 ${stat.color || 'text-white'}`} />
                  </div>
                  <span className="text-sm font-medium text-twilight-100/70">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight">{stat.val}</div>
                {stat.sub && <div className="text-xs text-twilight-300 mt-1">{stat.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-twilight-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-twilight-400 h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya kod ile ara..."
            className="pl-10 h-11 border-none bg-transparent focus-visible:ring-0 text-base"
          />
        </div>
        <div className="flex items-center gap-2 px-2">
          <Button variant="ghost" size="sm" className="text-twilight-500">
            <ArrowDownToLine className="h-4 w-4 mr-2" /> Dışa Aktar
          </Button>
          <div className="h-6 w-px bg-twilight-100"></div>
          <span className="text-sm text-twilight-400 font-medium px-2">{data?.items.length || 0} Sonuç</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-twilight-600" /></div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext
            items={orderedSites.map(s => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orderedSites.map(site => (
                <SortableSiteCard
                  key={site.id}
                  site={site}
                  setCommissionSite={setCommissionSite}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create Modal */}
      <CreateSiteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSite}
        isPending={createSite.isPending}
      />

      {/* Commission Modal */}
      {commissionSite && (
        <CommissionModal
          site={commissionSite}
          onClose={() => setCommissionSite(null)}
        />
      )}
    </div>
  );
}

// Sub-components for cleaner code
function BadgeCode({ code }: { code: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded-md bg-white border border-twilight-100 text-[10px] font-mono font-medium text-twilight-500">
      {code}
    </span>
  );
}

function MiniStat({ label, val, trend, icon: Icon, color, bg }: any) {
  return (
    <div className={`flex flex-col p-3 rounded-xl border border-transparent hover:border-twilight-100 transition-colors ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-twilight-500 uppercase">{label}</span>
        <Icon className={`h-3 w-3 ${color}`} />
      </div>
      <span className={`text-sm font-bold font-mono ${color}`}>{val}</span>
    </div>
  );
}
