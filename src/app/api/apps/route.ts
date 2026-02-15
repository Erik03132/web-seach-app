import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

/**
 * ARCHIVE API
 * Currently using 'sources' collection to bypass permission issues with the new 'apps' collection.
 * Documents will have sourceType: 'archived_app'
 */
export async function POST(req: NextRequest) {
    try {
        const appData = await req.json();
        const itemName = appData.name || appData.title; // Support both name and title
        const itemType = appData.sourceType || 'archived_app'; // Default to app, allow 'solution'

        console.log(`Archive Request (${itemType}) for:`, itemName);

        if (!itemName) {
            return NextResponse.json({ error: "Name or Title is required" }, { status: 400 });
        }

        const slug = itemName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\p{L}\p{N}_]/gu, '')
            .substring(0, 100);

        const appId = `${itemType}_${slug}`;
        const appRef = doc(db, "sources", appId);

        const sanitizedData = Object.entries(appData).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) acc[key] = value;
            return acc;
        }, {} as any);

        const appDoc = await getDoc(appRef);

        let finalData;
        if (appDoc.exists()) {
            const existing = appDoc.data();
            finalData = {
                ...existing,
                ...sanitizedData, // Update fields if changed
                lastMentionedAt: serverTimestamp(),
                mentionCount: (existing.mentionCount || 1) + 1
            };
        } else {
            finalData = {
                ...sanitizedData,
                id: appId,
                name: itemName, // Ensure name is set uniformly
                category: appData.category || "Разное",
                sourceType: itemType,
                createdAt: serverTimestamp(),
                lastMentionedAt: serverTimestamp(),
                mentionCount: 1,
                status: 'archived'
            };
        }

        console.log("Writing to Firestore:", appId);
        await setDoc(appRef, finalData);

        return NextResponse.json({
            message: appDoc.exists() ? "Mention updated" : "Added to archive",
            id: appId
        }, { status: 200 });

    } catch (error: any) {
        console.error("Archive API Error [CRITICAL]:", error);
        return NextResponse.json({
            error: "PERMISSION_ERROR: Please check Firestore Rules for 'apps' collection OR " + error.message,
            originalError: error.message
        }, { status: 500 });
    }
}
