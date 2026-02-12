# FinansPro v3 - Custom Agent Teams

Bu klasör, FinansPro v3 için özel tasarlanmış agent team'lerini içerir.

---

## 📋 Mevcut Agent Teams

### 1. Financial Audit Team (`financial-audit-team.md`)
**Amaç:** Sistemin finansal doğruluğunu, muhasebe tutarlılığını ve kod kalitesini denetler.

**Team Üyeleri:**
- 🧮 Accounting Auditor (Muhasebe denetimi)
- 💰 Commission Validator (Komisyon doğrulama)
- 💻 Code Quality Auditor (Kod kalitesi)
- 🗄️ Data Integrity Auditor (Veri bütünlüğü)
- ⚡ Performance Auditor (Performans)
- 🔒 Security Auditor (Güvenlik)

**Ne zaman kullan:**
- Production'a deploy etmeden önce
- Finansal logic değişikliğinden sonra
- Ay sonu kapanış öncesi
- Veri tutarsızlığı şüphesi olduğunda
- Vergi raporu hazırlığı öncesi

**Nasıl kullanılır:**
```
# Slash command ile (önerilen)
/financial-audit

# Manuel çağrı ile
"Run the Financial Audit Team agent"
```

**Çıktı:**
- ✅ Passed checks listesi
- ⚠️ Warning'ler (yakında fix edilmeli)
- ❌ Critical issues (hemen fix edilmeli)
- 📊 Finansal istatistikler
- 🔧 Önceliklendirilmiş fix önerileri

**Süre:** 10-20 dakika (transaction sayısına göre)

---

## 🛠️ Yeni Agent Team Nasıl Eklenir?

1. Bu klasörde yeni bir `.md` dosyası oluştur:
   ```bash
   touch .claude/agents/my-new-team.md
   ```

2. Şu yapıyı kullan:
   ```markdown
   # My New Team Agent

   ## Description
   [Agent team'in ne yaptığını açıkla]

   ## Team Members
   ### 1. [Role Name]
   **Role:** [Rolün görevi]
   **Responsibilities:** [Sorumluluklar]
   **Check List:** [Kontrol edilecekler]

   ## Execution Workflow
   [Adım adım ne yapacağını açıkla]

   ## Output Format
   [Nasıl bir rapor üretileceği]
   ```

3. Slash command ekle (opsiyonel):
   ```bash
   touch .claude/commands/my-new-command.md
   ```

4. Command içinde agent'ı çağır:
   ```markdown
   Launch the [Team Name] agent to [purpose]
   ```

---

## 💡 Agent Team İpuçları

### ✅ İyi Pratikler:
- Her team member için **net sorumluluklar** tanımla
- **Check list** formatı kullan (actionable olsun)
- **Execution workflow** adım adım olsun
- **Output format** standardize et (her seferinde aynı yapı)
- **Prerequisites** belirt (backend running, auth token, etc.)

### ❌ Kaçınılması Gerekenler:
- Belirsiz roller ("Genel kontrol yapar" → Ne kontrol eder?)
- Çok geniş scope (1 agent = 1 clear mission)
- Manual intervention gerektiren adımlar (otomatize et)
- Destructive operations (agent'lar read-only olmalı)

---

## 📊 Team Agent vs. Regular Agent

| Özellik | Regular Agent | Team Agent |
|---------|--------------|------------|
| Scope | Tek bir task | Birden fazla paralel task |
| Roles | Yok | Birden fazla role ayrılmış |
| Output | Freeform | Standardize rapor |
| Reusability | Low | High (her seferinde aynı format) |
| Complexity | Simple | Complex (orchestration gerekir) |

**Ne zaman Team Agent kullan:**
- Task'ın farklı perspektiflerden bakılması gerekiyorsa
- Standardize rapor formatı istiyorsan
- Recurring task (her ay, her deploy, etc.)
- Multiple domain expertise gerekiyorsa (accounting + security + performance)

**Ne zaman Regular Agent kullan:**
- Tek seferlik task
- Özel format (her seferinde farklı)
- Hızlı investigation
- No formal reporting needed

---

## 🔍 Örnek Kullanım Senaryoları

### Senaryo 1: Ay Sonu Kapanış
```
1. /financial-audit → Sistem durumunu kontrol et
2. Raporda ❌ Critical issue varsa → Fix et
3. Raporda ⚠️ Warning'ler varsa → Not al (sonra fix)
4. Hepsi ✅ ise → Period closing işlemini yap
```

### Senaryo 2: Yeni Komisyon Hesabı Ekleme
```
1. Kodu yaz (yeni commission logic)
2. /financial-audit → Doğrula
3. Commission Validator agent raporuna bak
4. Total commission hala 12% mi? → ✅ Deploy
```

### Senaryo 3: Performance Sorun Şüphesi
```
1. /financial-audit → Run et
2. Performance Auditor section'a odaklan
3. Slow queries listesine bak
4. Index recommendations'ları uygula
5. /financial-audit → Re-run, improvement doğrula
```

---

## 📝 Agent Development Roadmap

### Şu an mevcut:
- ✅ Financial Audit Team

### Gelecek agent team'ler (ihtiyaç halinde eklenebilir):
- [ ] **Reconciliation Team** - Bank hesapları vs. ledger mutabakatı
- [ ] **Tax Reporting Team** - Vergi beyanı için gerekli raporları hazırlar
- [ ] **Partner Payout Team** - Partner ödemelerini hesaplar ve validate eder
- [ ] **Migration Team** - Data migration işlemlerini safe şekilde yönetir
- [ ] **Backup & Restore Team** - Backup alır, restore test eder

---

## 🆘 Sorun Giderme

### "Agent team bulunamadı" hatası
- `.claude/agents/` klasörünün olduğundan emin ol
- `.md` dosya extension'ının doğru olduğunu kontrol et
- Claude Code'u restart et

### Agent team çok yavaş çalışıyor
- Prerequisites kontrol et (backend running?)
- Database connection timeout var mı?
- Transaction sayısı çok fazla ise → expect longer runtime

### Agent rapor yerine genel cevap veriyor
- "Output Format" section'ını daha detaylı yaz
- Explicit örnekler ekle (markdown code block ile)
- "Return a structured report in this exact format:" diye başla

---

## 📚 Kaynaklar

- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [FinansPro v3 Main Documentation](../.claude/CLAUDE.md)
- [Custom Commands Guide](../.claude/commands/README.md)

---

**Son Güncelleme:** 2026-02-11
**Maintainer:** Emre (CEO) + Claude (CFO)
