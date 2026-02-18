import { analyzeContent } from "../ai/analyzer";
import {
    extractTelegramInfo,
    getRecentTelegramPosts,
    getSingleTelegramPost
} from "./telegram";
import {
    extractChannelInfo,
    extractYoutubeId,
    getChannelUploadsPlaylistId,
    getPlaylistVideos,
    getYoutubeVideoDetails
} from "./youtube";

const RECENT_DAYS_THRESHOLD = 60;

function isRecent(dateStr: string): boolean {
    const published = new Date(dateStr);
    const now = new Date();
    return Math.abs(now.getTime() - published.getTime()) < (RECENT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
}

async function saveToFirestore(id: string, data: any) {
    const { db } = await import("@/lib/firebase/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "sources", id), data, { merge: true });
}

async function registerSource(details: any, type: 'youtube' | 'telegram') {
    const isOld = !isRecent(details.publishedAt);
    const sourceId = type === 'youtube' ? `youtube_${details.id}` : `telegram_${details.channelHandle}_${details.id}`;

    const { db } = await import("@/lib/firebase/firebase");
    const { doc, getDoc, serverTimestamp } = await import("firebase/firestore");

    const sourceRef = doc(db, "sources", sourceId);
    const snap = await getDoc(sourceRef);

    let attempts = 0;
    if (snap.exists()) {
        const d = snap.data();
        attempts = d.repairAttempts || 0;
        // Если всё ок — скипаем
        if (d.detectedApps?.length > 0 && !d.needsRepair && !d.isFallback) return;
        if (attempts >= 10) return;
    }

    if (isOld && !snap.exists()) return;

    console.log(`[AI SYNC] Processing ${sourceId} (Attempt ${attempts + 1})`);
    const content = type === 'youtube' ? `${details.title}\n\n${details.description}` : details.text;
    const analysis = await analyzeContent(content);

    const sourceData: any = {
        sourceType: type,
        externalId: details.id,
        title: analysis.title || (type === 'youtube' ? details.title : details.text.substring(0, 70)),
        description: type === 'youtube' ? (details.description || "") : details.text,
        aiSummary: analysis.summary || "",
        author: type === 'youtube' ? details.channelTitle : details.channelHandle,
        publishedAt: details.publishedAt,
        url: details.url,
        thumbnailUrl: type === 'youtube' ? details.thumbnailUrl : (details.imageUrl || null),
        detectedApps: analysis.apps || [],
        repairAttempts: attempts + 1,
        isFallback: analysis.isFallback === true,
        needsRepair: (analysis.isFallback === true || (analysis.apps || []).length === 0) && attempts < 5,
        updatedAt: serverTimestamp()
    };

    if (!snap.exists()) sourceData.createdAt = serverTimestamp();
    await saveToFirestore(sourceId, sourceData);
}

export async function processSourceUrl(url: string, type?: 'youtube' | 'telegram') {
    const t = type || (url.includes("youtube.com") ? "youtube" : "telegram");

    if (t === 'youtube') {
        const id = extractYoutubeId(url);
        if (id) {
            const d = await getYoutubeVideoDetails(id);
            if (d) await registerSource(d, 'youtube');
        } else {
            const info = extractChannelInfo(url);
            const pid = info ? await getChannelUploadsPlaylistId(info) : null;
            if (pid) {
                const vids = await getPlaylistVideos(pid, 3);
                for (const v of vids) await registerSource(v, 'youtube');
            }
        }
    } else {
        const info = extractTelegramInfo(url);
        if (info) {
            if (info.messageId) {
                const p = await getSingleTelegramPost(info.handle, info.messageId);
                if (p) await registerSource(p, 'telegram');
            } else {
                const posts = await getRecentTelegramPosts(info.handle, 3);
                for (const p of posts) await registerSource(p, 'telegram');
            }
        }
    }
}
