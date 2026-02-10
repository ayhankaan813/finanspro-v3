"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Edit3,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface ApprovalItem {
  id: string;
  type: "transaction_edit" | "transaction_delete" | "balance_correction" | "block_resolution";
  title: string;
  description: string;
  amount?: number;
  requestedBy: string;
  requestedAt: string;
  entity: string;
  status: "pending" | "approved" | "rejected";
}

// Mock data - in real implementation, this would come from API
const mockApprovals: ApprovalItem[] = [
  {
    id: "1",
    type: "transaction_edit",
    title: "İşlem Düzeltme",
    description: "TX-456 numaralı işlemin tutarı düzeltilmek isteniyor",
    amount: 125000,
    requestedBy: "Ahmet Yılmaz",
    requestedAt: "2024-01-15T10:30:00",
    entity: "Site-A",
    status: "pending",
  },
  {
    id: "2",
    type: "transaction_delete",
    title: "Silme Talebi",
    description: "TX-123 numaralı yanlış girilen işlem silinmek isteniyor",
    amount: 45000,
    requestedBy: "Mehmet Demir",
    requestedAt: "2024-01-15T09:15:00",
    entity: "Site-B",
    status: "pending",
  },
  {
    id: "3",
    type: "balance_correction",
    title: "Bakiye Düzeltme",
    description: "Partner-X bakiyesi manuel olarak düzeltilmek isteniyor",
    amount: 8500,
    requestedBy: "Ayşe Kaya",
    requestedAt: "2024-01-15T08:00:00",
    entity: "Partner-X",
    status: "pending",
  },
];

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(mockApprovals);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filteredApprovals = approvals.filter((a) =>
    filter === "all" ? true : a.status === filter
  );

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    );
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a))
    );
  };

  const getTypeIcon = (type: ApprovalItem["type"]) => {
    switch (type) {
      case "transaction_edit":
        return <Edit3 className="h-5 w-5 text-warning-600" />;
      case "transaction_delete":
        return <Trash2 className="h-5 w-5 text-danger-600" />;
      case "balance_correction":
        return <RefreshCw className="h-5 w-5 text-primary-600" />;
      case "block_resolution":
        return <AlertTriangle className="h-5 w-5 text-warning-600" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: ApprovalItem["type"]) => {
    switch (type) {
      case "transaction_edit":
        return "bg-warning-100 text-warning-700";
      case "transaction_delete":
        return "bg-danger-100 text-danger-700";
      case "balance_correction":
        return "bg-primary-100 text-primary-700";
      case "block_resolution":
        return "bg-warning-100 text-warning-700";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) return "Az önce";
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${Math.floor(diffHours / 24)} gün önce`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onay Bekleyenler</h1>
          <p className="text-muted-foreground">
            İşlem düzeltme ve silme taleplerini yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-danger-500 px-2 text-sm font-semibold text-white">
            {pendingCount}
          </span>
          <span className="text-muted-foreground">bekleyen onay</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Bekleyen ({approvals.filter((a) => a.status === "pending").length})
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("approved")}
        >
          Onaylanan ({approvals.filter((a) => a.status === "approved").length})
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("rejected")}
        >
          Reddedilen ({approvals.filter((a) => a.status === "rejected").length})
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Tümü
        </Button>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length > 0 ? (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <Card key={approval.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    {getTypeIcon(approval.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{approval.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadge(approval.type)}`}>
                            {approval.type === "transaction_edit" && "Düzeltme"}
                            {approval.type === "transaction_delete" && "Silme"}
                            {approval.type === "balance_correction" && "Bakiye"}
                            {approval.type === "block_resolution" && "Bloke"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {approval.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{approval.entity}</span>
                          <span>•</span>
                          <span>{approval.requestedBy}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(approval.requestedAt)}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      {approval.amount && (
                        <p className="font-amount text-lg font-semibold">
                          {formatMoney(approval.amount)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {approval.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="bg-success-600 hover:bg-success-700"
                          onClick={() => handleApprove(approval.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger-600 hover:bg-danger-50"
                          onClick={() => handleReject(approval.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reddet
                        </Button>
                        <Button size="sm" variant="ghost">
                          Detaylar
                        </Button>
                      </div>
                    )}

                    {/* Status Badge */}
                    {approval.status !== "pending" && (
                      <div className="mt-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                          approval.status === "approved"
                            ? "bg-success-100 text-success-700"
                            : "bg-danger-100 text-danger-700"
                        }`}>
                          {approval.status === "approved" ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Onaylandı
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Reddedildi
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              {filter === "pending"
                ? "Bekleyen onay yok"
                : `${filter === "approved" ? "Onaylanmış" : filter === "rejected" ? "Reddedilmiş" : ""} talep bulunamadı`}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === "pending"
                ? "Tüm talepler işlenmiş durumda"
                : "Bu kategoride henüz işlem yok"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
