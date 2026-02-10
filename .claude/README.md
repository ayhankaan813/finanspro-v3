# 🤖 Claude Code Customizations for FinansPro v3

Bu klasör, FinansPro v3 projesine özel Claude Code optimizasyonlarını içerir.

## 📂 İçerik

```
.claude/
├── README.md                           # Bu dosya
├── CLAUDE.md                           # Ana proje kılavuzu
├── mcp-setup-guide.md                  # MCP server kurulum rehberi
│
├── commands/                           # Özel slash komutları
│   ├── audit.md                        # /audit - Finansal doğruluk kontrolü
│   ├── financial-test.md               # /financial-test - E2E test senaryosu
│   ├── deploy-check.md                 # /deploy-check - Production hazırlık
│   └── optimize.md                     # /optimize - Performans analizi
│
└── skills/                             # Domain bilgisi
    ├── finanspro-accounting/
    │   └── SKILL.md                    # Muhasebe sistemi uzmanlığı
    └── finanspro-testing/
        └── SKILL.md                    # Test stratejisi uzmanlığı
```

## 🚀 Kullanım

### Slash Commands

Artık bu komutları kullanabilirsiniz:

```bash
/audit              # Tüm finansal hesaplamaları kontrol et
/financial-test     # Manuel test senaryosunu otomatik çalıştır
/deploy-check       # Production'a hazır mı kontrol et
/optimize           # Performans sorunlarını tespit et
```

### Skills (Otomatik Aktif)

Skills otomatik olarak ilgili kelimeleri tespit edip aktif olur:

- **finanspro-accounting:** komisyon, ledger, balance, decimal gibi kelimeler
- **finanspro-testing:** test, verify, validate, check gibi kelimeler

### CLAUDE.md - Proje Beyin

[CLAUDE.md](CLAUDE.md) dosyası proje hakkında tüm bilgiyi içerir:
- Teknoloji stack
- Business logic kuralları
- Kod standartları
- Kritik dosyalar
- Design system
- Development workflow

## 🎯 CEO-CFO Çalışma Modeli

**Sen (CEO):** Stratejik kararlar, feature request'ler, business goals
**Ben (CFO):** Teknik implementasyon, finansal doğruluk, kod kalitesi

### Örnek Workflow

```
CEO: "Organizasyon sayfasına kar marjı trendi ekle"
    ↓
CFO: Plan Mode ile analiz
    ↓
CEO: Plan'ı onaylar
    ↓
CFO: Implement eder + test eder
    ↓
CEO: Review yapar, approve eder
    ↓
CFO: Deploy eder
```

## 📊 Skills Detayları

### finanspro-accounting

- Komisyon yapısı: Site 6%, Partner 1.5%, Financier 2.5%, Org 2%
- Decimal.js kullanım kuralları (.plus, .minus, .times, .dividedBy)
- Double-entry ledger sistemi (DEBIT = CREDIT)
- Running balance hesaplama (geriye doğru)
- Kritik dosyalar: site.service.ts, commission.service.ts, organization.service.ts

### finanspro-testing

- Test database konfigürasyonu
- Seed data beklenen değerleri (Org: 22 TL, NISAN site, Ahmet Yılmaz partner)
- Test data reset flow
- API endpoint testleri
- Common test failures ve çözümleri

## 🔧 MCP Servers (Opsiyonel ama Önerilen)

[mcp-setup-guide.md](mcp-setup-guide.md) dosyasında detaylı kurulum:

1. **PostgreSQL MCP** - Database sorgulama
2. **GitHub MCP** - Repo yönetimi
3. **Context7 MCP** - Güncel tech docs

## ✅ Kurulum Doğrulama

1. Claude Code'u restart edin
2. Yeni bir chat başlatın
3. Test edin:
   ```
   /audit
   ```
4. Skill test:
   ```
   "Claude, komisyon hesaplamasını açıkla"
   ```
   → finanspro-accounting skill'i aktif olmalı

## 📝 Komut Örnekleri

### Yeni Feature Öncesi
```
/audit
→ Mevcut kod finansal açıdan doğru mu kontrol et
```

### Feature Implementation Sonrası
```
/financial-test
→ Tüm sistem E2E test edilsin
```

### Production Deploy Öncesi
```
/deploy-check
→ Checklist'i gözden geçir
```

### Performance Sorun Varsa
```
/optimize
→ N+1 query, bundle size, re-render analizi
```

## 🎓 Öğrenme Kaynakları

- [CLAUDE.md](CLAUDE.md) - Proje detayları
- [finanspro-accounting SKILL](skills/finanspro-accounting/SKILL.md) - Muhasebe kuralları
- [finanspro-testing SKILL](skills/finanspro-testing/SKILL.md) - Test stratejileri
- [MCP Setup Guide](mcp-setup-guide.md) - External tool entegrasyonları

## 🤝 Katkıda Bulunma

Yeni slash command veya skill eklemek için:

1. **Slash Command:**
   ```bash
   # Yeni dosya oluştur
   touch .claude/commands/yeni-komut.md

   # İçeriği düzenle (markdown format)
   # Claude Code otomatik olarak /yeni-komut komutu oluşturur
   ```

2. **Skill:**
   ```bash
   # Yeni skill klasörü
   mkdir -p .claude/skills/yeni-skill

   # SKILL.md oluştur (YAML frontmatter gerekli)
   # name, description, autoInvoke, patterns tanımla
   ```

## 📞 Yardım

Sorun yaşarsanız:

1. Claude Code'u restart edin
2. [CLAUDE.md](CLAUDE.md)'deki troubleshooting bölümüne bakın
3. Bana sorun:
   ```
   "Claude, [X] komutu çalışmıyor, [hata mesajı]"
   ```

---

**Oluşturulma Tarihi:** 2026-02-10
**Versiyon:** 1.0.0
**Sahip:** Emre Yılmaz (CEO) + Claude (CFO)
