import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeContent } from "../src/lib/ai/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function test() {
    console.log("Testing Gemini AI Analysis...");
    console.log("Key exists:", !!process.env.GEMINI_API_KEY);

    const testText = `
    Сегодня вышла новая версия Claude Code 1.1. 
    Это революционный инструмент для разработчиков. 
    Также упомянули Recraft V4 для генерации изображений и сервис Vercel для деплоя. 
    Все инструменты очень крутые.
    `;

    try {
        const result = await analyzeContent(testText);
        console.log("--- RESULT ---");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("TEST FAILED:", e);
    }
}

test();
