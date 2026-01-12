# PANDUAN PERHITUNGAN PERFORMANCE KARYAWAN

## 📊 Sistem Perhitungan Kehadiran dan Performance

Dokumen ini menjelaskan bagaimana sistem menghitung hari kerja, tingkat kehadiran, dan performance karyawan berdasarkan role dan shift pattern masing-masing.

---

## 1. Perhitungan Hari Kerja Berdasarkan Role

### 🌳 LINGKUNGAN & KEBERSIHAN

**Jadwal Kerja:**
- Bekerja: Senin - Sabtu (6 hari/minggu)
- Libur: Minggu

**Perhitungan Hari Kerja:**
```
Hari Kerja = Total Hari dalam Periode - Jumlah Hari Minggu
```

**Contoh:**
```
Periode: 1-31 Januari 2026
- Total hari: 31 hari
- Hari Minggu: 4 hari (5, 12, 19, 26 Januari)
- Hari Kerja: 31 - 4 = 27 hari
```

---

### 🛡️ SECURITY

**Jadwal Kerja:**
- Pattern: 5 hari rotasi (P, PM, M, OFF, OFF)
- Bekerja: 3 dari 5 hari = 60% dari total hari

**Perhitungan Hari Kerja:**
```
Hari Kerja = Total Hari dalam Periode × 0.6 (60%)
```

**Contoh:**
```
Periode: 1-31 Januari 2026
- Total hari: 31 hari
- Hari Kerja: 31 × 0.6 = 18.6 ≈ 19 hari (dibulatkan ke atas)
```

**Penjelasan Pattern:**
- **P (Pagi)**: 06:00 - 14:00
- **PM (Pagi-Malam)**: 06:00 - 18:00
- **M (Malam)**: 18:00 - 06:00 (keesokan hari)
- **OFF**: Libur (2 hari berturut-turut)

---

### 👔 ADMIN & PIC

**Jadwal Kerja:**
- Tidak ada kewajiban absensi harian
- Hari Kerja: 0 hari

**Catatan:**
Admin dan PIC tidak dihitung dalam sistem absensi karena sifat pekerjaan yang fleksibel.

---

## 2. Kolom-Kolom dalam Resume Performance

| Kolom | Deskripsi | Rumus |
|-------|-----------|-------|
| **Hari Kerja** | Total hari kerja yang diharapkan berdasarkan role & periode | Lihat perhitungan per role di atas |
| **Hadir** | Jumlah hari aktual hadir (status PRESENT atau LATE) | Count dari record absensi |
| **Absen** | Jumlah hari tidak masuk kerja | Hari Kerja - Hadir |
| **Tingkat** | Persentase tingkat kehadiran | (Hadir / Hari Kerja) × 100% |
| **Avg Perf** | Rata-rata performance harian | Rata-rata dari performance harian |
| **Telat** | Jumlah total keterlambatan | Count dari isLate = true |
| **Avg Telat** | Rata-rata menit terlambat | Total Menit Telat / Jumlah Telat |

---

## 3. Perhitungan Performance Harian

Performance harian dihitung berdasarkan ketepatan waktu masuk dan pulang:

### Formula:
```
Performance = 100%
- (Menit Terlambat × 0.5%, maksimal -30%)
- (Menit Pulang Cepat × 0.5%, maksimal -30%)
```

### Contoh Perhitungan:

**Kasus 1: Tepat Waktu**
```
- Telat: 0 menit
- Pulang Cepat: 0 menit
- Performance: 100%
```

**Kasus 2: Terlambat 20 Menit**
```
- Telat: 20 menit
- Pengurangan: 20 × 0.5% = 10%
- Performance: 100% - 10% = 90%
```

**Kasus 3: Terlambat 80 Menit**
```
- Telat: 80 menit
- Pengurangan: 80 × 0.5% = 40% (dibatasi maksimal 30%)
- Performance: 100% - 30% = 70%
```

**Kasus 4: Terlambat 15 Menit + Pulang Cepat 30 Menit**
```
- Telat: 15 menit → 15 × 0.5% = 7.5%
- Pulang Cepat: 30 menit → 30 × 0.5% = 15%
- Performance: 100% - 7.5% - 15% = 77.5%
```

---

## 4. Periode Perhitungan

Sistem menggunakan periode sebagai berikut (berurutan):

1. **Jika ada Filter Tanggal**
   - Gunakan Start Date dan End Date dari filter
   - Contoh: Filter 1-15 Januari → Periode 15 hari

