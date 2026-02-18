import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function askGemini(prompt: string, isJson: boolean = false): Promise<string> {
    if (!apiKey) {
        console.error("[Gemini] API Key is missing logic");
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: isJson ? "application/json" : "text/plain",
                temperature: 0.2,
            }
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("Gemini returned empty text");
        return text;
    } catch (error: any) {
        // Log more details about the error environment
        const keyInfo = apiKey ? `${apiKey.substring(0, 4)}...` : "NONE";
        console.error(`[Gemini SDK Error] Key=${keyInfo}:`, error.message);
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
