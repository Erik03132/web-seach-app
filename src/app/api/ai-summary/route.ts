import { generateSearchSummary } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const summary = await generateSearchSummary(query);

        return NextResponse.json({ summary });
    } catch (error) {
        console.error("AI Summary API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
