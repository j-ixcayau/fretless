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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";

export function useSetlists() {
  const { user } = useAuth();
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSetlists([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "setlists"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSetlists(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addSetlist = async (setlist) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, "users", user.uid, "setlists"), {
      ...setlist,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...setlist };
  };

  const updateSetlist = async (setlistId, updates) => {
    if (!user) return;
    const setlistRef = doc(db, "users", user.uid, "setlists", setlistId);
    await updateDoc(setlistRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
  };

  const deleteSetlist = async (setlistId) => {
    if (!user) return;
    const setlistRef = doc(db, "users", user.uid, "setlists", setlistId);
    await deleteDoc(setlistRef);
  };

  return { setlists, loading, addSetlist, updateSetlist, deleteSetlist };
}
