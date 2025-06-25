// route.js
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import path from "path";
import fs from "fs";

let db;

if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), "src/firebase/suduo-realtime-firebase-adminsdk.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

  initializeApp({
    credential: cert(serviceAccount),
  });

  db = getFirestore();
} else {
  db = getFirestore();
}

// App Router style (exporting POST function instead of handler)
export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, playerId } = body;

    if (!sessionId || !playerId) {
      return new Response("Missing data", { status: 400 });
    }

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return new Response("Session not found", { status: 404 });
    }

    const data = sessionSnap.data();
    const updatedPlayers = (data.players || []).filter(p => p.id !== playerId);

    await sessionRef.update({ players: updatedPlayers });

    return new Response("Player removed", { status: 200 });
  } catch (error) {
    console.error("Error in leave cleanup:", error);
    return new Response("Internal server error", { status: 500 });
  }
}