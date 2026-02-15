"use client";

import {
    Archive,
    ArrowLeft,
    BookOpen,
    Brain,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Compass,
    ExternalLink,
    Heart,
    HelpCircle,
    Image,
    Layers,
    Monitor,
    Palette,
    Plus,
    Search,
    Sparkles,
    TrendingUp,
    Zap
} from "lucide-react";
import React, { useState } from "react";

// Mock Data for "Practical Cases"
const PRACTICAL_CASES = [
    {
        id: 1,
        title: "Автоматизация юридической проверки договоров",
        summary: "Использование LLM для анализа рисков в корпоративных контрактах. Кейс сократил время проверки на 70% и выявил скрытые пункты об ответственности.",
        category: "Legal Tech",
        sourceDomain: "techcrunch.com",
        url: "#"
    },
    {
        id: 2,
        title: "AI-ассистент для службы поддержки банка",
        summary: "Внедрение гибридной системы (бот + человек) для обработки запросов клиентов. Снижение нагрузки на первую линию на 45% в первый месяц.",
        category: "Customer Service",
        sourceDomain: "forbes.com",
        url: "#"
    },
    {
        id: 3,
        title: "Генерация персонализированных маркетинговых кампаний",
        summary: "Как ритейлер одежды использовал Image Gen и Text Gen для создания 10,000 уникальных креативов для e-mail рассылки, увеличив конверсию в 3 раза.",
        category: "Marketing",
        sourceDomain: "marketingdive.com",
        url: "#"
    },
    {
        id: 4,
        title: "Оптимизация логистики с помощью Predictive AI",
        summary: "Применение алгоритмов машинного обучения для прогнозирования спроса и оптимизации маршрутов доставки в реальном времени.",
        category: "Logistics",
        sourceDomain: "logistics.review",
        url: "#"
    },
    {
        id: 5,
        title: "AI в диагностике медицинских снимков",
        summary: "Система компьютерного зрения, помогающая рентгенологам выявлять патологии на ранних стадиях с точностью 98%.",
        category: "Healthcare",
        sourceDomain: "healthtech.news",
        url: "#"
    },
    {
        id: 6,
        title: "Кодинг-ассистенты в Enterprise разработке",
        summary: "Опыт внедрения GitHub Copilot в команду из 500 разработчиков. Метрики продуктивности и качества кода спустя полгода.",
        category: "Development",
        sourceDomain: "habr.com",
        url: "#"
    }
];

// Mock Data for "Business Focus"
const BUSINESS_INSIGHTS = [
    {
        id: 1,
        title: "ROI от внедрения ИИ: Реальные цифры 2025",
        description: "Аналитичекий отчет о возврате инвестиций в различных секторах экономики.",
        readTime: "5 мин"
    },
    {
        id: 2,
        title: "Этика ИИ в корпоративном секторе",
        description: "Как избежать репутационных рисков при использовании генеративных моделей.",
        readTime: "7 мин"
    },
    {
        id: 3,
        title: "Топ-5 стратегий трансформации бизнеса",
        description: "Пошаговое руководство от ведущих экспертов McKinsey и BCG.",
        readTime: "10 мин"
    }
];

