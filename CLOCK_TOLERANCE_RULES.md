# Clock In/Out - Tolerance Rules

## ⏰ **Aturan Toleransi:**

### **Clock In (Absen Masuk):**
- ❌ **Tidak ada toleransi**
- Hanya bisa clock in **1x per hari**
- Jika sudah clock in hari ini (belum clock out), tidak bisa clock in lagi
- Setelah clock out, harus tunggu **3 menit** untuk clock in shift berikutnya

### **Clock Out (Absen Keluar):**
- ✅ **Toleransi 3 menit**
- Setelah clock out, tunggu 3 menit baru bisa clock in lagi
- Berguna untuk **pergantian shift**

---

## 📊 **Skenario:**

### **Skenario 1: Normal (1 Shift)**
```
08:00 → Clock In ✅
17:00 → Clock Out ✅
17:01 → Clock In ❌ (tunggu 3 menit)
17:04 → Clock In ✅ (untuk hari berikutnya/shift baru)
```

### **Skenario 2: Shift Ganda**
```
08:00 → Clock In (Shift Pagi) ✅
12:00 → Clock Out (Shift Pagi) ✅
12:01 → Clock In (Shift Siang) ❌ (tunggu 3 menit)
12:04 → Clock In (Shift Siang) ✅
17:00 → Clock Out (Shift Siang) ✅
```

### **Skenario 3: Sudah Clock In**
```
08:00 → Clock In ✅
08:30 → Clock In ❌ (sudah clock in, belum clock out)
12:00 → Clock Out ✅
12:04 → Clock In ✅ (shift baru)
```

---

## 🔧 **Implementasi:**

### **Backend (`src/actions/attendance.ts`):**

#### **clockIn():**
1. Cek apakah sudah clock in hari ini (belum clock out)
   - Jika ya → Error: "Sudah clock in hari ini"
2. Cek apakah ada clock out dalam 3 menit terakhir
   - Jika ya → Error: "Tunggu X menit"
3. Jika lolos semua → Clock in berhasil

#### **clockOut():**
1. Update clockOut timestamp
2. Revalidate paths

---

## 📱 **UI Flow:**

### **Status: Belum Clock In**
```
┌─────────────────────────┐
│  [Kamera Aktif]         │
│                         │
│  [Button: Absen Masuk]  │
└─────────────────────────┘
```

### **Status: Sudah Clock In**
```
┌─────────────────────────┐
│  Clock In: 08:00        │
│  Durasi: 4 jam 30 menit │
│                         │
│  [Button: Absen Keluar] │
└─────────────────────────┘
```

### **Status: Sudah Clock Out**
```
┌─────────────────────────┐
│  ✅ Selesai             │
│  Clock In: 08:00        │
│  Clock Out: 17:00       │
│  Durasi: 9 jam          │
└─────────────────────────┘
```

---

## ✅ **Keuntungan Sistem Ini:**

1. **Mencegah Double Clock In**
   - Tidak bisa clock in 2x dalam sehari tanpa clock out

2. **Support Shift Ganda**
   - Toleransi 3 menit untuk pergantian shift
   - Bisa clock in lagi setelah clock out (tunggu 3 menit)

3. **Akurat**
   - Durasi kerja tercatat dengan benar
   - Tidak ada manipulasi waktu

4. **User Friendly**
   - Pesan error yang jelas
   - Countdown waktu tunggu

---

Sistem ini sudah diimplementasikan di `src/actions/attendance.ts`!
