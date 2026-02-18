import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Объединение Tailwind классов без конфликтов */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Форматирование даты на русском */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

/** Fetch with timeout (default 8s) to prevent Vercel execution limits from killing the whole process */
export async function fetchWithTimeout(resource: string, options: RequestInit = {}) {
    const { timeout = 8000 } = options as any;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}
