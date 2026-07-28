import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Download,
  FileJson,
  LogOut,
  KeyRound,
  Check,
  Loader2,
} from "lucide-react";
import Modal from "../ui/Modal";
import { useAuth, authErrorMessage } from "../../hooks/useAuth";

/**
 * Account, Gemini key, and the power-user data actions
 * (import-from-JSON, export-all).
 */
export default function SettingsModal({
  open,
  onClose,
  initialKey = "",
  onSave,
  onImportJson,
  onExportAll,
}) {
  const { user, hasPassword, hasGoogle, linkPassword, logout } = useAuth();
  const [key, setKey] = useState(initialKey);

  // "Add password" form state
  const [showLink, setShowLink] = useState(false);
  const [linkPw, setLinkPw] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkErr, setLinkErr] = useState("");
  const [linkDone, setLinkDone] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(initialKey);
      setShowLink(false);
      setLinkPw("");
      setLinkErr("");
      setLinkDone(false);
    }
  }, [open, initialKey]);

  const addPassword = async () => {
    setLinkErr("");
    if (linkPw.length < 6) {
      setLinkErr("Password should be at least 6 characters.");
      return;
    }
    setLinkBusy(true);
    try {
      await linkPassword(linkPw);
      setLinkDone(true);
      setShowLink(false);
      setLinkPw("");
    } catch (err) {
      setLinkErr(authErrorMessage(err));
    } finally {
      setLinkBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Settings}
      title="Settings"
      subtitle="Account, API key & data"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(key.trim())}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Account */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-foreground">Account</label>
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-9 h-9 rounded-full border border-border-chrome"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border-chrome flex items-center justify-center text-sm font-bold text-primary">
                {(user?.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground truncate">
                {user?.displayName || user?.email || "Signed in"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {[
                  hasGoogle && "Google",
                  hasPassword && "Email/password",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Signed in"}
              </div>
            </div>
            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          {/* Add email/password to a Google-only account (same account/data) */}
          {user && !hasPassword && (
            <div className="rounded-xl border border-border-chrome bg-surface-elevated/40 p-3">
              {!showLink ? (
                <button
                  onClick={() => setShowLink(true)}
                  className="flex items-center gap-2 text-sm font-bold text-primary"
                >
                  <KeyRound className="w-4 h-4" />
                  Add email/password sign-in
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Set a password for <b>{user.email}</b>. You'll then be able to
                    sign in with Google <i>or</i> email/password — same account,
                    same songs.
                  </p>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={linkPw}
                    onChange={(e) => setLinkPw(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    className="w-full p-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 transition-all"
                  />
                  {linkErr && (
                    <p className="text-xs text-destructive font-medium">
                      {linkErr}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowLink(false);
                        setLinkErr("");
                        setLinkPw("");
                      }}
                      className="flex-1 py-2 rounded-xl text-sm font-bold hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addPassword}
                      disabled={linkBusy}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-60"
                    >
                      {linkBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      Add password
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(hasPassword || linkDone) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <Check className="w-4 h-4" />
              Email/password sign-in is enabled.
            </div>
          )}
        </div>

        {/* Gemini key */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">
            Gemini API Key
          </label>
          <p className="text-xs text-muted-foreground">
            Required for Smart Import. Stored in your browser's local storage and
            used only to call the Google Gemini API.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy…"
            className="w-full p-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all font-mono"
          />
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline font-bold inline-block mt-1"
          >
            Get a free API key from Google AI Studio &rarr;
          </a>
        </div>

        {/* Library data */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground">
            Library data
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onImportJson?.();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-surface-elevated border border-border-chrome hover:bg-muted transition-colors"
            >
              <FileJson className="w-4 h-4" />
              Import JSON
            </button>
            <button
              onClick={() => onExportAll?.()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-surface-elevated border border-border-chrome hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Export all
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
