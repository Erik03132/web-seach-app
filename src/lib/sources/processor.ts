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

/** Threshold in days for considering a post/video "recent" */
const RECENT_DAYS_THRESHOLD = 60;

function isRecent(dateStr: string): boolean {
    const published = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - published.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= RECENT_DAYS_THRESHOLD;
}

async function registerChannel(title: string, sourceType: 'youtube' | 'telegram', url: string, id?: string) {
    if (!title || !url) return;
    const { db } = await import("@/lib/firebase/firebase");
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

    const docId = id || `${sourceType === 'youtube' ? 'yt' : 'tg'}_${title.replace(/[^\w]/gi, '').toLowerCase()}`;
    await setDoc(doc(db, "channels", docId), {
        title,
        url,
        sourceType,
        lastScannedAt: serverTimestamp()
    }, { merge: true });
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
        // Skip if healthy and has apps
        if (data.detectedApps?.length > 0 && data.needsRepair === false) {
            return { status: "exists", data };
        }
        if (repairAttempts >= 5) return { status: "exists", data };
    }

    console.log(`[AI] Analyzing YouTube: ${details.title}`);
    const textToAnalyze = `Title: ${details.title}\nTags: ${details.tags.join(", ")}\nDescription: ${details.description}`;
    const analysis = await analyzeContent(textToAnalyze);

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
        needsRepair: (analysis.isFallback === true || analysis.apps.length === 0) && repairAttempts < 3,
        createdAt: sourceDoc.exists() ? (sourceDoc.data().createdAt || serverTimestamp()) : serverTimestamp(),
    };

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
        if (data.detectedApps?.length > 0 && data.needsRepair === false) {
            return { status: "exists", data };
        }
        if (repairAttempts >= 5) return { status: "exists", data };
    }

    console.log(`[AI] Analyzing Telegram: ${details.channelHandle}`);
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
        needsRepair: (analysis.isFallback === true || analysis.apps.length === 0) && repairAttempts < 3,
        createdAt: sourceDoc.exists() ? (sourceDoc.data().createdAt || serverTimestamp()) : serverTimestamp(),
    };

    await setDoc(sourceRef, sourceData, { merge: true });
    return { status: "created", data: sourceData };
}

export async function processSourceUrl(url: string, type?: 'youtube' | 'telegram') {
    let detectedType = type;
    if (!detectedType) {
        if (url.includes("t.me") || url.startsWith("@")) detectedType = "telegram";
        else if (url.includes("youtube.com") || url.includes("youtu.be")) detectedType = "youtube";
    }
    if (!detectedType) throw new Error("Unsupported source type");

    if (detectedType === 'youtube') {
        const videoId = extractYoutubeId(url);
        if (videoId) {
            const details = await getYoutubeVideoDetails(videoId);
            if (details) {
                await registerChannel(details.channelTitle, 'youtube', `https://youtube.com/channel/${details.channelId}`, details.channelId);
                return await saveYoutubeVideoToFirestore(details);
            }
        }
        const info = extractChannelInfo(url);
        if (info) {
            const pid = await getChannelUploadsPlaylistId(info);
            if (!pid) throw new Error("Playlist fail");
            const vids = await getPlaylistVideos(pid, 3);
            const results = [];
            for (const v of vids) {
                const res = await saveYoutubeVideoToFirestore(v);
                results.push({ title: v.title, status: res.status });
            }
            // Title for channel is hard to get without extra API call here, use value
            await registerChannel(info.value, 'youtube', url);
            return { type: 'channel', message: "ok", results };
        }
    }

    if (detectedType === 'telegram') {
        const info = extractTelegramInfo(url);
        if (!info) throw new Error("Invalid Telegram URL");

        await registerChannel(info.handle, 'telegram', `https://t.me/${info.handle}`);

        if (info.messageId) {
            const p = await getSingleTelegramPost(info.handle, info.messageId);
            if (p) return await saveTelegramPostToFirestore(p);
        } else {
            const posts = await getRecentTelegramPosts(info.handle, 3);
            const results = [];
            for (const p of posts) {
                const res = await saveTelegramPostToFirestore(p);
                results.push({ title: p.text.substring(0, 30), status: res.status });
            }
            return { type: 'channel', message: "ok", results };
        }
    }
    throw new Error("Processing failed");
}
