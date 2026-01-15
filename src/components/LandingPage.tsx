'use client';

import React from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Shield, MapPin, Users, Phone, ArrowRight, Home, CheckCircle2, Star, Zap, Info, Calendar, Megaphone, Heart, Coffee, TreePine, Sparkles, Smartphone, X } from 'lucide-react';
import Link from 'next/link';

interface LandingPageProps {
    settings?: Record<string, string>;
    activities?: any[];
    services?: any[];
}

const ICON_MAP: Record<string, any> = {
    Megaphone,
    TreePine,
    Shield,
    Info,
    Calendar,
    Home,
    Heart,
    Coffee,
    Smartphone
};

const TABS = [
    { id: 'hero', label: 'Home' },
    { id: 'info-warga', label: 'Informasi' },
    { id: 'kegiatan', label: 'Kegiatan' },
    { id: 'keamanan', label: 'Keamanan' }
];

// Simple Tab Navigation with animated underline
function TabNav({ activeSection, onTabClick }: { activeSection: string; onTabClick: (id: string) => void }) {
    return (
        <div className="hidden lg:flex items-center space-x-10 relative">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabClick(tab.id)}
                    className="relative group py-2"
                >
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${activeSection === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
                        {tab.label}
                    </span>

                    {/* Animated underline indicator */}
                    {activeSection === tab.id && (
                        <motion.div
                            layoutId="tab-underline"
                            className="absolute -bottom-2 left-0 right-0 h-[3px] bg-indigo-600 rounded-full"
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}



export default function LandingPage({ settings = {}, activities = [], services = [] }: LandingPageProps) {
    const [selectedActivity, setSelectedActivity] = React.useState<any>(null);
    const [activeSection, setActiveSection] = React.useState('hero');
    const [prevSection, setPrevSection] = React.useState('hero');
    const isAutoScrolling = React.useRef(false);
    const { scrollY } = useScroll();

    const SECTION_ORDER = ['hero', 'info-warga', 'kegiatan', 'keamanan'];

    const handleUpdateActiveSection = (newSection: string) => {
        if (newSection !== activeSection) {
            setPrevSection(activeSection);
            setActiveSection(newSection);
        }
    };

    // Parallax Transforms
    const yHero = useTransform(scrollY, [0, 1000], [0, 100]);
    const yFloat = useTransform(scrollY, [0, 1000], [0, -150]);
    const yBanner = useTransform(scrollY, [300, 1300], [-60, 60]);

    // Smooth Scroll Helper
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            isAutoScrolling.current = true;
            handleUpdateActiveSection(id); // Update immediately for animation

            const offset = 0;
            const targetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = 1800; // Pelan dan mewah
            let startTime: number | null = null;

            const animateScroll = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);

                // Ease In Out Quart function for premium feel
                const ease = progress < 0.5
                    ? 8 * progress * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 4) / 2;

                window.scrollTo(0, startPosition + distance * ease);

                if (timeElapsed < duration) {
                    requestAnimationFrame(animateScroll);
                } else {
                    setTimeout(() => {
                        isAutoScrolling.current = false;
                    }, 100);
                }
            };

            requestAnimationFrame(animateScroll);
        }
    };

    // Listen for scroll to update active section
    React.useEffect(() => {
        const handleScroll = () => {
            if (isAutoScrolling.current) return;

            const sections = ['hero', 'info-warga', 'kegiatan', 'keamanan'];
            const scrollPosition = window.scrollY + 100;

            // Force hero if at the very top
            if (window.scrollY < 100) {
                handleUpdateActiveSection('hero');
                return;
            }

            // Check sections from bottom to top for better accuracy
            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                const element = document.getElementById(section);
                if (element) {
                    const top = element.offsetTop;
                    if (scrollPosition >= top) {
                        handleUpdateActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeSection]);

    // Fallback values
    const heroTitle = settings['landing_hero_title'] || 'Sejuk, Aman & Harmonis Untuk Warga.';
    const heroSubtitle = settings['landing_hero_subtitle'] || 'Menyatukan keberagaman suku bangsa dari Jawa, Sumatera, Kalimantan, Papua, hingga NTT dalam satu lingkungan yang asri dan nyaman di Metland Cibitung.';
    const footerInfo = settings['landing_footer_info'] || 'Membangun komunitas multikultural yang harmonis, aman, dan sejuk di jantung Bekasi. Wadah aspirasi untuk warga RT 003 & 004 RW 26 Metland Cibitung.';

    // Default Images or Dynamic from settings
    const heroImage = settings['landing_hero_image'] || '/metland_diversity_harmony.png';
    const activityImage = settings['landing_activity_image'] || '/metland_harmony_activity.png';
    const securityImage = settings['landing_security_image'] || '/metland_marunda_gate_ultra.png';

    // Default Lists if empty
    const displayActivities = activities.length > 0 ? activities : [
        { title: 'Senam Pagi Bersama', time: 'Setiap Minggu Pagi' },
        { title: 'Rapat Koordinasi RT', time: 'Sabtu Minggu Ke-2' },
        { title: 'Arisan & Kuliner Nusantara', time: 'Minggu Terakhir' },
        { title: 'Bakti Lingkungan', time: 'Bulan Ganjil' }
    ];

    const displayServices = services.length > 0 ? services : [
        { icon: 'Megaphone', title: 'WARTA RT/RW', description: 'Informasi terbuka, kebijakan jelas, warga selaras. Pusat informasi resmi mengenai kegiatan, jadwal layanan, dan kebijakan lingkungan yang transparan.' },
        { icon: 'TreePine', title: 'LINGKUNGAN ASRI', description: 'Kebersihan terjaga, penghijauan lestari, taman indah. Program pemilahan sampah, penghijauan, dan perawatan fasilitas taman agar lingkungan selalu nyaman.' },
        { icon: 'Shield', title: 'RESPON CEPAT', description: 'Tim security siaga 24 jam untuk kedaruratan Anda. Layanan sigap yang menghubungkan warga langsung dengan tim keamanan untuk situasi mendesak.' }
    ];

    return (
        <div className="min-h-screen bg-white overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header / Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-3 overflow-hidden">
                    <img src="/logo_marunda.png" alt="Logo Taman Marunda" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                    <div className="min-w-0">
                        <span className="text-[11px] md:text-base font-black text-slate-900 uppercase tracking-tighter leading-tight block truncate">Cluster Taman Marunda</span>
                        <span className="block text-[7px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest -mt-0.5 md:-mt-1 truncate">RT 003/004 | RW 26 Metland</span>
                    </div>
                </div>

                <TabNav
                    activeSection={activeSection}
                    onTabClick={scrollToSection}
                />

                <Link
                    href="/login"
                    className="group flex items-center space-x-1.5 md:space-x-2 bg-slate-900 hover:bg-indigo-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-200 hover:shadow-indigo-200 shrink-0"
                >
                    <span className="text-[9px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap">Portal Petugas</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform md:w-4 md:h-4" />
                </Link>
            </nav>

            {/* Hero Section - Diversity & Harmony */}
            <section id="hero" className="relative pt-28 md:pt-40 lg:pt-48 pb-16 md:pb-32 px-4 md:px-6 bg-gradient-to-b from-indigo-50/50 via-white to-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-6 md:space-y-10 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white text-indigo-700 border border-indigo-100 shadow-sm mx-auto lg:mx-0">
                            <Sparkles size={14} className="text-indigo-600" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Bhinneka Tunggal Ika dalam Keharmonisan</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter uppercase italic whitespace-pre-line">
                            {heroTitle}
                        </h1>

                        <p className="text-sm md:text-lg lg:text-xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed md:leading-loose">
                            {heroSubtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <a href="#kegiatan" className="h-14 md:h-16 px-8 rounded-xl md:rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs md:text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center">
                                Lihat Agenda Warga
                            </a>
                            <Link
                                href="/login"
                                className="h-14 md:h-16 px-8 rounded-xl md:rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center space-x-3 hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100"
                            >
                                <Coffee size={18} className="text-indigo-600" />
                                <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest">Portal Khusus Petugas</span>
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ y: yHero }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 md:-inset-10 bg-indigo-600/5 blur-[100px] rounded-full" />
                        <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-4 md:border-8 border-white shadow-[0_32px_64px_-16px_rgba(79,70,229,0.1)]">
                            <motion.img
                                style={{ y: useTransform(scrollY, [0, 1000], [-40, 40]) }}
                                src={heroImage}
                                alt="Keharmonisan Suku Bangsa di Metland"
                                className="w-full h-full object-cover scale-125"
                            />

                            {/* Diversity Floating Badge */}
                            <motion.div
                                style={{ y: yFloat }}
                                className="absolute top-6 left-6 md:top-10 md:left-10 bg-white/95 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-full shadow-2xl border border-white/20 z-10"
                            >
                                <div className="flex items-center space-x-2 md:space-x-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                                <div className={`w-full h-full bg-gradient-to-br from-indigo-${i}00 to-indigo-${i + 2}00`} />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-900 tracking-widest">Multikultural</span>
                                </div>
                            </motion.div>

                            {/* Floating Community Card */}
                            <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 bg-white/90 backdrop-blur-md p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl">
                                <div className="flex items-center space-x-4 md:space-x-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                        <Heart size={24} className="md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <span className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Falsafah Lingkungan</span>
                                        <span className="text-sm md:text-xl font-black text-slate-900 uppercase leading-none tracking-tighter">Satu Hati, Satu Marunda</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Information Grid */}
            <section id="info-warga" className="py-24 md:py-40 px-4 md:px-6 bg-white border-t border-slate-50">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto space-y-20 md:space-y-32"
                >
                    {/* Concept Header */}
                    <div className="text-center space-y-6 md:space-y-8">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Info size={12} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Portal Layanan Warga</span>
                        </div>
                        <h2 className="text-4xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">
                            Cluster <span className="text-indigo-600">Hijau Asri.</span>
                        </h2>

                        {/* Main Service Banner */}
                        <div className="relative max-w-5xl mx-auto aspect-[21/9] md:aspect-video lg:aspect-[21/9] rounded-[3rem] md:rounded-[5rem] overflow-hidden border-4 md:border-8 border-slate-100 shadow-2xl group">
                            <motion.img
                                style={{ y: yBanner }}
                                src="/metland_service_banner.png"
                                alt="Cluster Hijau Asri"
                                className="w-full h-full object-cover scale-125"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex flex-col justify-end p-8 md:p-16 text-left group-hover:via-slate-900/40 transition-all duration-700">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <p className="text-white text-xs md:text-xl font-black uppercase tracking-[0.5em] opacity-80 mb-2 md:mb-4">Eksklusif & Harmonis</p>
                                    <h3 className="text-white text-2xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] italic">Menjamin Kenyamanan <br /> Setiap Keluarga.</h3>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-14 text-left">
                        {displayServices.map((item, i) => {
                            const IconComp = ICON_MAP[item.icon] || Info;
                            return (
                                <div key={i} className="group p-8 md:p-12 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.8rem] bg-white text-indigo-600 flex items-center justify-center mb-10 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                        <IconComp size={32} />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-5">{item.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-lg">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Section Footer Tagline */}
                    <div className="text-center pt-10">
                        <p className="text-slate-300 font-black uppercase tracking-[0.6em] text-[10px] md:text-xs">
                            Terhubung • Terinformasi • Terlindungi
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Activities Section */}
            <section id="kegiatan" className="py-24 md:py-48 px-4 md:px-6 bg-slate-50 border-y border-slate-100">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-32 items-center"
                >
                    <div className="order-2 lg:order-1 relative">
                        <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-4 md:border-8 border-white shadow-2xl">
                            <img
                                src={activityImage}
                                alt="Kegiatan Bersama Suku Bangsa"
                                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                            />
                        </div>
                        {/* Event Float Card */}
                        <div className="absolute -bottom-6 -right-4 md:-bottom-10 md:-right-6 bg-indigo-600 text-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-[240px] md:max-w-xs border-4 border-white">
                            <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-3 opacity-80">Info Terkini</div>
                            <div className="text-base md:text-2xl font-black uppercase tracking-tighter leading-tight mb-4 italic">Kegiatan <br /> Lingkungan <br /> Marunda.</div>
                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full w-fit">
                                <Sparkles size={14} />
                                <span>Update Bulanan</span>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-6 md:space-y-10 text-center lg:text-left">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mx-auto lg:mx-0">
                            <Calendar size={12} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Agenda Sosial Warga</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">
                            Rayakan <span className="text-emerald-600">Kebersamaan</span> <br className="hidden md:block" /> Dalam Keberagaman.
                        </h2>
                        <p className="text-sm md:text-lg text-slate-500 font-medium leading-relaxed md:leading-loose">
                            Dari senam pagi lintas suku hingga bakti sosial warga, kami rutin mengadakan kegiatan untuk mempererat tali silaturahmi antar warga RT 003 & 004 Metland Cibitung.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {displayActivities.map((item, i) => {
                                const hasDetail = item.image || item.description;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => hasDetail && setSelectedActivity(item)}
                                        className={`flex flex-col p-5 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-indigo-500/5 ${hasDetail ? 'md:col-span-2 flex-row gap-5 cursor-pointer active:scale-[0.98]' : ''}`}
                                    >
                                        {item.image && (
                                            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{item.title}</span>
                                            <span className="text-[9px] md:text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">{item.time}</span>
                                            {item.description && (
                                                <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 italic">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Security Section */}
            <section id="keamanan" className="py-32 md:py-56 px-4 md:px-6 bg-slate-900 relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:gap-32 items-center"
                >
                    <div className="space-y-6 md:space-y-12 text-center lg:text-left">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto lg:mx-0">
                            <Shield size={12} />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Safe Environment</span>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight italic">
                            Keamanan <span className="text-indigo-400">Prioritas</span> <br className="hidden md:block" /> Utama Kami.
                        </h2>
                        <p className="text-sm md:text-lg lg:text-xl text-slate-400 font-medium leading-relaxed md:leading-loose">
                            Hadir memantau 24 jam dengan penuh keramahan, memastikan warga dapat beristirahat dengan tenang dan nyaman di dalam kawasan cluster.
                        </p>

                        <div className="space-y-4">
                            {[
                                'Sistem RFID & Gerbang Ganda',
                                'Patroli Keamanan Setiap 2 Jam',
                                'Koordinasi Cepat Via WhatsApp Group',
                                'Penerangan Jalan & CCTV Berbasis IP'
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3 text-left">
                                    <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                        <CheckCircle2 size={12} className="md:w-4 md:h-4" />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-10 md:-inset-20 bg-indigo-500/10 blur-[100px] rounded-full" />
                        <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-4 md:border-8 border-slate-800 shadow-2xl">
                            <img
                                src={securityImage}
                                alt="Sistem Keamanan RFID Gate Marunda"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-16 md:py-24 bg-white px-4 md:px-6 border-t border-slate-100">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                            <img src="/logo_marunda.png" alt="Logo Taman Marunda" className="w-14 h-14 md:w-20 md:h-20 object-contain" />
                            <div className="text-left">
                                <span className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter block leading-none">Cluster Taman Marunda</span>
                                <span className="text-[9px] md:text-xs font-black text-indigo-600 uppercase tracking-[0.4em]">Metland Cibitung</span>
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.2em] max-w-xl leading-relaxed pt-2">
                            {footerInfo}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-10 md:gap-16">
                        <div className="text-center">
                            <span className="block text-[10px] md:text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">Pengaduan Warga</span>
                            <div className="flex items-center space-x-2 text-indigo-600 font-black text-xs md:text-sm uppercase tracking-tighter">
                                <Phone size={16} />
                                <span>Emergency Pos 1 (Ext. 26)</span>
                            </div>
                        </div>
                        <div className="text-center md:border-l md:border-slate-200 md:pl-16">
                            <span className="block text-[10px] md:text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4">Lokasi Sekretariat</span>
                            <div className="text-slate-900 font-black text-xs md:text-sm uppercase tracking-tighter leading-tight">
                                Balai Pertemuan RW 26, <br className="hidden md:block" /> Metland Cibitung, Bekasi
                            </div>
                        </div>
                    </div>

                    <div className="w-full pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <span className="text-center md:text-left">© 2024 Pengurus Lingkungan RT 003 & 004 RW 26. Semua hak dilindungi.</span>
                        <div className="flex items-center gap-3">
                            <span>Sistem Dashboard Petugas :</span>
                            <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-[8px] md:text-[9px]">V.1.2 MARUNDA</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Activity Detail Dialog */}
            <AnimatePresence>
                {selectedActivity && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedActivity(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="absolute top-6 right-6 md:top-10 md:right-10 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/80 backdrop-blur-md border border-slate-100 rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-90"
                            >
                                <X size={20} />
                            </button>

                            <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
                                {selectedActivity.image && (
                                    <div className="aspect-video w-full overflow-hidden border-b border-slate-50">
                                        <img
                                            src={selectedActivity.image}
                                            alt={selectedActivity.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-8 md:p-14 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
                                            <Calendar size={14} />
                                            <span>Agenda Warga Marunda</span>
                                        </div>
                                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">
                                            {selectedActivity.title}
                                        </h2>
                                        <div className="text-xs md:text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full w-fit uppercase tracking-widest">
                                            {selectedActivity.time}
                                        </div>
                                    </div>

                                    {selectedActivity.description && (
                                        <div className="space-y-4">
                                            <div className="h-px w-20 bg-slate-200" />
                                            <p className="text-sm md:text-lg text-slate-500 font-medium leading-relaxed md:leading-loose whitespace-pre-line italic">
                                                "{selectedActivity.description}"
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-6">
                                        <button
                                            onClick={() => setSelectedActivity(null)}
                                            className="w-full py-4 md:py-6 bg-slate-900 text-white rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                                        >
                                            Tutup Detail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
