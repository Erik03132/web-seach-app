"use client";

import { Archive, Layers, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-6 py-4 flex items-center justify-between safe-area-bottom">
            <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-gold' : 'text-white/40'}`}>
                <Layers size={20} />
                <span className="text-[10px] font-medium">Лента</span>
            </Link>

            <Link href="/archive" className={`flex flex-col items-center gap-1 ${isActive('/archive') ? 'text-gold' : 'text-white/40'}`}>
                <Archive size={20} />
                <span className="text-[10px] font-medium">Архив</span>
            </Link>

            <Link href="/test-add-source" className="relative -top-5">
                <div className="w-12 h-12 bg-gold text-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] border-4 border-black">
                    <Plus size={24} />
                </div>
            </Link>

            <Link href="/discover" className={`flex flex-col items-center gap-1 ${isActive('/discover') ? 'text-gold' : 'text-white/40'}`}>
                <Search size={20} />
                <span className="text-[10px] font-medium">Обзор</span>
            </Link>

            <div className="flex flex-col items-center gap-1 text-white/40 pointer-events-none opacity-50">
                {/* Placeholder for Profile/Settings if needed later */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-gold to-gold-light" />
                <span className="text-[10px] font-medium">Профиль</span>
            </div>
        </div>
    );
}
