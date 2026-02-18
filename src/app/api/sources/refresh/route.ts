import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(_request: Request) {
    const startTime = Date.now();
    const TIME_BUDGET = 55000; // 55s limit

    try {
        const { db } = await import("@/lib/firebase/firebase");
        const { collection, getDocs, query, where, limit } = await import("firebase/firestore");
        const { processSourceUrl } = await import("@/lib/sources/processor");

        console.log("[Refresh] Triggered...");

        // 1. Repair failed items (visible to user)
        const repairQuery = query(
            collection(db, "sources"),
            where("needsRepair", "==", true),
            limit(15)
        );
        const repairSnap = await getDocs(repairQuery);
        console.log(`[Refresh] Repairing ${repairSnap.size} items.`);

        for (const docSnap of repairSnap.docs) {
            if (Date.now() - startTime > TIME_BUDGET) break;
            const data = docSnap.data();
            try {
                await processSourceUrl(data.url, data.sourceType);
            } catch (e: any) {
                console.error("[Refresh] Repair fail:", e.message);
            }
        }

        // 2. Refresh random channels
        const channelsSnap = await getDocs(collection(db, "channels"));
        const channels = channelsSnap.docs
            .map(d => ({ url: d.data().url, type: d.data().sourceType }))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        for (const ch of channels) {
            if (Date.now() - startTime > TIME_BUDGET) break;
            try {
                console.log(`[Refresh] Channel scan: ${ch.url}`);
                await processSourceUrl(ch.url, ch.type);
            } catch (e: any) {
                console.error("[Refresh] Scan fail:", e.message);
            }
        }

        return NextResponse.json({ success: true, duration: Date.now() - startTime });
    } catch (error: any) {
        console.error("[Refresh CRITICAL]:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}
