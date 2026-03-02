import { askGemini } from "./gemini";

export interface AppRecommendation {
  name: string;
  category: string;
  shortDescription: string;
  features?: string[];
  pricing?: {
    hasFree: boolean;
    freeLimit?: string;
    minPrice?: string;
    hasApi: boolean;
    hasMcp: boolean;
  };
  url?: string;
}

export interface AnalysisResult {
  summary: string;
  apps: AppRecommendation[];
  title?: string;
  isFallback?: boolean;
}

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(заголовок|title|название|тема|новость|обзор):\s*/i, "")
    .replace(/[#*`"']/g, "")
    .trim();
}

function extractJson(text: string): any {
  try {
    const raw = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(raw);
  } catch (e: any) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON not found");
    return JSON.parse(match[0]);
  }
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  const safeText = (text || "").trim();
  if (safeText.length < 10) {
    return { title: "Новый пост", summary: "Нет контента для анализа.", apps: [], isFallback: true };
  }

  const prompt = `
    Ты супер-аналитик нейросетей. Твоя задача: найти все упомянутые сервисы, программы или нейросети.
    
    ДЛЯ КАЖДОГО СЕРВИСА:
    1. Найди 3 главных преимущества.
    2. Узнай про наличие бесплатной версии и её лимиты (дневные/месячные).
    3. Узнай минимальную цену платной подписки.
    4. Проверь наличие API или поддержки MCP (Model Context Protocol).

    ОТДАЙ ТОЛЬКО JSON:
    {
      "title": "Краткий заголовок",
      "summary": "Суть в 2 фразах",
      "apps": [
        {
          "name": "Название",
          "category": "Категория",
          "shortDescription": "Описание 1 фразой",
          "features": ["Фишка 1", "Фишка 2", "Фишка 3"],
          "pricing": {
             "hasFree": true/false,
             "freeLimit": "описание (например: 5 генераций/день)",
             "minPrice": "например: $10/мес",
             "hasApi": true/false,
             "hasMcp": true/false
          },
          "url": "URL или null"
        }
      ]
    }

    ТЕКСТ:
    """
    ${safeText.substring(0, 8000)}
    """
    `;

  try {
    const raw = await askGemini(prompt, true);
    const parsed = extractJson(raw);

    return {
      title: cleanTitle(parsed.title),
      summary: parsed.summary || (safeText.substring(0, 200) + "..."),
      apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      isFallback: false
    };
  } catch (error: any) {
    console.error("[AI-Analyzer] Fail:", error.message);
    return {
      title: cleanTitle(safeText.substring(0, 60)),
      summary: "Анализ временно недоступен.",
      apps: [],
      isFallback: true
    };
  }
}
