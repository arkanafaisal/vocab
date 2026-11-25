# Vocab Scraper Pipeline

Folder ini berisi skrip berurutan untuk mengambil teks web novel berbahasa Inggris dan membersihkannya hingga siap ditampung secara lokal.

## Urutan Proses

1. `01-scrape.mjs` — Membaca file lokal `target.html` di folder ini, memfokuskan ekstraksi pada `<div id="article">`, membuang iklan, lalu menormalkan innerText menjadi **1 spasi saja tanpa enter** ke `data/01-raw.txt`.
2. `02-clean-sort-dedupe.mjs` — Mengambil kata **English only** (`a-z`), mengubah ke huruf kecil, menghapus duplikat, dan mengurutkan (sort) ke `data/02-sorted-unique.txt`.
3. `03-filter-length.mjs` — Membuang kata dengan panjang `< 4` karakter ke `data/03-filtered-length.txt` (filter panjang maksimal `> 12` dilakukan setelah normalisasi).
4. `04-normalize-forms.mjs` — Memindai kata jamak, verb `-ing`, verb lampau, dan adverb `-ly` di `data/03-filtered-length.txt`, menampilkannya di console, lalu menanyakan apakah ingin dibersihkan ke bentuk dasar sebelum disimpan ke `data/04-normalized.txt`.
5. `05-filter-manual.mjs` — Membuang kata non-vocab (nama karakter, merek, istilah khusus) berdasarkan array `MANUAL_EXCLUDE_WORDS` di `manual-exclude.mjs`, menyaring rentang panjang `4-12`, serta membuang duplikat dari `data.txt`, lalu menyimpan ke `data/05-filtered.txt`.
6. `06-translate.mjs` — Membaca `data/05-filtered.txt`, menerjemahkan per batch (dipisahkan `\n`), dan menyimpannya sebagai array objek `[{ vocab, meaning }]` di `data/06-translated.json`.
7. `07-filter-loanwords.mjs` — Memindai kata serapan (kesamaan urutan huruf `vocab` vs `meaning`), menampilkannya di console, meminta konfirmasi hapus (`y/n`), lalu menyimpan ke `data/07-final.json`.
8. `08-save.mjs` — Menampilkan kata baru non-duplikat dari `data/07-final.json`, lalu menggabungkan & mengurutkan ke `data.txt`.
9. `09-upload.mjs` — Menyaring item yang melebihi batas panjang schema backend, menampilkan daftar yang di-exclude, lalu langsung mengirim item valid ke endpoint `/api/data/insert`.

## Cara Menjalankan

1. Tahap 1–3: `npm run scrape`
2. Tahap 4 (normalisasi): `npm run normalize` (atau `npm run normalize -- -y`)
3. Tahap 5 (filter manual & dedupe `data.txt`): `npm run filter`
4. Tahap 6 (translate): `npm run translate`
5. Tahap 7 (filter kata serapan): `npm run loanword`
6. Tahap 8 (simpan ke `data.txt`): `npm run save`
7. Tahap 9 (upload ke backend): `npm run upload`

Atau jalankan semuanya dengan konfirmasi jeda di setiap tahap:

```bash
npm run master
```

