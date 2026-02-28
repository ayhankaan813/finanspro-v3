"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  useSites,
  useCreateSite,
  useUpdateSite,
  useDeleteSite,
  useSiteStats,
  useSiteCommissionRates,
  useCreateSiteCommissionRate,
  useUpdateSiteCommissionRate,
  Site,
  CommissionRate,
} from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Calendar,
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
  siteStats,
  onEditName,
  onToggleActive,
  onDelete,
}: {
  site: Site;
  setCommissionSite: (site: Site) => void;
  siteStats?: { totalDeposit: string; totalWithdrawal: string };
  onEditName: (site: Site) => void;
  onToggleActive: (site: Site) => void;
  onDelete: (site: Site) => void;
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

  const accountBalance = parseFloat(site.account?.balance || "0");
  const displayBalance = accountBalance;
  const totalDeposit = parseFloat(siteStats?.totalDeposit || "0");
  const totalWithdrawal = parseFloat(siteStats?.totalWithdrawal || "0");

  const depositRate = rates?.find(r => r.transaction_type === "DEPOSIT" && r.is_active);
  const withdrawalRate = rates?.find(r => r.transaction_type === "WITHDRAWAL" && r.is_active);

  // Calculate commission amounts
  const depositCommission = depositRate ? totalDeposit * parseFloat(depositRate.rate) : 0;
  const withdrawalCommission = withdrawalRate ? totalWithdrawal * parseFloat(withdrawalRate.rate) : 0;
  const totalCommission = depositCommission + withdrawalCommission;

  const formatRate = (rate?: CommissionRate) => {
    return rate ? `${(parseFloat(rate.rate) * 100).toFixed(2)}%` : "-";
  };

  const isInactive = !site.is_active;

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? "shadow-2xl scale-105" : ""}`}>
      <Card className={`group border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden rounded-3xl ring-1 ${isInactive ? "ring-gray-200 bg-gray-50 opacity-60" : "ring-twilight-100 bg-white"
        }`}>
        <CardHeader className="p-0 relative">
          <div className={`h-1.5 sm:h-2 bg-gradient-to-r ${isInactive ? "from-gray-300 to-gray-400" : "from-twilight-400 to-twilight-600"
            }`}></div>
          <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5 flex justify-between items-start">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                {...attributes}
                {...listeners}
                className="cursor-move p-1.5 sm:p-2 -ml-2 text-twilight-300 hover:text-twilight-600 hover:bg-twilight-50 rounded-lg transition-colors"
                title="Sıralamak için sürükleyin"
              >
                <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-inner ${isInactive ? "bg-gray-100 text-gray-400" : "bg-twilight-50 text-twilight-700"
                }`}>
                {site.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-bold text-base sm:text-lg transition-colors ${isInactive ? "text-gray-400 line-through" : "text-twilight-900 group-hover:text-twilight-600"
                  }`}>
                  {site.name}
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <BadgeCode code={site.code} />
                  {site.is_active && <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                  {isInactive && <span className="text-[9px] sm:text-[10px] text-red-400 font-semibold uppercase">Pasif</span>}
                </div>
              </div>
            </div>

            {/* Three Dot Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-twilight-300 hover:text-twilight-600">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEditName(site)}>
                  <Pencil className="mr-2 h-4 w-4" /> İsim Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(site)}>
                  {site.is_active ? (
                    <><PowerOff className="mr-2 h-4 w-4 text-amber-500" /> Pasife Al</>
                  ) : (
                    <><Power className="mr-2 h-4 w-4 text-emerald-500" /> Aktif Et</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(site)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          {/* Main Balance */}
          <div className={`py-3 sm:py-4 text-center rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border ${isInactive ? "bg-gray-100/50 border-gray-200/50" : "bg-twilight-50/50 border-twilight-100/50"
            }`}>
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-0.5 sm:mb-1 ${isInactive ? "text-gray-400" : "text-twilight-400"
              }`}>Mevcut Bakiye</p>
            <p className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${isInactive ? "text-gray-400" : displayBalance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
              {formatMoney(displayBalance)}
            </p>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <MiniStat
              label="Aylık Yatırım"
              val={formatMoney(totalDeposit)}
              trend="up"
              icon={ArrowDownToLine}
              color={isInactive ? "text-gray-400" : "text-emerald-600"}
              bg={isInactive ? "bg-gray-50" : "bg-emerald-50"}
            />
            <MiniStat
              label="Aylık Çekim"
              val={formatMoney(totalWithdrawal)}
              trend="down"
              icon={ArrowUpFromLine}
              color={isInactive ? "text-gray-400" : "text-rose-600"}
              bg={isInactive ? "bg-gray-50" : "bg-rose-50"}
            />
            <MiniStat
              label="Komisyon"
              val={formatMoney(totalCommission)}
              trend="neutral"
              icon={Percent}
              color={isInactive ? "text-gray-400" : "text-amber-600"}
              bg={isInactive ? "bg-gray-50" : "bg-amber-50"}
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
          <div className="relative bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 px-4 py-3.5 sm:px-6 sm:py-6">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50 rounded-full p-2 sm:p-2.5 text-white/70 hover:bg-white/20 hover:text-white active:bg-white/30 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 sm:h-5 sm:w-5" />
            </button>
            <div className="relative">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm">
                  <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-twilight-50" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-white">Yeni Site Ekle</h2>
                  <p className="text-xs sm:text-sm text-twilight-200/70">Site bilgilerini ve komisyon oranlarını girin</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto">
              <div className="space-y-3 sm:space-y-5">
                <div className="space-y-3 sm:space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-twilight-400" />
                      Site Adı
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Örn: Casino Royal"
                      className={`h-9 sm:h-12 rounded-lg sm:rounded-xl border-twilight-100 text-sm focus:ring-2 focus:ring-twilight-400 focus:border-twilight-400 transition-all ${errors.name ? "border-red-300 focus:ring-red-200" : ""
                        }`}
                      autoFocus
                    />
                    {errors.name && <p className="text-[11px] sm:text-xs text-red-500 font-medium">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                      <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-twilight-400" />
                      Site Kodu
                    </Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SITE-001"
                      className="h-9 sm:h-12 rounded-lg sm:rounded-xl border-twilight-100 font-mono uppercase text-sm focus:ring-2 focus:ring-twilight-400 focus:border-twilight-400 transition-all"
                    />
                    {errors.code && <p className="text-[11px] sm:text-xs text-red-500 font-medium">{errors.code}</p>}
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-twilight-50 p-2.5 sm:p-4 border border-twilight-100">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-twilight-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-twilight-700">
                      Site adını girdikten sonra kod otomatik oluşturulur. Benzersiz bir kod seçtiğinizden emin olun.
                    </p>
                  </div>
                </div>

                {/* Komisyon Oranları */}
                <div className="rounded-lg sm:rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-2.5 sm:mb-4">
                    <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                    <h3 className="text-xs sm:text-sm font-semibold text-twilight-900">Komisyon Oranları</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Deposit Rate */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] sm:text-xs font-medium text-twilight-700 flex items-center gap-1">
                        <ArrowDownToLine className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                        Yatırım (DEPOSIT)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.deposit_commission_rate}
                          onChange={(e) => setFormData({ ...formData, deposit_commission_rate: e.target.value })}
                          className="h-9 sm:h-11 rounded-lg sm:rounded-xl border-twilight-100 pr-7 text-center font-semibold text-sm"
                          placeholder="4.00"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-twilight-400 font-bold text-xs sm:text-sm">%</span>
                      </div>
                    </div>

                    {/* Withdrawal Rate */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] sm:text-xs font-medium text-twilight-700 flex items-center gap-1">
                        <ArrowUpFromLine className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-600" />
                        Çekim (WITHDRAWAL)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.withdrawal_commission_rate}
                          onChange={(e) => setFormData({ ...formData, withdrawal_commission_rate: e.target.value })}
                          className="h-9 sm:h-11 rounded-lg sm:rounded-xl border-twilight-100 pr-7 text-center font-semibold text-sm"
                          placeholder="3.00"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-twilight-400 font-bold text-xs sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 sm:p-3 border border-amber-100 mt-2.5 sm:mt-3">
                    <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-xs text-amber-700">
                      Bu oranlar daha sonra değiştirilebilir. Komisyon ayarları site detay sayfasından güncellenebilir.
                    </p>
                  </div>
                </div>

                {/* Açıklama */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium text-twilight-900 flex items-center gap-1.5 sm:gap-2">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-twilight-400" />
                    Açıklama <span className="text-twilight-300 font-normal">(opsiyonel)</span>
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Site hakkında notlar..."
                    className="min-h-[60px] sm:min-h-[70px] rounded-lg sm:rounded-xl border-twilight-100 text-sm focus:ring-2 focus:ring-twilight-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-twilight-100 bg-twilight-50/30 px-4 py-3 sm:px-6 sm:py-4 flex gap-2.5 sm:gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9 sm:h-11 rounded-lg sm:rounded-xl border-twilight-200 text-sm">
                İptal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1 h-9 sm:h-11 rounded-lg sm:rounded-xl bg-twilight-600 hover:bg-twilight-700 text-white shadow-lg text-sm">
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
      <div className="fixed inset-0 bg-twilight-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-[85%] max-w-[340px] sm:w-full sm:max-w-md rounded-[2rem] bg-white shadow-2xl overflow-hidden transform transition-all border border-twilight-100 ring-4 ring-twilight-900/5 origin-center"
          onClick={e => e.stopPropagation()}
        >
          {/* Header - consistently using the premium gradient */}
          <div className="relative bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 px-5 py-4 sm:px-6 sm:py-5 flex justify-between items-center text-white overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-white/5 blur-xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-twilight-400/10 blur-2xl" />

            <div className="relative flex items-center gap-3 z-10">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                <Percent className="h-5 w-5 sm:h-6 sm:w-6 text-twilight-50" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-base sm:text-xl text-white tracking-tight leading-tight">{site.name}</h2>
                <span className="text-[10px] sm:text-sm text-twilight-200/80 font-medium tracking-wide uppercase">Komisyon Ayarları</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 -mr-1 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50/50">
            {isLoading ? (
              <div className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-twilight-600" /></div>
            ) : (
              TRANSACTION_TYPES.map(type => {
                const current = getCurrentRate(type.value);
                const isEditing = current && editingRates[current.id] !== undefined;
                const val = isEditing ? editingRates[current.id]! : newRates[type.value];

                return (
                  <div key={type.value} className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
                    <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${type.bg} text-white shadow-sm`}>
                          <type.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-twilight-900 tracking-tight">{type.label}</span>
                      </div>
                      {current && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingRates({ ...editingRates, [current.id]: (parseFloat(current.rate) * 100).toFixed(2) })} className="h-6 w-auto px-2 text-[10px] sm:text-xs text-twilight-500 hover:text-twilight-900 hover:bg-twilight-50 rounded-lg">
                          DÜZENLE
                        </Button>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      {current && !isEditing ? (
                        <div className="flex items-center justify-between">
                          <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${type.color}`}>%{(parseFloat(current.rate) * 100).toFixed(2)}</span>
                          <span className="text-[9px] sm:text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Aktif</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pr-6 font-bold text-base h-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                              value={isEditing ? editingRates[current!.id] || "" : newRates[type.value]}
                              onChange={e => isEditing ? setEditingRates({ ...editingRates, [current!.id]: e.target.value }) : setNewRates({ ...newRates, [type.value]: e.target.value })}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
                          </div>
                          <Button
                            onClick={() => handleSave(type.value, isEditing ? editingRates[current!.id] : newRates[type.value], current?.id)}
                            disabled={createRate.isPending || updateRate.isPending}
                            className="bg-twilight-900 hover:bg-twilight-800 text-white h-9 w-9 p-0 rounded-xl shadow-lg shadow-twilight-900/20"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          {isEditing && (
                            <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100" onClick={() => { const n = { ...editingRates }; delete n[current!.id]; setEditingRates(n); }}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
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

// Date presets
const DATE_PRESETS = [
  { label: "Bugün", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Dün", getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: "Son 7 Gün", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Son 30 Gün", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Bu Ay", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Geçen Ay", getValue: () => ({ from: startOfMonth(subDays(startOfMonth(new Date()), 1)), to: endOfMonth(subDays(startOfMonth(new Date()), 1)) }) },
];

export default function SitesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commissionSite, setCommissionSite] = useState<Site | null>(null);
  const [orderedSites, setOrderedSites] = useState<Site[]>([]);
  const [date, setDate] = useState<DateRange | undefined>(DATE_PRESETS[4].getValue());
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteSiteTarget, setDeleteSiteTarget] = useState<Site | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { toast } = useToast();

  const dateRange = {
    from: date?.from ? format(date.from, "yyyy-MM-dd") : "",
    to: date?.to ? format(date.to, "yyyy-MM-dd") : "",
    label: date?.from ? (date.to ? `${format(date.from, "d MMM", { locale: tr })} - ${format(date.to, "d MMM", { locale: tr })}` : format(date.from, "d MMM", { locale: tr })) : "Tarih Seçiniz"
  };

  const { data, isLoading, error } = useSites({ page, limit: 100, search });
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSiteMut = useDeleteSite();
  const { data: siteStatsData } = useSiteStats({ from: dateRange.from, to: dateRange.to });

  // Calculate Monthly Range for Card Stats (Fixed to Current Month)
  const now = new Date();
  const currentMonthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const { data: monthlyStatsData } = useSiteStats({ from: currentMonthStartStr, to: todayStr });

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

  const handleEditName = async () => {
    if (!editSite || !editName.trim()) return;
    try {
      await updateSite.mutateAsync({ id: editSite.id, data: { name: editName.trim() } });
      toast({ title: "Başarılı", description: `Site ismi güncellendi: ${editName.trim()}` });
      setEditSite(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Hata", description: err.message });
    }
  };

  const handleToggleActive = async (site: Site) => {
    try {
      await updateSite.mutateAsync({ id: site.id, data: { is_active: !site.is_active } });
      toast({
        title: site.is_active ? "Pasife Alındı" : "Aktif Edildi",
        description: `${site.name} ${site.is_active ? "pasif" : "aktif"} duruma getirildi.`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Hata", description: err.message });
    }
  };

  const handleDeleteSite = async () => {
    if (!deleteSiteTarget) return;
    try {
      await deleteSiteMut.mutateAsync(deleteSiteTarget.id);
      toast({ title: "Silindi", description: `${deleteSiteTarget.name} silindi.` });
      setDeleteSiteTarget(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Hata", description: err.message });
    }
  };

  // Calculate header stats from siteStatsData (Filtered by global date range)
  const globalTotalIn = siteStatsData
    ? Object.values(siteStatsData).reduce((acc, s) => acc + parseFloat(s.totalDeposit || "0"), 0)
    : 0;
  const globalTotalOut = siteStatsData
    ? Object.values(siteStatsData).reduce((acc, s) => acc + parseFloat(s.totalWithdrawal || "0"), 0)
    : 0;

  const stats = {
    total: data?.total || 0,
    active: data?.items.filter(s => s.is_active).length || 0,
    totalBalance: data?.items.reduce((acc, s) => acc + parseFloat(s.account?.balance || "0"), 0) || 0,
    totalIn: globalTotalIn,
    totalOut: globalTotalOut,
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

        <div className="relative z-10 p-4 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight mb-2 flex items-center gap-2 sm:gap-3">
                <GripVertical className="h-6 w-6 sm:h-8 sm:w-8 text-twilight-200" />
                Site Yönetimi
              </h1>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-twilight-900 hover:bg-twilight-50 font-bold px-4 py-4 sm:px-6 sm:py-6 rounded-xl sm:rounded-2xl shadow-xl transition-transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Yeni Site Ekle
            </Button>
          </div>

          {/* Glass Stats Cards Overlay */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Toplam Site", val: stats.total, sub: `${stats.active} aktif`, icon: Globe },
              { label: "Toplam Bakiye", val: formatMoney(stats.totalBalance), sub: "Anlık Durum", icon: Wallet, highlight: true },
              { label: "Toplam Giriş", val: formatMoney(stats.totalIn), sub: dateRange.label, icon: ArrowDownToLine, color: "text-emerald-300" },
              { label: "Toplam Çıkış", val: formatMoney(stats.totalOut), sub: dateRange.label, icon: ArrowUpFromLine, color: "text-rose-300" }
            ].map((stat, i) => (
              <div key={i} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10 ${stat.highlight ? 'bg-white/15' : 'bg-white/5'}`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/10">
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color || 'text-white'}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-twilight-100/70 truncate">{stat.label}</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold font-mono tracking-tight truncate">{stat.val}</div>
                {stat.sub && <div className="text-[10px] sm:text-xs text-twilight-300 mt-0.5 sm:mt-1 truncate">{stat.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Date Filter + Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-twilight-100 shadow-sm">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full md:w-[240px] justify-start text-left font-medium h-8 sm:h-9 rounded-xl border-dashed border-twilight-200 text-twilight-600 bg-white hover:bg-twilight-50 transition-colors text-xs sm:text-sm",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-twilight-400 shrink-0" />
              {date?.from ? (
                date.to ? (
                  <span className="truncate">
                    {format(date.from, "d MMM", { locale: tr })} - {format(date.to, "d MMM yyyy", { locale: tr })}
                  </span>
                ) : (
                  format(date.from, "d MMM yyyy", { locale: tr })
                )
              ) : (
                <span>Tarih filtrele</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
            <div className="flex">
              {/* Presets */}
              <div className="flex flex-col gap-0.5 p-2 border-r border-twilight-100 bg-twilight-50/50">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDate(preset.getValue());
                      setIsCalendarOpen(false);
                    }}
                    className="justify-start text-left font-medium text-[11px] h-7 px-2 hover:bg-white/80 hover:text-twilight-900 rounded-md whitespace-nowrap"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              {/* Calendar */}
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                locale={tr}
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-twilight-400 h-4 w-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim veya kod ile ara..."
              className="pl-9 h-9 text-sm border-twilight-100 w-full"
            />
          </div>
          <div className="h-6 w-px bg-twilight-100 shrink-0"></div>
          <span className="text-sm text-twilight-400 font-medium px-2 whitespace-nowrap">{data?.items.length || 0} Sonuç</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {orderedSites.map(site => (
                <SortableSiteCard
                  key={site.id}
                  site={site}
                  setCommissionSite={setCommissionSite}
                  siteStats={monthlyStatsData?.[site.id]}
                  onEditName={(s) => { setEditSite(s); setEditName(s.name); }}
                  onToggleActive={handleToggleActive}
                  onDelete={setDeleteSiteTarget}
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

      {/* Edit Name Dialog */}
      <Dialog open={!!editSite} onOpenChange={(open) => !open && setEditSite(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Site İsmini Düzenle</DialogTitle>
            <DialogDescription>Sitenin görünen adını değiştirin.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="siteName">Site Adı</Label>
            <Input
              id="siteName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-2"
              placeholder="Site adı"
              onKeyDown={(e) => e.key === "Enter" && handleEditName()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSite(null)}>İptal</Button>
            <Button onClick={handleEditName} disabled={updateSite.isPending}>
              {updateSite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSiteTarget} onOpenChange={(open) => !open && setDeleteSiteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siteyi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteSiteTarget?.name}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
              İşlem kaydı bulunan siteler silinemez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSite} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteSiteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <div className={`flex flex-col p-2 sm:p-3 rounded-lg sm:rounded-xl border border-transparent hover:border-twilight-100 transition-colors ${bg}`}>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[10px] font-bold text-twilight-500 uppercase">{label}</span>
        <Icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${color}`} />
      </div>
      <span className={`text-xs sm:text-sm font-bold font-mono ${color}`}>{val}</span>
    </div>
  );
}
