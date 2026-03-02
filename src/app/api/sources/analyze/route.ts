import { analyzeContent } from "@/lib/ai/analyzer";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const sourceRef = doc(db, "sources", id);
        const snap = await getDoc(sourceRef);

        if (!snap.exists()) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const data = snap.data();
        // Use full text for analysis
        const contentToAnalyze = `AUTHOR: ${data.author}\nTITLE: ${data.title}\nCONTENT: ${data.description || ""}`;

        console.log(`[MANUAL ANALYZE] Starting for ${id}...`);
        const analysis = await analyzeContent(contentToAnalyze);

        console.log(`[MANUAL ANALYZE] Result for ${id}:`, {
            appsFound: analysis.apps?.length || 0,
            isFallback: analysis.isFallback
        });

        // Even if AI found nothing, we update to clear old fallback flags
        await setDoc(sourceRef, {
            title: analysis.title || data.title,
            aiSummary: analysis.summary,
            detectedApps: analysis.apps || [],
            isFallback: (analysis.apps || []).length === 0 && analysis.isFallback,
            updatedAt: serverTimestamp(),
            needsRepair: false
        }, { merge: true });

        return NextResponse.json({
            success: true,
            appsCount: (analysis.apps || []).length,
            apps: analysis.apps || []
        });
    } catch (error: any) {
        console.error("[MANUAL ANALYZE] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
