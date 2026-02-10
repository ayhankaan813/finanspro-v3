"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const tabs = [
    { id: "general", label: "Genel", icon: Settings, desc: "Dil, bölge ve görünüm" },
    { id: "profile", label: "Profil", icon: User, desc: "Kişisel bilgileriniz" },
    { id: "security", label: "Güvenlik", icon: Shield, desc: "Şifre ve 2FA" },
    { id: "notifications", label: "Bildirimler", icon: Bell, desc: "İletişim tercihleri" },
    { id: "organization", label: "Organizasyon", icon: Building, desc: "Şirket detayları" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Glass Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-twilight-900 via-twilight-800 to-twilight-900 text-white shadow-2xl shadow-twilight-900/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-twilight-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-twilight-400/10 blur-3xl"></div>

        <div className="relative z-10 p-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Settings className="h-8 w-8 text-twilight-200" />
            Ayarlar
          </h1>
          <p className="text-twilight-200/80 text-lg max-w-xl">
            Sisteminizi özelleştirin ve hesap tercihlerinizi yönetin.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Modern Sidebar Navigation */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-8 space-y-2">
            <h3 className="px-4 text-xs font-semibold text-twilight-400 uppercase tracking-wider mb-3">Menü</h3>
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 w-full text-left overflow-hidden ${activeTab === tab.id
                      ? "bg-gradient-to-r from-twilight-600 to-twilight-500 text-white shadow-lg shadow-twilight-500/20"
                      : "text-twilight-600 hover:bg-white hover:text-twilight-900 hover:shadow-md bg-white/50"
                    }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-twilight-50 text-twilight-500 group-hover:bg-twilight-100 group-hover:text-twilight-700"
                    }`}>
                    <tab.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="block font-semibold">{tab.label}</span>
                    <span className={`text-xs block mt-0.5 ${activeTab === tab.id ? "text-white/70" : "text-twilight-400"
                      }`}>
                      {tab.desc}
                    </span>
                  </div>
                  {activeTab === tab.id && (
                    <ChevronRight className="h-4 w-4 text-white/50 animate-in fade-in slide-in-from-left-2" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* glass Content Panel */}
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
                  <div className="bg-white rounded-3xl shadow-xl shadow-twilight-100/50 border border-twilight-100 overflow-hidden">
                    <div className="p-8 border-b border-twilight-50 bg-gradient-to-r from-twilight-50/50 to-transparent">
                      <h2 className="text-xl font-bold text-twilight-900">Genel Ayarlar</h2>
                      <p className="text-twilight-500 mt-1">Sistem dili, saat dilimi ve para birimi tercihleri</p>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="language" className="text-twilight-700 font-medium">Sistem Dili</Label>
                          <div className="relative">
                            <select
                              id="language"
                              className="w-full h-12 pl-4 pr-10 rounded-xl border-twilight-200 bg-twilight-50/30 text-twilight-900 focus:ring-2 focus:ring-twilight-500 focus:border-twilight-500 transition-all appearance-none cursor-pointer"
                            >
                              <option value="tr">Türkçe (Türkiye)</option>
                              <option value="en">English (United States)</option>
                            </select>
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="timezone" className="text-twilight-700 font-medium">Saat Dilimi</Label>
                          <div className="relative">
                            <select
                              id="timezone"
                              className="w-full h-12 pl-4 pr-10 rounded-xl border-twilight-200 bg-twilight-50/30 text-twilight-900 focus:ring-2 focus:ring-twilight-500 focus:border-twilight-500 transition-all appearance-none cursor-pointer"
                            >
                              <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                              <option value="UTC">UTC (Coordinated Universal Time)</option>
                              <option value="America/New_York">America/New_York (EST)</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400 rotate-90 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="currency" className="text-twilight-700 font-medium">Varsayılan Para Birimi</Label>
                          <div className="relative">
                            <select
                              id="currency"
                              className="w-full h-12 pl-4 pr-10 rounded-xl border-twilight-200 bg-twilight-50/30 text-twilight-900 focus:ring-2 focus:ring-twilight-500 focus:border-twilight-500 transition-all appearance-none cursor-pointer"
                            >
                              <option value="TRY">Türk Lirası (₺)</option>
                              <option value="USD">US Dollar ($)</option>
                              <option value="EUR">Euro (€)</option>
                            </select>
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="dateFormat" className="text-twilight-700 font-medium">Tarih Formatı</Label>
                          <div className="relative">
                            <select
                              id="dateFormat"
                              className="w-full h-12 pl-4 pr-10 rounded-xl border-twilight-200 bg-twilight-50/30 text-twilight-900 focus:ring-2 focus:ring-twilight-500 focus:border-twilight-500 transition-all appearance-none cursor-pointer"
                            >
                              <option value="DD.MM.YYYY">31.12.2024 (Gün.Ay.Yıl)</option>
                              <option value="YYYY-MM-DD">2024-12-31 (Yıl-Ay-Gün)</option>
                              <option value="MM/DD/YYYY">12/31/2024 (Ay/Gün/Yıl)</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400 rotate-90 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Commission Info Box */}
                      <div className="rounded-2xl border border-twilight-200 bg-gradient-to-br from-twilight-50 to-white p-6 shadow-inner">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-twilight-100 flex items-center justify-center shrink-0">
                            <Info className="h-5 w-5 text-twilight-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-twilight-900 text-lg">Komisyon Oranları</h4>
                            <p className="mt-1 text-sm text-twilight-600 leading-relaxed">
                              Komisyon oranları; site, partner ve finansör bazında ayrı ayrı yapılandırılır.
                              Global bir komisyon ayarı bulunmamaktadır.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <Link href="/sites" className="inline-flex items-center gap-2 rounded-lg bg-white border border-twilight-200 px-4 py-2 text-sm font-semibold text-twilight-700 hover:bg-twilight-50 hover:border-twilight-300 transition-all shadow-sm">
                                <Globe className="h-4 w-4 text-twilight-500" />
                                Site Komisyonları
                              </Link>
                              <Link href="/partners" className="inline-flex items-center gap-2 rounded-lg bg-white border border-twilight-200 px-4 py-2 text-sm font-semibold text-twilight-700 hover:bg-twilight-50 hover:border-twilight-300 transition-all shadow-sm">
                                <User className="h-4 w-4 text-twilight-500" />
                                Partner Komisyonları
                              </Link>
                              <Link href="/financiers" className="inline-flex items-center gap-2 rounded-lg bg-white border border-twilight-200 px-4 py-2 text-sm font-semibold text-twilight-700 hover:bg-twilight-50 hover:border-twilight-300 transition-all shadow-sm">
                                <Building className="h-4 w-4 text-twilight-500" />
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
                  <div className="bg-white rounded-3xl shadow-xl shadow-twilight-100/50 border border-twilight-100 overflow-hidden">
                    <div className="p-8 border-b border-twilight-50 bg-gradient-to-r from-twilight-50/50 to-transparent">
                      <h2 className="text-xl font-bold text-twilight-900">Profil Bilgileri</h2>
                      <p className="text-twilight-500 mt-1">Kişisel bilgilerinizi ve iletişim detaylarınızı yönetin</p>
                    </div>

                    <div className="p-8">
                      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
                        <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-twilight-900 to-twilight-700 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-twilight-900/20 shrink-0 ring-4 ring-white">
                          BY
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="text-2xl font-bold text-twilight-900">Buğra Yılmaz</h3>
                          <p className="text-twilight-500 font-medium pb-2">Admin Yöneticisi</p>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Aktif Hesap
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-twilight-100 text-twilight-800">
                              Tam Yetki
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                          <LogOut className="h-4 w-4 mr-2" />
                          Oturumu Kapat
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="fullName" className="text-twilight-700 font-medium">Ad Soyad</Label>
                          <Input id="fullName" defaultValue="Buğra Yılmaz" className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl" />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-twilight-700 font-medium">E-posta Adresi</Label>
                          <div className="relative">
                            <Input id="email" defaultValue="admin@finanspro.com" className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl pl-10" />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="phone" className="text-twilight-700 font-medium">Telefon Numarası</Label>
                          <div className="relative">
                            <Input id="phone" defaultValue="+90 532 123 4567" className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl pl-10" />
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-twilight-400" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="role" className="text-twilight-700 font-medium">Kullanıcı Rolü</Label>
                          <Input id="role" defaultValue="Süper Admin" disabled className="h-12 bg-twilight-50 border-twilight-100 text-twilight-500 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl shadow-xl shadow-twilight-100/50 border border-twilight-100 overflow-hidden">
                    <div className="p-8 border-b border-twilight-50 bg-gradient-to-r from-twilight-50/50 to-transparent">
                      <h2 className="text-xl font-bold text-twilight-900">Güvenlik</h2>
                      <p className="text-twilight-500 mt-1">Hesap güvenliğinizi ve erişim kontrollerini yönetin</p>
                    </div>

                    <div className="p-8 space-y-8">
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-4">
                        <Shield className="h-6 w-6 text-amber-600 shrink-0" />
                        <div>
                          <h4 className="font-bold text-amber-900">Hesabınız Güvende</h4>
                          <p className="text-sm text-amber-700 mt-1">Son şifre değişikliğiniz 3 ay önce yapıldı. Düzenli olarak şifrenizi güncellemenizi öneririz.</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-twilight-900 flex items-center gap-2">
                          <Lock className="h-5 w-5 text-twilight-400" />
                          Şifre Değiştir
                        </h3>
                        <div className="grid grid-cols-1 gap-6 max-w-xl">
                          <div className="space-y-3">
                            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                            <Input id="currentPassword" type="password" className="h-12 rounded-xl" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="newPassword">Yeni Şifre</Label>
                            <Input id="newPassword" type="password" className="h-12 rounded-xl" />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                            <Input id="confirmPassword" type="password" className="h-12 rounded-xl" />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-twilight-100"></div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-twilight-900">İki Faktörlü Doğrulama (2FA)</h3>
                          <p className="text-twilight-500 text-sm mt-1">Hesabınıza giriş yaparken ekstra güvenlik katmanı ekleyin.</p>
                        </div>
                        <Button variant="outline" className="h-11 rounded-xl font-medium border-twilight-200">
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
                  <div className="bg-white rounded-3xl shadow-xl shadow-twilight-100/50 border border-twilight-100 overflow-hidden">
                    <div className="p-8 border-b border-twilight-50 bg-gradient-to-r from-twilight-50/50 to-transparent">
                      <h2 className="text-xl font-bold text-twilight-900">Bildirimler</h2>
                      <p className="text-twilight-500 mt-1">Hangi konularda bildirim almak istediğinizi seçin</p>
                    </div>

                    <div className="p-8">
                      <div className="space-y-6">
                        {[
                          { id: "newTx", label: "Finansal İşlemler", desc: "Her yeni yatırım ve çekim işleminde anlık bildirim al" },
                          { id: "approval", label: "Onay Talepleri", desc: "Manuel onay gerektiren işlemlerde yönetici onayı için bildirim" },
                          { id: "block", label: "Güvenlik Uyarıları", desc: "Şüpheli işlem veya bloke durumlarında acil bildirim" },
                          { id: "daily", label: "Günlük Raporlar", desc: "Her sabah 09:00'da bir önceki günün özet raporunu al" },
                          { id: "weekly", label: "Haftalık Analiz", desc: "Haftalık performans ve komisyon analiz raporlarını al" },
                        ].map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-twilight-100 hover:bg-twilight-50/50 transition-colors">
                            <div>
                              <h4 className="font-semibold text-twilight-900">{item.label}</h4>
                              <p className="text-sm text-twilight-500 mt-0.5">{item.desc}</p>
                            </div>
                            <Switch defaultChecked />
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
                  <div className="bg-white rounded-3xl shadow-xl shadow-twilight-100/50 border border-twilight-100 overflow-hidden">
                    <div className="p-8 border-b border-twilight-50 bg-gradient-to-r from-twilight-50/50 to-transparent">
                      <h2 className="text-xl font-bold text-twilight-900">Organizasyon</h2>
                      <p className="text-twilight-500 mt-1">Şirket bilgileri ve fatura detayları</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="orgName" className="text-twilight-700 font-medium">Şirket Ünvanı</Label>
                        <Input id="orgName" defaultValue="FinansPro Teknoloji A.Ş." className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="orgTax" className="text-twilight-700 font-medium">Vergi Numarası</Label>
                        <Input id="orgTax" defaultValue="1234567890" className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl" />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <Label htmlFor="orgAddress" className="text-twilight-700 font-medium">Fatura Adresi</Label>
                        <Input id="orgAddress" defaultValue="Maslak Mah. Büyükdere Cad. No:123 Şişli/İstanbul" className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="orgPhone" className="text-twilight-700 font-medium">Telefon</Label>
                        <Input id="orgPhone" defaultValue="+90 212 999 88 77" className="h-12 border-twilight-200 focus:ring-twilight-500 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Save Action Bar */}
              <div className="sticky bottom-4 mt-6">
                <div className="bg-twilight-900/90 backdrop-blur-md text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-twilight-900/30 border border-white/10 max-w-4xl mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Değişiklikler kaydedilmedi</p>
                      <p className="text-xs text-white/50">Yaptığınız değişikliklerin geçerli olması için kaydedin.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-xl">
                      İptal
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-white text-twilight-900 hover:bg-white/90 font-bold px-6 rounded-xl shadow-lg shadow-black/20"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-twilight-900 border-t-transparent animate-spin rounded-full mr-2" />
                      ) : saved ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saved ? "Kaydedildi" : "Değişiklikleri Kaydet"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
