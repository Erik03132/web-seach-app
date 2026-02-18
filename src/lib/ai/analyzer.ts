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
    .replace(/^(заголовок|title|название):\s*/i, "")
    .replace(/[#*`]/g, "")
    .trim();
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  if (!text || text.length < 5) {
    return { title: "Новый пост", summary: "Нет данных", apps: [], isFallback: true };
  }

  const prompt = `
    Analyze software/tech content and return ONLY JSON in Russian.
    
    JSON STRUCTURE (Strictly):
    {
      "title": "Short headline (no 'Title:' label)",
      "summary": "2-3 sentences max",
      "apps": [
        {
          "name": "App name",
          "category": "LLM|Design|Automation|Other",
          "shortDescription": "One sentence",
          "detailedDescription": "One paragraph",
          "features": ["feature 1", "feature 2"],
          "url": "https://...",
          "pricing": "free|paid"
        }
      ]
    }

    CONTENT TO ANALYZE:
    """
    ${text.substring(0, 7000)}
    """
    `;

  try {
    const rawJson = await askGemini(prompt, true);
    const parsed = JSON.parse(rawJson);

    return {
      title: cleanTitle(parsed.title || ""),
      summary: parsed.summary || "",
      apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      isFallback: false
    };
  } catch (e: any) {
    console.error("AI Analysis failed:", e.message);

    // Manual extraction fallback
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    return {
      title: cleanTitle(lines[0] || "Новый пост"),
      summary: "Краткий обзор временно недоступен.",
      apps: [],
      isFallback: true
    };
  }
}
