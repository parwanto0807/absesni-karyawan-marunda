export interface ResidentProject {
  title: string;
  description: string;
  visual: string;
  image: string;
}

export const RESIDENT_PROJECTS: ResidentProject[] = [
  {
    title: "IT Development",
    description: "Solusi transformasi digital, pembuatan website, aplikasi kustom, dan maintenance sistem informasi perusahaan.",
    visual: "Dashboard interaktif & baris kode modern.",
    image: "/projects/it.png"
  },
  {
    title: "Networking & Wi-Fi",
    description: "Instalasi jaringan internet, optimasi sinyal Wi-Fi, dan konfigurasi router MikroTik/Ubiquiti untuk rumah & kantor.",
    visual: "Router dengan pancaran sinyal biru estetik.",
    image: "/projects/networking.png"
  },
  {
    title: "Security & CCTV",
    description: "Sistem keamanan terintegrasi. Pantau hunian kapan saja dengan teknologi IP Camera terbaru dan storage awet.",
    visual: "Kamera dome modern dengan indikator record.",
    image: "/projects/security.png"
  },
  {
    title: "Portal Gate System",
    description: "Sistem akses otomatis perumahan menggunakan RFID atau Long Range Reader untuk keamanan akses keluar-masuk.",
    visual: "Boom gate otomatis dengan sensor RFID.",
    image: "/projects/portal.png"
  },
  {
    title: "Rental Mobil (R4)",
    description: "Sewa kendaraan roda 4 untuk kebutuhan harian, perjalanan dinas, atau liburan keluarga dengan armada terawat.",
    visual: "Mobil MPV putih bersih di depan gedung modern.",
    image: "/projects/rental.png"
  },
  {
    title: "HRD Solutions",
    description: "Konsultasi manajemen SDM, penyusunan SOP, payroll system, dan pelatihan tenaga kerja profesional.",
    visual: "Ikon tim yang saling terhubung (People network).",
    image: "/projects/hrd.png"
  },
  {
    title: "Dapur Ibu Marunda",
    description: "Layanan katering harian, pesanan nasi box, dan hidangan tradisional kualitas premium untuk berbagai acara.",
    visual: "Sajian nasi tumpeng atau box katering estetik.",
    image: "/projects/dapur.png"
  },
  {
    title: "Kios Sayuran",
    description: "Suplai sayuran segar, bumbu dapur, dan kebutuhan pokok harian langsung antar ke depan pintu rumah.",
    visual: "Keranjang kayu berisi sayuran hijau segar.",
    image: "/projects/kios.png"
  },
  {
    title: "Legal & Lawyer",
    description: "Layanan konsultasi hukum, pengurusan dokumen legalitas, dan pendampingan hukum profesional.",
    visual: "Timbangan keadilan atau dokumen dengan materai.",
    image: "/projects/legal.png"
  },
  {
    title: "General Contractor",
    description: "Jasa renovasi rumah, bangun baru, desain interior, hingga perbaikan atap dan kelistrikan.",
    visual: "Helm proyek dan blueprint bangunan.",
    image: "/projects/contractor.png"
  }
];
