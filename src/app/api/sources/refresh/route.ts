import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(_request: Request) {
    const startTime = Date.now();
    const TIME_BUDGET = 45000; // 45s - trying to fit more work before Vercel timeout

    try {
        const { db } = await import("@/lib/firebase/firebase");
        const { collection, getDocs, query, where, limit, orderBy } = await import("firebase/firestore");
        const { processSourceUrl } = await import("@/lib/sources/processor");

        console.log("[Refresh] Massive Scan Triggered...");

        // 1. Prioritize Repairs (fix ugly колесики)
        const repairQuery = query(
            collection(db, "sources"),
            where("needsRepair", "==", true),
            limit(10)
        );
        const repairSnap = await getDocs(repairQuery);
        console.log(`[Refresh] Found ${repairSnap.size} items for repair.`);

        for (const docSnap of repairSnap.docs) {
            if (Date.now() - startTime > TIME_BUDGET) break;
            const data = docSnap.data();
            try {
                await processSourceUrl(data.url, data.sourceType);
            } catch (e) { }
        }

        // 2. Scan ALL channels that haven't been scanned in the last 2 hours
        // or just pick a larger random set if we have many channels now.
        const channelsSnap = await getDocs(collection(db, "channels"));
        let channels = channelsSnap.docs.map(d => ({ url: d.data().url, type: d.data().sourceType }));

        // Randomize so we eventually cover everything
        channels = channels.sort(() => 0.5 - Math.random());

        console.log(`[Refresh] Scanning pool of ${channels.length} channels.`);

        let processedCount = 0;
        for (const ch of channels) {
            // If we've processed 6 channels OR time is running out, stop
            if (processedCount >= 6 || (Date.now() - startTime > TIME_BUDGET)) break;

            try {
                console.log(`[Refresh] Scanning: ${ch.url}`);
                await processSourceUrl(ch.url, ch.type);
                processedCount++;
            } catch (e) { }
        }

        return NextResponse.json({
            success: true,
            channelsScanned: processedCount,
            duration: Date.now() - startTime
        });

    } catch (error: any) {
        console.error("[Refresh Error]:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}
