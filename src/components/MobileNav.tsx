"use client";

import { LayoutGrid, Search, Settings, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t px-6 py-4 flex justify-around items-center safe-area-bottom bg-background/80">
            <Link href="/" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-accent' : 'text-muted hover:text-white'}`}>
                <TrendingUp size={24} />
                <span className="text-[10px] font-bold uppercase">Feed</span>
            </Link>

            <Link href="/archive" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/archive') ? 'text-accent' : 'text-muted hover:text-white'}`}>
                <LayoutGrid size={24} />
                <span className="text-[10px] font-bold uppercase">Apps</span>
            </Link>

            <div className="relative -top-4">
                <Link href="/discover" className="w-14 h-14 bg-accent text-background rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 rotate-45 group transition-transform hover:scale-105 active:scale-95">
                    <div className="-rotate-45">
                        <Search size={24} strokeWidth={3} />
                    </div>
                </Link>
            </div>

            <Link href="/favorites" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/favorites') ? 'text-accent' : 'text-muted hover:text-white'}`}>
                <Star size={24} />
                <span className="text-[10px] font-bold uppercase">Saved</span>
            </Link>

            <Link href="/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-accent' : 'text-muted hover:text-white'}`}>
                <Settings size={24} />
                <span className="text-[10px] font-bold uppercase">Self</span>
            </Link>
        </nav>
    );
}
