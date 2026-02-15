
export interface YoutubeVideoDetails {
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    thumbnailUrl: string;
    tags: string[];
    url: string;
}

/**
 * Extracts the YouTube Video ID from various URL formats.
 */
export function extractYoutubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Extracts the YouTube Channel Handle or ID from various URL formats.
 * Supports:
 * - youtube.com/@Handle
 * - youtube.com/channel/CHANNEL_ID
 * - youtube.com/c/CustomUrl
 * - youtube.com/user/Username
 */
export function extractChannelInfo(url: string): { type: 'handle' | 'id' | 'user' | 'custom', value: string } | null {
    // Handle (@username)
    const handleMatch = url.match(/youtube\.com\/@([^/?]+)/);
    if (handleMatch) return { type: 'handle', value: handleMatch[1] };

    // Channel ID (UC...)
    const idMatch = url.match(/youtube\.com\/channel\/([^/?]+)/);
    if (idMatch) return { type: 'id', value: idMatch[1] };

    // Custom URL (/c/...)
    const customMatch = url.match(/youtube\.com\/c\/([^/?]+)/);
    if (customMatch) return { type: 'custom', value: customMatch[1] };

    // User (/user/...)
    const userMatch = url.match(/youtube\.com\/user\/([^/?]+)/);
    if (userMatch) return { type: 'user', value: userMatch[1] };

    return null;
}

/**
 * Fetches the Uploads Playlist ID for a given channel.
 */
export async function getChannelUploadsPlaylistId(channelInfo: { type: string, value: string }): Promise<string | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("YOUTUBE_API_KEY is not defined.");

    let apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&key=${apiKey}`;

    if (channelInfo.type === 'id') {
        apiUrl += `&id=${channelInfo.value}`;
    } else if (channelInfo.type === 'handle') {
        apiUrl += `&forHandle=@${channelInfo.value}`; // API expects @ handle
    } else if (channelInfo.type === 'user') {
        apiUrl += `&forUsername=${channelInfo.value}`;
    } else {
        // Custom URL is tricky, often best to search
        console.warn("[YouTube API] Custom URLs are hard to resolve directly. Trying search.");
        return null;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`[YouTube API] Channel lookup failed: ${response.status}`);
            return null;
        }
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.warn(`[YouTube API] No channel found for ${channelInfo.type}: ${channelInfo.value}`);
            return null;
        }

        return data.items[0].contentDetails.relatedPlaylists.uploads;
    } catch (error) {
        console.error("Failed to fetch channel uploads ID:", error);
        return null;
    }
}

/**
 * Fetches the latest videos from a playlist (e.g., channel uploads).
 */
export async function getPlaylistVideos(playlistId: string, maxResults: number = 5): Promise<YoutubeVideoDetails[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("YOUTUBE_API_KEY is not defined.");

    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error(`[YouTube API] Playlist items failed: ${response.status}`);
            return [];
        }
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map((item: any) => {
            const snippet = item.snippet;
            const thumbnail =
                snippet.thumbnails.maxres?.url ||
                snippet.thumbnails.high?.url ||
                snippet.thumbnails.medium?.url ||
                snippet.thumbnails.default?.url;

            return {
                id: snippet.resourceId.videoId,
                title: snippet.title,
                description: snippet.description,
                publishedAt: snippet.publishedAt,
                channelTitle: snippet.channelTitle,
                thumbnailUrl: thumbnail,
                tags: [], // PlaylistItems API doesn't return tags, we'd need another call for that, but description is usually enough
                url: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`
            };
        });

    } catch (error) {
        console.error("Failed to fetch playlist videos:", error);
        return [];
    }
}


/**
 * Fetches video details from YouTube Data API v3 (Single Video).
 */
export async function getYoutubeVideoDetails(videoId: string): Promise<YoutubeVideoDetails | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.error("[YouTube API] API Key is missing!");
        throw new Error("YOUTUBE_API_KEY is not defined.");
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;

    console.log(`[YouTube API] Requesting details for video: ${videoId}`);

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[YouTube API] Error ${response.status}: ${errorText}`);
            return null;
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.warn(`[YouTube API] No video found for ID: ${videoId}`);
            return null;
        }

        const item = data.items[0];
        const snippet = item.snippet;

        console.log(`[YouTube API] Success: ${snippet.title}`);

        const thumbnail =
            snippet.thumbnails.maxres?.url ||
            snippet.thumbnails.high?.url ||
            snippet.thumbnails.medium?.url ||
            snippet.thumbnails.default?.url;

        return {
            id: item.id,
            title: snippet.title,
            description: snippet.description,
            publishedAt: snippet.publishedAt,
            channelTitle: snippet.channelTitle,
            thumbnailUrl: thumbnail,
            tags: snippet.tags || [],
            url: `https://www.youtube.com/watch?v=${item.id}`
        };

    } catch (error) {
        console.error("[YouTube API] Unexpected error:", error);
        return null;
    }
}
