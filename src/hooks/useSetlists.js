import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "./useAuth";

export function useSetlists() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [snapshotState, setSnapshotState] = useState({ uid: null, data: [] });
  const setlists = uid && snapshotState.uid === uid ? snapshotState.data : [];
  const loading = !!uid && snapshotState.uid !== uid;

  useEffect(() => {
    if (!uid) return;
    let active = true;

    const q = query(
      collection(db, "users", uid, "setlists"),
      orderBy("created_at", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!active || auth.currentUser?.uid !== uid) return;
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSnapshotState({ uid, data: docs });
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
    return uid;
  };

  const addSetlist = async (setlist) => {
    const ownerUid = requireCurrentUser();
    const docRef = await addDoc(collection(db, "users", ownerUid, "setlists"), {
      ...setlist,
      created_at: serverTimestamp(),
    });
    return { id: docRef.id, ...setlist };
  };

  const updateSetlist = async (setlistId, updates) => {
    const setlistRef = doc(
      db,
      "users",
      requireCurrentUser(),
      "setlists",
      setlistId,
    );
    await updateDoc(setlistRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  };

  const deleteSetlist = async (setlistId) => {
    const setlistRef = doc(
      db,
      "users",
      requireCurrentUser(),
      "setlists",
      setlistId,
    );
    await deleteDoc(setlistRef);
  };

  return { setlists, loading, addSetlist, updateSetlist, deleteSetlist };
}
