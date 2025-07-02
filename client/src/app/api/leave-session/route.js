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
    const now = Date.now();

    const updatedPlayers = (data.players || []).map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          maybeLeftAt: now // <-- ✅ MARK PLAYER AS "MAYBE LEFT"
        };
      }
      return player;
    });

    await sessionRef.update({ players: updatedPlayers });

    console.log(`[Beacon] Player ${playerId} marked as maybe left at ${now}`);

    // 🕒 Wait 8 seconds before cleanup
    setTimeout(async () => {
      const latestSnap = await sessionRef.get();
      const latestData = latestSnap.data();
      const now = Date.now();

      if (!latestData?.players) return;

      const cleanedPlayers = latestData.players.filter(player => {
        // ✅ REMOVE if maybeLeftAt was set and it's older than 8s ago
        if (player.maybeLeftAt && now - player.maybeLeftAt > 8000) {
          return false;
        }
        return true;
      });

      await sessionRef.update({ players: cleanedPlayers });

      console.log(`[Beacon] Final cleaned players list:`, cleanedPlayers.map(p => p.id));

      if (cleanedPlayers.length === 0) {
        await sessionRef.delete();
        console.log(`[Beacon] Session ${sessionId} deleted due to inactivity.`);
      }

    }, 8000);

    return new Response("Player marked as maybe left", { status: 200 });
  } catch (error) {
    console.error("Error in leave cleanup:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
