"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney, cn } from "@/lib/utils";
import {
  usePersonnelList,
  usePersonnelSummary,
  usePersonnelPayments,
  useCreatePersonnel,
  useUpdatePersonnel,
  useDeletePersonnel,
  useAddPersonnelPayment,
  Personnel,
  PersonnelPayment,
} from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

import {
  Users,
  Plus,
  ArrowLeft,
  Phone,
  Calendar,
  Loader2,
  Wallet,
  TrendingUp,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Briefcase,
  Clock,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"
];

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  SALARY: "Maas",
  ADVANCE: "Avans",
  BONUS: "Prim",
  OTHER: "Diger",
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  SALARY: "bg-blue-100 text-blue-700 border-blue-200",
  ADVANCE: "bg-amber-100 text-amber-700 border-amber-200",
  BONUS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OTHER: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function PersonnelPage() {
  const { toast } = useToast();

  // State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addPersonnelOpen, setAddPersonnelOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [paymentPage, setPaymentPage] = useState(1);

  // Queries
  const { data: personnelList, isLoading: listLoading } = usePersonnelList();
  const { data: summary, isLoading: summaryLoading } = usePersonnelSummary();
  const { data: paymentsData, isLoading: paymentsLoading } = usePersonnelPayments(
    expandedId,
    paymentPage
  );

  // Mutations
  const createPersonnel = useCreatePersonnel();
  const updatePersonnel = useUpdatePersonnel();
  const deletePersonnel = useDeletePersonnel();
  const addPayment = useAddPersonnelPayment();

  // Add Personnel Form State
  const [newPersonnel, setNewPersonnel] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
    monthly_salary: "",
    start_date: "",
    notes: "",
  });

  // Add Payment Form State
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_type: "SALARY" as 'SALARY' | 'ADVANCE' | 'BONUS' | 'OTHER',
    payment_date: new Date().toISOString().split("T")[0],
    period_month: (new Date().getMonth() + 1).toString(),
    period_year: new Date().getFullYear().toString(),
    description: "",
  });

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setPaymentPage(1);
  };

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonnel.first_name || !newPersonnel.last_name || !newPersonnel.role || !newPersonnel.monthly_salary || !newPersonnel.start_date) {
      toast({ title: "Hata", description: "Lutfen zorunlu alanlari doldurun.", variant: "destructive" });
      return;
    }
    try {
      await createPersonnel.mutateAsync({
        first_name: newPersonnel.first_name,
        last_name: newPersonnel.last_name,
        phone: newPersonnel.phone || undefined,
        role: newPersonnel.role,
        monthly_salary: parseFloat(newPersonnel.monthly_salary),
        start_date: newPersonnel.start_date,
        notes: newPersonnel.notes || undefined,
      });
      toast({ title: "Basarili", description: "Personel eklendi." });
      setAddPersonnelOpen(false);
      setNewPersonnel({ first_name: "", last_name: "", phone: "", role: "", monthly_salary: "", start_date: "", notes: "" });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "Personel eklenemedi.", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (person: Personnel) => {
    try {
      await updatePersonnel.mutateAsync({
        id: person.id,
        status: person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      toast({ title: "Basarili", description: `Personel durumu guncellendi.` });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "Durum guncellenemedi.", variant: "destructive" });
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    try {
      await deletePersonnel.mutateAsync(id);
      toast({ title: "Basarili", description: "Personel silindi." });
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "Personel silinemedi.", variant: "destructive" });
    }
  };

  const handleOpenPaymentDialog = (person: Personnel) => {
    setSelectedPersonnel(person);
    setNewPayment({
      amount: "",
      payment_type: "SALARY",
      payment_date: new Date().toISOString().split("T")[0],
      period_month: (new Date().getMonth() + 1).toString(),
      period_year: new Date().getFullYear().toString(),
      description: "",
    });
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel || !newPayment.amount || !newPayment.payment_date) {
      toast({ title: "Hata", description: "Lutfen zorunlu alanlari doldurun.", variant: "destructive" });
      return;
    }
    try {
      await addPayment.mutateAsync({
        personnelId: selectedPersonnel.id,
        amount: parseFloat(newPayment.amount),
        payment_type: newPayment.payment_type,
        payment_date: newPayment.payment_date,
        period_month: parseInt(newPayment.period_month),
        period_year: parseInt(newPayment.period_year),
        description: newPayment.description || undefined,
      });
      toast({ title: "Basarili", description: "Odeme kaydedildi." });
      setPaymentDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "Odeme eklenemedi.", variant: "destructive" });
    }
  };

  const isLoading = listLoading || summaryLoading;

  // Summary cards data
  const summaryCards = [
    {
      title: "Toplam Personel",
      value: summary ? summary.totalPersonnel.toString() : "0",
      icon: Users,
      colorClass: "bg-blue-600 text-blue-600",
      isMoney: false,
    },
    {
      title: "Aylik Maas Yuku",
      value: summary ? formatMoney(summary.totalSalaryObligation) : formatMoney(0),
      icon: Wallet,
      colorClass: "bg-violet-500 text-violet-500",
      isMoney: true,
    },
    {
      title: "Bu Ay Odenen",
      value: summary ? formatMoney(summary.totalPaidThisMonth) : formatMoney(0),
      icon: TrendingUp,
      colorClass: "bg-emerald-500 text-emerald-500",
      isMoney: true,
    },
    {
      title: "Avanslar",
      value: summary ? formatMoney(summary.totalAdvances) : formatMoney(0),
      icon: CreditCard,
      colorClass: "bg-amber-500 text-amber-500",
      isMoney: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 font-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/organization">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-700 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Organizasyon</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-[#013a63] flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#013a63] to-[#2c7da0] rounded-lg sm:rounded-xl text-white shadow-lg shadow-blue-900/10">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Personel Yonetimi
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm ml-10 sm:ml-14">
            Calisanlarin maas, avans ve odeme takibi.
          </p>
        </div>

        <Button
          onClick={() => setAddPersonnelOpen(true)}
          className="gap-2 bg-gradient-to-r from-[#013a63] to-[#2c7da0] text-white hover:from-[#01497c] hover:to-[#2a6f97] shadow-lg shadow-blue-900/10 rounded-xl"
        >
          <UserPlus className="h-4 w-4" />
          Yeni Personel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 z-10">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl bg-white p-3 sm:p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div className={cn("absolute -right-6 -top-6 h-16 w-16 sm:h-24 sm:w-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150", card.colorClass)} />
            <div className="relative flex justify-between items-start">
              <div>
                <h3 className="text-[10px] sm:text-sm font-medium text-slate-500">{card.title}</h3>
                {isLoading ? (
                  <Skeleton className="my-2 h-6 sm:h-8 w-20 sm:w-32" />
                ) : (
                  <div className={cn(
                    "mt-1 sm:mt-2 text-lg sm:text-2xl font-bold tracking-tight text-[#0F172A]",
                    card.isMoney && "font-mono"
                  )}>
                    {card.value}
                  </div>
                )}
              </div>
              <div className={cn("rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 bg-slate-50 ring-1 ring-slate-100", card.colorClass.replace('bg-', 'text-').split(' ')[1])}>
                <card.icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Personnel List */}
      <div className="relative z-10 space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !personnelList?.length ? (
          <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                <Users className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">Henuz personel eklenmemis</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-sm">
                Calisan bilgilerini ekleyerek maas ve odeme takibi yapabilirsiniz.
              </p>
              <Button
                onClick={() => setAddPersonnelOpen(true)}
                className="gap-2 bg-gradient-to-r from-[#013a63] to-[#2c7da0] text-white rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Ilk Personeli Ekle
              </Button>
            </CardContent>
          </Card>
        ) : (
          personnelList.map((person) => {
            const isExpanded = expandedId === person.id;
            const salary = parseFloat(person.monthly_salary);
            const paidThisMonth = parseFloat(person.paid_this_month);
            const paymentProgress = salary > 0 ? Math.min((paidThisMonth / salary) * 100, 100) : 0;

            return (
              <Card
                key={person.id}
                className={cn(
                  "border-0 shadow-sm ring-1 transition-all",
                  isExpanded ? "ring-blue-200 shadow-lg" : "ring-slate-200 hover:shadow-md"
                )}
              >
                <CardContent className="p-0">
                  {/* Main Row */}
                  <div
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 cursor-pointer select-none"
                    onClick={() => handleToggleExpand(person.id)}
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#013a63] to-[#2c7da0] flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                      {person.first_name[0]}{person.last_name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                          {person.first_name} {person.last_name}
                        </h3>
                        <Badge
                          className={cn(
                            "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 border",
                            person.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {person.status === "ACTIVE" ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {person.role}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {person.months_employed} ay
                        </span>
                      </div>
                    </div>

                    {/* Salary & Progress (desktop) */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Aylik Maas</p>
                        <p className="font-mono font-bold text-sm text-slate-900">{formatMoney(person.monthly_salary)}</p>
                      </div>
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Bu ay odenen</span>
                          <span className="font-mono font-medium">{formatMoney(person.paid_this_month)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              paymentProgress >= 100 ? "bg-emerald-500" : paymentProgress >= 50 ? "bg-blue-500" : "bg-amber-500"
                            )}
                            style={{ width: `${paymentProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="shrink-0 text-slate-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </div>
                  </div>

                  {/* Mobile salary row */}
                  <div className="sm:hidden px-3 pb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        <span className="font-mono">{formatMoney(person.paid_this_month)}</span> / {formatMoney(person.monthly_salary)}
                      </span>
                      <span className="font-mono text-xs font-medium text-slate-600">{Math.round(paymentProgress)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          paymentProgress >= 100 ? "bg-emerald-500" : paymentProgress >= 50 ? "bg-blue-500" : "bg-amber-500"
                        )}
                        style={{ width: `${paymentProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-3 sm:p-5 space-y-4 bg-slate-50/50">
                      {/* Person Info */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <InfoCell label="Ad Soyad" value={`${person.first_name} ${person.last_name}`} />
                        <InfoCell label="Gorev" value={person.role} />
                        <InfoCell label="Telefon" value={person.phone || "-"} />
                        <InfoCell label="Baslangic" value={new Date(person.start_date).toLocaleDateString("tr-TR")} />
                        <InfoCell label="Aylik Maas" value={formatMoney(person.monthly_salary)} mono />
                        <InfoCell label="Toplam Odenen" value={formatMoney(person.total_paid)} mono />
                        <InfoCell label="Bu Ay Odenen" value={formatMoney(person.paid_this_month)} mono />
                        <InfoCell label="Calisma Suresi" value={`${person.months_employed} ay`} />
                      </div>

                      {person.notes && (
                        <div className="text-xs text-slate-500 bg-white rounded-lg p-3 ring-1 ring-slate-100">
                          <span className="font-medium text-slate-600">Not:</span> {person.notes}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleOpenPaymentDialog(person); }}
                          className="gap-1.5 bg-gradient-to-r from-[#013a63] to-[#2c7da0] text-white rounded-lg text-xs"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                          Odeme Ekle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(person); }}
                          className="gap-1.5 rounded-lg text-xs"
                        >
                          {person.status === "ACTIVE" ? "Pasife Al" : "Aktife Al"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleDeletePersonnel(person.id); }}
                          className="gap-1.5 rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                          Sil
                        </Button>
                      </div>

                      {/* Payment History */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Odeme Gecmisi</h4>
                        {paymentsLoading ? (
                          <div className="space-y-2">
                            {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                          </div>
                        ) : !paymentsData?.items?.length ? (
                          <div className="text-center py-6 text-sm text-slate-400 bg-white rounded-xl ring-1 ring-slate-100">
                            Henuz odeme kaydedilmemis.
                          </div>
                        ) : (
                          <>
                            <div className="bg-white rounded-xl ring-1 ring-slate-100 overflow-hidden">
                              {/* Desktop Table */}
                              <div className="hidden sm:block">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                                      <th className="text-left p-3 font-medium">Tarih</th>
                                      <th className="text-left p-3 font-medium">Tur</th>
                                      <th className="text-left p-3 font-medium">Donem</th>
                                      <th className="text-right p-3 font-medium">Tutar</th>
                                      <th className="text-left p-3 font-medium">Aciklama</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {paymentsData.items.map((payment: PersonnelPayment) => (
                                      <tr key={payment.id} className="hover:bg-slate-50/50">
                                        <td className="p-3 text-slate-600">
                                          {new Date(payment.payment_date).toLocaleDateString("tr-TR")}
                                        </td>
                                        <td className="p-3">
                                          <Badge className={cn("text-[10px] border", PAYMENT_TYPE_COLORS[payment.payment_type])}>
                                            {PAYMENT_TYPE_LABELS[payment.payment_type]}
                                          </Badge>
                                        </td>
                                        <td className="p-3 text-slate-600">
                                          {MONTHS[payment.period_month - 1]} {payment.period_year}
                                        </td>
                                        <td className="p-3 text-right font-mono font-semibold text-slate-900">
                                          {formatMoney(payment.amount)}
                                        </td>
                                        <td className="p-3 text-slate-500 text-xs truncate max-w-[150px]">
                                          {payment.description || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile Cards */}
                              <div className="sm:hidden divide-y divide-slate-100">
                                {paymentsData.items.map((payment: PersonnelPayment) => (
                                  <div key={payment.id} className="p-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Badge className={cn("text-[10px] border", PAYMENT_TYPE_COLORS[payment.payment_type])}>
                                        {PAYMENT_TYPE_LABELS[payment.payment_type]}
                                      </Badge>
                                      <span className="font-mono font-semibold text-sm text-slate-900">
                                        {formatMoney(payment.amount)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                      <span>{new Date(payment.payment_date).toLocaleDateString("tr-TR")}</span>
                                      <span>{MONTHS[payment.period_month - 1]} {payment.period_year}</span>
                                    </div>
                                    {payment.description && (
                                      <p className="text-[10px] text-slate-400 truncate">{payment.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pagination */}
                            {paymentsData.totalPages > 1 && (
                              <div className="flex items-center justify-center gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs rounded-lg"
                                  disabled={paymentPage <= 1}
                                  onClick={(e) => { e.stopPropagation(); setPaymentPage(p => p - 1); }}
                                >
                                  Onceki
                                </Button>
                                <span className="text-xs text-slate-500">
                                  {paymentPage} / {paymentsData.totalPages}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs rounded-lg"
                                  disabled={paymentPage >= paymentsData.totalPages}
                                  onClick={(e) => { e.stopPropagation(); setPaymentPage(p => p + 1); }}
                                >
                                  Sonraki
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ==================== ADD PERSONNEL DIALOG ==================== */}
      <Dialog open={addPersonnelOpen} onOpenChange={setAddPersonnelOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#013a63] flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Yeni Personel Ekle
            </DialogTitle>
            <DialogDescription>
              Calisan bilgilerini girerek personel kaydini olusturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPersonnel} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Ad *</Label>
                <Input
                  placeholder="Ali"
                  value={newPersonnel.first_name}
                  onChange={(e) => setNewPersonnel(p => ({ ...p, first_name: e.target.value }))}
                  className="rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Soyad *</Label>
                <Input
                  placeholder="Yilmaz"
                  value={newPersonnel.last_name}
                  onChange={(e) => setNewPersonnel(p => ({ ...p, last_name: e.target.value }))}
                  className="rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Telefon</Label>
                <Input
                  placeholder="05551234567"
                  value={newPersonnel.phone}
                  onChange={(e) => setNewPersonnel(p => ({ ...p, phone: e.target.value }))}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Gorev *</Label>
                <Input
                  placeholder="Muhasebeci"
                  value={newPersonnel.role}
                  onChange={(e) => setNewPersonnel(p => ({ ...p, role: e.target.value }))}
                  className="rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Aylik Maas (TL) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15000"
                  value={newPersonnel.monthly_salary}
                  onChange={(e) => setNewPersonnel(p => ({ ...p, monthly_salary: e.target.value }))}
                  className="rounded-lg font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Baslangic Tarihi *</Label>
                <Input
                  type="date"
                  value={newPersonnel.start_date}
                  onChange={(e) => setNewPersonnel(p => ({ ...p, start_date: e.target.value }))}
                  className="rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Notlar</Label>
              <Textarea
                placeholder="Ek bilgiler..."
                value={newPersonnel.notes}
                onChange={(e) => setNewPersonnel(p => ({ ...p, notes: e.target.value }))}
                className="rounded-lg resize-none"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddPersonnelOpen(false)}
                className="rounded-lg"
              >
                Iptal
              </Button>
              <Button
                type="submit"
                disabled={createPersonnel.isPending}
                className="gap-2 bg-gradient-to-r from-[#013a63] to-[#2c7da0] text-white rounded-lg"
              >
                {createPersonnel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== ADD PAYMENT DIALOG ==================== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#013a63] flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Odeme Ekle
            </DialogTitle>
            <DialogDescription>
              {selectedPersonnel && (
                <span>
                  <span className="font-medium text-slate-700">
                    {selectedPersonnel.first_name} {selectedPersonnel.last_name}
                  </span>
                  {" "} - Aylik maas: <span className="font-mono font-medium">{formatMoney(selectedPersonnel.monthly_salary)}</span>
                  , bu ay odenen: <span className="font-mono font-medium">{formatMoney(selectedPersonnel.paid_this_month)}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Tutar (TL) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                  className="rounded-lg font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Odeme Tipi *</Label>
                <Select
                  value={newPayment.payment_type}
                  onValueChange={(val) => setNewPayment(p => ({ ...p, payment_type: val as any }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALARY">Maas</SelectItem>
                    <SelectItem value="ADVANCE">Avans</SelectItem>
                    <SelectItem value="BONUS">Prim</SelectItem>
                    <SelectItem value="OTHER">Diger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Odeme Tarihi *</Label>
              <Input
                type="date"
                value={newPayment.payment_date}
                onChange={(e) => setNewPayment(p => ({ ...p, payment_date: e.target.value }))}
                className="rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Donem Ay *</Label>
                <Select
                  value={newPayment.period_month}
                  onValueChange={(val) => setNewPayment(p => ({ ...p, period_month: val }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Donem Yil *</Label>
                <Select
                  value={newPayment.period_year}
                  onValueChange={(val) => setNewPayment(p => ({ ...p, period_year: val }))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Aciklama</Label>
              <Input
                placeholder="Subat maas 1. taksit"
                value={newPayment.description}
                onChange={(e) => setNewPayment(p => ({ ...p, description: e.target.value }))}
                className="rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                className="rounded-lg"
              >
                Iptal
              </Button>
              <Button
                type="submit"
                disabled={addPayment.isPending}
                className="gap-2 bg-gradient-to-r from-[#013a63] to-[#2c7da0] text-white rounded-lg"
              >
                {addPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Odemeyi Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for info cells in expanded view
function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white rounded-lg p-2.5 ring-1 ring-slate-100">
      <p className="text-[10px] text-slate-500 font-medium">{label}</p>
      <p className={cn("text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 truncate", mono && "font-mono")}>{value}</p>
    </div>
  );
}
