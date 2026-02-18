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

const RECENT_DAYS_THRESHOLD = 90;

function isRecent(dateStr: string): boolean {
    if (!dateStr) return false;
    const published = new Date(dateStr);
    const now = new Date();
    return Math.abs(now.getTime() - published.getTime()) < (RECENT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
}

async function registerSource(details: any, type: 'youtube' | 'telegram') {
    const isOld = !isRecent(details.publishedAt);
    const sourceId = type === 'youtube' ? `youtube_${details.id}` : `telegram_${details.channelHandle}_${details.id}`;

    const { db } = await import("@/lib/firebase/firebase");
    const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

    // 1. Check existing record
    const sourceRef = doc(db, "sources", sourceId);
    const snap = await getDoc(sourceRef);

    let attempts = 0;
    if (snap.exists()) {
        const d = snap.data();
        attempts = d.repairAttempts || 0;

        // Success case: has apps and no repair flags
        if (d.detectedApps?.length > 0 && !d.needsRepair && !d.isFallback) return;

        // HARD LIMIT: stop after 10 attempts
        if (attempts >= 10) return;

        // OR soft limit: if it was a clean run (not fallback) but found NO apps, give it 3 tries
        if (!d.isFallback && d.detectedApps?.length === 0 && attempts >= 3) return;
    }

    if (isOld && !snap.exists()) return;

    // 2. Perform AI Analysis
    console.log(`[AI SYNC] Processing ${sourceId} (Attempt ${attempts + 1})`);
    const content = type === 'youtube' ? `${details.title}\n\n${details.description}` : details.text;
    const analysis = await analyzeContent(content);

    // 3. Save Data
    const sourceData: any = {
        sourceType: type,
        externalId: details.id,
        title: (analysis.title && analysis.title.length > 5) ? analysis.title : (type === 'youtube' ? details.title : details.text.substring(0, 100)),
        description: type === 'youtube' ? (details.description || "") : details.text,
        aiSummary: analysis.summary || "",
        author: type === 'youtube' ? details.channelTitle : details.channelHandle,
        publishedAt: details.publishedAt,
        url: details.url,
        thumbnailUrl: type === 'youtube' ? details.thumbnailUrl : (details.imageUrl || null),
        detectedApps: analysis.apps || [],
        repairAttempts: attempts + 1,
        isFallback: analysis.isFallback === true,
        // Mark for repair if failed OR if found ZERO apps
        needsRepair: (analysis.isFallback === true || (analysis.apps || []).length === 0) && attempts < 5,
        updatedAt: serverTimestamp()
    };

    if (!snap.exists()) sourceData.createdAt = serverTimestamp();

    await setDoc(sourceRef, sourceData, { merge: true });

    // 4. Also register the channel for future scanning
    if (type === 'youtube' && details.channelId) {
        const chanRef = doc(db, "channels", details.channelId);
        await setDoc(chanRef, {
            title: details.channelTitle,
            url: `https://youtube.com/channel/${details.channelId}`,
            sourceType: 'youtube',
            lastScannedAt: serverTimestamp()
        }, { merge: true });
    } else if (type === 'telegram' && details.channelHandle) {
        const chanRef = doc(db, "channels", `tg_${details.channelHandle}`);
        await setDoc(chanRef, {
            title: details.channelHandle,
            url: `https://t.me/${details.channelHandle}`,
            sourceType: 'telegram',
            lastScannedAt: serverTimestamp()
        }, { merge: true });
    }
}

export async function processSourceUrl(url: string, type?: 'youtube' | 'telegram') {
    let t = type;
    if (!t) {
        if (url.includes("t.me") || url.startsWith("@")) t = "telegram";
        else if (url.includes("youtube.com") || url.includes("youtu.be")) t = "youtube";
    }
    if (!t) return;

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
