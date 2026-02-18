import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Common entry point for Gemini calls.
 * Uses the official SDK for reliability.
 */
export async function askGemini(prompt: string): Promise<string> {
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                topP: 0.95,
            }
        });

        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("Empty response from Gemini");

        return text;
    } catch (error: any) {
        console.error("[Gemini SDK Error]:", error.message);
        throw error;
    }
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
