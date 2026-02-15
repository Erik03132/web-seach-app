import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI features might not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function generateSearchSummary(query: string): Promise<string> {
    if (!apiKey) return "AI ключ не найден. Пожалуйста, настройте GEMINI_API_KEY.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Ты — умный бизнес-ассистент, который помогает предпринимателям находить AI-решения.
        Пользователь ищет: "${query}".

        Твоя задача:
        1. Кратко и емко ответь на этот запрос (2-3 предложения).
        2. Если это вопрос про инструменты — посоветуй 1-2 лучших (не придумывай несуществующие).
        3. Если это абстрактный вопрос (например, "как внедрить AI") — дай конкретный первый шаг.
        
        Отвечай на русском языке. Будь кратким, деловым и полезным. Не используй маркеринговый булшит.
        Твой ответ должен быть простым текстом (можно использовать markdown для жирного шрифта).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Gemini Generation Failed:", error);
        return "Не удалось сгенерировать ответ. Попробуйте позже.";
    }
}
