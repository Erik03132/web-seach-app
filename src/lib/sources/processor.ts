import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { analyzeContent } from "../ai/analyzer";
import { db } from "../firebase/firebase";
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

const RECENT_DAYS_THRESHOLD = 1095;

function isRecent(dateStr: string): boolean {
    if (!dateStr) return false;
    const published = new Date(dateStr);
    const now = new Date();
    return Math.abs(now.getTime() - published.getTime()) < (RECENT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
}

async function registerChannel(details: any, type: 'youtube' | 'telegram') {
    try {
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
    } catch (e: any) {
        console.warn("[Register Channel] Failed:", e.message);
    }
}

async function registerSource(details: any, type: 'youtube' | 'telegram') {
    // A. Always try to register/update the channel first
    await registerChannel(details, type);

    const isOld = !isRecent(details.publishedAt);
    const sourceId = type === 'youtube' ? `youtube_${details.id}` : `telegram_${details.channelHandle}_${details.id}`;

    console.log(`[PROCESSOR] Checking source: ${sourceId}, publishedAt: ${details.publishedAt}, isOld: ${isOld}`);

    // 1. Check existing record
    const sourceRef = doc(db, "sources", sourceId);
    const snap = await getDoc(sourceRef);

    let attempts = 0;
    if (snap.exists()) {
        const d = snap.data();
        attempts = d.repairAttempts || 0;

        // Success case: has apps and no repair flags
        if (d.detectedApps?.length > 0 && !d.needsRepair && !d.isFallback) {
            console.log(`[PROCESSOR] Source ${sourceId} already exists and is fine.`);
            return;
        }

        // HARD LIMIT: stop after 5 attempts to avoid infinite loops
        if (attempts >= 5) {
            if (d.needsRepair) {
                await setDoc(sourceRef, { needsRepair: false }, { merge: true });
            }
            return;
        }
    }

    // Skip OLD videos unless they already exist (keep historical data if we have it)
    if (isOld && !snap.exists()) {
        console.warn(`[PROCESSOR] Skipping OLD source: ${sourceId} (${details.publishedAt})`);
        return;
    }

    // 2. Perform AI Analysis
    console.log(`[AI SYNC] Processing ${sourceId} (Attempt ${attempts + 1})`);
    const content = type === 'youtube' ? `${details.title}\n\n${details.description}` : details.text;
    const analysis = await analyzeContent(content);

    // 3. Save Data - convert publishedAt string to Timestamp for proper sorting
    let publishedAtTimestamp: Timestamp | null = null;
    if (details.publishedAt) {
        const date = new Date(details.publishedAt);
        if (!isNaN(date.getTime())) {
            publishedAtTimestamp = Timestamp.fromDate(date);
        }
    }

    const sourceData: any = {
        sourceType: type,
        externalId: details.id,
        title: (analysis.title && analysis.title.length > 5) ? analysis.title : (type === 'youtube' ? details.title : (details.text || "").substring(0, 100)),
        description: type === 'youtube' ? (details.description || "") : details.text,
        aiSummary: analysis.summary || "",
        author: type === 'youtube' ? details.channelTitle : details.channelHandle,
        publishedAt: publishedAtTimestamp,
        publishedAtISO: details.publishedAt, // Keep original ISO string for display
        url: details.url,
        thumbnailUrl: type === 'youtube' ? details.thumbnailUrl : (details.imageUrl || null),
        detectedApps: analysis.apps || [],
        repairAttempts: attempts + 1,
        isFallback: analysis.isFallback === true,
        needsRepair: (analysis.isFallback === true || (analysis.apps || []).length === 0) && (attempts + 1) < 5,
        updatedAt: serverTimestamp()
    };

    if (!snap.exists()) sourceData.createdAt = serverTimestamp();
    await setDoc(sourceRef, sourceData, { merge: true });
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
            return { message: "ok" };
        } else {
            const info = extractChannelInfo(url);
            const pid = info ? await getChannelUploadsPlaylistId(info) : null;
            if (pid) {
                const vids = await getPlaylistVideos(pid, 3);
                for (const v of vids) await registerSource(v, 'youtube');
                return { message: "ok", count: vids.length };
            }
        }
    } else {
        const info = extractTelegramInfo(url);
        if (info) {
            if (info.messageId) {
                const p = await getSingleTelegramPost(info.handle, info.messageId);
                if (p) await registerSource(p, 'telegram');
                return { message: "ok" };
            } else {
                const posts = await getRecentTelegramPosts(info.handle, 3);
                for (const p of posts) await registerSource(p, 'telegram');
                return { message: "ok", count: posts.length };
            }
        }
    }
}
