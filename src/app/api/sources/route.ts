import { analyzeContent, AppRecommendation } from "@/lib/ai/analyzer";
import { db } from "@/lib/firebase/firebase";
import {
    extractTelegramInfo,
    getRecentTelegramPosts,
    getSingleTelegramPost,
    TelegramPostDetails
} from "@/lib/sources/telegram";
import {
    extractChannelInfo,
    extractYoutubeId,
    getChannelUploadsPlaylistId,
    getPlaylistVideos,
    getYoutubeVideoDetails,
    YoutubeVideoDetails
} from "@/lib/sources/youtube";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// Threshold in days for considering a post/video "recent"
const RECENT_DAYS_THRESHOLD = 60; // Increased from 30

function isRecent(dateStr: string): boolean {
    const published = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - published.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= RECENT_DAYS_THRESHOLD;
}

// Cleanup function to keep only top 200 newest items
async function cleanupOldSources() {
    try {
        console.log("[Cleanup] Starting cleanup of old sources...");
        const q = query(
            collection(db, "sources"),
            orderBy("publishedAt", "desc")
        );

        const snapshot = await getDocs(q);

        // Filter ONLY feed items (youtube/telegram) for cleanup
        const feedDocs = snapshot.docs.filter(doc => {
            const type = doc.data().sourceType;
            return type === "youtube" || type === "telegram";
        });

        const totalFeedDocs = feedDocs.length;
        const FEED_LIMIT = 200; // Increased from 60

        console.log(`[Cleanup] Total feed sources found: ${totalFeedDocs}`);

        if (totalFeedDocs <= FEED_LIMIT) {
            console.log(`[Cleanup] Feed count within limit (${FEED_LIMIT}). No deletion needed.`);
            return;
        }

        const toDelete = feedDocs.slice(FEED_LIMIT); // Keep top 200 feed items, delete rest
        console.log(`[Cleanup] Deleting ${toDelete.length} old feed sources...`);

        const deletePromises = toDelete.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        console.log(`[Cleanup] Successfully deleted ${toDelete.length} old sources.`);
    } catch (error) {
        console.error("[Cleanup] Error cleaning up old sources:", error);
    }
}

async function saveYoutubeVideoToFirestore(details: YoutubeVideoDetails) {
    if (!isRecent(details.publishedAt)) {
        return { status: "skipped_old", title: details.title, date: details.publishedAt };
    }

    const sourceId = `youtube_${details.id}`;
    const sourceRef = doc(db, "sources", sourceId);

    const sourceDoc = await getDoc(sourceRef);
    if (sourceDoc.exists()) {
        return { status: "exists", data: sourceDoc.data(), date: details.publishedAt };
    }

    // AI Analysis
    let detectedApps: AppRecommendation[] = [];
    let aiSummary = "";
    let aiTitle = details.title;

    console.log(`[AI] Analyzing YouTube: ${details.title}`);
    try {
        const textToAnalyze = `Title: ${details.title}\nTags: ${details.tags.join(", ")}\nDescription: ${details.description}`;
        const analysis = await analyzeContent(textToAnalyze);
        detectedApps = analysis.apps || [];
        aiSummary = analysis.summary || "";
        if (analysis.title) aiTitle = analysis.title;
    } catch (e) { console.error("[AI] Error:", e); }

    const sourceData = {
        sourceType: "youtube",
        externalId: details.id,
        title: aiTitle,
        description: details.description || "",
        aiSummary,
        author: details.channelTitle,
        publishedAt: details.publishedAt,
        url: details.url,
        thumbnailUrl: details.thumbnailUrl,
        tags: details.tags || [],
        detectedApps,
        createdAt: serverTimestamp(),
    };

    await setDoc(sourceRef, sourceData);
    return { status: "created", data: sourceData, date: details.publishedAt };
}

