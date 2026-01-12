# PWA Icon Generation

Anda perlu membuat icon dengan ukuran berbeda dari icon utama (512x512).

## Cara Generate Icon:

### Opsi 1: Online Tool (Recommended)
1. Buka https://realfavicongenerator.net/
2. Upload file `public/icon-512x512.png`
3. Download semua ukuran icon
4. Extract ke folder `public/`

### Opsi 2: Manual dengan Image Editor
Buat ukuran berikut dari `icon-512x512.png`:
- 192x192 → `public/icon-192x192.png`
- 512x512 → `public/icon-512x512.png` (sudah ada)

### Opsi 3: Menggunakan Sharp (Node.js)
```bash
npm install --save-dev sharp-cli
npx sharp -i public/icon-512x512.png -o public/icon-192x192.png resize 192 192
```

## Icon yang Dibutuhkan:
- ✅ icon-512x512.png (sudah ada)
- ⏳ icon-192x192.png (perlu dibuat)

Setelah icon dibuat, PWA siap digunakan!
