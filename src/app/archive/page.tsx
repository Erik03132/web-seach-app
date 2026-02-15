"use client";

import { db } from "@/lib/firebase/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
    Archive,
    ArrowLeft,
    Bell,
    Brain,
    Check,
    ChevronDown,
    ChevronRight,
    Coins,
    Cpu,
    ExternalLink,
    Globe,
    HelpCircle,
    Image,
    Layers,
    Monitor,
    Palette,
    Plus,
    Search,
    Sparkles,
    X,
    Zap
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// Extended Interface matching new Analyzer output
interface AppArchived {
    id: string;
    name: string;
    category: string;
    shortDescription: string;
    detailedDescription?: string;
    features?: string[];
    url?: string;
    pricing?: "free" | "paid" | "freemium";
    pricingDetails?: string;
    dailyCredits?: string;
    hasMcp?: boolean;
    hasApi?: boolean;
    minPaidPrice?: string;
    mentionCount: number;
    lastMentionedAt?: any;
    sourceType?: 'archived_app' | 'solution';
    content?: string; // For manual solutions
    sourceContext?: string; // Original news context
    sourceUrl?: string;
    sourceTitle?: string;
}

export default function ArchivePage() {
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('cat');
    const [apps, setApps] = useState<AppArchived[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedApp, setSelectedApp] = useState<AppArchived | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(current => {
                if (current) {
                    console.warn("Archive loading timed out after 5s");
                    return false;
                }
                return current;
            });
        }, 5000);

        // Update Query to fetch both types or filter client side if needed
        // Currently fetching 'archived_app' only - NEED TO UPDATE TO FETCH SOLUTIONS TOO
        // Or remove filter to fetch everything from 'sources' collection and filter in memory?
        // Let's use 'in' operator if possible, or just fetch all 'sources' that are relevant.
        // Actually, let's just fetch both types. 
        // Firestore 'in' query works for up to 10 values.
        const q = query(
            collection(db, "sources"),
            where("sourceType", "in", ["archived_app", "solution"])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Archive snapshot:", snapshot.size, "items");
            const newApps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AppArchived[];

            newApps.sort((a: any, b: any) => {
                const bVal = b.lastMentionedAt?.seconds || 0;
                const aVal = a.lastMentionedAt?.seconds || 0;
                return bVal - aVal;
            });

            setApps(newApps);
            setLoading(false);
            clearTimeout(timer);
        }, (error) => {
            console.error("Archive sync error:", error);
            setLoading(false);
            clearTimeout(timer);
            toast.error("Archive error: " + error.message);
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const filteredApps = apps.filter(app => {
        const searchLower = search.toLowerCase();

        // Search in Name
        const nameMatch = (app.name || "").toLowerCase().includes(searchLower);

        // Search in Category
        const catSearchMatch = (app.category || "").toLowerCase().includes(searchLower);

        // Deep Search (Descriptions & Content)
        const descMatch = (app.shortDescription || "").toLowerCase().includes(searchLower) ||
            (app.detailedDescription || "").toLowerCase().includes(searchLower);

        const contentMatch = (app.content || "").toLowerCase().includes(searchLower); // For manual solutions

        const searchMatch = nameMatch || catSearchMatch || descMatch || contentMatch;

        if (categoryFilter) {
            const catLower = (app.category || "").toLowerCase();
            const filterLower = categoryFilter.toLowerCase();
            return searchMatch && catLower.includes(filterLower);
        }

        return searchMatch;
    });

    console.log("Rendering ArchivePage, filtered items:", filteredApps.length);

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
                        <NavItem icon={<Layers size={18} />} label="Лента" href="/" />
                        <NavDropdown
                            icon={<Archive size={18} />}
                            label="Архив"
                            href="/archive"
                            active={true}
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
                        <div onClick={() => setIsCreateModalOpen(true)}>
                            <NavItem icon={<Plus size={18} />} label="Добавить заметку" href="#" />
                        </div>
                        <NavItem icon={<ExternalLink size={18} />} label="Добавить источник" href="/test-add-source" />
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto luxury-gradient relative">
                <header className="sticky top-0 z-10 glass border-b border-white/5 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </a>
                        <h1 className="text-lg font-medium">
                            Архив Инструментов {categoryFilter && <span className="text-gold opacity-50 ml-2">/ {categoryFilter}</span>}
                        </h1>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                        <input
                            type="text"
                            placeholder="Поиск в архиве..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-gold/50 transition-colors"
                        />
                    </div>
                </header>

                <div className="max-w-6xl mx-auto p-8 h-full">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                            <p className="text-white/40 mb-4">{search ? "Ничего не найдено по вашему запросу." : "Ваш архив пока пуст."}</p>
                            <a href="/" className="text-gold hover:underline">Перейти в ленту и добавить инструменты →</a>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                            {filteredApps.map((app) => (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedApp(app)}
                                    className="glass rounded-[1.5rem] p-6 hover:border-white/20 transition-all group flex flex-col h-full border border-white/5 cursor-pointer hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] active:scale-[0.98] duration-300"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-gold/80 border border-gold/20 uppercase tracking-tighter">
                                            {app.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-white/30">
                                            <Bell size={10} /> {app.mentionCount}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-gold transition-colors">{app.name}</h3>
                                    <p className="text-sm text-white/50 mb-6 line-clamp-3 flex-grow">{app.shortDescription}</p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-white/30 tracking-widest leading-none mb-1">Тариф</span>
                                            <span className={`text-sm font-bold capitalize ${app.pricing === 'free' ? 'text-green-400' : 'text-white'}`}>
                                                {app.pricing || "Неизвестно"}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-white/5 group-hover:bg-gold group-hover:text-black rounded-xl transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details Sheet/Modal */}
                {selectedApp && (
                    <ProductDetailsModal
                        app={selectedApp}
                        onClose={() => setSelectedApp(null)}
                    />
                )}

                {/* Create Solution Modal */}
                {isCreateModalOpen && (
                    <CreateSolutionModal onClose={() => setIsCreateModalOpen(false)} />
                )}
            </main>
        </div>
    );
}

function CreateSolutionModal({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Разное");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !content) {
            toast.error("Заполните заголовок и содержание");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: title,
                    category,
                    shortDescription: content.substring(0, 150) + "...",
                    content, // Markdown content
                    sourceType: 'solution',
                    mentionCount: 1, // Default for manual entry
                    pricing: 'free' // Default for manual entry
                })
            });

            if (res.ok) {
                toast.success("Заметка создана!");
                onClose();
            } else {
                const err = await res.json();
                toast.error("Ошибка: " + err.error);
            }
        } catch (e) {
            toast.error("Ошибка сети");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Создать заметку</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs uppercase text-white/40 font-bold mb-2 block">Заголовок</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Название решения или заметки..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase text-white/40 font-bold mb-2 block">Категория</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors appearance-none"
                        >
                            <option value="Разное">Разное</option>
                            <option value="LLM">LLM</option>
                            <option value="Vibe Coding">Vibe Coding</option>
                            <option value="Design">Design</option>
                            <option value="Automation">Automation</option>
                            <option value="Code Snippet">Code Snippet</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs uppercase text-white/40 font-bold mb-2 block">Содержание (Markdown)</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="# Описание решения\n\n```javascript\nconsole.log('Hello');\n```"
                            className="w-full h-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-gold/50 focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gold transition-colors disabled:opacity-50"
                        >
                            {loading ? "Сохранение..." : "Создать"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductDetailsModal({ app, onClose }: { app: AppArchived, onClose: () => void }) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative h-full w-full max-w-4xl bg-[#0a0a0a] border-l border-white/10 shadow-2xl p-10 flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs px-3 py-1 bg-gold/10 rounded-full text-gold border border-gold/20 uppercase tracking-tighter font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                                {app.category}
                            </span>
                            {app.hasMcp && (
                                <span className="text-xs px-3 py-1 bg-purple-500/10 rounded-full text-purple-400 border border-purple-500/20 uppercase tracking-tighter font-bold flex items-center gap-1.5">
                                    <Cpu size={12} /> MCP Support
                                </span>
                            )}
                            {app.hasApi && (
                                <span className="text-xs px-3 py-1 bg-blue-500/10 rounded-full text-blue-400 border border-blue-500/20 uppercase tracking-tighter font-bold flex items-center gap-1.5">
                                    <Globe size={12} /> API
                                </span>
                            )}
                        </div>
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent mb-2">
                            {app.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 content-start">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Short Description */}
                        <div className="text-xl text-white/90 leading-relaxed font-light border-l-4 border-gold/40 pl-6 py-1">
                            {app.shortDescription}
                        </div>

                        {/* Detailed Description */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Search size={14} /> Обзор
                            </h3>
                            <div className="text-base text-white/70 leading-loose whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                                {app.detailedDescription || "Подробное описание отсутствует. Попробуйте обновить данные источника или добавить новый источник."}
                            </div>
                        </div>

                        {/* Source Context (News/Summary) */}
                        {app.sourceContext && (
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <Bell size={14} /> Контекст из источника
                                </h3>
                                <div className="bg-white/[0.02] p-6 rounded-2xl border border-dashed border-white/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                        {app.sourceUrl && (
                                            <a href={app.sourceUrl} target="_blank" className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors" title="Открыть источник">
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="mb-2 text-xs text-gold/50 font-mono uppercase tracking-wider">
                                        {app.sourceTitle ? `Из новости: "${app.sourceTitle}"` : "Источник"}
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed italic">
                                        "{app.sourceContext}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Features */}
                        {app.features && app.features.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={14} /> Ключевые возможности
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {app.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3 text-sm text-white/80 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <Check size={18} className="text-gold mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Meta & Actions */}
                    <div className="space-y-6">
                        {/* Pricing Card */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-gold/20 transition-colors shadow-lg">
                            <div className="text-[10px] uppercase text-white/30 tracking-widest mb-3 flex items-center gap-2">
                                <Coins size={12} /> Модель оплаты
                            </div>
                            <div className="text-2xl font-bold capitalize text-white mb-1">
                                {app.pricing || "Неизвестно"}
                            </div>
                            {app.minPaidPrice && (
                                <div className="text-sm text-white/50">От {app.minPaidPrice}</div>
                            )}

                            {(app.pricingDetails) && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs text-white/60 leading-relaxed">{app.pricingDetails}</p>
                                </div>
                            )}
                        </div>

                        {/* Limits Card */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-gold/20 transition-colors shadow-lg">
                            <div className="text-[10px] uppercase text-white/30 tracking-widest mb-3 flex items-center gap-2">
                                <Zap size={12} /> Лимиты
                            </div>
                            <div className="text-base font-medium text-white/80">
                                {app.dailyCredits || "Нет данных о лимитах"}
                            </div>
                        </div>

                        {/* Actions */}
                        {app.url && (
                            <a
                                href={app.url}
                                target="_blank"
                                className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-gold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                            >
                                Открыть сайт <ExternalLink size={20} />
                            </a>
                        )}

                        <div className="text-center text-xs text-white/20 pt-4">
                            ID: {app.id} • Упоминаний: {app.mentionCount}
                        </div>
                    </div>
                </div>
            </div>
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
                        <span>Все элементы</span>
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
