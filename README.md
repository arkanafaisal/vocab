# 🎮 Real-Time Vocabulary Quiz Game

Aplikasi *full-stack* kuis kosakata *real-time* yang dilengkapi dengan papan peringkat (*leaderboard*) langsung, pengganda skor (*streak multipliers*), dan sistem autentikasi yang aman.

## 🏗️ Arsitektur & Deployment

Berbeda dengan aplikasi *frontend* terpisah pada umumnya, proyek ini menggunakan pendekatan *monolithic deployment* untuk menyajikan antarmuka:

* **Monolithic Serving:** Aplikasi React di-*build* ke dalam direktori `react/dist` dan disajikan secara statis langsung oleh *backend* Express.
* **SPA Routing:** Karena *backend* menyajikan *file* statis, *frontend* mengandalkan perutean berbasis *Hash URL* (contoh: `/#verify-email`) alih-alih *library router* eksternal untuk mencegah *error 404* saat pengguna melakukan *deep linking*.
* **Deployment (VPS):** Aplikasi di-*deploy* menggunakan *process manager* PM2 (tanpa kontainerisasi Docker).
* **Graceful Shutdown:** Server memantau sinyal `SIGINT` dan `SIGTERM` untuk membersihkan kunci *socket* Redis (`vocab:socket:*`) secara aman sebelum dimatikan guna mencegah kebocoran/sesi *ghost*.

---

## 💻 Tech Stack

### ⚙️ Backend
* **Core:** Node.js, Express v5
* **Database & Cache:** MySQL2, Redis
* **Real-time Communication:** Socket.io
* **Security & Utils:** JWT (*Cookies*), bcrypt, Joi (Validasi), Nodemailer

### 🖥️ Frontend
* **Core & UI:** React v19, Vite, Tailwind CSS v4, socket.io-client v4
* **State Management:** Terpusat pada `App.jsx` menggunakan React State dan pendelegasian logika kompleks melalui *Custom Hooks* (`useSocket`, `useLeaderboard`, `useQuizActions`).

---

## 🌟 Fitur Utama

### 🎮 Kuis Real-Time (Quiz Section & WebSockets)
* **Kuis Kosakata Interaktif:** Komponen `QuizSection.jsx` menampilkan pertanyaan kosakata beserta pilihan ganda. Dilengkapi *feedback* visual yang kompleks seperti penyorotan jawaban benar/salah, animasi *score-pop*, dan *badge* api *streak* yang dinamis.
* **Dynamic Scoring:** Menghitung tambahan poin secara dinamis berdasarkan *streak* aktif pengguna (mendapatkan 10, 15, 25, atau 50 poin per jawaban benar) melalui *event* `submit_answer` di server.
* **Optimasi State Redis:** Menyimpan *batch* 50 pertanyaan dan *state* kuis langsung di memori Redis menggunakan metode *Index Pointer* (`currentIndex`) dengan perintah `LINDEX` agar pengambilan data sangat cepat tanpa memutasi *array*.
* **Single-Device Session:** Menerapkan pembatasan satu sesi aktif per akun, yang secara otomatis memutus koneksi sesi lama jika akun yang sama *login* di perangkat lain.

### 🔐 Autentikasi & Manajemen Profil
* **Manajemen Profil Terpusat:** Menggunakan komponen `Modals.jsx` sebagai pengelola *overlay/popup* sentral untuk Form Login/Register, melihat status Profil, hingga melakukan *Update Username* dan *Update Email*.
* **Verifikasi Email & Reset Password:** Terintegrasi dengan Nodemailer untuk pengiriman tautan token. Berkat metode *Deep Linking via URL Hash*, saat pengguna mengklik tautan dari email (seperti `#verify-email?token=...` atau `#reset-password?token=...`), aplikasi akan otomatis mendeteksi *hash* tersebut dan langsung membuka modal pemrosesan verifikasi atau pembuatan *password* baru.
* **Akses Aman (JWT):** Menggunakan autentikasi berbasis token ganda (`accessToken` dan `refreshToken`) yang disimpan secara aman di dalam *cookies* browser.

### 🏆 Leaderboard & UI Dinamis
* **Live Leaderboard Pintar:** Komponen `LeaderboardSection.jsx` menampilkan peringkat pemain global. Sistem ini secara otomatis menggabungkan skor lokal pengguna agar peringkat terlihat mutakhir (*real-time*) secara visual tanpa harus terus-menerus mengambil data ulang dari *server*. Dilengkapi juga dengan mekanisme *cooldown* 5 detik untuk tombol penyegaran.
* **Visual Latar Belakang Interaktif:** Memanfaatkan `ParticleCanvas` dan `fire-vignette` yang aktif mengubah intensitas efek visualnya secara dinamis seiring dengan bertambahnya *streak* jawaban benar dari pengguna.