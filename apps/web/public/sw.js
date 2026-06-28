const CACHE_NAME = "elite-fitness-v2";
const APP_SHELL = ["/", "/dashboard", "/manifest.json", "/icon.svg", "/logo.jpeg", "/logo-mark.jpeg"];
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC2fHiWNthfiftw7oW-EQ2Herr_tuluAVE",
  authDomain: "elite-fitness-2026.firebaseapp.com",
  projectId: "elite-fitness-2026",
  storageBucket: "elite-fitness-2026.firebasestorage.app",
  messagingSenderId: "830041954136",
  appId: "1:830041954136:web:8f6ca7d111fa9aff19372d"
};

try {
  importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

  firebase.initializeApp(FIREBASE_CONFIG);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Elite Fitness reminder";
    const options = {
      body: payload.notification?.body || "Open the app to check your membership plan.",
      icon: "/icon.svg",
      badge: "/logo-mark.jpeg",
      tag: payload.data?.tag || "elite-renewal-reminder",
      data: {
        url: payload.data?.url || "/dashboard"
      }
    };
    self.registration.showNotification(title, options);
  });
} catch (error) {
  console.warn("Firebase messaging service worker setup skipped", error);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/dashboard")))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(targetUrl));
      return existing ? existing.focus() : self.clients.openWindow(targetUrl);
    })
  );
});
