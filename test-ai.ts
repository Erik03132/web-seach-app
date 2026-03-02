import * as dotenv from "dotenv";
import { analyzeContent } from "./src/lib/ai/analyzer";
dotenv.config();

const testText = `
Вышел Recraft V4, нейросеть со вкусом Recraft V4 — полностью переосмысленную модель для генерации изображений, которую делали вместе с дизайнерами, под реальные задачи брендов, кампаний и продакшена.
Не просто «красивые картинки по промпту», а осознанный визуальный выбор: композиция, свет, цвет, текстуры и типографика.
Доступно 2 модели: 
— V4: для быстрых и более дешевых генераций (до 10 секунд) 
— V4 Pro: даёт больше деталей и высокое разрешение под печать, крупные форматы и аккуратный продакшн (до 30 секунд)
`;

async function test() {
    console.log("Testing AI extraction...");
    try {
        const result = await analyzeContent(testText);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
