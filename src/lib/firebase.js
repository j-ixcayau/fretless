import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  memoryLocalCache,
  waitForPendingWrites,
  terminate,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { clearLegacyOfflineCache } from "./offlineCache";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Keep cached songs and pending edits within this tab's lifetime.
// Legacy disk data is retained until explicitly cleared, to preserve old writes.
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const offlineCacheNoticeKey = "chordlyOfflineCacheNotice";

export function clearSavedOfflineData() {
  return clearLegacyOfflineCache({
    waitForWrites: () => waitForPendingWrites(db),
    terminate: () => terminate(db),
    clearPersistence: () => clearIndexedDbPersistence(db),
    report: (message) => {
      try {
        sessionStorage.setItem(offlineCacheNoticeKey, message);
      } catch {
        window.alert(message);
      }
    },
    reload: () => window.location.reload(),
  });
}
