'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudLightning, Sun, CloudSun, CloudFog, Loader2, MapPin } from 'lucide-react';

interface WeatherData {
    utc_datetime: string;
    local_datetime: string;
    t: number; // Temperature
    weather_desc: string;
    weather_desc_en: string;
    ws: number; // Wind speed
    hu: number; // Humidity
    tp: number; // Total Precipitation
}

interface BMKGLocationData {
    lokasi: {
        adm4: string;
        provinsi: string;
        kotkab: string;
        kecamatan: string;
        desa: string;
        timezone: string;
    };
    cuaca: WeatherData[][]; // BMKG API v2 often returns nested array for days or just flat. Let's handle flat first but check structure.
}

interface BMKGResponse {
    data: BMKGLocationData[];
}

export default function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Metland Cibitung (Wanajaya) ADM4 Code: 32.16.07.2002
                const res = await fetch('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.16.07.2002');
                if (!res.ok) throw new Error('Failed to fetch weather');
                const json: BMKGResponse = await res.json();

                if (!json.data || json.data.length === 0 || !json.data[0].cuaca) {
                    throw new Error('No weather data available');
                }

                const rawCuaca = json.data[0].cuaca;
                const forecasts = Array.isArray(rawCuaca[0]) ? rawCuaca.flat() : rawCuaca as unknown as WeatherData[];

                // Find the closest forecast to current time
                const now = new Date();
                const closest = forecasts.reduce((prev, curr) => {
                    const prevDiff = Math.abs(new Date(prev.local_datetime.replace(' ', 'T')).getTime() - now.getTime());
                    const currDiff = Math.abs(new Date(curr.local_datetime.replace(' ', 'T')).getTime() - now.getTime());
                    return currDiff < prevDiff ? curr : prev;
                });

                setWeather(closest);
            } catch (err) {
                console.error("Weather fetch error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Refresh every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getWeatherIcon = (weather: WeatherData) => {
        // Override for precipitation
        if (weather.tp > 0 && ['berawan', 'cerah berawan', 'cerah'].includes(weather.weather_desc.toLowerCase())) {
            return <CloudRain className="text-blue-400" size={20} />;
        }

        const desc = weather.weather_desc;
        if (!desc) return <Cloud className="text-slate-400" size={20} />;
        const d = desc.toLowerCase();
        if (d.includes('petir')) return <CloudLightning className="text-amber-400" size={20} />;
        if (d.includes('hujan')) return <CloudRain className="text-blue-400" size={20} />;
        if (d.includes('cerah berawan')) return <CloudSun className="text-orange-400" size={20} />;
        if (d.includes('cerah')) return <Sun className="text-yellow-400" size={20} />;
        if (d.includes('kabur') || d.includes('fog')) return <CloudFog className="text-slate-400" size={20} />;
        return <Cloud className="text-slate-400" size={20} />; // Default Berawan/Cloudy
    };

    if (error) return null; // Hide if error

    if (loading) {
        return (
            <div className="flex items-center justify-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-100 dark:border-slate-700 h-10 w-16 md:w-24 shrink-0">
                <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
        );
    }

    if (!weather) return null;

    return (
        <a
            href="https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32.16.07.2002"
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center space-x-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-100 dark:border-slate-700 rounded-2xl px-2 md:px-3 py-1.5 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-800/80 hover:scale-[1.02] active:scale-95 cursor-pointer group"
        >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900/50 shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                {getWeatherIcon(weather)}
            </div>
            <div className="flex flex-col">
                <div className="flex items-center">
                    <span className="text-sm md:text-lg font-black text-slate-700 dark:text-slate-200 leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {weather.t}°
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5 mt-0.5 md:mt-1">C</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-none truncate max-w-[60px] md:max-w-[80px]">
                        {(weather.tp > 0 && ['berawan', 'cerah berawan', 'cerah'].includes(weather.weather_desc.toLowerCase())) ? 'Hujan Ringan' : weather.weather_desc}
                    </span>
                    <span className="text-[7px] text-slate-400 font-medium leading-none mt-0.5">
                        {weather.local_datetime.split(' ')[1].slice(0, 5)} WIB
                    </span>
                </div>
                <div className="flex items-center mt-0.5 gap-1.5">
                    <div className="flex items-center space-x-0.5 text-[7px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">
                        <MapPin size={8} />
                        <span>Wanajaya</span>
                    </div>
                    <span className="hidden md:inline-block text-[6px] font-bold text-indigo-400/80 uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50 rounded-[3px] px-0.5 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        BMKG
                    </span>
                </div>
            </div>
        </a>
    );
}
