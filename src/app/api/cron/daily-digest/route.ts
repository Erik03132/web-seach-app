import { db } from "@/lib/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

// Re-use logic from sources API via internal fetch or direct function calls
// To avoid duplication, we should probably extract the "processUrl" logic to a lib function
// For now, we will call the publicly available API capability or duplicate the minimal logic safely.
// Better approach: Extract the processing logic from /api/sources/route.ts into a shared lib function.

// However, since we can't easily refactor the large route file right now without risk, 
// we will fetch the list of channels and call the processing for each.

export async function GET(request: Request) {
    // Verify Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log("[Cron] Starting Daily Digest...");

        // 1. Fetch all tracked channels
        const channelsRef = collection(db, "channels"); // We need to ensure this collection exists/is populated
        const snapshot = await getDocs(channelsRef);

        const channels = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        console.log(`[Cron] Found ${channels.length} channels to process.`);

        const results = [];

        // 2. Process each channel
        // We limit to 5 channels per cron run to avoid timeouts on Vercel Hobby plan (10s limit usually, optimization needed)
        // Or we use Vercel's maxDuration config if on Pro.
        // For MVP, we process a small batch.

        const BATCH_SIZE = 5;
        const currentBatch = channels.slice(0, BATCH_SIZE); // TODO: Implement rotation logic if needed

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        for (const channel of currentBatch) {
            try {
                console.log(`[Cron] Processing ${channel.title} (${channel.url})...`);

                // We call our own API to reuse the robust logic there (fetching, parsing, AI, saving)
                const res = await fetch(`${baseUrl}/api/sources`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: channel.url })
                });

                const data = await res.json();
                results.push({ channel: channel.title, status: res.status, data });

            } catch (err) {
                console.error(`[Cron] Failed to process ${channel.title}`, err);
                results.push({ channel: channel.title, status: 'error', error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            details: results
        });

    } catch (error: any) {
        console.error("[Cron] Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
