"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  Loader2,
  Save,
  Calendar as CalendarIcon
} from "lucide-react";
import { EditableTransactionGrid, BulkTransactionRow } from "@/components/bulk-import/EditableTransactionGrid";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSites, useFinanciers } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api";

export default function BulkImportPage() {
  const [data, setData] = useState<BulkTransactionRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch Sites and Financiers for dropdowns
  const { data: sitesData } = useSites({ limit: 1000 });
  const { data: financiersData } = useFinanciers({ limit: 1000 });

  const sites = sitesData?.items.map(s => ({ id: s.id, name: s.name, code: s.code, is_active: s.is_active })) || [];
  const financiers = financiersData?.items.map(f => ({ id: f.id, name: f.name, code: f.code, is_active: f.is_active })) || [];

  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bulkImportData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setData(parsed);
      } catch (e) {
        console.error("Failed to load bulk data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("bulkImportData", JSON.stringify(data));
  }, [data, isInitialized]);

  const handleImport = async () => {
    // 1. Filter out completely empty rows (keep rows with site, even if amounts are 0)
    const validRows = data.filter(r => r.site);

    if (validRows.length === 0) {
      toast({
        variant: "destructive",
        title: "Veri Yok",
        description: "Lütfen en az bir geçerli satır girin (Site ve Tutar zorunlu).",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "Tarih Seçilmedi",
        description: "Lütfen işlemlere uygulanacak tarihi seçin.",
      });
      return;
    }

    // 2. Validate Rows (Financier Check)
    const currentErrors: string[] = [];
    validRows.forEach((row, index) => {
      // Find visible index in main array for error reporting
      const realIndex = data.indexOf(row);
      if (!row.financier) {
        currentErrors.push(`Satır ${realIndex + 1}: Finansör seçilmeli`);
      }
      if (!row.siteId) {
        // Try to fuzzy match if not exact ID (though grid handles this, safety check)
        currentErrors.push(`Satır ${realIndex + 1}: Site geçerli değil`);
      }
    });

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      toast({
        variant: "destructive",
        title: "Doğrulama Hatası",
        description: "Bazı satırlarda eksik bilgiler var.",
      });
      return;
    }

    setErrors([]);
    setIsUploading(true);

    // 3. Transform to Transactions
    // Format Date to DD.MM.YYYY for backend (as per schema)
    const [year, month, day] = selectedDate.split("-");
    const formattedDate = `${day}.${month}.${year}`;

    const transactions = [];

    for (const row of validRows) {
      // Deposit Transaction
      if (row.depositAmount > 0) {
        transactions.push({
          date: formattedDate,
          amount: row.depositAmount,
          type: "DEPOSIT",
          site: row.site, // Backend will resolve or we can pass ID if backend supports it? Backend schema expects string name/code.
          financier: row.financier,
          description: `${row.depositCount} Adet Yatırım (Toplu İşlem)`
        });
      }
      // Withdrawal Transaction
      if (row.withdrawalAmount > 0) {
        transactions.push({
          date: formattedDate,
          amount: row.withdrawalAmount,
          type: "WITHDRAWAL",
          site: row.site,
          financier: row.financier,
          description: `${row.withdrawalCount} Adet Çekim (Toplu İşlem)`
        });
      }
    }

    try {
      const accessToken = useAuthStore.getState().accessToken;
      api.setToken(accessToken);
      const result = await api.post<{ success: number; failed: number; errors: string[] }>("/api/transactions/bulk", { transactions });

      if (result.failed > 0) {
        setErrors(result.errors);
        toast({
          title: "Kısmi Başarı",
          description: `${result.success} işlem oluşturuldu, ${result.failed} hata. Detaylar aşağıda görüntüleniyor.`,
        });
      } else {
        toast({
          title: "Başarılı",
          description: `${result.success} işlem başarıyla oluşturuldu.`,
        });
        setData([]);
        localStorage.removeItem("bulkImportData");
        router.refresh();
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toplu Veri Girişi (Gün Sonu)</h1>
          <p className="text-muted-foreground">
            Excel'den kopyaladığınız günlük raporları (Site Özeti) yapıştırarak hızlıca girin.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="text-sm font-medium text-muted-foreground">İşlem Tarihi:</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 h-9 w-[160px]"
              />
            </div>
          </div>
          <div className="h-6 w-px bg-border mx-2"></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setData([])} disabled={data.length === 0 || isUploading}>
              Temizle
            </Button>
            <Button size="sm" onClick={handleImport} disabled={data.length === 0 || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aktarılıyor...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Veri Tablosu
            </CardTitle>
            <CardDescription>
              Aşağıdaki alana Excel'den kopyaladığınız verileri yapıştırın.<br />
              Format: <strong>Site | Yatırım Tutarı | Yatırım Adedi | Çekim Tutarı | Çekim Adedi | (Opsiyonel: Finansör)</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pt-0">
            <EditableTransactionGrid
              data={data}
              setData={setData}
              errors={errors}
              sites={sites}
              financiers={financiers}
            />
          </CardContent>
        </Card>

        {/* Error Details Panel */}
        {errors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-800">
                ⚠️ Hata Detayları ({errors.length} hata)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm text-red-700">
                    • {err}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
