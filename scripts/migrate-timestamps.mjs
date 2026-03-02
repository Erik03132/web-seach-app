import dotenv from "dotenv";
import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, query, Timestamp, updateDoc, where } from 'firebase/firestore/lite';
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

async function migrateTimestamps() {
    console.log("Migrating publishedAt to Timestamp format...");

    // Get all youtube and telegram sources
    const sourcesRef = collection(db, 'sources');
    const q = query(sourcesRef, where('sourceType', 'in', ['youtube', 'telegram']));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} documents to check`);

    let updated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const publishedAt = data.publishedAt;

        // Check if already a Timestamp object (has seconds and nanoseconds)
        if (publishedAt && typeof publishedAt === 'object' && 'seconds' in publishedAt) {
            skipped++;
            continue;
        }

        // Convert string to Timestamp
        if (publishedAt && typeof publishedAt === 'string') {
            const date = new Date(publishedAt);
            if (!isNaN(date.getTime())) {
                const timestamp = Timestamp.fromDate(date);
                const docRef = doc(db, 'sources', docSnap.id);
                await updateDoc(docRef, {
                    publishedAt: timestamp,
                    publishedAtISO: publishedAt
                });
                updated++;
                console.log(`Updated: ${docSnap.id}`);
            }
        }
    }

    console.log(`\nMigration complete!`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (already Timestamp): ${skipped}`);
}

migrateTimestamps().catch(console.error);
