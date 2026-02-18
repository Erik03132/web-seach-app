import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Common entry point for Gemini calls.
 * Uses the official SDK with a manual retry mechanism.
 */
export async function askGemini(prompt: string, isJson: boolean = false): Promise<string> {
    if (!apiKey) throw new Error("GEMINI_API_KEY_NOT_FOUND");

    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
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
            lastError = error;
            console.warn(`[Gemini Attempt ${attempt} failed]:`, error.message);

            // Wait before retry (exponential backoff)
            if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    }

    throw lastError;
}

export async function generateSearchSummary(query: string): Promise<string> {
    try {
        const prompt = `Коротко (2 предложения) ответь на вопрос пользователя на русском: "${query}"`;
        return await askGemini(prompt);
    } catch (e) {
        return "Не удалось получить ответ.";
    }
}
