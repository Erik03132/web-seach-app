import * as cheerio from 'cheerio';

export interface TelegramPostDetails {
    id: string;
    channelTitle: string;
    channelHandle: string;
    text: string;
    publishedAt: string;
    url: string;
    imageUrl?: string;
}

/**
 * Extracts channel handle and message ID from Telegram URL
 */
export function extractTelegramInfo(url: string): { handle: string; messageId?: string } | null {
    // Handle @username format
    if (url.startsWith("@")) {
        return { handle: url.substring(1) };
    }

    // Regex for t.me/channel_name/123 or t.me/s/channel_name
    const regex = /t\.me\/(s\/)?([a-zA-Z0-9_]{5,})(\/(\d+))?/;
    const match = url.match(regex);

    if (match) {
        return {
            handle: match[2],
            messageId: match[4] || undefined
        };
    }
    return null;
}

/**
 * Fetches recent posts from a public Telegram channel using the "s/" preview URL
 */
export async function getRecentTelegramPosts(handle: string, limit: number = 5): Promise<TelegramPostDetails[]> {
    const url = `https://t.me/s/${handle}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Telegram request failed: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const posts: TelegramPostDetails[] = [];

        const channelTitle = $('.tgme_channel_info_header_title').text().trim() || handle;

        $('.tgme_widget_message_wrap').slice(-limit).each((_, element) => {
            const $post = $(element);
            const messageIdMatch = $post.find('.tgme_widget_message').attr('data-post')?.split('/');
            const messageId = messageIdMatch ? messageIdMatch[1] : '';

            if (!messageId) return;

            const text = $post.find('.tgme_widget_message_text.js-message_text').text().trim();
            const date = $post.find('time').attr('datetime') || new Date().toISOString();
            const postUrl = `https://t.me/${handle}/${messageId}`;

            // Extract style for background-image
            const photoEl = $post.find('.tgme_widget_message_photo_wrap');
            let imageUrl: string | undefined = undefined;
            if (photoEl.length > 0) {
                const style = photoEl.attr('style');
                const imgMatch = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (imgMatch) imageUrl = imgMatch[1];
            }

            posts.push({
                id: messageId,
                channelTitle,
                channelHandle: handle,
                text,
                publishedAt: date,
                url: postUrl,
                imageUrl
            });
        });

        return posts.reverse(); // Newest first
    } catch (error) {
        console.error("[Telegram] Error fetching posts:", error);
        return [];
    }
}

/**
 * Fetches a single Telegram post by handle and ID
 */
export async function getSingleTelegramPost(handle: string, messageId: string): Promise<TelegramPostDetails | null> {
    const url = `https://t.me/s/${handle}/${messageId}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Find the specific message wrap (usually only one in /s/handle/id view)
        const $post = $(`.tgme_widget_message_wrap`).last();
        if ($post.length === 0) return null;

        const channelTitle = $('.tgme_channel_info_header_title').text().trim() || handle;
        const text = $post.find('.tgme_widget_message_text.js-message_text').text().trim();
        const date = $post.find('time').attr('datetime') || new Date().toISOString();

        let imageUrl: string | undefined = undefined;
        const photoEl = $post.find('.tgme_widget_message_photo_wrap');
        if (photoEl.length > 0) {
            const style = photoEl.attr('style');
            const imgMatch = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (imgMatch) imageUrl = imgMatch[1];
        }

        return {
            id: messageId,
            channelTitle,
            channelHandle: handle,
            text,
            publishedAt: date,
            url: `https://t.me/${handle}/${messageId}`,
            imageUrl
        };
    } catch (error) {
        console.error("[Telegram] Error fetching single post:", error);
        return null;
    }
}
