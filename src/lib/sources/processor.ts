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

    let currentRepairAttempts = 0;
    if (sourceDoc.exists()) {
        const data = sourceDoc.data();
        currentRepairAttempts = data.repairAttempts || 0;

        // IF we have apps AND no repair flag AND it's not a fallback, we are GOOD.
        if (data.detectedApps?.length > 0 && data.needsRepair === false && !data.isFallback) {
            return { status: "exists", data };
        }
        // IF too many attempts, stop
        if (currentRepairAttempts >= 12) return { status: "exists", data };
    }

    console.log(`[Processor] Analyzing YT: ${details.id} (Attempt ${currentRepairAttempts + 1})`);
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
        repairAttempts: currentRepairAttempts + 1,
        isFallback: analysis.isFallback === true,
        // Mark for repair if failed or no apps (until limit reached)
        needsRepair: (analysis.isFallback === true || analysis.apps.length === 0) && currentRepairAttempts < 5,
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

    let currentRepairAttempts = 0;
    if (sourceDoc.exists()) {
        const data = sourceDoc.data();
        currentRepairAttempts = data.repairAttempts || 0;
        if (data.detectedApps?.length > 0 && data.needsRepair === false && !data.isFallback) {
            return { status: "exists", data };
        }
        if (currentRepairAttempts >= 12) return { status: "exists", data };
    }

    console.log(`[Processor] Analyzing TG: ${details.id} (Attempt ${currentRepairAttempts + 1})`);
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
        repairAttempts: currentRepairAttempts + 1,
        isFallback: analysis.isFallback === true,
        needsRepair: (analysis.isFallback === true || analysis.apps.length === 0) && currentRepairAttempts < 5,
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