export default function DiscoverPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsAiLoading(true);
        setAiSummary(null);

        try {
            const response = await fetch('/api/ai-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            });

            const data = await response.json();
            if (data.summary) {
                setAiSummary(data.summary);
            }
        } catch (error) {
            console.error("Failed to fetch AI summary", error);
        } finally {
            setIsAiLoading(false);
        }
    };

    const toggleFavorite = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const displayedCases = (viewMode === 'all' ? PRACTICAL_CASES : PRACTICAL_CASES.filter(c => favorites.includes(c.id)))
        .filter(item =>
            searchQuery.trim() === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 glass border-r border-white/10 hidden md:flex flex-col shrink-0">
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
                            items={[
                                { label: 'LLM', href: '/archive?cat=LLM', icon: <Brain size={14} /> },
                                { label: 'Vibe Coding', href: '/archive?cat=Vibe', icon: <Zap size={14} /> },
                                { label: 'Design', href: '/archive?cat=Design', icon: <Palette size={14} /> },
                                { label: 'Автоматизация', href: '/archive?cat=Automation', icon: <Monitor size={14} /> },
                                { label: 'Изображения', href: '/archive?cat=Image', icon: <Image size={14} /> },
                                { label: 'Разное', href: '/archive?cat=Разное', icon: <HelpCircle size={14} /> },
                            ]}
                        />
                        <NavItem icon={<Search size={18} />} label="Обзор" href="/discover" active />
                        <NavItem icon={<Plus size={18} />} label="Добавить источник" href="/test-add-source" />
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto luxury-gradient relative">
                <header className="sticky top-0 z-10 glass border-b border-white/5 px-8 py-4 flex items-center gap-4">
                    <a href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </a>
                    <h1 className="text-lg font-medium tracking-tight">Обзор и Тренды</h1>
                </header>

                <div className="max-w-6xl mx-auto p-8 space-y-12 pb-24 md:pb-12">

                    {/* Search Section */}
                    <section className="relative">
                        <div className="absolute inset-0 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-6 text-center">Что вы хотите найти?</h2>
                            <div className="max-w-2xl mx-auto relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Спросите AI или ищите кейсы..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-16 text-base text-white focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all shadow-lg"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl transition-colors"
                                >
                                    {isAiLoading ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <ArrowLeft size={20} className="rotate-180" />}
                                </button>
                            </div>

                            {/* AI Summary Card */}
                            {(aiSummary || isAiLoading) && (
                                <div className="max-w-3xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="glass border border-gold/20 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

                                        <div className="flex gap-4">
                                            <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                                <Sparkles size={20} className="text-gold" />
                                            </div>
                                            <div className="space-y-2 w-full">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    AI Инсайт
                                                    {isAiLoading && <span className="text-xs font-normal text-white/40 animate-pulse">• Думаю...</span>}
                                                </h3>

                                                {isAiLoading ? (
                                                    <div className="space-y-2 opacity-50">
                                                        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                                                        <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                                                        <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                                                    </div>
                                                ) : (
                                                    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
                                                        <p className="whitespace-pre-line">{aiSummary}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Practical Cases Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Compass size={18} className="text-gold" />
                                    Практические кейсы
                                </h3>
                                {/* View Toggles */}
                                <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                                    <button
                                        onClick={() => setViewMode('all')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Все
                                    </button>
                                    <button
                                        onClick={() => setViewMode('favorites')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${viewMode === 'favorites' ? 'bg-gold/20 text-gold' : 'text-white/40 hover:text-white'}`}
                                    >
                                        <Heart size={10} className={viewMode === 'favorites' ? 'fill-gold' : ''} />
                                        Избранное ({favorites.length})
                                    </button>
                                </div>
                            </div>

                            <a href="#" className="text-xs text-white/40 hover:text-gold transition-colors flex items-center gap-1">
                                Смотреть все <ChevronRight size={12} />
                            </a>
                        </div>

                        {displayedCases.length === 0 ? (
                            <div className="text-center py-20 text-white/30 text-sm border border-dashed border-white/10 rounded-2xl">
                                {viewMode === 'favorites' ? 'Нет избранных кейсов' : 'Ничего не найдено'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedCases.map((item) => {
                                    const isFav = favorites.includes(item.id);
                                    return (
                                        <div key={item.id} className="glass group hover:border-gold/30 transition-all duration-300 rounded-2xl p-6 border border-white/5 flex flex-col h-full hover:-translate-y-1 relative">

                                            {/* Heart Button */}
                                            <button
                                                onClick={(e) => toggleFavorite(item.id, e)}
                                                className="absolute top-4 right-4 p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all z-10 touch-manipulation"
                                            >
                                                <Heart
                                                    size={18}
                                                    className={`transition-all duration-300 ${isFav ? 'text-gold fill-gold scale-110' : 'text-white/20 hover:text-red-400'}`}
                                                />
                                            </button>

                                            <div className="flex justify-between items-start mb-4 pr-10">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-gold/80 bg-gold/10 px-2 py-1 rounded-md">
                                                    {item.category}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold mb-3 leading-snug group-hover:text-gold transition-colors pr-6">
                                                {item.title}
                                            </h4>
                                            <p className="text-sm text-white/60 mb-6 line-clamp-3 leading-relaxed flex-grow">
                                                {item.summary}
                                            </p>
                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/50">
                                                        {item.sourceDomain[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-xs text-white/30">{item.sourceDomain}</span>
                                                </div>
                                                <a href={item.url} target="_blank" className="text-xs flex items-center gap-1 text-gold/60 hover:text-gold transition-colors">
                                                    Читать <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Business Focus Section */}
                    <section className="bg-gradient-to-r from-gold/5 via-white/[0.02] to-transparent rounded-3xl p-6 md:p-8 border border-white/5">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="p-3 bg-gold/20 rounded-xl text-gold">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">ИИ в Бизнесе</h3>
                                <p className="text-sm text-white/40">Стратегии, аналитика и внедрение</p>
                            </div>
                        </div>

                        <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
                            {BUSINESS_INSIGHTS.map((insight) => (
                                <div key={insight.id} className="group cursor-pointer min-w-[280px] md:min-w-0 snap-center bg-white/5 md:bg-transparent rounded-2xl p-4 md:p-0 border border-white/5 md:border-0 hover:border-gold/20 transition-all">
                                    <div className="flex items-start gap-4 mb-3">
                                        <div className="mt-1">
                                            <TrendingUp size={16} className="text-white/20 group-hover:text-green-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white/90 group-hover:text-gold transition-colors mb-2 text-sm md:text-base">
                                                {insight.title}
                                            </h4>
                                            <p className="text-xs text-white/50 leading-relaxed mb-2 line-clamp-2 md:line-clamp-none">
                                                {insight.description}
                                            </p>
                                            <span className="text-[10px] text-white/20 uppercase tracking-widest flex items-center gap-1">
                                                <BookOpen size={10} /> {insight.readTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

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
