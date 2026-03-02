"use client";

import {
    ArrowRight,
    Loader2,
    Search,
    Sparkles,
    Zap
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function DiscoverPage() {
    const [query, setQuery] = useState("");
    const [insight, setInsight] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setInsight("");

        try {
            const res = await fetch("/api/ai/insight", {
                method: "POST",
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            if (data.answer) setInsight(data.answer);
            else toast.error("Не удалось получить ответ");
        } catch (e) {
            toast.error("Ошибка сети");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-white pb-24 px-6 md:px-12 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col items-center text-center gap-4 mb-16">
                    <div className="w-20 h-20 bg-accent/10 text-accent rounded-[2.5rem] flex items-center justify-center mb-4 border border-accent/20 rotate-12 shadow-2xl shadow-accent/10">
                        <Sparkles size={40} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter">AI EXPLORER</h1>
                    <p className="text-muted text-lg max-w-md">Умный поиск решений для вашего бизнеса на базе Gemini AI.</p>
                </div>

                <form onSubmit={handleSearch} className="mb-20">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
                            <Search size={28} />
                        </div>
                        <input
                            type="text"
                            placeholder="Как внедрить AI в отдел продаж?"
                            className="w-full bg-card-bg border-2 border-border rounded-[2rem] py-8 pl-18 pr-40 outline-none focus:border-accent/40 focus:ring-8 focus:ring-accent-glow transition-all text-xl font-bold placeholder:text-muted/40"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-4 top-4 bottom-4 bg-accent text-background px-8 rounded-2xl font-black uppercase tracking-tighter flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <div className="flex items-center gap-2">Анализ <ArrowRight size={20} /></div>}
                        </button>
                    </div>
                </form>

                {(insight || loading) && (
                    <div className="premium-card bg-accent/5 border-accent/20 animate-fade-in relative overflow-hidden backdrop-blur-md mb-20">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
                        <div className="flex items-center gap-3 mb-6 text-accent text-sm font-black uppercase tracking-[0.3em]">
                            <Zap size={18} fill="currentColor" />
                            AI Insights Generated
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                                <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                                <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
                            </div>
                        ) : (
                            <div className="text-lg leading-relaxed text-white/90 font-medium">
                                {insight.split('\n').map((line, i) => (
                                    <p key={i} className="mb-4">{line}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                    <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
                        <h3 className="font-bold text-muted uppercase text-[10px] tracking-widest mb-4">Trending Now</h3>
                        <p className="font-bold text-lg mb-2">Автоматизация юридической проверки</p>
                        <p className="text-sm text-muted">Использование LLM для анализа рисков в корпоративных контрактах.</p>
                    </div>
                    <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
                        <h3 className="font-bold text-muted uppercase text-[10px] tracking-widest mb-4">Success Story</h3>
                        <p className="font-bold text-lg mb-2">AI-ассистент для службы поддержки</p>
                        <p className="text-sm text-muted">Снижение нагрузки на первую линию на 45% в первый месяц внедрения.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
