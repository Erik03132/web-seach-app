import { fetchWithTimeout } from "@/lib/utils";

/**
 * Google Gemini API клиент
 * Документация: https://ai.google.dev
 */

interface GeminiResponse {
    candidates?: Array<{
        content?: { parts: Array<{ text: string }> },
        finishReason?: string
    }>;
    error?: {
        message: string;
        code: number;
    };
}

export async function askGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY не задан')

    let lastError: any;
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetchWithTimeout(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.1,
                            topP: 0.95,
                        }
                    }),
                    timeout: 25000 // 25s
                } as any
            )

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 150)}`);
            }

            const data: GeminiResponse = await response.json()

            if (data.error) {
                throw new Error(`Gemini Error: ${data.error.message}`);
            }

            const candidate = data.candidates?.[0];
            if (!candidate || !candidate.content || !candidate.content.parts?.[0]?.text) {
                const reason = candidate?.finishReason || "UNKNOWN";
                throw new Error(`No content from Gemini (Reason: ${reason})`);
            }

            return candidate.content.parts[0].text
        } catch (e: any) {
            lastError = e;
            console.warn(`[Gemini] Attempt ${i + 1} failed:`, e.message);
            if (i < 2) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    throw lastError;
}

export async function generateSearchSummary(query: string): Promise<string> {
    try {
        const prompt = `
        Ты — умный бизнес-ассистент. Пользователь ищет: "${query}".
        Кратко (2-3 предложения) ответь на русском языке. Будь полезным и конкретным.
        `;
        return await askGemini(prompt);
    } catch (e) {
        return "Не удалось сгенерировать ответ.";
    }
}
