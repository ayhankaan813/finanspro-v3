# Database Backup

Buyuk degisikliklerden once veritabanini yedekle.

## Yapilacak

1. Yedek al:
```bash
PGPASSWORD=finanspro_v3_secure_password pg_dump -h localhost -U finanspro_v3 -d finanspro_v3 > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. Kullaniciya yedek dosya adini goster.

3. Geri yukleme komutu hatirlatmasi:
```bash
# Geri yuklemek icin:
PGPASSWORD=finanspro_v3_secure_password psql -h localhost -U finanspro_v3 -d finanspro_v3 < backup_DOSYA_ADI.sql
```

NOT: Yedek dosyasini proje kokune kaydet. .gitignore'da *.sql ekli olmali.
