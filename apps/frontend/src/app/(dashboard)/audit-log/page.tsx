"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Globe,
  Shield,
  LogIn,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
} from "lucide-react";

// Action renk ve ikon haritası
const actionConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  LOGIN:       { color: "text-blue-700",   bgColor: "bg-blue-50",    icon: LogIn,       label: "Giriş" },
  LOGOUT:      { color: "text-gray-700",   bgColor: "bg-gray-50",    icon: LogIn,       label: "Çıkış" },
  CREATE:      { color: "text-green-700",  bgColor: "bg-green-50",   icon: Plus,        label: "Oluşturma" },
  UPDATE:      { color: "text-amber-700",  bgColor: "bg-amber-50",   icon: Pencil,      label: "Güncelleme" },
  DELETE:      { color: "text-red-700",    bgColor: "bg-red-50",     icon: Trash2,      label: "Silme" },
  APPROVE:     { color: "text-emerald-700",bgColor: "bg-emerald-50", icon: CheckCircle,  label: "Onay" },
  REJECT:      { color: "text-rose-700",   bgColor: "bg-rose-50",    icon: XCircle,      label: "Red" },
  REVERSE:     { color: "text-purple-700", bgColor: "bg-purple-50",  icon: RotateCcw,    label: "Ters İşlem" },
  BULK_CREATE: { color: "text-indigo-700", bgColor: "bg-indigo-50",  icon: FileDown,     label: "Toplu Oluşturma" },
  PAY:         { color: "text-teal-700",   bgColor: "bg-teal-50",    icon: CheckCircle,  label: "Ödeme" },
  CANCEL:      { color: "text-orange-700", bgColor: "bg-orange-50",  icon: XCircle,      label: "İptal" },
};

const entityLabels: Record<string, string> = {
  transaction: "İşlem",
  auth: "Oturum",
  site: "Site",
  partner: "Partner",
  financier: "Finansör",
  external_party: "Dış Kişi",
  debt: "Borç",
  adjustment: "Düzeltme",
  user: "Kullanıcı",
  settings: "Ayar",
  personnel: "Personel",
  Financier: "Finansör",
  Partner: "Partner",
  Site: "Site",
  ExternalParty: "Dış Kişi",
  Transaction: "İşlem",
  CommissionRate: "Komisyon",
};

