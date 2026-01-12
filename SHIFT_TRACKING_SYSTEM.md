# 🕐 Shift Tracking & Late Detection System

## 📋 **Shift Schedule:**

| Shift | Nama | Jam Kerja | Durasi |
|-------|------|-----------|--------|
| **P** | Pagi | 08:00 - 20:00 | 12 jam |
| **PM** | Pagi-Malam | 13:00 - 20:00 | 7 jam |
| **M** | Malam | 20:00 - 08:00 | 12 jam |
| **OFF** | Libur | - | - |

---

## ⏰ **Aturan Clock In/Out:**

### **Clock In:**
- ✅ **Toleransi**: 0 menit (tepat waktu)
- ❌ **Terlambat**: Lebih dari 1 menit dari jadwal
- 📊 **Tracking**: Tercatat berapa menit terlambat

**Contoh:**
```
Shift P (Jadwal: 08:00)
- Clock in 08:00 → ✅ Tepat waktu
- Clock in 08:01 → ⚠️ Terlambat 1 menit
- Clock in 08:15 → ⚠️ Terlambat 15 menit
```

### **Clock Out:**
- ✅ **Toleransi**: 5 menit sebelum jadwal
- ✅ **Boleh pulang lebih awal**: Maksimal 5 menit sebelum jadwal

**Contoh:**
```
Shift P (Jadwal: 20:00)
- Clock out 19:54 → ❌ Terlalu awal (belum 5 menit sebelum)
- Clock out 19:55 → ✅ Boleh (dalam toleransi 5 menit)
- Clock out 20:00 → ✅ Tepat waktu
- Clock out 20:05 → ✅ Boleh (lembur)
```

---

## 🗄️ **Database Schema:**

### **Attendance Model (Updated):**
```prisma
model Attendance {
  // ... existing fields
  shiftType         String?    // P, PM, M
  scheduledClockIn  DateTime?  // Jadwal masuk seharusnya
  scheduledClockOut DateTime?  // Jadwal pulang seharusnya
  isLate            Boolean    @default(false)
  lateMinutes       Int        @default(0)
}
```

---

## 🔧 **Implementation Steps:**

### **Step 1: Database Migration**
```bash
npx prisma db push
```

### **Step 2: Get User's Shift**
Dari tabel `Schedule`, ambil shift user untuk hari ini:
```typescript
const schedule = await prisma.schedule.findFirst({
    where: {
        userId,
        date: today
    }
});
const shiftType = schedule?.shiftCode; // P, PM, M, atau OFF
```

### **Step 3: Calculate Scheduled Times**
```typescript
import { SHIFT_SCHEDULES, getScheduledTime } from '@/lib/shift-utils';

const shift = SHIFT_SCHEDULES[shiftType];
const scheduledClockIn = getScheduledTime(today, shift.clockInTime);
const scheduledClockOut = getScheduledTime(today, shift.clockOutTime);
```

### **Step 4: Check Late Status**
```typescript
const lateMinutes = calculateLateMinutes(now, scheduledClockIn);
const isLate = lateMinutes > 0;
```

### **Step 5: Save to Database**
```typescript
await prisma.attendance.create({
    data: {
        userId,
        clockIn: now,
        shiftType,
        scheduledClockIn,
        scheduledClockOut,
        isLate,
        lateMinutes,
        // ... other fields
    }
});
```

---

## 📊 **UI Display:**

### **Clock In Status:**
```
┌─────────────────────────────┐
│ Shift: Pagi (08:00 - 20:00) │
│ Status: ⚠️ Terlambat 15 menit │
│ Clock In: 08:15             │
└─────────────────────────────┘
```

### **Clock Out Status:**
```
┌─────────────────────────────┐
│ Shift: Pagi (08:00 - 20:00) │
│ Clock In: 08:15 (Terlambat) │
│ Durasi: 11 jam 45 menit     │
│ [Button: Absen Keluar]      │
│ (Boleh dari 19:55)          │
└─────────────────────────────┘
```

---

## 📈 **Reports & Analytics:**

### **Data yang Bisa Ditrack:**
1. ✅ Total keterlambatan per bulan
2. ✅ Rata-rata keterlambatan per karyawan
3. ✅ Persentase kehadiran tepat waktu
4. ✅ Durasi kerja aktual vs jadwal
5. ✅ Lembur (clock out lebih dari jadwal)

### **Example Query:**
```typescript
// Total terlambat bulan ini
const lateCount = await prisma.attendance.count({
    where: {
        userId,
        isLate: true,
        clockIn: {
            gte: startOfMonth,
            lt: endOfMonth
        }
    }
});

// Rata-rata menit terlambat
const avgLate = await prisma.attendance.aggregate({
    where: { userId, isLate: true },
    _avg: { lateMinutes: true }
});
```

---

## 🚀 **Next Steps:**

1. **Run Migration:**
   ```bash
   npx prisma db push
   ```

2. **Update clockIn() function:**
   - Get user's shift from Schedule
   - Calculate scheduled times
   - Check late status
   - Save with shift info

3. **Update UI:**
   - Show shift info
   - Display late status
   - Show clock out tolerance time

4. **Add Reports:**
   - Late statistics
   - Attendance summary
   - Monthly reports

---

## ✅ **Benefits:**

1. **Akurat**: Tracking keterlambatan otomatis
2. **Fair**: Toleransi 5 menit untuk clock out
3. **Transparent**: Karyawan tahu kapan boleh pulang
4. **Analytics**: Data lengkap untuk evaluasi
5. **Flexible**: Support 3 jenis shift

---

**Status**: Schema updated, utilities created. 
**Next**: Run migration & update clockIn function.
