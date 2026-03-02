"use client";

import { Loader2, Plus, Search, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const ActionPanel = () => {
    const [query, setQuery] = useState("");
    const [insight, setInsight] = useState("");
    const [loading, setLoading] = useState(false);
    const [sourceUrl, setSourceUrl] = useState("");
    const [adding, setAdding] = useState(false);

    const handleSearch = async () => {
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

    const handleAddSource = async () => {
        if (!sourceUrl.trim()) return;
        setAdding(true);

        try {
            const res = await fetch("/api/sources", {
                method: "POST",
                body: JSON.stringify({ url: sourceUrl }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Источник добавлен и анализируется!");
                setSourceUrl("");
            } else {
                toast.error(data.error || "Ошибка при добавлении");
            }
        } catch (e) {
            toast.error("Ошибка сети");
        } finally {
            setAdding(false);
        }
    };

    return (
        <section className="px-6 py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold">Добро пожаловать</h2>
                <p className="text-muted">Ищите идеи, инструменты и тренды AI в один клик.</p>
            </div>

            {/* AI Insight Section */}
            <div className="flex flex-col gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Спросите AI о чем угодно..."
                        className="w-full bg-card-bg border border-border rounded-2xl py-4 pl-12 pr-32 outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent-glow transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="absolute right-2 top-2 bottom-2 bg-accent text-background px-4 rounded-xl font-semibold flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        <span>Анализ</span>
                    </button>
                </div>

                {insight && (
                    <div className="premium-card bg-accent/5 border-accent/20 animate-fade-in">
                        <div className="flex items-center gap-2 mb-3 text-accent text-sm font-bold uppercase tracking-wider">
                            <Wand2 size={16} />
                            AI Insight
                        </div>
                        <div className="text-sm prose prose-invert max-w-none prose-p:leading-relaxed">
                            {insight.split('\n').map((line, i) => (
                                <p key={i} className={line.startsWith('-') || line.startsWith('*') ? 'ml-4 mb-2' : 'mb-3'}>
                                    {line}
                                </p>
                            ))}
                        </div>
                        <button
                            onClick={() => setInsight("")}
                            className="mt-4 text-[10px] text-muted hover:text-white uppercase font-bold tracking-widest"
                        >
                            Закрыть ответ
                        </button>
                    </div>
                )}
            </div>

            {/* Add Source Section */}
            <div className="p-1 flex items-center gap-2 bg-card-bg border border-border rounded-xl">
                <input
                    type="text"
                    placeholder="Вставьте ссылку на YouTube или Telegram профиль..."
                    className="flex-1 bg-transparent py-2 px-3 text-sm outline-none"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                />
                <button
                    onClick={handleAddSource}
                    disabled={adding}
                    className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                    title="Добавить источник"
                >
                    {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {["Лучшие LLM 2026", "AI для видео", "Автоматизация SMM", "Тренды в коде"].map((tag) => (
                    <button
                        key={tag}
                        onClick={() => { setQuery(tag); }}
                        className="whitespace-nowrap bg-border/50 hover:bg-border px-4 py-2 rounded-full text-sm border border-border transition-colors"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </section>
    );
};
