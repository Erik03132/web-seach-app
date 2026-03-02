import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { db } = await import("@/lib/firebase/firebase");
        const { collection, getDocs, orderBy, query } = await import("firebase/firestore");

        const channelsRef = collection(db, "channels");
        const snapshot = await getDocs(query(channelsRef, orderBy("lastScannedAt", "desc")));

        const channels = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                lastScannedAt: data.lastScannedAt?.toDate ? data.lastScannedAt.toDate().toISOString() : null
            };
        });

        return NextResponse.json(channels);
    } catch (error: any) {
        return NextResponse.json({ error: "Fetch Fail", message: error.message }, { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const { action } = await req.json();
        const { db } = await import("@/lib/firebase/firebase");
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

        if (action === "restore_defaults") {
            const defaults = [
                { id: "tg_bugfeature", title: "Bug Feature", url: "https://t.me/bugfeature", sourceType: "telegram" },
                { id: "tg_vibecoding", title: "Vibe Coding", url: "https://t.me/vibecoding_tg", sourceType: "telegram" },
                { id: "tg_neuro_channel", title: "Нейросети и AI", url: "https://t.me/neuro_channel", sourceType: "telegram" },
                { id: "tg_dz_v_obshestve", title: "Deep-Dive в ИИ", url: "https://t.me/ai_newz", sourceType: "telegram" },
                { id: "tg_techsparks", title: "TechSparks", url: "https://t.me/tech_sparks", sourceType: "telegram" },
                { id: "tg_denis_sexy_it", title: "Denis SEO/IT", url: "https://t.me/denissexyit", sourceType: "telegram" },
                { id: "yt_antigravity", title: "AntiGravity", url: "https://www.youtube.com/@AntiGravity_AI", sourceType: "youtube" },
                { id: "yt_droider", title: "Droider", url: "https://www.youtube.com/@Droider", sourceType: "youtube" },
                { id: "yt_wylsacom", title: "Wylsacom", url: "https://www.youtube.com/@Wylsacom", sourceType: "youtube" },
                { id: "yt_ай_ти_борода", title: "АйТи Борода", url: "https://www.youtube.com/@itbeard", sourceType: "youtube" }
            ];

            for (const ch of defaults) {
                await setDoc(doc(db, "channels", ch.id), {
                    ...ch,
                    lastScannedAt: serverTimestamp()
                }, { merge: true });
            }
            return NextResponse.json({ success: true, count: defaults.length });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const { db } = await import("@/lib/firebase/firebase");
        const { doc, deleteDoc } = await import("firebase/firestore");

        await deleteDoc(doc(db, "channels", id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Delete Fail" }, { status: 200 });
    }
}
