"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export default function SidebarWrapper() {
    const pathname = usePathname();

    // Мы можем скрывать сайдбар на определенных страницах если нужно
    return <Sidebar />;
}
