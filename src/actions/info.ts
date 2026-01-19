"use server";

import { TIMEZONE } from "@/lib/date-utils";
import { toZonedTime } from "date-fns-tz";

import { prisma } from "@/lib/db";

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

        // 2. Fetch Recent Voucher Claims (Last 24 Hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentClaims = await prisma.voucherClaim.findMany({
            where: {
                claimedAt: {
                    gte: twentyFourHoursAgo
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                        role: true
                    }
                }
            },
            orderBy: {
                claimedAt: 'desc'
            },
            take: 5
        });

        const performanceNews = recentClaims.map(claim => ({
            id: `claim-${claim.id}`,
            text: `Selamat kepada ${claim.user.name} (${claim.user.role}) atas pencapaian Performance 100% Bulan Ini!`,
            image: claim.user.image || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800",
            sourceUrl: "",
            title: "Performance Terbaik"
        }));

        // 3. Fetch Real-time News from Antara News (RSS)
        let liveNews: { id: string | number; text: string; image: string; sourceUrl: string; title?: string }[] = [];
        try {
            const newsRes = await fetch(
                `https://megapolitan.antaranews.com/rss/bekasi-update.xml`,
                { next: { revalidate: 1800 } } // Refresh every 30 mins
            );
            const xmlText = await newsRes.text();

            // Simple XML/RSS parsing using regex
            const items = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
            liveNews = items.slice(0, 3).map((item, idx) => {
                const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
                    item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Berita Bekasi";
                const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "https://megapolitan.antaranews.com";

                // Get image from enclosure or description if possible
                const enclosure = item.match(/<enclosure url="([\s\S]*?)"/)?.[1] || "";

                return {
                    id: `news-${idx}`,
                    text: title.trim(),
                    image: enclosure || (idx === 0
                        ? "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"
                        : idx === 1
                            ? "https://images.unsplash.com/photo-1592210633466-41f48c42962c?auto=format&fit=crop&q=80&w=800"
                            : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800"),
                    sourceUrl: link.trim(),
                    title: "Update Bekasi"
                };
            });
        } catch (error) {
            console.error("Error fetching live news:", error);
            // Fallback to static if live fails
            liveNews = [
                { id: 1, text: "Info: CFD Kota Bekasi dilaksanakan setiap hari Minggu pukul 06.00-09.00 WIB.", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800", sourceUrl: "https://www.bekasikota.go.id", title: "Update Bekasi" },
                { id: 2, text: "Cuaca: Bekasi Berawan. Tetap waspada potensi hujan ringan pada sore hari.", image: "https://images.unsplash.com/photo-1592210633466-41f48c42962c?auto=format&fit=crop&q=80&w=800", sourceUrl: "https://megapolitan.antaranews.com/bekasi", title: "Update Bekasi" }
            ];
        }

        // Combine Performance News + General News
        const combinedNews = [...performanceNews, ...liveNews];

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
                news: combinedNews
            }
        };
    } catch (error) {
        console.error("Error fetching dashboard info:", error);
        return { success: false, error: "Failed to fetch dashboard info" };
    }
}
