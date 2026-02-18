import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

async function testAI() {
    console.log("Starting Local AI Test...");
    console.log("API Key present:", !!apiKey);

    if (!apiKey) {
        console.error("ERROR: GEMINI_API_KEY is not in .env");
        return;
    }

    const prompt = `
    Analyze software/tech content and return ONLY JSON in Russian.
    
    JSON STRUCTURE (Strictly):
    {
      "title": "Short headline",
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
    Сегодня вышла новая версия Claude Code 1.1. 
    Это революционный инструмент для разработчиков. 
    Также упомянули Recraft V4 для генерации изображений и сервис Vercel для деплоя. 
    Все инструменты очень крутые.
    """
    `;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
            }
        });

        console.log("Calling Gemini API...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("--- RAW RESPONSE ---");
        console.log(text);

        const parsed = JSON.parse(text);
        console.log("--- PARSED SUCCESS ---");
        console.log("Title:", parsed.title);
        console.log("Apps found:", parsed.apps?.length);
    } catch (error) {
        console.error("!!! API CALL FAILED !!!");
        console.error(error.message);
        if (error.stack) console.error(error.stack);
    }
}

testAI();
