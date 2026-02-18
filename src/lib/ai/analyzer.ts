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
  title?: string;
  isFallback?: boolean;
}

/** Robust JSON extraction */
function extractJson(text: string): any {
  // 1. Remove markdown backticks if any
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // 2. Find the first '{' and the last '}'
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) throw new Error("No JSON object found in response");

  const jsonStr = cleaned.substring(start, end + 1);
  return JSON.parse(jsonStr);
}

export async function analyzeContent(text: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze the following technical or software-related content and provide a structured summary in Russian.
    
    YOUR TASKS (Output in RUSSIAN):
    1. title: Create a short, engaging headline (no labels like "Title:").
    2. summary: Write 2-3 sentences summarizing the value or news.
    3. apps: Extract ALL software, AI tools, services, or websites mentioned.
    
    For each app/tool:
    - name: Name of the tool.
    - category: Choose from: [LLM, Vibe Coding, Design, Automation, Image Generation, Other].
    - shortDescription: 1 concise sentence.
    - detailedDescription: 1-2 detailed paragraphs about features and benefits.
    - features: Array of 3-5 strings.
    - url: Website URL (if found).
    - pricing: "free", "paid", or "freemium".
    
    FORMAT: Respond ONLY with a valid JSON object. No preamble, no post-text.
    
    CONTENT:
    """
    ${text}
    """
    
    JSON STRUCTURE EXAMPLE:
    {
        "title": "...",
        "summary": "...",
        "apps": [
            {
                "name": "...",
                "category": "...",
                "shortDescription": "...",
                "detailedDescription": "...",
                "features": ["...", "..."],
                "url": "...",
                "pricing": "...",
                "hasMcp": false,
                "hasApi": false
            }
        ]
    }
    `;

  try {
    const rawContent = await askGemini(prompt);
    const parsed = extractJson(rawContent);

    return {
      title: parsed.title || "",
      summary: parsed.summary || "Анализ выполнен.",
      apps: parsed.apps || [],
      isFallback: false
    };
  } catch (e: any) {
    console.error("[Analyzer Fail]:", e.message);

    // Context-aware basic fallback
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    return {
      title: (lines[0] || "Новый пост").replace(/^Title:\s*/i, ""),
      summary: "Краткое описание временно недоступно.",
      apps: [],
      isFallback: true
    };
  }
}
