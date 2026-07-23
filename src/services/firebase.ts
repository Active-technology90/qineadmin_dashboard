// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";

// ✅ TEMPORARY HARDCODE FOR TESTING
export const firebaseConfig = {
  apiKey: "AIzaSyDBSCXeVu3DVRHS5CDyCwB5xpsqvdiyDAY",
  authDomain: "qine-delivery-tracking.firebaseapp.com",
  databaseURL: "https://qine-delivery-tracking-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "qine-delivery-tracking",
  storageBucket: "qine-delivery-tracking.firebasestorage.app",
  messagingSenderId: "860762669004",
  appId: "1:860762669004:web:bb7434ed3fea7d150d6769",
};

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const app = initializeApp(firebaseConfig);

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  try {
    if (await isSupported()) return getMessaging(app);
  } catch {
    return null;
  }
}

export const db = getDatabase(app);