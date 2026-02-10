# MCP (Model Context Protocol) Setup Guide

FinansPro v3 projesi için önerilen MCP server'ları ve kurulum talimatları.

## 📋 Önerilen MCP Servers

### 1. PostgreSQL MCP - Database Inspector ⭐ (Highest Priority)

**Kullanım Alanı:** Database sorgulama, tablo inceleme, veri doğrulama

**Kurulum:**
```bash
# Claude Code'da MCP konfigürasyon dosyasını aç
# Genellikle: ~/.config/claude-code/config.json (Linux/Mac)
# Veya: %APPDATA%/claude-code/config.json (Windows)
```

**Config İçine Ekle:**
```json
{
  "mcpServers": {
    "postgres-finanspro": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://finanspro_v3:finanspro_v3_secure_password@localhost:5432/finanspro_v3"
      ]
    }
  }
}
```

**Ne Sağlar:**
- Database tablolarını sorgulayabilme
- Ledger entry'leri kontrol etme
- Balance hesaplamalarını doğrulama
- Data integrity check'leri

**Örnek Kullanım:**
```
"Claude, ledger_entry tablosunda DEBIT ve CREDIT toplamlarını karşılaştır"
→ Claude PostgreSQL MCP ile sorgu çalıştırır
```

---

### 2. GitHub MCP - Repository Management ⭐

**Kullanım Alanı:** PR oluşturma, issue tracking, commit history

**Kurulum:**

1. GitHub Personal Access Token oluştur:
   - https://github.com/settings/tokens
   - Scopes: `repo`, `read:org`, `write:discussion`

2. Config'e ekle:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

**Ne Sağlar:**
- Pull request oluşturma
- Issue tracking
- Code review
- Commit history analizi

**Örnek Kullanım:**
```
"Claude, finanspro-v3 repo'sundaki son 5 commit'i göster"
→ Claude GitHub MCP ile commit history'yi çeker
```

---

### 3. Context7 MCP - Tech Documentation ⭐

**Kullanım Alanı:** Güncel teknoloji dokümantasyonuna erişim

**Kurulum:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

**Ne Sağlar:**
- Decimal.js güncel docs
- Prisma best practices
- Next.js 15 örnekleri
- React Query v5 docs

**Örnek Kullanım:**
```
"Claude, Decimal.js'in plus metodunu kullanım örnekleriyle göster"
→ Claude Context7'den güncel docs getirir
```

---

### 4. Filesystem MCP (Built-in) ✅

**Zaten mevcut** - Claude Code ile geliyor

**Ne Sağlar:**
- File read/write
- Directory listing
- File search

---

## 🔧 Tam Konfigürasyon Örneği

Claude Code config dosyanızı (`~/.config/claude-code/config.json`) şu şekilde güncelleyin:

```json
{
  "mcpServers": {
    "postgres-finanspro": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://finanspro_v3:finanspro_v3_secure_password@localhost:5432/finanspro_v3"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  },
  "mcpSettings": {
    "outputTokenLimit": 25000,
    "enableToolSearch": true
  }
}
```

---

## 📊 MCP Kullanım Örnekleri

### Scenario 1: Ledger Balance Verification
```
Sen: "Claude, ledger_entry tablosunda toplam DEBIT ve CREDIT'leri karşılaştır"

Claude (PostgreSQL MCP kullanarak):
→ SQL: SELECT SUM(CASE WHEN entry_type='DEBIT' THEN amount ELSE 0 END) as debit,
              SUM(CASE WHEN entry_type='CREDIT' THEN amount ELSE 0 END) as credit
       FROM ledger_entry;
→ Result: DEBIT: 120.00, CREDIT: 120.00
→ ✅ Balanced!
```

### Scenario 2: Commission Data Audit
```
Sen: "Claude, commission_snapshot tablosundaki tüm kayıtları göster ve toplamları kontrol et"

Claude (PostgreSQL MCP):
→ SQL: SELECT * FROM commission_snapshot;
→ Analysis: 2 rows, total org_amount = 22.00 TL
→ Verification: Matches account balance ✓
```

### Scenario 3: Technology Research
```
Sen: "Claude, Decimal.js'de division işlemi nasıl yapılır?"

Claude (Context7 MCP):
→ Fetches: Latest Decimal.js docs
→ Shows: .dividedBy() method with examples
→ Notes: Never use .div() (deprecated)
```

### Scenario 4: Git Operations
```
Sen: "Claude, son değişiklikleri commit et ve GitHub'a push'la"

Claude (GitHub MCP):
→ Creates commit with proper message
→ Pushes to origin/main
→ Provides commit URL
```

---

## 🚀 MCP'yi Aktif Etme

1. **Config dosyasını düzenle:**
   ```bash
   # Mac/Linux
   nano ~/.config/claude-code/config.json

   # Windows
   notepad %APPDATA%/claude-code/config.json
   ```

2. **Yukarıdaki JSON config'i yapıştır**

3. **Claude Code'u restart et:**
   - VSCode'da: Reload window (Cmd+R / Ctrl+R)
   - CLI'da: Exit ve tekrar başlat

4. **Test et:**
   ```
   "Claude, PostgreSQL MCP çalışıyor mu test et"
   ```

---

## 🔐 Güvenlik Notları

### PostgreSQL Connection String
```
⚠️ Development: postgresql://user:pass@localhost:5432/db
✅ Production: Environment variable kullan
```

Production'da:
```json
{
  "postgres-finanspro": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-postgres"
    ],
    "env": {
      "DATABASE_URL": "${DATABASE_URL}"  // Environment variable
    }
  }
}
```

### GitHub Token
```
⚠️ Personal Access Token'ı asla commit'leme
✅ Local config dosyasında sakla
✅ Minimal scope ver (sadece gerekli permissions)
```

---

## 📈 MCP Performans İpuçları

### 1. Output Token Limit
```json
"mcpSettings": {
  "outputTokenLimit": 25000  // Büyük query'ler için artır
}
```

### 2. Tool Search
```json
"mcpSettings": {
  "enableToolSearch": true  // Otomatik tool discovery
}
```

### 3. Cache Management
MCP sonuçları 15 dakika cache'lenir. Fresh data için:
```
"Claude, cache'i temizle ve tekrar sorgula"
```

---

## 🧪 MCP Test Checklist

Kurulumdan sonra test et:

- [ ] PostgreSQL MCP: `"Claude, account tablosunu listele"`
- [ ] GitHub MCP: `"Claude, repo commit history'sini göster"`
- [ ] Context7 MCP: `"Claude, Prisma ile Decimal field kullanımı nedir?"`

Her üçü de çalışıyorsa:
```
✅ MCP Setup Complete!
```

---

## 🆘 Troubleshooting

### MCP Server Başlamıyor
```bash
# Test npx komutunu manuel
npx -y @modelcontextprotocol/server-postgres --version

# Node.js versiyonu kontrol et
node --version  # 18+ olmalı
```

### PostgreSQL Connection Error
```bash
# Database erişilebilir mi?
PGPASSWORD=finanspro_v3_secure_password psql -h localhost -U finanspro_v3 -d finanspro_v3 -c "SELECT 1;"
```

### GitHub Token Invalid
```bash
# Token test
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

---

## 📚 Additional Resources

- [MCP Official Docs](https://modelcontextprotocol.io/docs)
- [PostgreSQL MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)
- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Context7 MCP](https://context7.com/mcp)

---

**Not:** MCP server'lar projeye özel değil, global olarak kullanılır. Yani bir kere kurduktan sonra tüm projelerde aktif olur. FinansPro v3 için özelleştirilmiş kullanım bu guide'da açıklanmıştır.
