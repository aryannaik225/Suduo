import { doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore"
import { db } from "./config"

export const createSession = async (sessionId, initialState) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId)
    await setDoc(sessionRef, { ...initialState, updatedAt: Date.now() })
    console.log("Session created successfully:", sessionId)
  } catch (error) {
    console.error("Error creating session:", error)
  }
}

export const subscribeToSession = (sessionId, onUpdate) => {
  const sessionRef = doc(db, "sessions", sessionId)
  return onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data())
  })
}

export const updateSession = async (sessionId, updates) => {
  const sessionRef = doc(db, "sessions", sessionId)
  await updateDoc(sessionRef, updates)
}

export const getSessionData = async (sessionId) => {
  const sessionRef = doc(db, "sessions", sessionId)
  const sessionSnap = await getDoc(sessionRef)
  if (sessionSnap.exists()) return sessionSnap.data()
  return null
}

export const addPlayerToSession = async (sessionId, player) => {
  const sessionRef = doc(db, "sessions", sessionId)
  await updateDoc(sessionRef, {
    players: arrayUnion(player)
  })
}

export const deleteSession = async (sessionId) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId)
    await deleteDoc(sessionRef)
  } catch (error) {
    console.error("Error deleting session:", error)
  }
}