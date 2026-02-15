import MobileNav from '@/components/MobileNav'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
    title: 'AI Scout | Live Feed',
    description: 'Personalized AI app recommendations aggregator',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
                {children}
                <MobileNav />
                <Toaster position="bottom-right" richColors />
            </body>
        </html>
    )
}
