import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function askGemini(prompt: string): Promise<string> {
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                topP: 0.95,
                maxOutputTokens: 2048,
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
        const prompt = `Пользователь ищет: "${query}". Кратко (2-3 предложения) ответь на русском языке.`;
        return await askGemini(prompt);
    } catch (e) {
        return "Не удалось сгенерировать ответ.";
    }
}
