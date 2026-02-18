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
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(cleaned.substring(start, end + 1));
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze this text and return ONLY a JSON object in Russian.
    
    TASKS:
    1. "title": A catchy headline for the post.
    2. "summary": 2-3 sentences of what this is about.
    3. "apps": List of mentioned tools/services.
    
    For each tool: 
    - name, category, shortDescription (1 sentence), detailedDescription (1 paragraph), features (array of strings), url, pricing.

    JSON STRUCTURE:
    {
        "title": "Заголовок",
        "summary": "Краткое описание",
        "apps": [{ "name": "...", "category": "...", "shortDescription": "...", "detailedDescription": "...", "features": ["...", "..."], "url": "...", "pricing": "..." }]
    }

    TEXT TO ANALYZE:
    """
    ${text.substring(0, 4000)}
    """
    `;

  try {
    const raw = await askGemini(prompt);
    const parsed = extractJson(raw);
    return {
      title: parsed.title || "",
      summary: parsed.summary || "",
      apps: parsed.apps || [],
      isFallback: false
    };
  } catch (e: any) {
    console.error("[Analyzer ERROR]:", e.message);
    return {
      title: text.split('\n')[0].substring(0, 80),
      summary: text.substring(0, 200) + "...",
      apps: [],
      isFallback: true
    };
  }
}
