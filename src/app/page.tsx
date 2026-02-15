"use client";

import { db } from "@/lib/firebase/firebase";
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import {
    Archive,
    Bell,
    Brain,
    Check,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    HelpCircle,
    Image,
    Layers,
    Monitor,
    Palette,
    Plus,
    Search,
    Send,
    Settings,
    Sparkles,
    Youtube,
    Zap
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface AppRecommendation {
    name: string;
    category: string;
    shortDescription: string;
    url?: string;
    pricing?: string;
    pricingDetails?: string;
}

interface SourcePost {
    id: string;
    sourceType: "youtube" | "telegram";
    title: string;
    description: string;
    aiSummary?: string;
    author: string;
    publishedAt: string | Timestamp;
    url: string;
    thumbnailUrl?: string;
    detectedApps?: AppRecommendation[];
}

export default function HomeFeed() {
    const [posts, setPosts] = useState<SourcePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const q = query(
            collection(db, "sources"),
            orderBy("createdAt", "desc"),
            limit(60)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newPosts = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((p: any) => p.sourceType === "youtube" || p.sourceType === "telegram") as SourcePost[];
            setPosts(newPosts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 glass border-r border-white/10 hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                            <Sparkles size={18} className="text-black" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter gold-text uppercase">AI Scout</span>
                    </div>

                    <nav className="space-y-1">
                        <NavItem icon={<Layers size={18} />} label="Лента" active />
                        <NavDropdown
                            icon={<Archive size={18} />}
                            label="Архив"
                            href="/archive"
                            items={[
                                { label: 'LLM', href: '/archive?cat=LLM', icon: <Brain size={14} /> },
                                { label: 'Vibe Coding', href: '/archive?cat=Vibe', icon: <Zap size={14} /> },
                                { label: 'Design', href: '/archive?cat=Design', icon: <Palette size={14} /> },
                                { label: 'Автоматизация', href: '/archive?cat=Automation', icon: <Monitor size={14} /> },
                                { label: 'Изображения', href: '/archive?cat=Image', icon: <Image size={14} /> },
                                { label: 'Разное', href: '/archive?cat=Разное', icon: <HelpCircle size={14} /> },
                            ]}
                        />
                        <NavItem icon={<Search size={18} />} label="Обзор" href="/discover" />
                        <NavItem icon={<Plus size={18} />} label="Добавить источник" href="/test-add-source" />
                    </nav>

                    <div className="mt-12">
                        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Отслеживаемые каналы</h3>
                        <div className="space-y-4">
                            <TrackedChannel name="@bugfeature" type="telegram" />
                            <TrackedChannel name="@vibecoding_tg" type="telegram" />
                            <TrackedChannel name="AntiGravity AI" type="youtube" />
                        </div>
                    </div>
                </div>
                <div className="mt-auto p-6 border-t border-white/5 space-y-4">
                    <NavItem icon={<Settings size={18} />} label="Настройки" />
                    <div className="p-3 bg-white/5 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-gold-light" />
                        <div>
                            <div className="text-xs font-semibold">Igor Vasin</div>
                            <div className="text-[10px] text-white/40">VIP Участник</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto luxury-gradient relative">
                <header className="sticky top-0 z-10 glass border-b border-white/5 px-8 py-4 flex items-center justify-between">
                    <h1 className="text-lg font-medium flex items-center gap-2">
                        Лента новостей <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    </h1>
                    <div className="flex items-center gap-4 text-white/60">
                        <Bell size={20} className="hover:text-gold transition-colors cursor-pointer" />
                        <div className="w-[1px] h-4 bg-white/10" />
                        <div className="text-sm font-light">Обновлено: только что</div>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto p-8 space-y-8 pb-24 md:pb-8">
                    {!mounted || loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                            <p className="text-white/40 mb-4">Ваша лента пуста.</p>
                            <a href="/test-add-source" className="text-gold hover:underline">Добавить первый источник →</a>
                        </div>
                    ) : (
                        <>
                            {posts.map((post, idx) => (
                                <FeedCard key={post.id} post={post} index={idx} />
                            ))}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function NavDropdown({ icon, label, href, items, active = false }: { icon: React.ReactNode, label: string, href: string, items: { label: string, href: string, icon: React.ReactNode }[], active?: boolean }) {
    const [isOpen, setIsOpen] = useState(active);

    return (
        <div className="space-y-1">
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${active ? "bg-white/5 text-gold" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={active ? "text-gold" : "text-white/40 group-hover:text-gold transition-colors"}>{icon}</span>
                <span className="font-medium text-sm tracking-tight flex-1">{label}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-gold" : "text-white/20"}`} />
            </div>

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-white/5 space-y-1 py-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    {items.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-white/40 hover:text-gold hover:bg-white/5 transition-all group/sub"
                        >
                            <span className="group-hover/sub:scale-110 transition-transform">{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    ))}
                    <a
                        href={href}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-gold/60 hover:text-gold hover:bg-white/5 transition-all"
                    >
                        <ChevronRight size={12} />
                        <span>All Items</span>
                    </a>
                </div>
            )}
        </div>
    );
}

function NavItem({ icon, label, active = false, href = "#" }: { icon: React.ReactNode, label: string, active?: boolean, href?: string }) {
    return (
        <a
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active
                ? "bg-white/10 text-gold shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.05)]"
                : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
        >
            <span className={active ? "text-gold" : "text-white/40 group-hover:text-gold transition-colors"}>{icon}</span>
            <span className="font-medium text-sm tracking-tight">{label}</span>
            {active && <div className="ml-auto w-1 h-1 bg-gold rounded-full" />}
        </a>
    );
}

function TrackedChannel({ name, type }: { name: string, type: "youtube" | "telegram" }) {
    return (
        <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-6 h-6 flex items-center justify-center text-white/20 group-hover:text-gold transition-colors">
                {type === "youtube" ? <Youtube size={14} /> : <Send size={14} />}
            </div>
            <span className="text-xs text-white/50 group-hover:text-white transition-colors truncate">{name}</span>
            <div className="ml-auto w-1.5 h-1.5 bg-white/5 group-hover:bg-green-500 rounded-full transition-colors" />
        </div>
    );
}

function FeedCard({ post, index }: { post: SourcePost, index: number }) {
    const [publishStr, setPublishStr] = useState("");

    useEffect(() => {
        const date = post.publishedAt instanceof Timestamp
            ? post.publishedAt.toDate()
            : new Date(post.publishedAt || Date.now());
        setPublishStr(date.toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' }));
    }, [post.publishedAt]);

    return (
        <div
            className="animate-fade-in group"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="glass rounded-[2rem] p-6 hover:border-white/20 transition-all duration-500 relative overflow-hidden">
                {/* Background glow effect on hover */}
                <div className="absolute -inset-10 bg-gold/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex items-center justify-center ${post.sourceType === "youtube" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-400"
                            }`}>
                            {post.sourceType === "youtube" ? <Youtube size={16} /> : <Send size={16} />}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white/90">{post.author}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{publishStr}</div>
                        </div>
                    </div>
                    <a href={post.url} target="_blank" className="p-2 bg-white/5 hover:bg-gold hover:text-black rounded-lg transition-all duration-300">
                        <ExternalLink size={14} />
                    </a>
                </div>

                {/* Content Section */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {post.thumbnailUrl && (
                        <div className="w-full md:w-48 shrink-0 relative aspect-video md:aspect-square rounded-2xl overflow-hidden border border-white/5 group/img bg-white/5 flex items-center justify-center">
                            <img
                                src={post.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-4 leading-snug group-hover:text-gold transition-colors duration-300">
                            {post.title}
                        </h2>

                        {post.aiSummary && (
                            <div className="relative pl-6 py-2">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold/30 rounded-full" />
                                <p className="text-sm text-white/70 leading-relaxed italic pr-4">
                                    "{post.aiSummary}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detected Apps Section */}
                {post.detectedApps && post.detectedApps.length > 0 && (
                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={14} className="text-gold animate-pulse" />
                            <h3 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">AI Разведка: Найденные инструменты</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {post.detectedApps.map((app, i) => (
                                <div key={i} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group/app flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-white group-hover/app:text-gold transition-colors">{app.name}</span>
                                        <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded-full text-white/40 border border-white/5 uppercase tracking-tighter whitespace-nowrap">{app.category}</span>
                                    </div>
                                    <p className="text-xs text-white/50 leading-relaxed line-clamp-4 flex-grow mb-3">{app.shortDescription}</p>
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        <div className="flex gap-2 items-center flex-wrap">
                                            {app.pricing && (
                                                <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-green-400/20 shrink-0">
                                                    {app.pricing}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ArchiveButton app={app} post={post} />
                                            {app.url && (
                                                <a href={app.url} target="_blank" className="p-1.5 text-white/30 hover:text-gold hover:bg-white/5 rounded-md transition-colors" title="Visit website">
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ArchiveButton({ app, post }: { app: any, post: SourcePost }) {
    const [archived, setArchived] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleArchive = async () => {
        if (archived || loading) return;
        setLoading(true);
        try {
            // Context strategy: Prefer AI Summary, fallback to full content (for Telegram), fallback to title
            const sourceContext = post.aiSummary || post.description || `Mentioned in: ${post.title}`;

            const payload = {
                ...app,
                sourceContext,
                sourceUrl: post.url,
                sourceTitle: post.title,
                sourceType: 'archived_app'
            };

            const res = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setArchived(true);
                toast.success(`${app.name} — в архиве!`);
            } else {
                const err = await res.json();
                toast.error(`Ошибка: ${err.error || 'Server error'}`);
            }
        } catch (e) {
            toast.error("Ошибка сети");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleArchive}
            disabled={archived || loading}
            className={`text-[9px] px-3 py-1 rounded-md transition-all flex items-center gap-1.5 border active:scale-95 ${archived
                ? "bg-green-500/20 text-green-400 border-green-500/30 cursor-default"
                : "bg-white/5 hover:bg-gold/20 hover:text-gold border-white/5"
                }`}
        >
            {loading ? (
                <div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : archived ? (
                <Check size={10} className="text-green-400" />
            ) : (
                <Archive size={10} />
            )}
            {archived ? "Сохранено" : "В архив"}
        </button>
    );
}
