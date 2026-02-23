"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  User,
  Shield,
  Bell,
  Building,
  Save,
  Check,
  Info,
  ChevronRight,
  Globe,
  Lock,
  Smartphone,
  Mail,
  CreditCard,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_STORAGE_KEY = "finanspro-settings";

interface SettingsData {
  // General
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  // Profile
  fullName: string;
  email: string;
  phone: string;
  // Security (password fields are never persisted)
  // Notifications
  notifications: {
    newTx: boolean;
    approval: boolean;
    block: boolean;
    daily: boolean;
    weekly: boolean;
  };
  // Organization
  orgName: string;
  orgTax: string;
  orgAddress: string;
  orgPhone: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function loadSettings(userName: string, userEmail: string): SettingsData {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    language: "tr",
    timezone: "Europe/Istanbul",
    currency: "TRY",
    dateFormat: "DD.MM.YYYY",
    fullName: userName || "Admin",
    email: userEmail || "admin@finanspro.com",
    phone: "+90 532 123 4567",
    notifications: {
      newTx: true,
      approval: true,
      block: true,
      daily: true,
      weekly: true,
    },
    orgName: "FinansPro Teknoloji A.Ş.",
    orgTax: "1234567890",
    orgAddress: "Maslak Mah. Büyükdere Cad. No:123 Şişli/İstanbul",
    orgPhone: "+90 212 999 88 77",
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize settings from localStorage or auth store defaults
  const [settings, setSettings] = useState<SettingsData>(() =>
    loadSettings(user?.name || "Admin", user?.email || "admin@finanspro.com")
  );
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(() =>
    loadSettings(user?.name || "Admin", user?.email || "admin@finanspro.com")
  );

  // Security fields (never persisted)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMounted(true);
    const loaded = loadSettings(user?.name || "Admin", user?.email || "admin@finanspro.com");
    setSettings(loaded);
    setOriginalSettings(loaded);
  }, [user?.name, user?.email]);

  // Dirty tracking
  const isDirty = useMemo(() => {
    if (!mounted) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings) ||
      currentPassword !== "" || newPassword !== "" || confirmPassword !== "";
  }, [settings, originalSettings, currentPassword, newPassword, confirmPassword, mounted]);

  const updateField = useCallback(<K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNotification = useCallback((key: keyof SettingsData["notifications"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  }, []);

  const handleSave = useCallback(() => {
    // Password validation
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        toast({ title: "Mevcut şifrenizi girin", variant: "destructive" });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: "Yeni şifre en az 6 karakter olmalı", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: "Yeni şifreler eşleşmiyor", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    // Simulate save delay (no backend endpoint yet)
    setTimeout(() => {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

        // Update auth store if name or email changed
        if (user && (settings.fullName !== originalSettings.fullName || settings.email !== originalSettings.email)) {
          useAuthStore.getState().setAuth(
            { ...user, name: settings.fullName, email: settings.email },
            useAuthStore.getState().accessToken || "",
            useAuthStore.getState().refreshToken || ""
          );
        }

        setOriginalSettings({ ...settings });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSaving(false);

        toast({ title: "Ayarlar kaydedildi", description: "Değişiklikleriniz başarıyla uygulandı." });
      } catch {
        setSaving(false);
        toast({ title: "Kaydetme başarısız", description: "Lütfen tekrar deneyin.", variant: "destructive" });
      }
    }, 500);
  }, [settings, originalSettings, user, currentPassword, newPassword, confirmPassword, toast]);

  const handleCancel = useCallback(() => {
    setSettings({ ...originalSettings });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Değişiklikler iptal edildi" });
  }, [originalSettings, toast]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const tabs = [
    { id: "general", label: "Genel", icon: Settings, desc: "Dil, bölge ve görünüm" },
    { id: "profile", label: "Profil", icon: User, desc: "Kişisel bilgileriniz" },
    { id: "security", label: "Güvenlik", icon: Shield, desc: "Şifre ve 2FA" },
    { id: "notifications", label: "Bildirimler", icon: Bell, desc: "İletişim tercihleri" },
    { id: "organization", label: "Organizasyon", icon: Building, desc: "Şirket detayları" },
  ];

  const selectClassName = "w-full h-11 sm:h-12 pl-4 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer text-sm";

  const inputClassName = "h-11 sm:h-12 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-primary rounded-lg";

  const avatarInitials = getInitials(settings.fullName);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="relative z-10 p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2 sm:gap-3">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
            Ayarlar
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl">
            Sisteminizi özelleştirin ve hesap tercihlerinizi yönetin.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Tab Navigation */}
        <div className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24">
            <nav className="flex flex-wrap lg:flex-col gap-1.5 sm:gap-2 lg:gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-1.5 lg:gap-3 rounded-lg px-2.5 py-2 lg:px-4 lg:py-3 text-sm font-medium transition-all duration-200 lg:w-full lg:text-left ${
                    activeTab === tab.id
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 lg:border-0"
                  }`}
                >
                  <div className={`p-1 lg:p-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                  }`}>
                    <tab.icon className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs lg:text-sm font-semibold">{tab.label}</span>
                    <span className={`hidden lg:block text-xs mt-0.5 ${
                      activeTab === tab.id ? "text-white/70" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {tab.desc}
                    </span>
                  </div>
                  {activeTab === tab.id && (
                    <ChevronRight className="hidden lg:block h-4 w-4 text-white/50" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* General Settings */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Genel Ayarlar</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Sistem dili, saat dilimi ve para birimi tercihleri</p>
                    </div>
                    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-slate-700 dark:text-slate-300 font-medium">Sistem Dili</Label>
                          <div className="relative">
                            <select
                              id="language"
                              value={settings.language}
                              onChange={(e) => updateField("language", e.target.value)}
                              className={selectClassName}
                            >
                              <option value="tr">Türkçe (Türkiye)</option>
                              <option value="en">English (United States)</option>
                            </select>
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-slate-700 dark:text-slate-300 font-medium">Saat Dilimi</Label>
                          <div className="relative">
                            <select
                              id="timezone"
                              value={settings.timezone}
                              onChange={(e) => updateField("timezone", e.target.value)}
                              className={selectClassName}
                            >
                              <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                              <option value="UTC">UTC (Coordinated Universal Time)</option>
                              <option value="America/New_York">America/New_York (EST)</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 rotate-90 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-slate-700 dark:text-slate-300 font-medium">Varsayılan Para Birimi</Label>
                          <div className="relative">
                            <select
                              id="currency"
                              value={settings.currency}
                              onChange={(e) => updateField("currency", e.target.value)}
                              className={selectClassName}
                            >
                              <option value="TRY">Türk Lirası (₺)</option>
                              <option value="USD">US Dollar ($)</option>
                              <option value="EUR">Euro (€)</option>
                            </select>
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateFormat" className="text-slate-700 dark:text-slate-300 font-medium">Tarih Formatı</Label>
                          <div className="relative">
                            <select
                              id="dateFormat"
                              value={settings.dateFormat}
                              onChange={(e) => updateField("dateFormat", e.target.value)}
                              className={selectClassName}
                            >
                              <option value="DD.MM.YYYY">31.12.2024 (Gün.Ay.Yıl)</option>
                              <option value="YYYY-MM-DD">2024-12-31 (Yıl-Ay-Gün)</option>
                              <option value="MM/DD/YYYY">12/31/2024 (Ay/Gün/Yıl)</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 rotate-90 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Commission Info Box */}
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 sm:p-6">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <Info className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Komisyon Oranları</h4>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              Komisyon oranları; site, partner ve finansör bazında ayrı ayrı yapılandırılır.
                              Global bir komisyon ayarı bulunmamaktadır.
                            </p>
                            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                              <Link href="/sites" className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm">
                                <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                Site Komisyonları
                              </Link>
                              <Link href="/partners" className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm">
                                <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                Partner Komisyonları
                              </Link>
                              <Link href="/financiers" className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm">
                                <Building className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                Finansör Komisyonları
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Settings */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Profil Bilgileri</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Kişisel bilgilerinizi ve iletişim detaylarınızı yönetin</p>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6 mb-8 sm:mb-10">
                        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg shrink-0 ring-4 ring-white dark:ring-slate-800">
                          {avatarInitials}
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{settings.fullName}</h3>
                          <p className="text-slate-500 dark:text-slate-400 font-medium pb-2">{user?.role || "Admin Yöneticisi"}</p>
                          <div className="flex justify-center sm:justify-start gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                              Aktif Hesap
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                              Tam Yetki
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="w-full sm:w-auto border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Oturumu Kapat
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300 font-medium">Ad Soyad</Label>
                          <Input
                            id="fullName"
                            value={settings.fullName}
                            onChange={(e) => updateField("fullName", e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">E-posta Adresi</Label>
                          <div className="relative">
                            <Input
                              id="email"
                              value={settings.email}
                              onChange={(e) => updateField("email", e.target.value)}
                              className={`${inputClassName} pl-10`}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">Telefon Numarası</Label>
                          <div className="relative">
                            <Input
                              id="phone"
                              value={settings.phone}
                              onChange={(e) => updateField("phone", e.target.value)}
                              className={`${inputClassName} pl-10`}
                            />
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-slate-700 dark:text-slate-300 font-medium">Kullanıcı Rolü</Label>
                          <Input
                            id="role"
                            value={user?.role || "Süper Admin"}
                            disabled
                            className="h-11 sm:h-12 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Güvenlik</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Hesap güvenliğinizi ve erişim kontrollerini yönetin</p>
                    </div>

                    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800 flex gap-3 sm:gap-4">
                        <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-300">Hesabınız Güvende</h4>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Son şifre değişikliğiniz 3 ay önce yapıldı. Düzenli olarak şifrenizi güncellemenizi öneririz.</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                          Şifre Değiştir
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-xl">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-slate-700 dark:text-slate-300">Mevcut Şifre</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className={inputClassName}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300">Yeni Şifre</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className={inputClassName}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">Yeni Şifre (Tekrar)</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={inputClassName}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">İki Faktörlü Doğrulama (2FA)</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Hesabınıza giriş yaparken ekstra güvenlik katmanı ekleyin.</p>
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto h-11 rounded-lg font-medium border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                          Kurulumu Başlat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Bildirimler</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Hangi konularda bildirim almak istediğinizi seçin</p>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {([
                          { id: "newTx" as const, label: "Finansal İşlemler", desc: "Her yeni yatırım ve çekim işleminde anlık bildirim al" },
                          { id: "approval" as const, label: "Onay Talepleri", desc: "Manuel onay gerektiren işlemlerde yönetici onayı için bildirim" },
                          { id: "block" as const, label: "Güvenlik Uyarıları", desc: "Şüpheli işlem veya bloke durumlarında acil bildirim" },
                          { id: "daily" as const, label: "Günlük Raporlar", desc: "Her sabah 09:00'da bir önceki günün özet raporunu al" },
                          { id: "weekly" as const, label: "Haftalık Analiz", desc: "Haftalık performans ve komisyon analiz raporlarını al" },
                        ]).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="min-w-0 mr-3">
                              <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{item.label}</h4>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">{item.desc}</p>
                            </div>
                            <Switch
                              checked={settings.notifications[item.id]}
                              onCheckedChange={(checked) => updateNotification(item.id, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Organization Settings */}
              {activeTab === "organization" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Organizasyon</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Şirket bilgileri ve fatura detayları</p>
                    </div>

                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="orgName" className="text-slate-700 dark:text-slate-300 font-medium">Şirket Ünvanı</Label>
                        <Input
                          id="orgName"
                          value={settings.orgName}
                          onChange={(e) => updateField("orgName", e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgTax" className="text-slate-700 dark:text-slate-300 font-medium">Vergi Numarası</Label>
                        <Input
                          id="orgTax"
                          value={settings.orgTax}
                          onChange={(e) => updateField("orgTax", e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="orgAddress" className="text-slate-700 dark:text-slate-300 font-medium">Fatura Adresi</Label>
                        <Input
                          id="orgAddress"
                          value={settings.orgAddress}
                          onChange={(e) => updateField("orgAddress", e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgPhone" className="text-slate-700 dark:text-slate-300 font-medium">Telefon</Label>
                        <Input
                          id="orgPhone"
                          value={settings.orgPhone}
                          onChange={(e) => updateField("orgPhone", e.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Save Action Bar — only visible when dirty */}
              <AnimatePresence>
                {isDirty && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="sticky bottom-4 mt-6 z-20"
                  >
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between shadow-2xl shadow-slate-900/30 border border-white/10 max-w-4xl mx-auto gap-3 sm:gap-0">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">Kaydedilmemiş değişiklikler var</p>
                          <p className="text-[10px] sm:text-xs text-white/50">Değişikliklerin geçerli olması için kaydedin.</p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                          variant="ghost"
                          onClick={handleCancel}
                          className="flex-1 sm:flex-none text-white hover:bg-white/10 hover:text-white rounded-lg text-xs sm:text-sm h-9 sm:h-10"
                        >
                          İptal
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 sm:flex-none bg-white text-slate-900 hover:bg-white/90 font-bold px-4 sm:px-6 rounded-lg shadow-lg shadow-black/20 text-xs sm:text-sm h-9 sm:h-10"
                        >
                          {saving ? (
                            <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-slate-900 border-t-transparent animate-spin rounded-full mr-2" />
                          ) : (
                            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          )}
                          Kaydet
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
