import { useState, useEffect, createContext, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

const AuthContext = createContext();

// Maps Firebase auth error codes to friendly, user-facing messages.
export function authErrorMessage(err) {
  switch (err?.code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account already exists for this email — try signing in, or sign in with Google and add a password in Settings.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/credential-already-in-use":
      return "That email/password is already linked to another account.";
    case "auth/provider-already-linked":
      return "This account already has a password.";
    case "auth/requires-recent-login":
      return "Please sign out and sign in again, then retry.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in isn't enabled for this app yet.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const signUpWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    return cred;
  };

  // Attach email/password sign-in to the CURRENT account (e.g. a Google user)
  // so the same account and its data are reachable both ways (same uid).
  const linkPassword = async (password) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error("This account has no email to link.");
    const credential = EmailAuthProvider.credential(current.email, password);
    await linkWithCredential(current, credential);
    // Refresh local user so `hasPassword` reflects the new provider.
    await current.reload();
    setUser(auth.currentUser);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  const logout = () => signOut(auth);

  const hasPassword = !!user?.providerData?.some(
    (p) => p.providerId === "password",
  );
  const hasGoogle = !!user?.providerData?.some(
    (p) => p.providerId === "google.com",
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasPassword,
        hasGoogle,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        linkPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