// Cihaz türü tespit
function getDeviceType(userAgent: string | null): { type: string; icon: React.ElementType } {
  if (!userAgent) return { type: "Bilinmiyor", icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return { type: "Mobil", icon: Smartphone };
  return { type: "Masaüstü", icon: Monitor };
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_id: string;
  user_email: string;
  user_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  fingerprint: string | null;
  session_id: string | null;
  request_method: string | null;
  request_path: string | null;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
  user: { id: string; name: string; email: string; role: string };
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filters, setFilters] = useState({
    action: "",
    entity_type: "",
    user_id: "",
    ip_address: "",
    search: "",
    date_from: "",
    date_to: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Query params
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params[key] = val;
    });
    return new URLSearchParams(params).toString();
  }, [page, limit, filters]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", queryParams],
    queryFn: async () => {
      const res = await api.get<{ items: AuditLog[]; pagination: any }>(`/api/audit-logs?${queryParams}`);
      return res;
    },
    refetchInterval: 30000, // 30 saniyede bir yenile
  });

  const logs: AuditLog[] = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 };

  // Filtre uygula
  const handleFilter = () => {
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      action: "",
      entity_type: "",
      user_id: "",
      ip_address: "",
      search: "",
      date_from: "",
      date_to: "",
    });
    setPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm sistem aktivitelerinin detaylı kaydı
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border hover:bg-secondary-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters ? "bg-primary text-white border-primary" : "hover:bg-secondary-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrele</span>
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Toplam Kayıt"
          value={pagination.total}
          icon={ScrollText}
          color="text-primary"
        />
        <StatCard
          label="Giriş"
          value={logs.filter(l => l.action === "LOGIN").length}
          icon={LogIn}
          color="text-blue-600"
        />
        <StatCard
          label="Oluşturma"
          value={logs.filter(l => l.action === "CREATE").length}
          icon={Plus}
          color="text-green-600"
        />
        <StatCard
          label="Benzersiz IP"
          value={new Set(logs.map(l => l.ip_address).filter(Boolean)).size}
          icon={Globe}
          color="text-amber-600"
        />
      </div>

      {/* Filtreler */}
      {showFilters && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Genel arama */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Genel Arama</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Email, IP, açıklama..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Action filtresi */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">İşlem Tipi</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Tümü</option>
                <option value="LOGIN">Giriş</option>
                <option value="CREATE">Oluşturma</option>
                <option value="UPDATE">Güncelleme</option>
                <option value="DELETE">Silme</option>
                <option value="APPROVE">Onay</option>
                <option value="REJECT">Red</option>
                <option value="REVERSE">Ters İşlem</option>
              </select>
            </div>

            {/* Entity type filtresi */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Varlık Tipi</label>
              <select
                value={filters.entity_type}
                onChange={(e) => setFilters(f => ({ ...f, entity_type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Tümü</option>
                <option value="auth">Oturum</option>
                <option value="transaction">İşlem</option>
                <option value="site">Site</option>
                <option value="partner">Partner</option>
                <option value="financier">Finansör</option>
                <option value="external_party">Dış Kişi</option>
                <option value="debt">Borç</option>
              </select>
            </div>

            {/* IP adresi */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">IP Adresi</label>
              <input
                type="text"
                placeholder="192.168.1.1"
                value={filters.ip_address}
                onChange={(e) => setFilters(f => ({ ...f, ip_address: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Tarih aralığı */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Temizle
            </button>
            <button
              onClick={handleFilter}
              className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Filtrele
            </button>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ScrollText className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Henüz audit log kaydı yok</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b bg-secondary-50/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tarih</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">İşlem</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Kullanıcı</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Açıklama</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">IP / Cihaz</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const config = actionConfig[log.action] || {
                      color: "text-gray-700", bgColor: "bg-gray-50",
                      icon: AlertTriangle, label: log.action,
                    };
                    const ActionIcon = config.icon;
                    const device = getDeviceType(log.user_agent);
                    const DeviceIcon = device.icon;
                    const isExpanded = expandedRow === log.id;
                    const entityLabel = entityLabels[log.entity_type] || log.entity_type;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={`border-b hover:bg-secondary-50/50 transition-colors cursor-pointer ${
                            isExpanded ? "bg-secondary-50/30" : ""
                          }`}
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                        >
                          {/* Tarih */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">
                              {format(new Date(log.created_at), "dd MMM", { locale: tr })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "HH:mm:ss")}
                            </div>
                          </td>

                          {/* İşlem tipi */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                              <ActionIcon className="h-3 w-3" />
                              {config.label}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">{entityLabel}</div>
                          </td>

                          {/* Kullanıcı */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{log.user?.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.user_role && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  log.user_role === "ADMIN" ? "bg-red-50 text-red-700" :
                                  log.user_role === "OPERATOR" ? "bg-blue-50 text-blue-700" :
                                  log.user_role === "PARTNER" ? "bg-green-50 text-green-700" :
                                  log.user_role === "VIEWER" ? "bg-gray-50 text-gray-700" :
                                  "bg-gray-50 text-gray-600"
                                }`}>
                                  <Shield className="h-2.5 w-2.5" />
                                  {log.user_role}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Açıklama */}
                          <td className="px-4 py-3">
                            <div className="text-sm max-w-[250px] truncate">
                              {log.description || `${log.action} — ${entityLabel}`}
                            </div>
                            {log.request_path && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.request_method} {log.request_path}
                              </div>
                            )}
                          </td>

                          {/* IP / Cihaz */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-mono">{log.ip_address || "-"}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DeviceIcon className="h-3 w-3" />
                              {device.type}
                            </div>
                          </td>

                          {/* Detay toggle */}
                          <td className="px-4 py-3 text-center">
                            <button className="p-1 rounded hover:bg-secondary-100 transition-colors">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Detay satırı */}
                        {isExpanded && (
                          <tr className="bg-secondary-50/50">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                {/* Teknik bilgiler */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-xs uppercase text-muted-foreground">Bağlantı Bilgileri</h4>
                                  <InfoRow label="IP Adresi" value={log.ip_address} mono />
                                  <InfoRow label="User Agent" value={log.user_agent} small />
                                  <InfoRow label="Fingerprint" value={log.fingerprint} mono />
                                  <InfoRow label="Session ID" value={log.session_id} mono />
                                </div>

                                {/* HTTP bilgileri */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-xs uppercase text-muted-foreground">HTTP Detayları</h4>
                                  <InfoRow label="Method" value={log.request_method} />
                                  <InfoRow label="Path" value={log.request_path} mono />
                                  <InfoRow label="Status" value={log.status_code?.toString()} />
                                  <InfoRow label="Süre" value={log.duration_ms ? `${log.duration_ms}ms` : null} />
                                  <InfoRow label="Entity ID" value={log.entity_id} mono />
                                </div>

                                {/* Veri değişiklikleri */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-xs uppercase text-muted-foreground">Veri Değişiklikleri</h4>
                                  {log.old_values && (
                                    <div>
                                      <span className="text-xs font-medium text-red-600">Eski Değerler:</span>
                                      <pre className="text-xs bg-red-50 rounded p-2 mt-1 overflow-x-auto max-h-32">
                                        {JSON.stringify(log.old_values, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.new_values && (
                                    <div>
                                      <span className="text-xs font-medium text-green-600">Yeni Değerler:</span>
                                      <pre className="text-xs bg-green-50 rounded p-2 mt-1 overflow-x-auto max-h-32">
                                        {JSON.stringify(log.new_values, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {!log.old_values && !log.new_values && (
                                    <p className="text-xs text-muted-foreground italic">Veri değişikliği kaydı yok</p>
                                  )}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-secondary-50/30">
              <div className="text-xs text-muted-foreground">
                Toplam {pagination.total} kayıttan{" "}
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} gösteriliyor
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-secondary-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === pageNum
                          ? "bg-primary text-white"
                          : "hover:bg-secondary-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-1.5 rounded-lg hover:bg-secondary-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper components
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg sm:text-xl font-bold">{value.toLocaleString("tr-TR")}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  small?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${
          small ? "text-[11px] break-all" : "text-xs"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
