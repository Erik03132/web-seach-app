/**
 * Common entry point for Gemini calls.
 * Uses RAW fetch instead of SDK for maximum reliability in Vercel Edge/Serverless environments.
 */
export async function askGemini(prompt: string, isJson: boolean = false): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("[Gemini] API Key Missing from Environment");
        throw new Error("GEMINI_API_KEY_NOT_FOUND");
    }

    // Using gemini-1.5-flash which is fastest and supports JSON output well
    // v1beta because JSON schema/mode is often more reliable there
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: isJson ? "application/json" : "text/plain",
            temperature: 0.1,
            maxOutputTokens: 2048,
        }
    };

    let lastError: any;
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`[Gemini] Requesting (Attempt ${i + 1})...`);

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.status === 200 && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }

            // Error extraction
            const errMsg = data.error?.message || JSON.stringify(data);
            console.error(`[Gemini API Error] status=${res.status}:`, errMsg);

            throw new Error(`Gemini API Error (${res.status}): ${errMsg}`);

        } catch (error: any) {
            lastError = error;
            console.warn(`[Gemini Fetch Attempt ${i + 1} failed]: ${error.message}`);

            // Wait with backoff
            if (i < 2) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        }
    }

    throw lastError;
}

export async function generateSearchSummary(query: string): Promise<string> {
    try {
        const prompt = `Ты бизнес-ассистент. Пользователь ищет: "${query}". Дай краткий ответ в 2 предложениях на русском.`;
        return await askGemini(prompt, false);
    } catch (e) {
        return "Не удалось получить ответ от ИИ.";
    }
}
