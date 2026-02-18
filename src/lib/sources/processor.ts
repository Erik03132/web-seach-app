import { analyzeContent } from "../ai/analyzer";
import {
    extractTelegramInfo,
    getRecentTelegramPosts,
    getSingleTelegramPost,
    TelegramPostDetails
} from "./telegram";
import {
    extractChannelInfo,
    extractYoutubeId,
    getChannelUploadsPlaylistId,
    getPlaylistVideos,
    getYoutubeVideoDetails,
    YoutubeVideoDetails
} from "./youtube";

const RECENT_DAYS_THRESHOLD = 90;

function isRecent(dateStr: string): boolean {
    const published = new Date(dateStr);
    const now = new Date();
    return Math.abs(now.getTime() - published.getTime()) < (RECENT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
}

async function registerChannel(title: string, sourceType: 'youtube' | 'telegram', url: string, id?: string) {
    if (!title || !url) return;
    const { db } = await import("@/lib/firebase/firebase");
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const docId = id || `${sourceType === 'youtube' ? 'yt' : 'tg'}_${title.replace(/[^\w]/gi, '').toLowerCase().substring(0, 40)}`;
    await setDoc(doc(db, "channels", docId), { title, url, sourceType, lastScannedAt: serverTimestamp() }, { merge: true });
}

async function saveYoutubeVideoToFirestore(details: YoutubeVideoDetails) {
    if (!isRecent(details.publishedAt)) return { status: "skipped_old" };

    const { db } = await import("@/lib/firebase/firebase");
    const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

    const sourceId = `youtube_${details.id}`;
    const sourceRef = doc(db, "sources", sourceId);
    const sourceDoc = await getDoc(sourceRef);

    let repairAttempts = 0;
    if (sourceDoc.exists()) {
        const data = sourceDoc.data();
        repairAttempts = data.repairAttempts || 0;

        // Success case: has apps and no repair flags
        if (data.detectedApps?.length > 0 && !data.needsRepair && !data.isFallback) {
            return { status: "exists", data };
        }

        // Stop if too many attempts
        if (repairAttempts >= 10) return { status: "exists", data };

        // If it was a clean run (not fallback) but found NO apps, give it at most 3 total tries
        if (!data.isFallback && data.detectedApps?.length === 0 && repairAttempts >= 3) {
            return { status: "exists", data };
        }
    }

    console.log(`[Processor] AI-Sync YT: ${details.id} (Att: ${repairAttempts + 1})`);
    const analysis = await analyzeContent(`${details.title}\n\n${details.description}`);

    const sourceData: any = {
        sourceType: "youtube",
        externalId: details.id,
        title: analysis.title || details.title,
        description: details.description || "",
        aiSummary: analysis.summary || "",
        author: details.channelTitle,
        publishedAt: details.publishedAt,
        url: details.url,
        thumbnailUrl: details.thumbnailUrl,
        tags: details.tags || [],
        detectedApps: analysis.apps || [],
        repairAttempts: repairAttempts + 1,
        isFallback: analysis.isFallback === true,
        // Mark for repair if failed OR if found ZERO apps (we want cards!)
        needsRepair: (analysis.isFallback === true || (analysis.apps || []).length === 0) && repairAttempts < 4,
    };

    if (!sourceDoc.exists()) sourceData.createdAt = serverTimestamp();

    await setDoc(sourceRef, sourceData, { merge: true });
    return { status: "created", data: sourceData };
}

async function saveTelegramPostToFirestore(details: TelegramPostDetails) {
    if (!isRecent(details.publishedAt)) return { status: "skipped_old" };

    const { db } = await import("@/lib/firebase/firebase");
    const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

    const sourceId = `telegram_${details.channelHandle}_${details.id}`;
    const sourceRef = doc(db, "sources", sourceId);
    const sourceDoc = await getDoc(sourceRef);

    let repairAttempts = 0;
    if (sourceDoc.exists()) {
        const data = sourceDoc.data();
        repairAttempts = data.repairAttempts || 0;

        if (data.detectedApps?.length > 0 && !data.needsRepair && !data.isFallback) {
            return { status: "exists", data };
        }
        if (repairAttempts >= 10) return { status: "exists", data };
        if (!data.isFallback && data.detectedApps?.length === 0 && repairAttempts >= 3) {
            return { status: "exists", data };
        }
    }

    console.log(`[Processor] AI-Sync TG: ${details.id} (Att: ${repairAttempts + 1})`);
    const analysis = await analyzeContent(details.text);

    const sourceData: any = {
        sourceType: "telegram",
        externalId: details.id,
        title: analysis.title || details.text.split('\n')[0].substring(0, 100),
        description: details.text,
        aiSummary: analysis.summary || "",
        author: details.channelHandle,
        publishedAt: details.publishedAt,
        url: details.url,
        thumbnailUrl: details.imageUrl || null,
        tags: [],
        detectedApps: analysis.apps || [],
        repairAttempts: repairAttempts + 1,
        isFallback: analysis.isFallback === true,
        needsRepair: (analysis.isFallback === true || (analysis.apps || []).length === 0) && repairAttempts < 4,
    };

    if (!sourceDoc.exists()) sourceData.createdAt = serverTimestamp();

    await setDoc(sourceRef, sourceData, { merge: true });
    return { status: "created", data: sourceData };
}

export async function processSourceUrl(url: string, type?: 'youtube' | 'telegram') {
    let t = type;
    if (!t) {
        if (url.includes("t.me") || url.startsWith("@")) t = "telegram";
        else if (url.includes("youtube.com") || url.includes("youtu.be")) t = "youtube";
    }
    if (!t) return;

    if (t === 'youtube') {
        const vid = extractYoutubeId(url);
        if (vid) {
            const d = await getYoutubeVideoDetails(vid);
            if (d) {
                await registerChannel(d.channelTitle, 'youtube', `https://youtube.com/channel/${d.channelId}`, d.channelId);
                return await saveYoutubeVideoToFirestore(d);
            }
        }
        const info = extractChannelInfo(url);
        if (info) {
            const pid = await getChannelUploadsPlaylistId(info);
            const vids = pid ? await getPlaylistVideos(pid, 3) : [];
            for (const v of vids) await saveYoutubeVideoToFirestore(v);
            await registerChannel(info.value, 'youtube', url);
            return { message: "ok" };
        }
    }

    if (t === 'telegram') {
        const info = extractTelegramInfo(url);
        if (info) {
            await registerChannel(info.handle, 'telegram', `https://t.me/${info.handle}`);
            if (info.messageId) {
                const p = await getSingleTelegramPost(info.handle, info.messageId);
                if (p) return await saveTelegramPostToFirestore(p);
            } else {
                const posts = await getRecentTelegramPosts(info.handle, 3);
                for (const p of posts) await saveTelegramPostToFirestore(p);
                return { message: "ok" };
            }
        }
    }
}
