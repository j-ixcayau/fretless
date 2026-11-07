import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { validateSongs } from "../lib/songValidation";
import { useAuth } from "./useAuth";

export function useTabs() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState({ uid: null, tabs: [], loading: true });
  const tabs = state.uid === uid ? state.tabs : [];
  const loading = !!uid && (state.uid !== uid || state.loading);

  useEffect(() => {
    if (!uid) return;
    let active = true;

    const q = query(
      collection(db, "users", uid, "tabs"),
      orderBy("created_at", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!active || auth.currentUser?.uid !== uid) return;
      const docs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setState({ uid, tabs: docs, loading: false });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  const requireCurrentUser = () => {
    if (!uid || auth.currentUser?.uid !== uid) {
      throw new Error("Your account changed. Please try again.");
    }
  };

  const addTabs = async (values) => {
    requireCurrentUser();
    const songs = validateSongs(values);
    const batch = writeBatch(db);
    const saved = songs.map((song) => {
      const ref = doc(collection(db, "users", uid, "tabs"));
      batch.set(ref, { ...song, created_at: serverTimestamp() });
      return { ...song, id: ref.id };
    });
    await batch.commit();
    return saved;
  };

  const addTab = async (tab) => {
    const [saved] = await addTabs([tab]);
    return saved;
  };

  const updateTab = async (tabId, updates) => {
    requireCurrentUser();
    const tabRef = doc(db, "users", user.uid, "tabs", tabId);
    await updateDoc(tabRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  };

  const deleteTab = async (tabId) => {
    requireCurrentUser();
    const tabRef = doc(db, "users", user.uid, "tabs", tabId);
    await deleteDoc(tabRef);
  };

  return { tabs, loading, addTab, addTabs, updateTab, deleteTab };
}
