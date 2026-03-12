"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Search,
  X,
  UserCog,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  partner_id: string | null;
  allowed_sites: string[] | null;
  last_login_at: string | null;
  created_at: string;
  partner: { id: string; name: string; code: string } | null;
}

const roleConfig: Record<string, { label: string; color: string; bgColor: string; desc: string }> = {
  ADMIN:    { label: "Admin",    color: "text-red-700",    bgColor: "bg-red-50",     desc: "Tüm yetkiler" },
  OPERATOR: { label: "Operatör", color: "text-blue-700",   bgColor: "bg-blue-50",    desc: "Yatırım/Çekim direkt, diğerleri onay" },
  PARTNER:  { label: "Partner",  color: "text-green-700",  bgColor: "bg-green-50",   desc: "Kendi verileri, ödeme/takviye/borç talebi" },
  VIEWER:   { label: "İzleyici", color: "text-gray-700",   bgColor: "bg-gray-100",   desc: "Sadece görüntüleme" },
  USER:     { label: "Kullanıcı",color: "text-amber-700",  bgColor: "bg-amber-50",   desc: "Legacy rol" },
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "OPERATOR",
    partner_id: "",
    is_active: true,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<User[]>("/api/users");
      return res;
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      try {
        const res = await api.get<any[]>("/api/partners");
        return res;
      } catch {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowModal(false);
      resetForm();
      toast({ title: "Kullanıcı oluşturuldu" });
    },
    onError: (err: any) => toast({ title: err.message || "Hata oluştu", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      toast({ title: "Kullanıcı güncellendi" });
    },
    onError: (err: any) => toast({ title: err.message || "Hata oluştu", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Kullanıcı silindi" });
    },
    onError: (err: any) => toast({ title: err.message || "Hata oluştu", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "OPERATOR", partner_id: "", is_active: true });
    setShowPassword(false);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      partner_id: user.partner_id || "",
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const data: any = { ...formData };
      if (!data.password) delete data.password;
      if (!data.partner_id) data.partner_id = null;
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      const data: any = { ...formData };
      if (!data.partner_id) delete data.partner_id;
      createMutation.mutate(data);
    }
  };

  const filteredUsers = users.filter((u: User) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem kullanıcılarını yönetin, roller ve yetkiler atayın
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Rol bilgileri kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(roleConfig).filter(([k]) => k !== "USER").map(([key, config]) => {
          const count = users.filter((u: User) => u.role === key).length;
          return (
            <div key={key} className={`rounded-xl border p-3 ${config.bgColor}`}>
              <div className="flex items-center gap-2">
                <Shield className={`h-4 w-4 ${config.color}`} />
                <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
              </div>
              <div className="text-lg font-bold mt-1">{count}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{config.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Arama */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="İsim, email veya rol ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Kullanıcı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b bg-secondary-50/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Kullanıcı</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Rol</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Partner</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Durum</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Son Giriş</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: User) => {
                  const config = roleConfig[user.role] || roleConfig.USER;
                  return (
                    <tr key={user.id} className="border-b hover:bg-secondary-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <Shield className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.partner ? (
                          <span className="text-green-700">{user.partner.name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <Check className="h-3 w-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700">
                            <AlertTriangle className="h-3 w-3" /> Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {user.last_login_at
                          ? format(new Date(user.last_login_at), "dd MMM HH:mm", { locale: tr })
                          : "Hiç giriş yapmadı"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg hover:bg-secondary-100 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${user.name} kullanıcısını silmek istediğinize emin misiniz?`)) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
                className="p-1 rounded-lg hover:bg-secondary-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* İsim */}
              <div>
                <label className="block text-sm font-medium mb-1">İsim</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Kullanıcı adı"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="email@example.com"
                />
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Şifre {editingUser && <span className="text-muted-foreground font-normal">(boş bırakırsan değişmez)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder={editingUser ? "Değiştirmek için yaz" : "Min. 6 karakter"}
                    minLength={editingUser ? 0 : 6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 p-1 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="ADMIN">Admin — Tüm yetkiler</option>
                  <option value="OPERATOR">Operatör — İşlem girişi + onay</option>
                  <option value="PARTNER">Partner — Kendi verileri</option>
                  <option value="VIEWER">İzleyici — Sadece görüntüleme</option>
                </select>
              </div>

              {/* Partner seçimi (sadece PARTNER rolünde) */}
              {formData.role === "PARTNER" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Bağlı Partner</label>
                  <select
                    required
                    value={formData.partner_id}
                    onChange={(e) => setFormData(f => ({ ...f, partner_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Partner Seçin</option>
                    {partners.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Aktif/Pasif (sadece edit'te) */}
              {editingUser && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(f => ({ ...f, is_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm">Aktif</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Kaydediliyor..." : editingUser ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
