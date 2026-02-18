import { askGemini } from "./gemini";

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
  title?: string; // Optional title if LLM provides one
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  const prompt = `
    Проанализируй следующий текст и сделай следующее на РУССКОМ языке:
    
    1. Придумай короткий привлекательный заголовок для этого поста.
    2. Напиши краткое саммари (2-3 предложения), о чем текст и какую пользу несет.
    3. Извлеки все упомянутые программы, сервисы, нейросети или сайты.
    
    Для каждого найденного инструмента заполни следующие поля:
    - "name": Название инструмента.
    - "category": Категория из списка: [LLM, Vibe Coding, Design, Automation, Image Generation, Разное].
    - "shortDescription": Краткое описание (1 предложение).
    - "detailedDescription": Подробное описание (2-3 абзаца): функции, кейсы.
    - "features": Массив строк (3-5 фич).
    - "url": Ссылка на сайт (если есть).
    - "pricing": "free", "paid", или "freemium".
    - "pricingDetails": Описание цен.
    - "dailyCredits": Инфо о лимитах или null.
    - "hasMcp": boolean (упоминается ли MCP).
    - "hasApi": boolean (есть ли API).
    - "minPaidPrice": Минимальная цена или null.

    Верни ответ СТРОГО в формате JSON с полями "title", "summary" и "apps".
    Не используй markdown блоки (\`\`\`json). Только чистый JSON.

    Текст для анализа:
    """
    ${text}
    """
  `;

  try {
    const response = await askGemini(prompt);

    // Clean potential leftovers
    let cleanResponse = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleanResponse;

    const parsed = JSON.parse(jsonStr);

    return {
      title: parsed.title || "",
      summary: parsed.summary || "Анализ завершен.",
      apps: parsed.apps || []
    };
  } catch (error: any) {
    console.error("[AI Expert] Gemini Analysis Failed:", error.message);
    return {
      title: text.split('\n')[0].substring(0, 70),
      summary: "Ошибка при анализе контента.",
      apps: []
    };
  }
}
