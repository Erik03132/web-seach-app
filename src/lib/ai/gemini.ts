import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function askGemini(prompt: string, isJson: boolean = false): Promise<string> {
    if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                // Если нужен JSON, требуем его на уровне модели
                responseMimeType: isJson ? "application/json" : "text/plain",
                temperature: 0.1,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error("Empty response from AI");
        return text;
    } catch (error: any) {
        console.error(`[Gemini Error]:`, error.message);
        throw error;
    }
}

export async function generateSearchSummary(query: string): Promise<string> {
    try {
        const prompt = `Коротко (2 предложения) ответь на вопрос пользователя на русском: "${query}"`;
        return await askGemini(prompt);
    } catch (e) {
        return "Не удалось получить ответ.";
    }
}
