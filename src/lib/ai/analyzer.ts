import OpenAI from "openai";

const apiKey = process.env.PERPLEXITY_API_KEY;

if (!apiKey) {
    console.warn("PERPLEXITY_API_KEY is not defined. AI features will not work.");
}

const openai = new OpenAI({
    apiKey: apiKey || "",
    baseURL: "https://api.perplexity.ai",
});

export interface AppRecommendation {
    name: string;
    category: string;
    shortDescription: string;
    detailedDescription: string;
    features: string[];
    url?: string;
    pricing?: "free" | "paid" | "freemium";
    pricingDetails?: string;
    dailyCredits?: string | null;
    hasMcp: boolean;
    hasApi: boolean;
    minPaidPrice?: string | null;
}

export interface AnalysisResult {
    summary: string;
    apps: AppRecommendation[];
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
    if (!apiKey) return { summary: "", apps: [] };

    const prompt = `
    Проанализируй следующий текст (заголовок, описание и теги видео) и сделай следующее на РУССКОМ языке:
    
    1. Напиши краткое саммари видео (2-3 предложения), о чем оно и какую пользу несет.
    2. Извлеки все упомянутые программы, сервисы, нейросети или сайты.
    
    Для каждого найденного инструмента заполни следующие поля:
    - "name": Название инструмента.
    - "category": Выбери категорию из списка: [LLM, Vibe Coding, Design, Automation, Image Generation, Разное].
    - "shortDescription": Очень краткое описание (1 предложение) для превью.
    - "detailedDescription": Подробное описание (2-3 абзаца): что делает, для кого, основные кейсы использования.
    - "features": Массив строк (3-5 ключевых фич).
    - "url": Ссылка на сайт (если есть).
    - "pricing": "free", "paid", или "freemium".
    - "pricingDetails": Текстовое описание цен (например, "Есть бесплатный план, про от $20").
    - "dailyCredits": Строка с инфо о бесплатных лимитах (например, "50 генераций в день" или null).
    - "hasMcp": boolean (true/false) — упоминается ли поддержка MCP (Model Context Protocol).
    - "hasApi": boolean (true/false) — есть ли API для разработчиков.
    - "minPaidPrice": Строка с минимальной ценой платного тарифа (например, "$10/mo" или null).

    Верни ответ СТРОГО в формате JSON с полями "summary" и "apps".
    Весь текст значений должен быть на РУССКОМ языке.
    Не используй блоки кода markdown (\`\`\`json). Только чистый JSON.

    Текст для анализа:
    """
    ${text}
    """
  `;

    try {
        console.log("[AI] Starting Perplexity analysis (Russian + Summary)...");

        const response = await openai.chat.completions.create({
            model: "sonar-reasoning-pro",
            messages: [
                {
                    role: "system",
                    content: "Ты — профессиональный аналитик софта. Ты извлекаешь данные из описаний видео и переводишь их на русский язык. Ты всегда отвечаешь только чистым JSON."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
        });

        const content = response.choices[0].message.content || '{"summary": "", "apps": []}';
        console.log("[AI] Raw response length:", content.length);

        // 1. Remove <think> blocks common in reasoning models
        const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        // 2. Extract JSON part (find first { and last })
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);

        let jsonStr = "";
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        } else {
            // Fallback: try standard cleanup if regex failed (unlikely for valid JSON)
            jsonStr = cleanContent.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        console.log("[AI] Response received and parsed.");
        const parsed = JSON.parse(jsonStr) as AnalysisResult;

        return parsed;
    } catch (error) {
        console.error("Perplexity Analysis Failed:", error);
        return { summary: "Ошибка анализа контента.", apps: [] };
    }
}
