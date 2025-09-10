"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
// Env vars from .env or .env.local
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app = (0, app_1.initializeApp)(firebaseConfig);
const db = (0, firestore_1.getFirestore)(app);
// TODO: Replace with your actual user UID
const userId = 'YOUR_USER_UID';
async function seedMatches() {
    const matches = [
        { id: 'match1', distance: 4800, passes: 15, shots: 3, points: 75 },
        { id: 'match2', distance: 5200, passes: 22, shots: 5, points: 82 },
        { id: 'match3', distance: 6000, passes: 30, shots: 7, points: 90 },
    ];
    for (const m of matches) {
        const ref = (0, firestore_1.doc)((0, firestore_1.collection)(db, 'users', userId, 'matches'), m.id);
        await (0, firestore_1.setDoc)(ref, {
            distance: m.distance,
            passes: m.passes,
            shots: m.shots,
            points: m.points,
            createdAt: (0, firestore_1.serverTimestamp)(),
        });
        console.log(`Seeded ${m.id}`);
    }
    console.log('Seeding completed');
}
seedMatches().catch(console.error);
