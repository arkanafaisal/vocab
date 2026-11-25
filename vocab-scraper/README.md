# Vocab Scraper Pipeline

Folder ini berisi skrip berurutan untuk mengambil teks web novel berbahasa Inggris dan membersihkannya hingga siap ditampung secara lokal.

## Urutan Proses

1. `01-scrape.mjs` — Membaca file lokal `target.html` di folder ini, memfokuskan ekstraksi pada `<div id="article">`, membuang iklan, lalu menormalkan innerText menjadi **1 spasi saja tanpa enter** ke `data/01-raw.txt`.
2. `02-clean-sort-dedupe.mjs` — Mengambil kata **English only** (`a-z`), mengubah ke huruf kecil, menghapus duplikat, dan mengurutkan (sort) ke `data/02-sorted-unique.txt`.
3. `03-filter-length.mjs` — Membuang kata dengan panjang `< 4` karakter ke `data/03-filtered-length.txt` (filter panjang maksimal `> 12` dilakukan setelah normalisasi).
4. `04-normalize-forms.mjs` — Memindai kata jamak, verb `-ing`, verb lampau, dan adverb `-ly` di `data/03-filtered-length.txt`, menampilkannya di console, lalu menanyakan apakah ingin dibersihkan ke bentuk dasar sebelum disimpan ke `data/04-normalized.txt`.
5. `05-filter-manual.mjs` — Membuang kata non-vocab (nama karakter, merek, istilah khusus) berdasarkan array `MANUAL_EXCLUDE_WORDS` di `manual-exclude.mjs` serta kata dengan panjang `> 12`, lalu menyimpan ke `data/05-filtered.txt`.
6. `06-save.mjs` — Menampilkan kata baru non-duplikat, menggabungkan & mengurutkan ke `data.txt` (di-commit ke repo), serta menulis hanya kata baru ke `data/06-final.txt`.
7. `07-translate.mjs` — Membaca `data/06-final.txt`, menerjemahkan per batch (dipisahkan `\n`), dan menyimpannya sebagai array objek `[{ vocab, meaning }]` di `data/07-translated.json`.
8. `08-upload.mjs` — Menyaring item yang melebihi batas panjang schema backend, menampilkan daftar yang di-exclude, lalu langsung mengirim item valid ke endpoint `/api/data/insert`.

## Cara Menjalankan

Jalankan tahap 1–3 sekaligus:

```bash
npm run scrape
```

Lanjutkan tahap 4 (scan & konfirmasi normalisasi jamak / verb-ing / verb lampau / adverb -ly):

```bash
npm run normalize
```

Atau langsung normalkan semua kategori tanpa prompt:

```bash
npm run normalize -- -y
```

Setelah mengecek `data/04-normalized.txt` dan mengisi `manual-exclude.mjs`, jalankan tahap 5:

```bash
npm run exclude
```

Simpan & gabungkan kata baru ke `data.txt` (serta buat `data/06-final.txt`):

```bash
npm run save
```

Setelah hasil tahap 6 siap, jalankan tahap 7 (translate):

```bash
npm run translate
```

