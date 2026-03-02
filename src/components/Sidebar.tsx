"use client";

import { db } from '@/lib/firebase/firebase';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import {
    Archive,
    ChevronDown,
    Heart,
    Hexagon,
    LogOut,
    PlusCircle,
    Send,
    Settings,
    TrendingUp,
    Youtube
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Channel {
    id: string;
    title: string;
    sourceType: 'youtube' | 'telegram';
}

export const Sidebar = () => {
    const pathname = usePathname();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [archiveOpen, setArchiveOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "channels"), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Channel[];
            setChannels(fetched);
        });
        return () => unsubscribe();
    }, []);

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="hidden md:flex flex-col w-[280px] fixed left-0 top-0 bottom-0 bg-[#0a0a0c] border-r border-white/5 z-50">
            {/* Logo Section */}
            <div className="p-8 pb-10 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#facc15] rounded-xl flex items-center justify-center text-black shadow-lg shadow-[#facc15]/20">
                    <Hexagon size={22} fill="currentColor" strokeWidth={0} />
                </div>
                <span className="text-xl font-black tracking-tighter text-white">AI SCOUT</span>
            </div>

            {/* Main Navigation */}
            <nav className="flex flex-col gap-1 px-4 mb-12">
                <Link
                    href="/"
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold ${isActive('/') ? 'bg-[#facc15]/10 text-[#facc15]' : 'text-[#888891] hover:text-white hover:bg-white/5'
                        }`}
                >
                    <TrendingUp size={20} />
                    <span className="text-sm">Лента</span>
                    {isActive('/') && <div className="ml-auto w-1 h-1 bg-[#facc15] rounded-full" />}
                </Link>

                {/* Archive with Dropdown */}
                <div className="flex flex-col">
                    <button
                        onClick={() => setArchiveOpen(!archiveOpen)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold ${pathname.startsWith('/archive') ? 'text-[#facc15]' : 'text-[#888891] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Archive size={20} />
                        <span className="text-sm flex-1 text-left">Архив</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${archiveOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {archiveOpen && (
                        <div className="ml-10 flex flex-col gap-0.5 mt-1 border-l border-white/5 pl-4 py-1">
                            <Link href="/archive?cat=LLM" className="text-xs text-[#888891] hover:text-white py-2 transition-colors">LLM Models</Link>
                            <Link href="/archive?cat=Vibe" className="text-xs text-[#888891] hover:text-white py-2 transition-colors">Vibe Coding</Link>
                            <Link href="/archive?cat=Design" className="text-xs text-[#888891] hover:text-white py-2 transition-colors">Design Tools</Link>
                        </div>
                    )}
                </div>

                <Link
                    href="/favorites"
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold ${isActive('/favorites') ? 'bg-[#facc15]/10 text-[#facc15]' : 'text-[#888891] hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Heart size={20} className={isActive('/favorites') ? "fill-current" : ""} />
                    <span className="text-sm">Избранное</span>
                </Link>

                <Link
                    href="/add-source"
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold ${isActive('/add-source') ? 'bg-[#facc15]/10 text-[#facc15]' : 'text-[#888891] hover:text-white hover:bg-white/5'
                        }`}
                >
                    <PlusCircle size={20} />
                    <span className="text-sm">Добавить источник</span>
                </Link>
            </nav>

            {/* Tracked Channels Section */}
            <div className="flex flex-col gap-4 px-4 mb-4 overflow-y-auto flex-1 scrollbar-hide">
                <div className="text-[10px] font-black text-[#888891]/50 uppercase tracking-[0.25em] px-4">ОТСЛЕЖИВАЕМЫЕ КАНАЛЫ</div>
                <div className="flex flex-col gap-1">
                    {channels.length === 0 ? (
                        [1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />)
                    ) : (
                        channels.map((channel) => (
                            <button
                                key={channel.id}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#888891] hover:text-white hover:bg-white/5 transition-all text-left group"
                            >
                                {channel.sourceType === 'youtube' ? (
                                    <Youtube size={16} className="text-red-500/60 group-hover:text-red-500" />
                                ) : (
                                    <Send size={16} className="text-blue-400/60 group-hover:text-blue-400" />
                                )}
                                <span className="text-[11px] truncate font-bold lowercase tracking-tight">@{channel.title}</span>
                                <div className="ml-auto w-1 h-1 bg-[#facc15]/30 rounded-full group-hover:bg-[#facc15]" />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Profile Section */}
            <div className="p-4 border-t border-white/5">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[#888891] hover:text-white hover:bg-white/5 transition-all mb-4 font-bold"
                >
                    <Settings size={20} />
                    <span className="text-sm">Настройки</span>
                </Link>

                <div className="p-3 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center gap-3 group px-4 py-4">
                    <div className="w-10 h-10 rounded-full bg-[#facc15]/20 border-2 border-[#facc15]/20 overflow-hidden ring-2 ring-transparent group-hover:ring-[#facc15]/20 transition-all">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h5 className="text-[11px] font-black text-white truncate uppercase">Igor Vasin</h5>
                        <p className="text-[9px] font-bold text-[#facc15] uppercase tracking-widest whitespace-nowrap">VIP Участник</p>
                    </div>
                    <button className="text-[#888891] hover:text-white transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};
