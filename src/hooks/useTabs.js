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

export function useTabs() {
  const { user } = useAuth();
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTabs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "tabs"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTabs(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addTab = async (tab) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "tabs"), {
      ...tab,
      created_at: serverTimestamp()
    });
  };

  const updateTab = async (tabId, updates) => {
    if (!user) return;
    const tabRef = doc(db, "users", user.uid, "tabs", tabId);
    await updateDoc(tabRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
  };

  const deleteTab = async (tabId) => {
    if (!user) return;
    const tabRef = doc(db, "users", user.uid, "tabs", tabId);
    await deleteDoc(tabRef);
  };

  return { tabs, loading, addTab, updateTab, deleteTab };
}
