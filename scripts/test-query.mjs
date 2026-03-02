import dotenv from "dotenv";
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, limit, query, where } from 'firebase/firestore/lite';
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testQuery() {
    console.log("Testing query with 'in' filter...");

    const sourcesRef = collection(db, 'sources');
    const q = query(
        sourcesRef,
        where('sourceType', 'in', ['youtube', 'telegram']),
        limit(10)
    );

    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} documents`);

    const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title?.substring(0, 50),
            publishedAt: data.publishedAt,
            sourceType: data.sourceType
        };
    });

    // Sort client-side
    posts.sort((a, b) => {
        const dateA = a.publishedAt?.seconds ? a.publishedAt.seconds * 1000 : new Date(a.publishedAt || 0).getTime();
        const dateB = b.publishedAt?.seconds ? b.publishedAt.seconds * 1000 : new Date(b.publishedAt || 0).getTime();
        return dateB - dateA;
    });

    console.log("\nSorted posts:");
    posts.forEach((p, i) => {
        const date = p.publishedAt?.seconds
            ? new Date(p.publishedAt.seconds * 1000).toISOString()
            : new Date(p.publishedAt || 0).toISOString();
        console.log(`[${i + 1}] ${p.sourceType}: ${p.title}... (${date})`);
    });
}

testQuery().catch(console.error);
