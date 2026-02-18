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

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(заголовок|title|название|тема|новость):\s*/i, "")
    .replace(/[#*`]/g, "")
    .trim();
}

function extractJson(text: string): any {
  try {
    // Remove thinking or preamble
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON Object not found in text");
    return JSON.parse(match[0]);
  } catch (e: any) {
    console.error("[Analyzer] JSON Extract Fail:", e.message);
    throw e;
  }
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  if (!text || text.trim().length < 5) {
    return { title: "Новый пост", summary: "Описание отсутствует", apps: [], isFallback: true };
  }

  const prompt = `
    Analyze this text and return a JSON object in Russian.
    
    REQUIRED JSON FIELDS:
    1. "title": Catchy headline (max 60 chars, no "Title:" label).
    2. "summary": 2-3 sentences summarizing the importance.
    3. "apps": List of tools/AI/services found. 
       Each app field: name, category, shortDescription, detailedDescription, features (array), url, pricing.

    TEXT FOR ANALYSIS:
    """
    ${text.substring(0, 7000)}
    """
    `;

  try {
    // isJson = true enables responseMimeType: application/json
    const raw = await askGemini(prompt, true);
    const parsed = extractJson(raw);

    return {
      title: cleanTitle(parsed.title),
      summary: parsed.summary || "Анализ завершен.",
      apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      isFallback: false
    };
  } catch (error: any) {
    console.error("[AI-Analyzer] Critical Failure:", error.message);

    // Robust basic fallback
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    return {
      title: cleanTitle(lines[0] || "Новый пост"),
      summary: "Краткий обзор временно недоступен — сервис аналитики обновляется.",
      apps: [],
      isFallback: true
    };
  }
}
