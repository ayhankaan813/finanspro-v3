"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TransactionFilters, INITIAL_FILTERS, FilterState } from "@/components/transactions/TransactionFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/utils";
import {
  useTransactions,
  useSites,
  usePartners,
  useFinanciers,
  useExternalParties,
  useDeliveryTypes,
  useCreateDeposit,
  useCreateWithdrawal,
  useCreatePayment,
  useCreateTopUp,
  useCreateDelivery,
  useCreatePartnerPayment,
  useCreateFinancierTransfer,
  useCreateExternalDebt,
  useCreateExternalPayment,
  useCreateOrgExpense,
  useCreateOrgIncome,
  useCreateOrgWithdraw,
  useReverseTransaction,
  Transaction,
} from "@/hooks/use-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  PiggyBank,
  Package,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Plus,
  X,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  UserPlus,
  UserMinus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Building2,
  Users,
  CreditCard,
  Briefcase,
  CheckCircle,
  Loader2,
  LayoutGrid,
  Banknote,
  Repeat,
  Eye,
  RotateCcw,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

// ===== TRANSACTION CONFIG & TABS =====

type TransactionType =
  | "DEPOSIT" | "WITHDRAWAL" | "TOP_UP" | "DELIVERY"  // Main
  | "PAYMENT" | "PARTNER_PAYMENT" | "EXTERNAL_DEBT_IN" | "EXTERNAL_DEBT_OUT" | "EXTERNAL_PAYMENT" // Payments/Debt
  | "ORG_EXPENSE" | "ORG_INCOME" | "ORG_WITHDRAW" | "FINANCIER_TRANSFER"; // Org

interface TransactionAction {
  id: TransactionType;
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  color: string;
}

const TABS = [
  { id: "main", label: "Ana İşlemler", icon: LayoutGrid },
  { id: "payments", label: "Ödeme & Borç", icon: Banknote },
  { id: "org", label: "Organizasyon", icon: Building2 },
];

const ACTIONS_BY_TAB: Record<string, TransactionAction[]> = {
  main: [
    {
      id: "DEPOSIT",
      name: "Yatırım",
      description: "Oyuncu sitede para yatırdı. Komisyon kesintisi otomatik yapılır.",
      icon: ArrowDownCircle,
      gradient: "from-emerald-500 to-emerald-600",
      color: "emerald"
    },
    {
      id: "WITHDRAWAL",
      name: "Çekim",
      description: "Oyuncu siteden kazancını çekiyor. Komisyon otomatik hesaplanır.",
      icon: ArrowUpCircle,
      gradient: "from-rose-500 to-rose-600",
      color: "rose"
    },
    {
      id: "DELIVERY",
      name: "Teslim",
      description: "Site'ye nakit/kripto teslimatı. Teslimat komisyonu uygulanır.",
      icon: Package,
      gradient: "from-violet-500 to-violet-600",
      color: "violet"
    },
    {
      id: "TOP_UP",
      name: "Takviye",
      description: "Partner açık kapattı veya organizasyon kasaya para ekledi.",
      icon: PiggyBank,
      gradient: "from-amber-500 to-amber-600",
      color: "amber"
    },
  ],
  payments: [
    {
      id: "PAYMENT",
      name: "Genel Ödeme",
      description: "Reklam, maaş, kira vb. ödemeler. Site/Partner/Org/Dış kişi adına.",
      icon: Send,
      gradient: "from-blue-500 to-blue-600",
      color: "blue"
    },
    {
      id: "PARTNER_PAYMENT",
      name: "Partner Ödemesi",
      description: "Partner'a haftalık/aylık komisyon hak ediş ödemesi yapılıyor.",
      icon: Users,
      gradient: "from-indigo-500 to-indigo-600",
      color: "indigo"
    },
    {
      id: "EXTERNAL_DEBT_IN",
      name: "Dış Borç Al",
      description: "Dış kişiden (arkadaş, akraba) borç para alınıyor.",
      icon: UserPlus,
      gradient: "from-cyan-500 to-cyan-600",
      color: "cyan"
    },
    {
      id: "EXTERNAL_DEBT_OUT",
      name: "Dış Borç Ver",
      description: "Dış kişiye (arkadaş, akraba) borç para veriliyor.",
      icon: UserMinus,
      gradient: "from-pink-500 to-pink-600",
      color: "pink"
    },
    {
      id: "EXTERNAL_PAYMENT",
      name: "Borç Kapama",
      description: "Dış kişiye olan borcun ödenmesi veya alacağın tahsili.",
      icon: Receipt,
      gradient: "from-orange-500 to-orange-600",
      color: "orange"
    },
  ],
  org: [
    {
      id: "ORG_EXPENSE",
      name: "Org Gider",
      description: "Ofis kirası, elektrik, su, internet vb. organizasyon giderleri.",
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      color: "red"
    },
    {
      id: "ORG_INCOME",
      name: "Org Gelir",
      description: "Danışmanlık, faiz geliri vb. organizasyona gelen gelirler.",
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      color: "green"
    },
    {
      id: "ORG_WITHDRAW",
      name: "Hak Ediş Çekimi",
      description: "Organizasyon kârından sahiplere pay dağıtımı yapılıyor.",
      icon: Wallet,
      gradient: "from-purple-500 to-purple-600",
      color: "purple"
    },
    {
      id: "FINANCIER_TRANSFER",
      name: "Kasa Transferi",
      description: "Bir kasadan diğerine para transferi (örn: Emre → Mehmet).",
      icon: ArrowLeftRight,
      gradient: "from-slate-500 to-slate-600",
      color: "slate"
    },
  ]
};

