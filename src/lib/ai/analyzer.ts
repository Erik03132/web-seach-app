import { askGemini } from "./gemini";

export interface AppRecommendation {
  name: string;
  category: string;
  shortDescription: string;
  detailedDescription: string;
  features: string[];
  url?: string;
  pricing?: "free" | "paid" | "freemium";
}

export interface AnalysisResult {
  summary: string;
  apps: AppRecommendation[];
  title?: string;
  isFallback?: boolean;
}

/** Clean title from common LLM artifacts like "Title: " or markdown */
function cleanTitle(title: string): string {
  return title
    .replace(/^(заголовок|title|название|тема|новость):\s*/i, "")
    .replace(/[#*`]/g, "")
    .trim();
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  if (!text || text.length < 5) {
    return { title: "Новый пост", summary: "Нет содержания для анализа", apps: [], isFallback: true };
  }

  const prompt = `
    Ты эксперт по софту и ИИ. Твоя задача: проанализировать текст и вернуть результат СТРОГО в формате JSON на РУССКОМ языке.
    
    ЗАДАНИЕ:
    1. title: Придумай короткий яркий заголовок (без слова "Заголовок").
    2. summary: Напиши 2-3 предложения о смысле текста.
    3. apps: Найди все упомянутые сервисы, программы или нейросети.
    
    СТРУКТУРА JSON:
    {
      "title": "...",
      "summary": "...",
      "apps": [
        {
          "name": "Название",
          "category": "LLM|Дизайн|Автоматизация|Другое",
          "shortDescription": "1 предложение",
          "detailedDescription": "1 абзац о пользе",
          "features": ["функция 1", "функция 2"],
          "url": "https://...",
          "pricing": "free|paid"
        }
      ]
    }

    ТЕКСТ:
    """
    ${text.substring(0, 8000)}
    """
    `;

  try {
    const rawJson = await askGemini(prompt, true);
    const parsed = JSON.parse(rawJson);

    return {
      title: cleanTitle(parsed.title || ""),
      summary: parsed.summary || "Анализ завершен.",
      apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      isFallback: false
    };
  } catch (e: any) {
    console.error("[Analyzer Fail]:", e.message);

    // Manual extraction fallback
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    const autoTitle = cleanTitle(lines[0] || "Новый пост");

    return {
      title: autoTitle,
      summary: "Краткий обзор временно недоступен — выполняется повторная попытка анализа.",
      apps: [],
      isFallback: true
    };
  }
}
