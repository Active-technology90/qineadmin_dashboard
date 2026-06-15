// src/services/firebase.ts
// Firebase Web SDK init for push notifications (qine-delivery-tracking project).
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Web Push (VAPID) public key — Firebase Console → Cloud Messaging → Web Push certificates.
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const app = initializeApp(firebaseConfig);

/** Returns a Messaging instance, or null if the browser can't do web push. */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  try {
    if (await isSupported()) return getMessaging(app);
  } catch {
    /* not supported */
  }
  return null;
}
