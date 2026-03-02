"use client";

import { db } from "@/lib/firebase/firebase";
import { collection, deleteDoc, doc, limit, onSnapshot, query, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore";
import {
    Bell,
    Box,
    ChevronRight,
    CircleDollarSign,
    Cpu,
    ExternalLink,
    FolderPlus,
    Heart,
    Layers,
    Loader2,
    RefreshCw,
    Send,
    Sparkles,
    Trash2,
    Youtube,
    Zap
} from "lucide-react";
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

interface SourcePost {
    id: string;
    sourceType: "youtube" | "telegram";
    title: string;
    summary?: string;
    aiSummary?: string;
    description?: string;
    author: string;
    publishedAt: any;
    url: string;
    thumbnailUrl?: string;
    detectedApps?: AppRecommendation[];
}

export default function HomePage() {
    const [posts, setPosts] = useState<SourcePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
    const [archivedApps, setArchivedApps] = useState<Set<string>>(new Set());
    const [favoriteApps, setFavoriteApps] = useState<Set<string>>(new Set());
    const [showTest, setShowTest] = useState(false);

    useEffect(() => {
        // Get youtube and telegram sources, sort client-side to avoid composite index requirement
        const q = query(
            collection(db, "sources"),
            where("sourceType", "in", ["youtube", "telegram"]),
            limit(500)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => {
                const data = doc.data();
                let cleanTitle = data.title || "";
                cleanTitle = cleanTitle.replace(/^(Title|Заголовок|Название|Тема):\s*/i, "").replace(/^"|"$/g, "").trim();
                return { id: doc.id, ...data, title: cleanTitle };
            }) as SourcePost[];

            // Sort client-side by publishedAt (handle both Timestamp and string)
            fetchedPosts.sort((a, b) => {
                const dateA = a.publishedAt?.seconds ? a.publishedAt.seconds * 1000 : new Date(a.publishedAt || 0).getTime();
                const dateB = b.publishedAt?.seconds ? b.publishedAt.seconds * 1000 : new Date(b.publishedAt || 0).getTime();
                return dateB - dateA;
            });

            setPosts(fetchedPosts.slice(0, 20));
            setLoading(false);
        }, (error) => {
            console.error("Firestore error:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleManualAnalyze = async (id: string) => {
        setAnalyzingIds(prev => new Set(prev).add(id));
        toast.info("AI обновляет данные о сервисах...");
        try {
            const res = await fetch("/api/sources/analyze", {
                method: "POST",
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Данные обновлены. Найдено инструментов: ${data.appsCount}`);
            } else {
                toast.error(`Ошибка: ${data.error}`);
            }
        } catch (e) {
            toast.error("Ошибка сети");
        } finally {
            setAnalyzingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const toggleArchive = (appName: string) => {
        setArchivedApps(prev => {
            const next = new Set(prev);
            if (next.has(appName)) {
                next.delete(appName);
                toast.error(`${appName} удален из архива`);
            } else {
                next.add(appName);
                toast.success(`${appName} сохранен в архив`);
            }
            return next;
        });
    };

    const toggleFavorite = async (app: AppRecommendation) => {
        try {
            const appRef = doc(db, "favorites", app.name);
            const isFav = favoriteApps.has(app.name);

            if (isFav) {
                await deleteDoc(appRef);
                toast.error(`${app.name} убран из Избранного`);
            } else {
                await setDoc(appRef, {
                    ...app,
                    addedAt: serverTimestamp()
                });
                toast.success(`${app.name} добавлен в Избранное ❤️`);
            }
        } catch (e) {
            toast.error("Ошибка при сохранении");
        }
    };

    // Synchronize favorites on mount
    useEffect(() => {
        const q = query(collection(db, "favorites"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const favs = new Set<string>();
            snapshot.forEach(doc => favs.add(doc.id));
            setFavoriteApps(favs);
        });
        return () => unsubscribe();
    }, []);

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        return d.toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' }).toUpperCase();
    };

    const getDisplaySummary = (post: SourcePost) => {
        const s = post.aiSummary || "";
        if (!s || s.includes("недоступен") || s.length < 5) {
            return (post.description || post.summary || "").substring(0, 250).trim() + "...";
        }
        return s;
    };

    const testPost: SourcePost = {
        id: "test",
        sourceType: "telegram",
        author: "AI SCOUT DATA",
        title: "Тестовая подборка: Нагрузка и возможности",
        publishedAt: null,
        url: "#",
        thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4628c67a0?auto=format&fit=crop&q=80&w=800",
        aiSummary: "Демонстрируем кнопку 'Сердечко' для перевода сервиса в раздел Избранное прямо из карточки архива.",
        detectedApps: [
            {
                name: "Recraft V4",
                category: "Gen-AI",
                shortDescription: "SOTA нейросеть для дизайнеров с поддержкой векторной графики.",
                features: ["Безупречная работа с текстом", "Генерация SVG векторов"],
                pricing: {
                    hasFree: true,
                    freeLimit: "50 кредитов/день",
                    minPrice: "$25/mo",
                    hasApi: true,
                    hasMcp: false
                },
                url: "https://recraft.ai"
            },
            {
                name: "Claude 3.5",
                category: "LLM",
                shortDescription: "Флагманская модель от Anthropic, лидер в кодинге и логике.",
                features: ["Режим Artifacts", "Контекст 200k+"],
                pricing: {
                    hasFree: true,
                    freeLimit: "10 сообщ. в 3 часа",
                    minPrice: "$20/mo",
                    hasApi: true,
                    hasMcp: true
                },
                url: "https://claude.ai"
            }
        ]
    };

    const displayPosts = showTest ? [testPost, ...posts] : posts;

    return (
        <main className="min-h-screen bg-[#0a0a0c] text-white selection:bg-[#facc15]/30">
            {/* Navbar */}
            <div className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-white/5 px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 font-black uppercase tracking-tighter text-[11px]">
                        <span>Лента AI</span>
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                    </div>
                    <button onClick={() => setShowTest(!showTest)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${showTest ? 'bg-[#facc15] text-black border-[#facc15]' : 'bg-white/5 text-[#888891] border-white/5'}`}>
                        <Sparkles size={12} strokeWidth={3} /> ЛАБОРАТОРИЯ
                    </button>
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase border border-white/5">
                        <RefreshCw size={12} strokeWidth={3} />
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-[#888891] hover:text-white"><Bell size={20} /></button>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden ring-2 ring-[#facc15]/10">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" alt="User" />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full px-6 py-10 pb-40">
                <div className="flex flex-col gap-20">
                    {loading ? (
                        [1, 2].map(i => <div key={i} className="bg-[#16161a] rounded-[2.5rem] h-64 animate-pulse border border-white/5" />)
                    ) : (
                        displayPosts.map((post, idx) => (
                            <div key={post.id} className="animate-fade-in group/item">

                                {/* Main Card */}
                                <article className="bg-[#16161a] border border-white/5 rounded-[2.5rem] p-8 hover:border-[#facc15]/20 shadow-2xl relative transition-all duration-500">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${post.sourceType === 'youtube' ? 'bg-red-500/10 text-red-500' : 'bg-blue-400/10 text-blue-400'}`}>
                                                {post.sourceType === 'youtube' ? <Youtube size={20} /> : <Send size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-black text-white uppercase tracking-tight">{post.author}</h4>
                                                <p className="text-[10px] text-[#888891] font-black tracking-widest uppercase">{formatDate(post.publishedAt) || 'LIVE SIGNAL'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {post.id !== 'test' && (
                                                <button onClick={() => handleManualAnalyze(post.id)} disabled={analyzingIds.has(post.id)} className="p-2.5 bg-white/5 hover:bg-[#facc15] hover:text-black rounded-xl text-[#888891] transition-all">
                                                    {analyzingIds.has(post.id) ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} strokeWidth={2.5} />}
                                                </button>
                                            )}
                                            <a href={post.url} target="_blank" className="p-2.5 bg-white/5 hover:bg-[#facc15] hover:text-black rounded-xl text-[#888891] transition-all duration-300">
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-10 items-start">
                                        <div className="relative shrink-0 w-full md:w-[300px] aspect-video rounded-3xl overflow-hidden border-2 border-white/5">
                                            {post.thumbnailUrl ? (
                                                <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/5">
                                                    <Layers size={64} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-2xl font-black leading-[1.1] text-white mb-6 tracking-tighter line-clamp-2 uppercase">
                                                {post.title}
                                            </h3>

                                            <div className="mb-6 text-[#888891] text-[15px] leading-relaxed font-bold italic line-clamp-4">
                                                {getDisplaySummary(post)}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${post.sourceType === 'youtube' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'}`}>
                                                    {post.sourceType === 'youtube' ? 'YouTube' : 'Telegram'}
                                                </span>
                                                {post.detectedApps && post.detectedApps.length > 0 && (
                                                    <span className="text-[9px] font-black text-[#facc15] uppercase tracking-widest border border-[#facc15]/20 px-3 py-1 rounded-full bg-[#facc15]/5">
                                                        <Box size={10} className="inline mr-1" /> {post.detectedApps.length} TOOLS
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>

                                {/* SERVICE CARDS */}
                                {post.detectedApps && post.detectedApps.length > 0 && (
                                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 px-4 animate-fade-in-up">
                                        {post.detectedApps.map((app, aIdx) => (
                                            <div
                                                key={aIdx}
                                                className="bg-[#16161a] border border-white/5 rounded-[2rem] p-6 flex flex-col gap-5 hover:border-[#facc15]/40 hover:bg-[#1c1c21] transition-all duration-300 group/app shadow-xl relative overflow-hidden"
                                            >
                                                {/* Action Buttons Top Right */}
                                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleFavorite(app)}
                                                        className={`p-2 rounded-xl transition-all border ${favoriteApps.has(app.name) ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-white/5 text-[#888891] border-white/10 hover:text-red-500'}`}
                                                        title="В избранное"
                                                    >
                                                        <Heart size={16} strokeWidth={2.5} className={favoriteApps.has(app.name) ? "fill-red-500" : ""} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleArchive(app.name)}
                                                        className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center ${archivedApps.has(app.name) ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-white/5 text-[#888891] border-white/10 hover:text-[#facc15]'}`}
                                                        title={archivedApps.has(app.name) ? "Удалить из архива" : "Добавить в архив"}
                                                    >
                                                        {archivedApps.has(app.name) ? <Trash2 size={16} strokeWidth={2.5} /> : <FolderPlus size={16} strokeWidth={2.5} />}
                                                    </button>
                                                </div>

                                                <div className="flex gap-4 items-start">
                                                    <div className="w-14 h-14 shrink-0 bg-[#facc15] text-black rounded-2xl flex items-center justify-center shadow-lg group-hover/app:scale-105 transition-transform duration-300">
                                                        <Box size={28} strokeWidth={3} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-20">
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
                                                        {(app.features || ["Высокая скорость", "Быстрый старт"]).map((feat, fidx) => (
                                                            <div key={fidx} className="flex items-center gap-2 text-[10px] text-white/60 font-bold">
                                                                <Zap size={10} className="text-[#facc15]" /> {feat}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Technical Details Row */}
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
                                                                <Cpu size={10} /> Integration
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {app.pricing?.hasApi && <span className="bg-[#facc15]/10 text-[#facc15] px-1.5 py-0.5 rounded-[4px] text-[8px] font-black tracking-tighter">API</span>}
                                                                {app.pricing?.hasMcp && <span className="bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black tracking-tighter">MCP</span>}
                                                                {!app.pricing?.hasApi && !app.pricing?.hasMcp && <span className="text-[10px] font-bold text-white/40">—</span>}
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
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
