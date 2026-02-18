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

function extractJson(text: string): any {
  // Attempt to find JSON in the response
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON found in response");
  }

  const jsonStr = text.substring(jsonStart, jsonEnd + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // One last try: remove markdown-like thinking or code blocks manually
    const cleaner = jsonStr
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaner);
  }
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  if (!text || text.trim().length < 10) {
    return { title: "Новый пост", summary: "Описание отсутствует", apps: [], isFallback: true };
  }

  const prompt = `
    Analyze this text and return a JSON object in Russian.
    
    RULES:
    1. Respond ONLY with JSON.
    2. Fields: "title" (catchy, max 60 chars), "summary" (2-3 sentences), "apps" (list of software/AI tools found).
    3. Each app: "name", "category", "shortDescription", "detailedDescription", "features" (array), "url", "pricing".

    TEXT:
    """
    ${text.substring(0, 5000)}
    """
    
    OUTPUT STRUCTURE:
    {
      "title": "Заголовок без лишних слов",
      "summary": "Текст саммари на русском.",
      "apps": []
    }
    `;

  try {
    const rawResponse = await askGemini(prompt);
    const parsed = extractJson(rawResponse);

    return {
      title: (parsed.title || "").replace(/^(title|заголовок):\s*/i, "").trim(),
      summary: parsed.summary || "",
      apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      isFallback: false
    };
  } catch (error: any) {
    console.error("[AI FAIL]:", error.message);

    // Better fallback: extraction from text
    const firstLine = text.split('\n')[0].substring(0, 100).trim();
    return {
      title: firstLine || "Новый пост",
      summary: "Краткое описание временно недоступно.",
      apps: [],
      isFallback: true
    };
  }
}
