import MobileNav from '@/components/MobileNav'
import SidebarWrapper from '@/components/SidebarWrapper'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
    title: 'AI Scout | Business Insights',
    description: 'Personalized AI app recommendations aggregator',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
                <div className="flex min-h-screen">
                    <SidebarWrapper />
                    <div className="flex-1 md:ml-64 relative">
                        {children}
                    </div>
                </div>
                <MobileNav />
                <Toaster position="bottom-right" richColors />
            </body>
        </html>
    )
}
