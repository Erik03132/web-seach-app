"use client";

import { db } from "@/lib/firebase/firebase";
import { collection, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import {
    Box,
    ChevronRight,
    CircleDollarSign,
    Cpu,
    Heart,
    Search,
    Trash2,
    TrendingUp,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AppRecommendation {
    name: string;
    category: string;
    shortDescription: string;
    features?: string[];
    pricing?: {
        hasFree: boolean;
        freeLimit?: string;
        minPrice?: string;
        hasApi: boolean;
        hasMcp: boolean;
    };
    url?: string;
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<AppRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "favorites"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                ...doc.data()
            })) as AppRecommendation[];
            setFavorites(fetched);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const removeFavorite = async (name: string) => {
        try {
            await deleteDoc(doc(db, "favorites", name));
            toast.error(`${name} удален из Избранного`);
        } catch (e) {
            toast.error("Ошибка при удалении");
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0c] text-white selection:bg-[#facc15]/30">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-white/5 px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black uppercase tracking-tighter text-[11px]">
                    <Heart size={14} className="text-red-500 fill-red-500" />
                    <span>Избранные инструменты</span>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-[#facc15] hover:text-black rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                >
                    <TrendingUp size={12} strokeWidth={3} />
                    Вернуться в ленту
                </Link>
            </div>

            <div className="max-w-5xl mx-auto w-full px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                        <div className="w-12 h-12 border-4 border-[#facc15] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">Загрузка...</span>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="max-w-md mx-auto text-center py-20 px-6 bg-[#16161a] border border-white/5 rounded-[2.5rem] shadow-2xl">
                        <div className="w-20 h-20 bg-white/5 text-[#888891] rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <Heart size={40} className="text-red-500 fill-red-500" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Здесь пока пусто</h2>
                        <p className="text-[#888891] font-bold text-sm leading-relaxed mb-8">
                            Добавляйте понравившиеся нейросети и сервисы в избранное, нажимая на сердечко в ленте новостей.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#facc15] text-black px-8 py-3 rounded-2xl font-black uppercase text-xs hover:scale-105 transition-transform"
                        >
                            <Search size={16} strokeWidth={3} />
                            Найти инструменты
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((app, idx) => (
                            <div
                                key={app.name}
                                className="bg-[#16161a] border border-white/5 rounded-[2rem] p-6 flex flex-col gap-5 hover:border-[#facc15]/40 hover:bg-[#1c1c21] transition-all duration-300 group/app shadow-xl relative overflow-hidden animate-fade-in"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <button
                                    onClick={() => removeFavorite(app.name)}
                                    className="absolute top-6 right-6 p-2 rounded-xl border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
                                    title="Удалить"
                                >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                </button>

                                <div className="flex gap-4 items-start">
                                    <div className="w-14 h-14 shrink-0 bg-[#facc15] text-black rounded-2xl flex items-center justify-center shadow-lg group-hover/app:scale-105 transition-transform">
                                        <Box size={28} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-10">
                                        <h5 className="font-black text-base text-white uppercase tracking-tighter truncate">{app.name}</h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-[#888891] font-black uppercase tracking-widest leading-none">{app.category}</span>
                                        </div>
                                        <p className="text-[11px] text-[#888891] font-bold leading-snug mt-3 line-clamp-2">
                                            {app.shortDescription}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        {(app.features || ["Advanced AI features", "Built-in integration"]).map((feat, fidx) => (
                                            <div key={fidx} className="flex items-center gap-2 text-[10px] text-white/60 font-bold">
                                                <Zap size={10} className="text-[#facc15]" /> {feat}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[8px] font-black text-[#888891] uppercase tracking-widest">
                                                <CircleDollarSign size={10} /> Тарифы
                                            </div>
                                            <div className="text-[10px] font-bold text-white/90 leading-tight">
                                                {app.pricing?.hasFree ? `FREE (${app.pricing.freeLimit || 'лимит'})` : 'PAID ONLY'}
                                                <div className="text-[#facc15] mt-0.5">{app.pricing?.minPrice || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 pl-4 border-l border-white/5">
                                            <div className="flex items-center gap-1.5 text-[8px] font-black text-[#888891] uppercase tracking-widest">
                                                <Cpu size={10} /> Technical
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {app.pricing?.hasApi && <span className="bg-[#facc15]/10 text-[#facc15] px-1.5 py-0.5 rounded-[4px] text-[8px] font-black tracking-tighter uppercase">API</span>}
                                                {app.pricing?.hasMcp && <span className="bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black tracking-tighter uppercase">MCP</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {app.url && (
                                    <a
                                        href={app.url}
                                        target="_blank"
                                        className="mt-auto w-full bg-white/5 py-2.5 rounded-xl text-[9px] font-black uppercase text-center hover:bg-[#facc15] hover:text-black transition-all flex items-center justify-center gap-2 border border-white/5"
                                    >
                                        ОТКРЫТЬ СЕРВИС <ChevronRight size={12} strokeWidth={3} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )
                }
            </div>
        </main>
    );
}