2. **Jika Tidak Ada Filter**
   - Gunakan range dari data absensi yang ada
   - Contoh: Data absensi dari 5-20 Januari → Periode 16 hari

3. **Jika Tidak Ada Data**
   - Default ke bulan berjalan
   - Contoh: Bulan Januari → 1-31 Januari

---

## 5. Contoh Lengkap Perhitungan

### Karyawan LINGKUNGAN - Periode 1-31 Januari 2026

**Data:**
- Total hari dalam periode: 31 hari
- Hari Minggu: 4 hari
- **Hari Kerja**: 27 hari

**Absensi:**
- Hadir: 25 hari
- Tidak masuk: 2 hari
- Terlambat: 8 kali
- Total menit terlambat: 120 menit

**Perhitungan:**
```
Hari Kerja: 31 - 4 = 27 hari
Hadir: 25 hari
Absen: 27 - 25 = 2 hari
Tingkat Kehadiran: (25 / 27) × 100% = 92.6%
Avg Telat: 120 / 8 = 15 menit
```

**Interpretasi:**
- ✅ Tingkat kehadiran sangat baik (92.6%)
- ⚠️ Perlu perbaikan ketepatan waktu (rata-rata telat 15 menit)

---

### Karyawan SECURITY - Periode 1-31 Januari 2026

**Data:**
- Total hari dalam periode: 31 hari
- **Hari Kerja**: 31 × 0.6 = 19 hari (rounded up)

**Absensi:**
- Hadir: 18 hari
- Tidak masuk: 1 hari
- Terlambat: 3 kali
- Total menit terlambat: 45 menit

**Perhitungan:**
```
Hari Kerja: 31 × 0.6 = 19 hari
Hadir: 18 hari
Absen: 19 - 18 = 1 hari
Tingkat Kehadiran: (18 / 19) × 100% = 94.7%
Avg Telat: 45 / 3 = 15 menit
```

**Interpretasi:**
- ✅ Tingkat kehadiran excellent (94.7%)
- ⚠️ Perlu perbaikan ketepatan waktu (rata-rata telat 15 menit)

---

## 6. Standar Penilaian Performance

### Tingkat Kehadiran:
- **Excellent**: ≥ 95%
- **Baik**: 90% - 94.9%
- **Cukup**: 80% - 89.9%
- **Kurang**: < 80%

### Average Performance:
- **Excellent**: ≥ 95%
- **Baik**: 85% - 94.9%
- **Cukup**: 75% - 84.9%
- **Kurang**: < 75%

### Keterlambatan:
- **Baik**: Rata-rata < 5 menit
- **Cukup**: Rata-rata 5-15 menit
- **Kurang**: Rata-rata > 15 menit

---

## 7. Cara Menggunakan Laporan PDF

1. **Buka Halaman Riwayat Absensi**
2. **Pilih Filter** (opsional):
   - Pilih karyawan tertentu atau "Semua Karyawan"
   - Pilih periode tanggal (Start Date - End Date)
3. **Klik "Export PDF"**
4. **PDF akan terbuka di tab baru** dengan 2 tabel:
   - **Resume Performance Karyawan** (hijau)
   - **Detail Absensi** (biru)

---

## 8. Tips untuk Admin

1. **Review Bulanan**: Export laporan setiap akhir bulan untuk evaluasi
2. **Identifikasi Pola**: Perhatikan karyawan dengan tingkat kehadiran < 90%
3. **Tindak Lanjut**: Berikan coaching untuk karyawan dengan avg telat > 15 menit
4. **Apresiasi**: Berikan penghargaan untuk karyawan dengan performance > 95%
5. **Dokumentasi**: Simpan PDF laporan sebagai arsip HR

---

## 9. FAQ

**Q: Mengapa hari kerja Security hanya 60% dari total hari?**
A: Karena pattern shift 5 hari (P, PM, M, OFF, OFF) berarti 3 hari kerja dari 5 hari = 60%.

**Q: Apakah hari libur nasional dihitung?**
A: Saat ini sistem belum memperhitungkan hari libur nasional. Perhitungan murni berdasarkan pattern shift.

**Q: Bagaimana jika karyawan cuti atau sakit?**
A: Cuti dan sakit akan masuk ke kolom "Absen" dan mengurangi tingkat kehadiran.

**Q: Apakah performance bisa negatif?**
A: Tidak. Performance minimal adalah 0%, meskipun total pengurangan melebihi 100%.

---

**Dokumen ini dibuat pada:** 12 Januari 2026  
**Versi:** 1.0  
**Kontak:** Admin Sistem Absensi Marunda
