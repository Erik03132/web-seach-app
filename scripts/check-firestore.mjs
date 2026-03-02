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

async function checkSources() {
    console.log("Checking sources collection...");
    console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    // Check for youtube/telegram sources
    const sourcesRef = collection(db, 'sources');
    const ytQuery = query(sourcesRef, where('sourceType', '==', 'youtube'), limit(5));
    const tgQuery = query(sourcesRef, where('sourceType', '==', 'telegram'), limit(5));

    console.log("\n=== YOUTUBE SOURCES ===");
    const ytSnap = await getDocs(ytQuery);
    console.log(`Found ${ytSnap.size} YouTube documents:`);
    ytSnap.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n[${i + 1}] ID: ${doc.id}`);
        console.log(`  Title: ${data.title?.substring(0, 80)}...`);
        console.log(`  PublishedAt: ${data.publishedAt}`);
        console.log(`  DetectedApps: ${data.detectedApps?.length || 0}`);
        console.log(`  NeedsRepair: ${data.needsRepair}`);
    });

    console.log("\n=== TELEGRAM SOURCES ===");
    const tgSnap = await getDocs(tgQuery);
    console.log(`Found ${tgSnap.size} Telegram documents:`);
    tgSnap.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n[${i + 1}] ID: ${doc.id}`);
        console.log(`  Title: ${data.title?.substring(0, 80)}...`);
        console.log(`  PublishedAt: ${data.publishedAt}`);
        console.log(`  DetectedApps: ${data.detectedApps?.length || 0}`);
        console.log(`  NeedsRepair: ${data.needsRepair}`);
    });

    // Check channels collection
    console.log("\n=== CHANNELS ===");
    const channelsRef = collection(db, 'channels');
    const channelsSnap = await getDocs(query(channelsRef, limit(5)));
    console.log(`Found ${channelsSnap.size} channels:`);
    channelsSnap.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`[${i + 1}] ${doc.id}: ${data.title} (${data.sourceType}) - ${data.url}`);
    });
}

checkSources().catch(console.error);
