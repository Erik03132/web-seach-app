"use client";

import { Header } from "@/components/Header";
import {
    CheckCircle2,
    Link2,
    Loader2,
    PlusCircle,
    Search,
    Send,
    Youtube
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function AddSourcePage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setStatus("idle");

        try {
            const res = await fetch("/api/sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: url.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                toast.success("Источник успешно добавлен!");
                setUrl("");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                toast.error(data.error || "Ошибка при добавлении");
            }
        } catch (err) {
            setStatus("error");
            toast.error("Сетевая ошибка");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-white pb-24">
            <Header />

            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="flex flex-col gap-3 mb-10">
                    <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-4 border border-accent/20">
                        <PlusCircle size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Добавить источник</h2>
                    <p className="text-muted">
                        Вставьте ссылку на YouTube видео или Telegram канал.
                        AI автоматически проанализирует контент и выделит главное.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
                            <Link2 size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="https://youtube.com/... или https://t.me/..."
                            className="w-full bg-card-bg border border-border rounded-2xl py-6 pl-14 pr-6 outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent-glow transition-all text-lg font-medium"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="w-full bg-accent text-background py-5 rounded-2xl font-black uppercase tracking-[0.1em] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl shadow-accent/10 disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Анализируем...</span>
                            </>
                        ) : status === "success" ? (
                            <>
                                <CheckCircle2 size={24} />
                                <span>Готово!</span>
                            </>
                        ) : (
                            <>
                                <Search size={22} />
                                <span>Начать магию AI</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="premium-card bg-white/5 border-white/10 p-6">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <Youtube size={24} />
                            <span className="font-bold uppercase text-[10px] tracking-widest">YouTube</span>
                        </div>
                        <p className="text-sm text-muted">Мы парсим описание, теги и используем AI для понимания сути ролика.</p>
                    </div>
                    <div className="premium-card bg-white/5 border-white/10 p-6">
                        <div className="flex items-center gap-3 mb-4 text-blue-400">
                            <Send size={24} />
                            <span className="font-bold uppercase text-[10px] tracking-widest">Telegram</span>
                        </div>
                        <p className="text-sm text-muted">Анализируем публичные посты, извлекая полезные ссылки и сервисы.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
