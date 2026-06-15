// src/services/notifications.ts
// Web-push enable + foreground listener for the admin dashboard.
import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getMessagingIfSupported, VAPID_KEY } from "./firebase";
import { registerDevice } from "./api";

export type ClientApp = "admin" | "customer" | "delivery";

/**
 * Ask permission, get the FCM token, and register the device with the backend.
 * Returns the token on success; throws an Error with a human message otherwise.
 */
export async function enablePushNotifications(app: ClientApp = "admin"): Promise<string> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }
  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    throw new Error("Push messaging is not supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
  if (!token) {
    throw new Error("Could not obtain an FCM token.");
  }

  await registerDevice(token, "web", app);
  return token;
}

/** Subscribe to messages received while the tab is in the foreground. */
export async function listenForegroundMessages(
  cb: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
}
