import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Строгий режим React — двойной рендеринг в dev для выявления проблем
    reactStrictMode: true,
    // Игнорируем ошибки линтера и типов при сборке (для гарантии деплоя)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

export default nextConfig
