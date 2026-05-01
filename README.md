# Aplikasi MFarm

Ini adalah proyek [Expo](https://expo.dev) untuk aplikasi irigasi SmartDrip.

## Mulai

1. Pasang dependensi

   ```bash
   npm install
   ```

2. Jalankan aplikasi

   ```bash
   npx expo start
   ```

3. Jalankan backend Flask

   ```bash
   cd ../backend
   pip install -r requirements.txt
   python app.py
   ```

Atau jalankan backend dan frontend sekaligus dari root project:

```bash
python scripts/run_dev.py
```

Alternatif lewat npm:

```bash
npm run dev
```

Pada output terminal, kamu bisa memilih untuk membuka aplikasi di:

- [build pengembangan](https://docs.expo.dev/develop/development-builds/introduction/)
- [emulator Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [simulator iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), sandbox terbatas untuk mencoba pengembangan aplikasi Expo

Pengembangan bisa dimulai dari file di direktori **app**. Proyek ini memakai [routing berbasis file](https://docs.expo.dev/router/introduction).

Backend tersedia di `http://localhost:5000/api` dengan endpoint utama:

- `GET /api/farm-summary`
- `GET /api/schedules`
- `POST /api/schedules`
- `PATCH /api/schedules/<id>`
- `GET /api/history`
- `GET /api/profile`
- `PUT /api/profile`

Jika aplikasi akan dihubungkan ke VPS, buat file `.env` di folder `mfarm` dengan isi berikut sebelum menjalankan Expo:

```bash
EXPO_PUBLIC_API_BASE_URL=http://109.110.188.181:5000/api
```

Backend Flask pada project ini sudah dijalankan di `0.0.0.0:5000`, jadi dari sisi aplikasi cukup pastikan port `5000` di VPS terbuka dan mengarah ke service backend.

## Reset Proyek

Untuk membuat ulang struktur awal, jalankan:

```bash
npm run reset-project
```

Perintah ini akan memindahkan kode awal ke direktori **app-example** dan membuat direktori **app** kosong.

## Pelajari Lebih Lanjut

Untuk mempelajari pengembangan dengan Expo, lihat referensi berikut:

- [Dokumentasi Expo](https://docs.expo.dev/): Pelajari dasar-dasar dan topik lanjutan melalui panduan resmi.
- [Tutorial Expo](https://docs.expo.dev/tutorial/introduction/): Ikuti tutorial bertahap untuk membuat proyek yang berjalan di Android, iOS, dan web.

## Komunitas

Bergabung dengan komunitas pengembang aplikasi universal:

- [Expo di GitHub](https://github.com/expo/expo): Lihat platform sumber terbuka Expo dan ikut berkontribusi.
- [Komunitas Discord](https://chat.expo.dev): Berdiskusi dengan pengguna Expo dan ajukan pertanyaan.