async function saveTelegramPostToFirestore(details: TelegramPostDetails) {
    if (!isRecent(details.publishedAt)) {
        return { status: "skipped_old", title: details.text.substring(0, 50), date: details.publishedAt };
    }

    const sourceId = `telegram_${details.channelHandle}_${details.id}`;
    const sourceRef = doc(db, "sources", sourceId);

    const sourceDoc = await getDoc(sourceRef);
    if (sourceDoc.exists()) {
        return { status: "exists", data: sourceDoc.data(), date: details.publishedAt };
    }

    // AI Analysis
    let detectedApps: AppRecommendation[] = [];
    let aiSummary = "";
    let aiTitle = details.text.split('\n')[0].substring(0, 100);

    console.log(`[AI] Analyzing Telegram post from: ${details.channelHandle}`);
    try {
        const analysis = await analyzeContent(details.text);
        detectedApps = analysis.apps || [];
        aiSummary = analysis.summary || "";
        if (analysis.title) aiTitle = analysis.title;
    } catch (e) { console.error("[AI] Error:", e); }

    const sourceData = {
        sourceType: "telegram",
        externalId: details.id,
        title: aiTitle,
        description: details.text,
        aiSummary,
        author: details.channelHandle, // Use handle as author
        publishedAt: details.publishedAt,
        url: details.url,
        thumbnailUrl: details.imageUrl || null,
        tags: [],
        detectedApps,
        createdAt: serverTimestamp(),
    };

    await setDoc(sourceRef, sourceData);
    return { status: "created", data: sourceData, date: details.publishedAt };
}

export async function POST(req: NextRequest) {
    try {
        const { url, type: requestedType } = await req.json();
        if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

        // Auto-detect type if not provided correctly
        let type = requestedType;
        if (url.includes("t.me") || url.startsWith("@")) type = "telegram";
        else if (url.includes("youtube.com") || url.includes("youtu.be")) type = "youtube";

        // --- YOUTUBE ---
        if (type === "youtube") {
            const videoId = extractYoutubeId(url);
            if (videoId) {
                const details = await getYoutubeVideoDetails(videoId);
                if (!details) return NextResponse.json({ error: "Video not found" }, { status: 404 });
                const res = await saveYoutubeVideoToFirestore(details);
                // Attempt cleanup
                await cleanupOldSources();
                return NextResponse.json({ message: res.status, data: (res as any).data, type: "video" }, { status: 201 });
            }

            const channelInfo = extractChannelInfo(url);
            if (channelInfo) {
                const playlistId = await getChannelUploadsPlaylistId(channelInfo);
                if (!playlistId) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
                const videos = await getPlaylistVideos(playlistId, 5);
                const results = [];
                for (const v of videos) {
                    const res = await saveYoutubeVideoToFirestore(v);
                    results.push({
                        id: v.id,
                        status: res.status,
                        title: v.title,
                        url: v.url,
                        aiSummary: (res as any).data?.aiSummary || "",
                        detectedApps: (res as any).data?.detectedApps || []
                    });
                }
                // Save Channel to "channels" collection for Cron
                const channelRef = doc(db, "channels", `yt_${channelInfo.value.replace('@', '')}`);
                await setDoc(channelRef, {
                    url: url, // Use the original URL
                    title: channelInfo.value,
                    sourceType: 'youtube',
                    lastScannedAt: serverTimestamp()
                }, { merge: true });

                // Cleanup after processing channel
                await cleanupOldSources();
                return NextResponse.json({ message: "Processed channel", type: "channel", results }, { status: 201 });
            }
        }

        // --- TELEGRAM ---
        if (type === "telegram") {
            const info = extractTelegramInfo(url);
            if (!info) return NextResponse.json({ error: "Invalid Telegram URL" }, { status: 400 });

            if (info.messageId) {
                // Single post
                const details = await getSingleTelegramPost(info.handle, info.messageId);
                if (!details) return NextResponse.json({ error: "Post not found" }, { status: 404 });
                const res = await saveTelegramPostToFirestore(details);
                // Cleanup
                await cleanupOldSources();
                return NextResponse.json({ message: res.status, data: (res as any).data, type: "video" }, { status: 201 });
            } else {
                // Channel (recent posts)
                const posts = await getRecentTelegramPosts(info.handle, 5);
                const results = [];
                for (const p of posts) {
                    const res = await saveTelegramPostToFirestore(p);
                    results.push({
                        id: p.id,
                        status: res.status,
                        title: p.text.substring(0, 50),
                        url: p.url,
                        aiSummary: (res as any).data?.aiSummary || "",
                        detectedApps: (res as any).data?.detectedApps || []
                    });
                }
                // Save Channel to "channels" collection for Cron
                const channelRef = doc(db, "channels", `tg_${info.handle}`);
                await setDoc(channelRef, {
                    url: `https://t.me/${info.handle}`,
                    title: info.handle,
                    sourceType: 'telegram',
                    lastScannedAt: serverTimestamp()
                }, { merge: true });

                // Cleanup
                await cleanupOldSources();
                return NextResponse.json({ message: "Processed TG channel", type: "channel", results }, { status: 201 });
            }
        }

        return NextResponse.json({ error: "Unsupported source" }, { status: 400 });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
