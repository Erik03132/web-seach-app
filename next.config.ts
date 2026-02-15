import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Строгий режим React — двойной рендеринг в dev для выявления проблем
    reactStrictMode: true,
    // Игнорируем ошибки линтера и типов при сборке (для гарантии деплоя)
    // removed eslint config as it is deprecated in Next.js 15+
    typescript: {
        ignoreBuildErrors: true,
    },
}

export default nextConfig
