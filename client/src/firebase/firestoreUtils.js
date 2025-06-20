import { doc, setDoc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "./config"

export const createSession = async (sessionId, initialState) => {
  const sessionRef = doc(db, "sessions", sessionId)
  await setDoc(sessionRef, { ...initialState, updatedAt: Date.now() })
}

export const subscribeToSession = (sessionId, onUpdate) => {
  const sessionRef = doc(db, "sessions", sessionId)
  return onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data())
  })
}

export const updateSession = async (sessionId, updates) => {
  const sessionRef = doc(db, "sessions", sessionId)
  await updateDoc(sessionRef, { ...updates, updatedAt: Date.now() })
}

export const getSessionData = async (sessionId) => {
  const sessionRef = doc(db, "sessions", sessionId)
  const sessionSnap = await getDoc(sessionRef)
  if (sessionSnap.exists()) return sessionSnap.data()
  return null
}
