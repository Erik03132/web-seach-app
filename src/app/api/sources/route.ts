import { processSourceUrl } from "@/lib/sources/processor";
import { NextRequest, NextResponse } from "next/server";

/**
 * Main API route for processing YouTube/Telegram sources.
 * It handles both single URLs and channels.
 */
export async function POST(req: NextRequest) {
    try {
        const { url, type } = await req.json();
        if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

        console.log(`[API] Processing: ${url}`);
        const result = await processSourceUrl(url, type);

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("[API Error]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
