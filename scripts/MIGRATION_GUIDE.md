# Photo Migration Guide

## Overview
Script ini akan mengkonversi semua foto absensi yang masih dalam format base64 di database menjadi file WebP yang tersimpan di `public/image/attendance`.

## Benefits
- ✅ **Mengurangi ukuran database** hingga 90%+
- ✅ **Mengurangi traffic** karena tidak perlu transfer base64 besar
- ✅ **Meningkatkan performa** query database
- ✅ **Konsisten** dengan sistem baru
- ✅ **Backup mudah** - foto bisa di-backup terpisah

## Prerequisites
1. Database migration sudah dijalankan (`npx prisma db push`)
2. Field `imageOut` sudah ada di tabel Attendance
3. Backup database sebelum menjalankan migrasi

## How to Run

### 1. Stop Dev Server
```bash
# Tekan Ctrl+C di terminal yang menjalankan npm run dev
```

### 2. Run Migration Script
```bash
npx tsx scripts/migrate-photos.ts
```

### 3. Monitor Progress
Script akan menampilkan progress real-time:
```
🔄 Starting photo migration from base64 to WebP files...

✅ Upload directory ready

📊 Found 150 attendance records with base64 photos

  ✓ Migrated clock in photo for attendance abc123
  ✓ Migrated clock out photo for attendance abc123
  ✓ Migrated clock in photo for attendance def456
  ...

📈 Migration Summary:
  ✅ Successfully migrated: 150 records
  ❌ Errors: 0 records

✨ Migration completed!
```

### 4. Verify Results
1. Check `public/image/attendance/` folder - should have many `.webp` files
2. Check database - `image` and `imageOut` fields should now contain paths like `/image/attendance/userId_timestamp_in.webp`
3. Check file sizes - should be 100-200KB each

### 5. Restart Dev Server
```bash
npm run dev
```

## What the Script Does

1. **Finds all base64 photos** in the database (both `image` and `imageOut` fields)
2. **Converts each photo**:
   - Decodes base64 to buffer
   - Compresses to WebP format
   - Adjusts quality to achieve 100-200KB file size
   - Saves to `public/image/attendance/`
3. **Updates database**:
   - Replaces base64 string with file path
   - Preserves original timestamp in filename
4. **Reports progress** and any errors

## File Naming Convention
- Clock In: `{userId}_{timestamp}_in.webp`
- Clock Out: `{userId}_{timestamp}_out.webp`

Example: `clxyz123_1705456789000_in.webp`

## Safety Features
- ✅ Non-destructive - only updates records with base64 data
- ✅ Preserves original timestamps
- ✅ Error handling - continues even if some photos fail
- ✅ Detailed logging for troubleshooting

## Rollback (if needed)
If you need to rollback:
1. Restore database from backup
2. Delete files in `public/image/attendance/`

## Estimated Time
- ~100 photos: 1-2 minutes
- ~500 photos: 5-10 minutes
- ~1000 photos: 10-20 minutes

## Troubleshooting

### Error: "Cannot find module 'tsx'"
Install tsx globally:
```bash
npm install -g tsx
```

Or use ts-node:
```bash
npx ts-node scripts/migrate-photos.ts
```

### Error: "EPERM: operation not permitted"
Make sure dev server is stopped and no other process is using the database.

### Some photos failed to migrate
Check the error messages in the console. Common issues:
- Corrupted base64 data
- Invalid image format
- Insufficient disk space

Failed photos will remain as base64 in the database and can be migrated manually later.

## Post-Migration Verification

### Check Database
```sql
-- Count records still using base64
SELECT COUNT(*) FROM "Attendance" 
WHERE image LIKE 'data:image%' OR "imageOut" LIKE 'data:image%';

-- Should return 0 if migration was successful
```

### Check File System
```bash
# Count migrated files
ls public/image/attendance/*.webp | wc -l
```

### Test in Browser
1. Navigate to `/history` page
2. Verify all photos load correctly
3. Check browser Network tab - photos should load from `/image/attendance/` URLs
