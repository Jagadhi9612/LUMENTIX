import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "build-safe-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "elite-fitness.localhost",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "elite-fitness-build",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "elite-fitness-build.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const firebasePublicConfig = firebaseConfig;

export async function getClientMessaging() {
  const { getMessaging, isSupported } = await import("firebase/messaging");

  if (typeof window === "undefined" || !(await isSupported())) {
    return null;
  }

  return getMessaging(firebaseApp);
}

export function getFirebaseVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
}

export function isFirebaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}
