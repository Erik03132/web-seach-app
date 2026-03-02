"use client";

import { Bell, Search } from 'lucide-react';

export const Header = () => {
    return (
        <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
                <div className="bg-accent w-8 h-8 rounded-lg flex items-center justify-center text-background">
                    <Search size={20} strokeWidth={3} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">AI Scout</h1>
            </div>
            <div className="flex items-center gap-4">
                <button className="text-muted hover:text-white transition-colors">
                    <Bell size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-border border border-muted/20 overflow-hidden min-w-8 min-h-8">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
};
