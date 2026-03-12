# Guvenli Gorev Calistirici

Kullanici bir gorev verdi. Asagidaki adimlari OTOMATIK ve SIRAYLA yap. Kullaniciya her adimda ne yaptigini KISA bildir.

## Adimlar

### 1. YEDEK
- `git stash` ile mevcut degisiklikleri kaydet (varsa)
- Gorev icin yeni branch ac: `git checkout -b task/KISA-ISIM` (gorevden turet)
- Kullaniciya bildir: "Branch: task/xxx acildi"

### 2. ANALIZ
- Gorevi anla, ilgili dosyalari oku
- Plan moduna gir ve kullaniciya KISA ozet sun:
  - Hangi dosya(lar) degisecek
  - Ne degisecek (1-2 cumle)
  - Nelere dokunulmayacak
- Kullanici onaylamazsa DURUR

### 3. UYGULAMA
- Onaylanan plani uygula
- SADECE gereken dosyalari degistir
- Degisiklik sonrasi `git diff --stat` goster

### 4. DOGRULAMA
- Backend .ts dosyalari degistiyse: Decimal.js kontrolu (grep .add\( .sub\( .mul\( .div\()
- Ledger/transaction degistiyse: DEBIT=CREDIT mantik kontrolu
- Her durumda: degisen dosya sayisi ve satirlari raporla

### 5. TAMAMLA
- Degisiklikleri commit et (aciklayici mesajla)
- `dev` branch'ine merge et: `git checkout dev && git merge task/xxx`
- Task branch'i sil: `git branch -d task/xxx`
- Kullaniciya ozet: "X dosyada Y degisiklik yapildi, dev'e merge edildi"

## HATA DURUMUNDA
- Bir sey bozulursa: `git checkout dev && git branch -D task/xxx`
- Kullaniciya bildir: "Sorun olustu, tum degisiklikler geri alindi, dev temiz"
- Stash varsa geri yukle: `git stash pop`

## KURALLAR
- CLAUDE.md'deki agent kurallarini MUTLAKA uygula
- Gorev disinda hicbir dosyaya dokunma
- Kullanici "iptal" derse hemen 'HATA DURUMUNDA' adimina git
