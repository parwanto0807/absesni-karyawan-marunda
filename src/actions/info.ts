"use server";

import { TIMEZONE } from "@/lib/date-utils";
import { toZonedTime } from "date-fns-tz";

export async function getDashboardInfo() {
    try {
        const now = toZonedTime(new Date(), TIMEZONE);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        // 1. Fetch Prayer Times (Bekasi ID: 1225)
        const prayerRes = await fetch(
            `https://api.myquran.com/v2/sholat/jadwal/1225/${year}/${month}/${day}`,
            { next: { revalidate: 3600 } }
        );
        const prayerData = await prayerRes.json();
        const timings = prayerData.status ? prayerData.data.jadwal : null;

        // 2. Info / News
        const news = [
            { id: 1, text: "Info: CFD Kota Bekasi dilaksanakan setiap hari Minggu pukul 06.00-09.00 WIB." },
            { id: 2, text: "Cuaca: Bekasi Berawan. Tetap waspada potensi hujan ringan pada sore hari." },
            { id: 3, text: "Lalu Lintas: Arus lalu lintas Kalimalang terpantau ramai lancar." }
        ];

        return {
            success: true,
            data: {
                prayer: timings ? {
                    subuh: timings.subuh,
                    dzuhur: timings.dzuhur,
                    ashar: timings.ashar,
                    maghrib: timings.maghrib,
                    isya: timings.isya,
                    image: "https://images.unsplash.com/photo-1590076214663-12503254580b?auto=format&fit=crop&q=80&w=800",
                    sourceUrl: "https://myquranina.com/"
                } : null,
                news: news.map(n => ({
                    ...n,
                    image: n.id === 1
                        ? "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"
                        : n.id === 2
                            ? "https://images.unsplash.com/photo-1592210633466-41f48c42962c?auto=format&fit=crop&q=80&w=800"
                            : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
                    sourceUrl: n.id === 1 ? "https://www.bekasikota.go.id" : "https://megapolitan.antaranews.com/bekasi"
                }))
            }
        };
    } catch (error) {
        console.error("Error fetching dashboard info:", error);
        return { success: false, error: "Failed to fetch dashboard info" };
    }
}
