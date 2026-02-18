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

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  if (!text || text.trim().length < 5) {
    return { title: "Новый пост", summary: "Описание отсутствует", apps: [], isFallback: true };
  }

  // Aggressive reasoning prompt
  const prompt = `
    Analyze this message and extract all software products or web services mentioned.
    
    INSTRUCTIONS:
    - Step 1: Identify all tools, neuro-networks, mobile apps, or sites.
    - Step 2: Extract features and pricing for each.
    - Step 3: Write a 3-sentence summary in Russian.
    - Step 4: Create a short Russian title.
    - Final Output: Send ONLY a JSON object.

    OUTPUT FIELDS (all strings in Russian):
    - title: Catchy headline.
    - summary: Helpful summary.
    - apps: Array of tools. Each tool needs: name, category, shortDescription, detailedDescription, features (min 3), url, pricing.

    TEXT:
    """
    ${text.substring(0, 10000)}
    """
    `;

  try {
    const rawJson = await askGemini(prompt, true);
    const parsed = JSON.parse(rawJson);

    return {
      title: (parsed.title || "").substring(0, 70),
      summary: parsed.summary || "Анализ завершен.",
      apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      isFallback: false
    };
  } catch (error: any) {
    console.error("[Analyzer Fail]:", error.message);

    const firstLine = text.split('\n')[0].replace(/[#*]/g, '').trim().substring(0, 80);
    return {
      title: firstLine || "Новый пост",
      summary: "Краткий обзор временно недоступен.",
      apps: [],
      isFallback: true
    };
  }
}