const ALL_ACTIONS = Object.values(ACTIONS_BY_TAB).flat();

// ===== HELPER FUNCTIONS =====

const getTransactionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    DEPOSIT: 'Yatirim',
    WITHDRAWAL: 'Cekim',
    PAYMENT: 'Odeme',
    TOP_UP: 'Takviye',
    DELIVERY: 'Teslimat',
    PARTNER_PAYMENT: 'Partner Odemesi',
    EXTERNAL_DEBT_IN: 'Borc Alindi',
    EXTERNAL_DEBT_OUT: 'Borc Verildi',
    EXTERNAL_PAYMENT: 'Dis Odeme',
    ORG_EXPENSE: 'Org. Gideri',
    ORG_INCOME: 'Org. Geliri',
    ORG_WITHDRAW: 'Hak Edis',
    FINANCIER_TRANSFER: 'Kasa Transferi',
    ADJUSTMENT: 'Duzeltme',
    REVERSAL: 'Iptal',
  };
  return labels[type] || type;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-emerald-100 text-emerald-700 border-0">Tamamlandi</Badge>;
    case 'REVERSED':
      return <Badge className="bg-rose-100 text-rose-700 border-0">Iptal Edildi</Badge>;
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-700 border-0">Bekliyor</Badge>;
    case 'FAILED':
      return <Badge className="bg-gray-100 text-gray-700 border-0">Basarisiz</Badge>;
    default:
      return <Badge className="bg-twilight-100 text-twilight-700 border-0">{status}</Badge>;
  }
};

// ===== MODAL COMPONENT =====

function NewTransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("main");
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [formData, setFormData] = useState({
    site_id: "",
    partner_id: "",
    financier_id: "",
    from_financier_id: "",
    to_financier_id: "",
    external_party_id: "",
    amount: "",
    description: "",
    reference_id: "",
    source_type: "" as "SITE" | "PARTNER" | "EXTERNAL_PARTY" | "ORGANIZATION" | "",
    source_id: "",
    topup_source_type: "" as "PARTNER" | "ORGANIZATION" | "EXTERNAL" | "",
    topup_source_id: "",
    delivery_type_id: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data Hooks
  const { data: sites } = useSites({ limit: 100 });
  const { data: partners } = usePartners({ limit: 100 });
  const { data: financiers } = useFinanciers({ limit: 100 });
  const { data: externalParties } = useExternalParties({ limit: 100 });
  const { data: deliveryTypes } = useDeliveryTypes();

  // Mutation Hooks
  const mutations = {
    DEPOSIT: useCreateDeposit(),
    WITHDRAWAL: useCreateWithdrawal(),
    PAYMENT: useCreatePayment(),
    TOP_UP: useCreateTopUp(),
    DELIVERY: useCreateDelivery(),
    PARTNER_PAYMENT: useCreatePartnerPayment(),
    FINANCIER_TRANSFER: useCreateFinancierTransfer(),
    EXTERNAL_DEBT_IN: useCreateExternalDebt(), // Handled specially
    EXTERNAL_DEBT_OUT: useCreateExternalDebt(), // Handled specially
    EXTERNAL_PAYMENT: useCreateExternalPayment(),
    ORG_EXPENSE: useCreateOrgExpense(),
    ORG_INCOME: useCreateOrgIncome(),
    ORG_WITHDRAW: useCreateOrgWithdraw(),
  };

  const isPending = Object.values(mutations).some(m => m.isPending);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setFormData({
        site_id: "", partner_id: "", financier_id: "", from_financier_id: "", to_financier_id: "",
        external_party_id: "", amount: "", description: "", reference_id: "",
        source_type: "", source_id: "", topup_source_type: "", topup_source_id: "", delivery_type_id: ""
      });
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedType) return;

    try {
      // Logic mapping
      if (selectedType === "DEPOSIT") await mutations.DEPOSIT.mutateAsync({ ...formData, description: formData.description || undefined });
      else if (selectedType === "WITHDRAWAL") await mutations.WITHDRAWAL.mutateAsync({ ...formData, description: formData.description || undefined });
      else if (selectedType === "PAYMENT") {
        if (!formData.source_type) throw new Error("Kaynak tipi seçin");
        await mutations.PAYMENT.mutateAsync({
          source_type: formData.source_type,
          source_id: formData.source_type === "ORGANIZATION" ? undefined : formData.source_id,
          financier_id: formData.financier_id,
          amount: formData.amount,
          description: formData.description || undefined
        });
      }
      else if (selectedType === "TOP_UP") {
        if (!formData.topup_source_type) throw new Error("Kaynak tipi seçin");
        await mutations.TOP_UP.mutateAsync({
          source_type: formData.topup_source_type,
          source_id: formData.topup_source_type === "EXTERNAL" ? undefined : formData.topup_source_id,
          financier_id: formData.financier_id,
          amount: formData.amount,
          description: formData.description || undefined
        });
      }
      else if (selectedType === "DELIVERY") {
        if (!formData.delivery_type_id) throw new Error("Teslimat türü seçin");
        await mutations.DELIVERY.mutateAsync({ ...formData, delivery_type_id: formData.delivery_type_id, description: formData.description || undefined });
      }
      else if (selectedType === "FINANCIER_TRANSFER") await mutations.FINANCIER_TRANSFER.mutateAsync({ ...formData, description: formData.description || undefined });
      else if (selectedType === "EXTERNAL_DEBT_IN") await mutations.EXTERNAL_DEBT_IN.mutateAsync({ ...formData, direction: "in", description: formData.description || undefined });
      else if (selectedType === "EXTERNAL_DEBT_OUT") await mutations.EXTERNAL_DEBT_IN.mutateAsync({ ...formData, direction: "out", description: formData.description || undefined }); // Using same mutation hook but logic handles it
      else if (selectedType === "EXTERNAL_PAYMENT") await mutations.EXTERNAL_PAYMENT.mutateAsync({ ...formData, description: formData.description || undefined });
      else if (selectedType === "PARTNER_PAYMENT") await mutations.PARTNER_PAYMENT.mutateAsync({ partner_id: formData.partner_id, financier_id: formData.financier_id, amount: formData.amount, description: formData.description || undefined });
      else if (selectedType === "ORG_EXPENSE") await mutations.ORG_EXPENSE.mutateAsync({ ...formData, description: formData.description || undefined });
      else if (selectedType === "ORG_INCOME") await mutations.ORG_INCOME.mutateAsync({ ...formData, description: formData.description || undefined });
      else if (selectedType === "ORG_WITHDRAW") await mutations.ORG_WITHDRAW.mutateAsync({ ...formData, description: formData.description || undefined });

      setSuccess(true);
      toast({
        title: "İşlem Başarılı ✓",
        description: `${currentAction?.name || "İşlem"} başarıyla oluşturuldu.`,
        variant: "success",
      });
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "İşlem başarısız");
      toast({
        title: "Hata",
        description: err.message || "İşlem oluşturulamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  const currentAction = ALL_ACTIONS.find(a => a.id === selectedType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-twilight-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-twilight-950 px-8 py-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-twilight-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-twilight-800 flex items-center justify-center border border-twilight-700 shadow-lg">
                <Sparkles className="h-6 w-6 text-twilight-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Yeni İşlem</h2>
                <p className="text-twilight-400 text-sm">Finansal hareket kaydı oluşturun</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-twilight-900 mb-2">İşlem Başarılı!</h3>
            <p className="text-twilight-500">Kayıt başarıyla oluşturuldu, yönlendiriliyorsunuz...</p>
          </div>
        ) : !selectedType ? (
          // TYPE SELECTION
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs Header - Premium Style */}
            <div className="px-8 pt-6 pb-4 bg-gradient-to-b from-twilight-50/50 to-white">
              <div className="flex gap-2 p-1.5 bg-twilight-100/60 rounded-2xl backdrop-blur-sm">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-semibold rounded-xl transition-all ${activeTab === tab.id
                      ? "bg-white text-twilight-900 shadow-lg shadow-twilight-200/50 scale-[1.02]"
                      : "text-twilight-500 hover:text-twilight-700 hover:bg-white/40"
                      }`}
                  >
                    <tab.icon className="h-4.5 w-4.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Content - Larger Cards */}
            <div className="p-8 overflow-y-auto bg-gradient-to-b from-white to-twilight-50/30 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {ACTIONS_BY_TAB[activeTab].map(action => (
                  <button
                    key={action.id}
                    onClick={() => setSelectedType(action.id)}
                    className="group relative flex items-start gap-5 p-6 bg-white rounded-2xl border-2 border-twilight-100 shadow-sm hover:shadow-xl hover:border-twilight-300 hover:-translate-y-1 transition-all duration-200 text-left"
                  >
                    {/* Icon */}
                    <div className={`h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-lg text-twilight-900 mb-1.5 group-hover:text-twilight-950">{action.name}</h3>
                      <p className="text-sm text-twilight-600 leading-relaxed">{action.description}</p>
                    </div>

                    {/* Arrow hint */}
                    <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-5 w-5 text-twilight-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // FORM
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-4 px-8 py-4 border-b border-twilight-100 bg-white">
              <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)} className="-ml-2 gap-2 text-twilight-600">
                <ChevronLeft className="h-4 w-4" />
                Geri Dön
              </Button>
              <div className="h-6 w-px bg-twilight-200" />
              <div className="flex items-center gap-2">
                {currentAction && (
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${currentAction.gradient} flex items-center justify-center`}>
                    <currentAction.icon className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className="font-bold text-twilight-900">{currentAction?.name}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 bg-twilight-50/30">
              <div className="max-w-2xl mx-auto space-y-6">

                {/* Amount Input */}
                <div className="bg-white p-6 rounded-2xl border border-twilight-200 shadow-sm space-y-2">
                  <Label className="text-twilight-600 font-medium">İşlem Tutarı</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-twilight-300">₺</span>
                    <Input
                      placeholder="0,00"
                      className="pl-10 h-16 text-3xl font-bold border-twilight-200 rounded-xl focus:ring-twilight-500"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      autoFocus
                      required
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Dynamic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                  {/* Financier Selection (Required for most) */}
                  {selectedType !== "FINANCIER_TRANSFER" && (
                    <div className="space-y-2">
                      <Label>Hangi Kasadan/Kasaya?</Label>
                      <Select value={formData.financier_id} onValueChange={v => setFormData({ ...formData, financier_id: v })} required>
                        <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Kasa Seçin" /></SelectTrigger>
                        <SelectContent>
                          {financiers?.items.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name} ({formatMoney(parseFloat(f.account?.balance || "0"))})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Site Selection */}
                  {["DEPOSIT", "WITHDRAWAL", "DELIVERY"].includes(selectedType) && (
                    <div className="space-y-2">
                      <Label>Hangi Site?</Label>
                      <Select value={formData.site_id} onValueChange={v => setFormData({ ...formData, site_id: v })} required>
                        <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Site Seçin" /></SelectTrigger>
                        <SelectContent>
                          {sites?.items.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Delivery Type */}
                  {selectedType === "DELIVERY" && (
                    <div className="space-y-2">
                      <Label>Teslimat Yöntemi</Label>
                      <Select value={formData.delivery_type_id} onValueChange={v => setFormData({ ...formData, delivery_type_id: v })} required>
                        <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Yöntem Seçin" /></SelectTrigger>
                        <SelectContent>
                          {deliveryTypes?.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Partner Selection */}
                  {selectedType === "PARTNER_PAYMENT" && (
                    <div className="space-y-2">
                      <Label>Hangi Partner?</Label>
                      <Select value={formData.partner_id} onValueChange={v => setFormData({ ...formData, partner_id: v })} required>
                        <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Partner Seçin" /></SelectTrigger>
                        <SelectContent>
                          {partners?.items.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* External Debt Party */}
                  {["EXTERNAL_DEBT_IN", "EXTERNAL_DEBT_OUT", "EXTERNAL_PAYMENT"].includes(selectedType) && (
                    <div className="space-y-2">
                      <Label>Dış Kişi</Label>
                      <Select value={formData.external_party_id} onValueChange={v => setFormData({ ...formData, external_party_id: v })} required>
                        <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Kişi Seçin" /></SelectTrigger>
                        <SelectContent>
                          {externalParties?.items.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Payment Source Type */}
                  {selectedType === "PAYMENT" && (
                    <>
                      <div className="space-y-2">
                        <Label>Kimin Adına?</Label>
                        <Select value={formData.source_type} onValueChange={v => setFormData({ ...formData, source_type: v as any, source_id: "" })} required>
                          <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Tip Seçin" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SITE">Site</SelectItem>
                            <SelectItem value="PARTNER">Partner</SelectItem>
                            <SelectItem value="EXTERNAL_PARTY">Dış Kişi</SelectItem>
                            <SelectItem value="ORGANIZATION">Organizasyon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.source_type && formData.source_type !== "ORGANIZATION" && (
                        <div className="space-y-2">
                          <Label>Kaynak Seçimi</Label>
                          <Select value={formData.source_id} onValueChange={v => setFormData({ ...formData, source_id: v })} required>
                            <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                            <SelectContent>
                              {formData.source_type === "SITE" && sites?.items.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                              {formData.source_type === "PARTNER" && partners?.items.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                              {formData.source_type === "EXTERNAL_PARTY" && externalParties?.items.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Top Up Source */}
                  {selectedType === "TOP_UP" && (
                    <>
                      <div className="space-y-2">
                        <Label>Takviye Kaynağı</Label>
                        <Select value={formData.topup_source_type} onValueChange={v => setFormData({ ...formData, topup_source_type: v as any, topup_source_id: "" })} required>
                          <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Kaynak Tipi" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PARTNER">Partner</SelectItem>
                            <SelectItem value="ORGANIZATION">Organizasyon</SelectItem>
                            <SelectItem value="EXTERNAL">Dış Kaynak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.topup_source_type === "PARTNER" && (
                        <div className="space-y-2">
                          <Label>Partner Seçin</Label>
                          <Select value={formData.topup_source_id} onValueChange={v => setFormData({ ...formData, topup_source_id: v })} required>
                            <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Partner..." /></SelectTrigger>
                            <SelectContent>
                              {partners?.items.map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Transfer Specifics */}
                  {selectedType === "FINANCIER_TRANSFER" && (
                    <>
                      <div className="space-y-2">
                        <Label>Çıkış Kasası</Label>
                        <Select value={formData.from_financier_id} onValueChange={v => setFormData({ ...formData, from_financier_id: v })} required>
                          <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Seçin" /></SelectTrigger>
                          <SelectContent>
                            {financiers?.items.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giriş Kasası</Label>
                        <Select value={formData.to_financier_id} onValueChange={v => setFormData({ ...formData, to_financier_id: v })} required>
                          <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Seçin" /></SelectTrigger>
                          <SelectContent>
                            {financiers?.items.filter(f => f.id !== formData.from_financier_id).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-twilight-600">Açıklama (Opsiyonel)</Label>
                  <Textarea
                    placeholder="İşlem detayı..."
                    className="resize-none bg-white border-twilight-200 rounded-xl"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl border-twilight-200 hover:bg-twilight-50 text-twilight-700">İptal</Button>
                  <Button type="submit" disabled={isPending} className="flex-[2] h-12 rounded-xl bg-twilight-600 hover:bg-twilight-500 text-white shadow-lg shadow-twilight-900/10">
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "İşlemi Tamamla"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [expandedReversals, setExpandedReversals] = useState<Set<string>>(new Set());
  const reverseTransaction = useReverseTransaction();
  const limit = 20;

  const { data: sites } = useSites({ page: 1, limit: 100 });
  const { data: partners } = usePartners({ page: 1, limit: 100 });
  const { data: financiers } = useFinanciers({ page: 1, limit: 100 });

  const { data: transactionsData, isLoading } = useTransactions({
    page,
    limit,
    search: filters.search || searchTerm, // Search can come from header or filter
    type: filters.type || undefined,
    status: filters.status || undefined,
    site_id: filters.site_id || undefined,
    partner_id: filters.partner_id || undefined,
    financier_id: filters.financier_id || undefined,
    date_from: filters.start_date || undefined,
    date_to: filters.end_date || undefined,
    min_amount: filters.min_amount || undefined,
    max_amount: filters.max_amount || undefined,
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length - (filters.search ? 1 : 0);

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchTerm("");
  };

  const toggleReversalDetails = (transactionId: string) => {
    setExpandedReversals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <NewTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <TransactionFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        data={{
          sites: sites?.items || [],
          partners: partners?.items || [],
          financiers: financiers?.items || [],
        }}
      />

      {/* Header Area with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-twilight-900 tracking-tight">İşlem Yönetimi</h1>
          <p className="text-twilight-500">Tüm finansal transferlerinizi tek yerden yönetin.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-twilight-200 text-twilight-700 hover:bg-twilight-50">
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-twilight-950 hover:bg-twilight-800 text-white shadow-lg shadow-twilight-900/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni İşlem
          </Button>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-twilight-400" />
          <Input
            placeholder="İşlem kodu, açıklama veya tutar ara..."
            className="pl-10 h-11 rounded-xl border-twilight-200 bg-white focus:ring-2 focus:ring-twilight-400 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Quick Type Filters */}
        <div className="hidden md:flex bg-white p-1 rounded-xl border border-twilight-200 shadow-sm">
          {["", "DEPOSIT", "WITHDRAWAL"].map((type) => (
            <button
              key={type}
              onClick={() => setFilters({ ...filters, type })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.type === type
                  ? "bg-twilight-900 text-white shadow-md"
                  : "text-twilight-600 hover:text-twilight-900 hover:bg-twilight-50"
                }`}
            >
              {type === "" ? "Tümü" : type === "DEPOSIT" ? "Yatırım" : "Çekim"}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowFilters(true)}
          className={`h-11 px-5 rounded-xl border transition-all ${activeFilterCount > 0
              ? "bg-twilight-900 text-white border-twilight-900 hover:bg-twilight-800 shadow-lg shadow-twilight-900/20"
              : "bg-white text-twilight-700 border-twilight-200 hover:bg-twilight-50 hover:border-twilight-300"
            }`}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtreler
          {activeFilterCount > 0 && (
            <span className="ml-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Transactions List */}
      <Card className="border-0 shadow-xl shadow-twilight-100/50 bg-white rounded-3xl overflow-hidden ring-1 ring-twilight-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-twilight-100 bg-twilight-50/50">
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Islem Turu</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Durum</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Site</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Finansor</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Partner / Kisi</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Aciklama</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Tarih</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-twilight-500 uppercase tracking-wider">Tutar</th>
                <th className="w-14"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-twilight-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-twilight-200 border-t-twilight-600 rounded-full mx-auto" />
                  </td>
                </tr>
              ) : transactionsData?.items.map((t) => {
                const isReversed = t.status === 'REVERSED';
                const isExpanded = expandedReversals.has(t.id);

                // Hide REVERSAL transactions - only show original reversed transactions
                if (t.type === 'REVERSAL') {
                  return null;
                }

                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`group transition-colors ${
                        isReversed
                          ? 'bg-rose-50/30 hover:bg-rose-50/50 border-l-4 border-rose-400'
                          : 'hover:bg-twilight-50/30'
                      }`}
                      onClick={() => isReversed && toggleReversalDetails(t.id)}
                      style={{ cursor: isReversed ? 'pointer' : 'default' }}
                    >
                      {/* Islem Turu */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isReversed ? 'bg-rose-100 text-rose-600' :
                            t.type === 'DEPOSIT' || t.type === 'TOP_UP' ? 'bg-emerald-100 text-emerald-600' :
                            t.type === 'WITHDRAWAL' || t.type === 'PAYMENT' ? 'bg-rose-100 text-rose-600' :
                            t.type === 'REVERSAL' ? 'bg-amber-100 text-amber-600' :
                            'bg-twilight-100 text-twilight-600'
                          }`}>
                            {isReversed ? <RotateCcw className="h-4 w-4" /> :
                             t.type === 'DEPOSIT' || t.type === 'TOP_UP' ? <ArrowDownLeft className="h-4 w-4" /> :
                             t.type === 'WITHDRAWAL' || t.type === 'PAYMENT' ? <ArrowUpRight className="h-4 w-4" /> :
                             <Send className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isReversed ? 'text-rose-700 line-through' : 'text-twilight-900'}`}>
                              {getTransactionTypeLabel(t.type)}
                            </p>
                            <p className="text-[10px] text-twilight-400 font-mono">{t.id.slice(0, 8)}</p>
                          </div>
                          {isReversed && (
                            <ChevronDown
                              className={`h-4 w-4 text-rose-500 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Durum */}
                      <td className="py-3 px-4">
                        {isReversed ? (
                          <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-300">
                            🚫 İptal Edildi
                          </Badge>
                        ) : getStatusBadge(t.status)}
                      </td>

                      {/* Site */}
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${isReversed ? 'text-twilight-500 line-through' : 'text-twilight-700'}`}>
                          {t.site?.name || '\u2014'}
                        </span>
                        {t.site?.code && <p className="text-[10px] text-twilight-400">{t.site.code}</p>}
                      </td>

                      {/* Finansor */}
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${isReversed ? 'text-twilight-500 line-through' : 'text-twilight-700'}`}>
                          {t.financier?.name || '\u2014'}
                        </span>
                      </td>

                      {/* Partner / Dis Kisi */}
                      <td className="py-3 px-4">
                        {t.partner ? (
                          <span className={`text-sm font-medium ${isReversed ? 'text-twilight-500 line-through' : 'text-twilight-700'}`}>
                            {t.partner.name}
                          </span>
                        ) : t.external_party ? (
                          <span className={`text-sm font-medium ${isReversed ? 'text-twilight-500 line-through' : 'text-purple-700'}`}>
                            {t.external_party.name}
                          </span>
                        ) : (
                          <span className="text-sm text-twilight-300">{'\u2014'}</span>
                        )}
                      </td>

                      {/* Aciklama */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className={`text-sm truncate ${isReversed ? 'text-twilight-500 line-through' : 'text-twilight-600'}`}>
                          {t.description || '\u2014'}
                        </p>
                      </td>

                      {/* Tarih */}
                      <td className="py-3 px-4">
                        <p className={`text-sm whitespace-nowrap ${isReversed ? 'text-twilight-500' : 'text-twilight-600'}`}>
                          {format(new Date(t.transaction_date), "d MMM yyyy", { locale: tr })}
                        </p>
                        <p className="text-[10px] text-twilight-400">
                          {format(new Date(t.transaction_date), "HH:mm", { locale: tr })}
                        </p>
                      </td>

                      {/* Tutar */}
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-bold ${
                          isReversed ? 'text-rose-600 line-through' :
                          t.type === 'DEPOSIT' || t.type === 'TOP_UP' || t.type === 'ORG_INCOME' || t.type === 'EXTERNAL_DEBT_IN'
                            ? 'text-emerald-700' :
                          t.type === 'WITHDRAWAL' || t.type === 'PAYMENT' || t.type === 'ORG_EXPENSE' || t.type === 'EXTERNAL_DEBT_OUT'
                            ? 'text-rose-700' :
                            'text-twilight-700'
                        }`}>
                          {formatMoney(parseFloat(t.gross_amount || "0"))}
                        </span>
                        {t.net_amount && t.net_amount !== t.gross_amount && (
                          <p className="text-[10px] text-twilight-400">Net: {formatMoney(parseFloat(t.net_amount))}</p>
                        )}
                      </td>

                      {/* 3 Nokta Menu */}
                      <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-twilight-400 hover:text-twilight-700">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => { setSelectedTransaction(t); setShowDetail(true); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Detay Goruntule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setSelectedTransaction(t); setShowReverseDialog(true); }}
                              disabled={t.status === 'REVERSED' || t.status === 'FAILED'}
                              className="text-rose-600 focus:text-rose-600"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Islemi Iptal Et
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>

                    {/* Accordion: Reversal Details */}
                    {isReversed && isExpanded && (
                      <tr className="bg-rose-50/50">
                        <td colSpan={9} className="py-4 px-6">
                          <div className="bg-white rounded-xl border-2 border-rose-200 p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-5 w-5 text-rose-600" />
                              <h4 className="font-bold text-rose-900">İptal Detayları</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-twilight-500 font-medium mb-1">İptal Tarihi</p>
                                <p className="text-twilight-900 font-semibold">
                                  {t.reversed_at ? format(new Date(t.reversed_at), "d MMM yyyy HH:mm", { locale: tr }) : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-twilight-500 font-medium mb-1">İptal Nedeni</p>
                                <p className="text-rose-700 font-semibold">{t.reversal_reason || '—'}</p>
                              </div>
                              <div>
                                <p className="text-twilight-500 font-medium mb-1">Orijinal İşlem ID</p>
                                <p className="text-twilight-900 font-mono text-xs">{t.id}</p>
                              </div>
                              <div>
                                <p className="text-twilight-500 font-medium mb-1">İşlem Tutarı</p>
                                <p className="text-twilight-900 font-bold">{formatMoney(parseFloat(t.gross_amount || "0"))}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-rose-200">
                              <p className="text-xs text-twilight-500 italic">
                                Bu işlem iptal edilmiştir. Tüm finansal hareketler geri alınmıştır.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-twilight-100 p-4 flex items-center justify-between">
          <span className="text-sm text-twilight-500">
            Toplam {transactionsData?.total || 0} islem
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!transactionsData?.hasNext}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent className="w-[450px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-twilight-900">Islem Detayi</SheetTitle>
          </SheetHeader>
          {selectedTransaction && (
            <div className="mt-6 space-y-6">
              {/* Durum ve Tur */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedTransaction.type === 'DEPOSIT' || selectedTransaction.type === 'TOP_UP' ? 'bg-emerald-100 text-emerald-600' :
                    selectedTransaction.type === 'WITHDRAWAL' || selectedTransaction.type === 'PAYMENT' ? 'bg-rose-100 text-rose-600' :
                      'bg-twilight-100 text-twilight-600'
                    }`}>
                    {selectedTransaction.type === 'DEPOSIT' || selectedTransaction.type === 'TOP_UP' ? <ArrowDownLeft className="h-6 w-6" /> :
                      selectedTransaction.type === 'WITHDRAWAL' || selectedTransaction.type === 'PAYMENT' ? <ArrowUpRight className="h-6 w-6" /> :
                        <Send className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-twilight-900">{getTransactionTypeLabel(selectedTransaction.type)}</p>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
              </div>

              {/* Tutar Bilgileri */}
              <div className="bg-twilight-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-twilight-500">Brut Tutar</span>
                  <span className="font-bold text-twilight-900">{formatMoney(parseFloat(selectedTransaction.gross_amount || "0"))}</span>
                </div>
                {selectedTransaction.net_amount && selectedTransaction.net_amount !== selectedTransaction.gross_amount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-twilight-500">Net Tutar</span>
                    <span className="font-bold text-emerald-700">{formatMoney(parseFloat(selectedTransaction.net_amount))}</span>
                  </div>
                )}
                {selectedTransaction.commission_snapshot && (
                  <>
                    <div className="border-t border-twilight-200 pt-2 mt-2">
                      <p className="text-xs text-twilight-400 font-semibold mb-1">Komisyon Detayi</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-twilight-500">Site Komisyonu</span>
                        <span className="text-twilight-700">{formatMoney(parseFloat(selectedTransaction.commission_snapshot.site_commission_amount || "0"))}</span>
                      </div>
                      {selectedTransaction.commission_snapshot.partner_commission_amount && (
                        <div className="flex justify-between text-xs">
                          <span className="text-twilight-500">Partner Komisyonu</span>
                          <span className="text-twilight-700">{formatMoney(parseFloat(selectedTransaction.commission_snapshot.partner_commission_amount))}</span>
                        </div>
                      )}
                      {selectedTransaction.commission_snapshot.financier_commission_amount && (
                        <div className="flex justify-between text-xs">
                          <span className="text-twilight-500">Finansor Komisyonu</span>
                          <span className="text-twilight-700">{formatMoney(parseFloat(selectedTransaction.commission_snapshot.financier_commission_amount))}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-twilight-500">Organizasyon</span>
                        <span className="text-twilight-700">{formatMoney(parseFloat(selectedTransaction.commission_snapshot.organization_amount || "0"))}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Ilgili Taraflar */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-twilight-700">Ilgili Taraflar</p>
                {selectedTransaction.site && (
                  <div className="flex justify-between items-center py-2 border-b border-twilight-100">
                    <span className="text-sm text-twilight-500">Site</span>
                    <span className="text-sm font-medium text-twilight-900">{selectedTransaction.site.name} ({selectedTransaction.site.code})</span>
                  </div>
                )}
                {selectedTransaction.financier && (
                  <div className="flex justify-between items-center py-2 border-b border-twilight-100">
                    <span className="text-sm text-twilight-500">Finansor</span>
                    <span className="text-sm font-medium text-twilight-900">{selectedTransaction.financier.name}</span>
                  </div>
                )}
                {selectedTransaction.partner && (
                  <div className="flex justify-between items-center py-2 border-b border-twilight-100">
                    <span className="text-sm text-twilight-500">Partner</span>
                    <span className="text-sm font-medium text-twilight-900">{selectedTransaction.partner.name} ({selectedTransaction.partner.code})</span>
                  </div>
                )}
                {selectedTransaction.external_party && (
                  <div className="flex justify-between items-center py-2 border-b border-twilight-100">
                    <span className="text-sm text-twilight-500">Dis Kisi</span>
                    <span className="text-sm font-medium text-purple-700">{selectedTransaction.external_party.name}</span>
                  </div>
                )}
                {selectedTransaction.category && (
                  <div className="flex justify-between items-center py-2 border-b border-twilight-100">
                    <span className="text-sm text-twilight-500">Kategori</span>
                    <Badge style={{ backgroundColor: selectedTransaction.category.color + '20', color: selectedTransaction.category.color }}>{selectedTransaction.category.name}</Badge>
                  </div>
                )}
                {selectedTransaction.delivery_type && (
                  <div className="flex justify-between items-center py-2 border-b border-twilight-100">
                    <span className="text-sm text-twilight-500">Teslimat Turu</span>
                    <span className="text-sm font-medium text-twilight-900">{selectedTransaction.delivery_type.name}</span>
                  </div>
                )}
              </div>

              {/* Aciklama */}
              {selectedTransaction.description && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-twilight-700">Aciklama</p>
                  <p className="text-sm text-twilight-600 bg-twilight-50 rounded-xl p-3">{selectedTransaction.description}</p>
                </div>
              )}

              {/* Iptal Bilgisi */}
              {selectedTransaction.reversed_at && (
                <div className="bg-rose-50 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <p className="text-sm font-semibold text-rose-700">Iptal Edildi</p>
                  </div>
                  {selectedTransaction.reversal_reason && (
                    <p className="text-sm text-rose-600">Neden: {selectedTransaction.reversal_reason}</p>
                  )}
                  <p className="text-xs text-rose-400">{format(new Date(selectedTransaction.reversed_at), "d MMMM yyyy, HH:mm", { locale: tr })}</p>
                </div>
              )}

              {/* Meta Bilgiler */}
              <div className="space-y-2 pt-4 border-t border-twilight-100">
                <div className="flex justify-between text-xs">
                  <span className="text-twilight-400">Islem ID</span>
                  <span className="text-twilight-500 font-mono">{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-twilight-400">Islem Tarihi</span>
                  <span className="text-twilight-500">{format(new Date(selectedTransaction.transaction_date), "d MMMM yyyy, HH:mm:ss", { locale: tr })}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-twilight-400">Olusturulma</span>
                  <span className="text-twilight-500">{format(new Date(selectedTransaction.created_at), "d MMMM yyyy, HH:mm:ss", { locale: tr })}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reverse Transaction Dialog */}
      {showReverseDialog && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-twilight-900">Islemi Iptal Et</h3>
                <p className="text-sm text-twilight-500">Bu islem geri alinamaz!</p>
              </div>
            </div>

            <div className="bg-twilight-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-twilight-500">{getTransactionTypeLabel(selectedTransaction.type)}</span>
                <span className="font-bold text-twilight-900">{formatMoney(parseFloat(selectedTransaction.gross_amount || "0"))}</span>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="reverse-reason" className="text-sm font-medium text-twilight-700">Iptal Nedeni *</Label>
              <Textarea
                id="reverse-reason"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Iptal nedenini yazin..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowReverseDialog(false); setReverseReason(""); }}>
                Vazgec
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={!reverseReason.trim() || reverseTransaction.isPending}
                onClick={async () => {
                  try {
                    await reverseTransaction.mutateAsync({ id: selectedTransaction.id, reason: reverseReason });
                    toast({
                      title: "İşlem İptal Edildi",
                      description: "İşlem başarıyla iptal edildi ve bakiyeler güncellendi.",
                      variant: "success",
                    });
                    setShowReverseDialog(false);
                    setReverseReason("");
                    setSelectedTransaction(null);
                  } catch (err: any) {
                    toast({
                      title: "İptal Hatası",
                      description: err.message || "İşlem iptal edilemedi. Lütfen tekrar deneyin.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {reverseTransaction.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Iptal Ediliyor...</>
                ) : (
                  'Iptal Et'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
