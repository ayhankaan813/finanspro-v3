"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: { imported: number; errors: number };
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    // Simulated upload - will be connected to backend
    setTimeout(() => {
      setUploadResult({
        success: true,
        message: "Dosya başarıyla işlendi",
        details: { imported: 45, errors: 2 },
      });
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
        <p className="text-muted-foreground">
          Excel veya CSV dosyasından toplu işlem aktarımı yapın
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dosya Yükle
            </CardTitle>
            <CardDescription>
              Excel (.xlsx) veya CSV (.csv) formatında dosya yükleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  {file ? file.name : "Dosya seçmek için tıklayın"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  veya sürükleyip bırakın
                </p>
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Yükle
                    </>
                  )}
                </Button>
              </div>
            )}

            {uploadResult && (
              <div
                className={`rounded-lg p-4 ${
                  uploadResult.success
                    ? "bg-success-50 text-success-700"
                    : "bg-danger-50 text-danger-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{uploadResult.message}</span>
                </div>
                {uploadResult.details && (
                  <div className="mt-2 text-sm">
                    <p>Başarılı: {uploadResult.details.imported} işlem</p>
                    <p>Hatalı: {uploadResult.details.errors} işlem</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Şablon İndir
            </CardTitle>
            <CardDescription>
              Doğru formatta veri girişi için şablon dosyalarını indirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Deposit İşlemleri Şablonu (.xlsx)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Withdrawal İşlemleri Şablonu (.xlsx)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Site Teslim Şablonu (.xlsx)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Partner Ödeme Şablonu (.xlsx)
              </Button>
            </div>

            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-medium mb-2">Önemli Notlar</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• İlk satır başlık satırı olmalıdır</li>
                <li>• Tarih formatı: GG.AA.YYYY</li>
                <li>• Tutar formatı: 1234.56 (nokta ile)</li>
                <li>• Site ve Finansör kodları doğru girilmeli</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <CardTitle>Son İçe Aktarmalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Henüz içe aktarma yapılmadı
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
