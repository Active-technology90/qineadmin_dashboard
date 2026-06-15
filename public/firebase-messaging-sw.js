/* public/firebase-messaging-sw.js
 * Service worker that receives FCM web-push messages while the dashboard tab is
 * in the background/closed. Uses the compat SDK (required inside a worker).
 * Keep the version here aligned with the `firebase` npm version (10.12.2).
 */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAc8UsHWnN6ejpP9GYShExcp50Z-iKNoeE",
  authDomain: "qine-delivery-tracking.firebaseapp.com",
  projectId: "qine-delivery-tracking",
  storageBucket: "qine-delivery-tracking.firebasestorage.app",
  messagingSenderId: "860762669004",
  appId: "1:860762669004:web:bb7434ed3fea7d150d6769",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "Qine";
  const body = (payload.notification && payload.notification.body) || "";
  self.registration.showNotification(title, {
    body,
    icon: "/vite.svg",
    data: payload.data || {},
  });
});
