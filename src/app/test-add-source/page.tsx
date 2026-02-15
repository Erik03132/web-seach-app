"use client";

import React, { useState } from "react";
import {
    Youtube,
    Send,
    Sparkles,
    ExternalLink,
    Layers,
    Search,
    Settings,
    Plus,
    Archive,
    ArrowLeft,
    ChevronRight,
    CheckCircle2,
    Check,
    AlertCircle,
    ChevronDown,
    Brain,
    Zap,
    Palette,
    Monitor,
    Image,
    HelpCircle
} from "lucide-react";
import { toast } from "sonner";

export default function AddSourcePage() {
    const [urls, setUrls] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResults([]);
        setError(null);

        const urlList = urls.split("\n").map(u => u.trim()).filter(u => u.length > 0);

        if (urlList.length === 0) {
            toast.error("Please enter at least one URL");
            setLoading(false);
            return;
        }

        const newResults: any[] = [];

        for (const url of urlList) {
            try {
                const response = await fetch("/api/sources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });

                const data = await response.json();

                newResults.push({
                    url,
                    status: response.ok ? "success" : "error",
                    response: data
                });

            } catch (err: any) {
                newResults.push({
                    url,
                    status: "error",
                    response: { error: err.message }
                });
            }
        }

        setResults(newResults);
        setLoading(false);
        toast.success("Processing complete!");
    };

    const renderApps = (apps: any[]) => {
        if (!apps || apps.length === 0) return null;

        return (
            <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gold uppercase tracking-wider mb-2">
                    <Sparkles size={12} /> AI Detected {apps.length} tools
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {apps.map((app: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.03] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-white">{app.name}</span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded border border-white/5 text-white/40 uppercase">{app.category}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <ArchiveButton app={app} />
                                {app.url && <a href={app.url} target="_blank" className="text-[9px] text-white/30 hover:text-white"><ExternalLink size={10} /></a>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
                        <NavItem icon={<Layers size={18} />} label="Feed" href="/" />
                        <NavItem icon={<Archive size={18} />} label="Archive" href="/archive" />
                        <NavItem icon={<Search size={18} />} label="Discover" />
                        <NavItem icon={<Plus size={18} />} label="Add Sources" active />
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto luxury-gradient relative">
                <header className="sticky top-0 z-10 glass border-b border-white/5 px-8 py-4 flex items-center gap-4">
                    <a href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </a>
                    <h1 className="text-lg font-medium tracking-tight">Source Manager</h1>
                </header>

                <div className="max-w-3xl mx-auto p-8">
                    <div className="glass rounded-[2rem] p-8 border border-white/5 mb-8">
                        <h2 className="text-xl font-bold mb-2">Import Channels</h2>
                        <p className="text-white/40 text-sm mb-6">Add YouTube channels or Telegram handles to expand your intelligence feed.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <textarea
                                    placeholder={`@vibecoding_tg\nhttps://youtube.com/@TheRiddle\n@denis_sekretov`}
                                    value={urls}
                                    onChange={(e) => setUrls(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 min-h-[120px] text-sm focus:outline-none focus:border-gold/50 transition-all font-mono"
                                    required
                                />
                                <div className="absolute right-4 bottom-4 text-[10px] text-white/20 uppercase tracking-widest font-bold">URLs list</div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-gold transition-all duration-300 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        Analyzing Sources...
                                    </>
                                ) : (
                                    <>
                                        Process & Save <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {results.length > 0 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Layers size={12} /> Журнал выполнения
                            </h3>

                            {results.map((res, idx) => (
                                <div key={idx} className="glass rounded-2xl p-5 border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-white/30 font-mono">{res.url}</span>
                                            <div className="flex items-center gap-2">
                                                {res.status === 'success' ? (
                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                ) : (
                                                    <AlertCircle size={14} className="text-red-500" />
                                                )}
                                                <span className="font-bold text-sm">
                                                    {res.status === 'success' ? (res.response.data?.title || res.response.message) : "Ошибка обработки"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {res.status === 'success' && (
                                        <div className="pl-6 border-l border-white/10 space-y-4">
                                            {res.response.type === "video" && res.response.data?.aiSummary && (
                                                <p className="text-xs text-white/60 italic leading-relaxed">"{res.response.data.aiSummary}"</p>
                                            )}

                                            {res.response.type === "channel" && res.response.results && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {res.response.results.map((item: any, i: number) => (
                                                        <div key={i} className="px-2 py-1 bg-white/5 rounded-md text-[9px] text-white/50 flex items-center gap-2">
                                                            <span className={`w-1 h-1 rounded-full ${item.status === 'created' ? 'bg-green-500' : 'bg-white/20'}`} />
                                                            {item.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {res.response.data?.detectedApps && renderApps(res.response.data.detectedApps)}
                                            {res.response.results?.some((r: any) => r.detectedApps?.length > 0) && (
                                                <div className="space-y-4">
                                                    {res.response.results.map((r: any) => renderApps(r.detectedApps))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {res.status === 'error' && (
                                        <p className="text-xs text-red-400 pl-6">{res.response?.error || "Unknown error occurred"}</p>
                                    )}
                                </div>
                            ))}
                        </div>
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


function ArchiveButton({ app }: { app: any }) {
    const [archived, setArchived] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleArchive = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (archived || loading) return;
        setLoading(true);
        try {
            const res = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(app)
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
            className={`text-[9px] px-2 py-0.5 rounded transition-all flex items-center gap-1 border active:scale-95 ${archived
                ? "bg-green-500/20 text-green-400 border-green-500/30 cursor-default"
                : "bg-gold/10 text-gold hover:bg-gold/20 border-gold/20"
                }`}
        >
            {loading ? (
                <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
            ) : archived ? (
                <Check size={10} />
            ) : (
                <Archive size={10} />
            )}
            {archived ? "Saved" : "Archive"}
        </button>
    );
}
