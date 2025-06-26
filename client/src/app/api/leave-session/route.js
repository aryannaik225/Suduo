import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import path from "path";
import fs from "fs";

let db;

if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), "src/firebase/suduo-realtime-firebase-adminsdk-fbsvc-49ee1cf9dd.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

  initializeApp({
    credential: cert(serviceAccount),
  });

  db = getFirestore();
} else {
  db = getFirestore();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, playerId } = body;

    console.log(`[Beacon] Leave request received — Session: ${sessionId}, Player: ${playerId}`)

    if (!sessionId || !playerId) {
      console.log(`[Beacon] Missing sessionId or playerId`);
      return new Response("Missing data", { status: 400 });
    }

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.log(`[Beacon] Session not found: ${sessionId}`);
      return new Response("Session not found", { status: 404 });
    }

    const data = sessionSnap.data();
    const updatedPlayers = (data.players || []).filter(p => p.id !== playerId);

    await sessionRef.update({ players: updatedPlayers });

    console.log(`[Beacon] Player ${playerId} removed from session ${sessionId}`);

    if (updatedPlayers.length === 0) {
      console.log(`[Beacon] No players left. Waiting 8secs to confirm before deleting session ${sessionId}`)

      setTimeout(async () => {
        const latestSnap = await sessionRef.get()
        const latestData = latestSnap.data()

        if (!latestData?.players || latestData.players.length === 0) {
          await sessionRef.delete()
          console.log(`[Beacon] Session ${sessionId} deleted due to inactivity.`)
        } else {
          console.log(`[Beacon] Session ${sessionId} still has players. Not deleting.`);
        }
      }, 8000)
    }

    return new Response("Player removed", { status: 200 });
  } catch (error) {
    console.error("Error in leave cleanup:", error);
    return new Response("Internal server error", { status: 500 });
  }
}