"use client";

import { Header } from "@/components/Header";
import { db } from "@/lib/firebase/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import {
    Archive as ArchiveIcon,
    Box,
    ExternalLink,
    Layers,
    Search,
    Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";

interface App {
    name: string;
    category: string;
    shortDescription: string;
    url?: string;
    pricing?: string;
    sourceId: string;
    addedAt: any;
}

export default function ArchivePage() {
    const [apps, setApps] = useState<App[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "sources"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allApps: App[] = [];
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.detectedApps) {
                    data.detectedApps.forEach((app: any) => {
                        allApps.push({
                            ...app,
                            sourceId: doc.id,
                            addedAt: data.publishedAt
                        });
                    });
                }
            });

            // Deduplicate by name
            const uniqueApps = Array.from(new Map(allApps.map(app => [app.name.toLowerCase(), app])).values());
            setApps(uniqueApps.sort((a, b) => b.addedAt?.seconds - a.addedAt?.seconds));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const categories = ["All", ...Array.from(new Set(apps.map(app => app.category)))];

    const filteredApps = apps.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
            app.shortDescription.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="min-h-screen bg-background text-white pb-32">
            <Header />

            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="flex flex-col gap-4">
                        <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center border border-accent/20">
                            <ArchiveIcon size={28} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight uppercase">App Archive</h1>
                        <p className="text-muted max-w-sm">База знаний всех инструментов, найденных AI Scouter в ваших источниках.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Поиск по названию..."
                                className="w-full bg-card-bg border border-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-accent/40 transition-all font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-accent text-background border-accent shadow-lg shadow-accent/10' : 'bg-card-bg border border-border text-muted hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="premium-card animate-pulse h-48" />)}
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-border rounded-[3rem]">
                        <Layers className="mx-auto text-muted/20 mb-6" size={64} />
                        <p className="text-muted font-bold tracking-widest uppercase">Инструменты не найдены</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApps.map((app, idx) => (
                            <div
                                key={idx}
                                className="premium-card hover:border-accent/30 group animate-fade-in flex flex-col justify-between"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 bg-accent/5 text-accent rounded-xl flex items-center justify-center border border-accent/10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                                            <Box size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-muted rounded">
                                            {app.category}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                                        {app.name}
                                    </h3>
                                    <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-6">
                                        {app.shortDescription}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-muted font-black uppercase tracking-widest mb-1">Status</span>
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                                            <Sparkles size={10} fill="currentColor" /> verified
                                        </span>
                                    </div>
                                    {app.url ? (
                                        <a
                                            href={app.url}
                                            target="_blank"
                                            className="p-2 bg-white/5 hover:bg-accent hover:text-background rounded-lg transition-all"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    ) : (
                                        <div className="text-[10px] bg-white/5 px-2 py-1 rounded text-muted font-bold uppercase">No URL</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
