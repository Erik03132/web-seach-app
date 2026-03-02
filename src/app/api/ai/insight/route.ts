import { askGemini } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

        const prompt = `
            Ты — AI Scout, интеллектуальный бизнес-ассистент. 
            Пользователь задал вопрос: "${query}".
            
            Твоя задача:
            1. Дать четкий, структурированный ответ на русском языке.
            2. Использовать формат Markdown.
            3. Если уместно, упомянуть конкретные AI-инструменты или подходы.
            4. Будь профессиональным, но лаконичным (максимум 150 слов).
            
            Отвечай прямо, без приветствий типа "Как ИИ-помощник...".
        `;

        const response = await askGemini(prompt, false);
        return NextResponse.json({ answer: response });

    } catch (error: any) {
        console.error("[Insight API Error]:", error.message);
        return NextResponse.json({ error: "Ошибка при генерации ответа" }, { status: 500 });
    }
}
