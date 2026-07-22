import { useEffect, useState } from "react";
import { Settings, Save, Download, FileJson } from "lucide-react";
import Modal from "../ui/Modal";

/**
 * Houses the Gemini key plus the power-user data actions
 * (import-from-JSON, export-all) moved out of the primary action bar.
 */
export default function SettingsModal({
  open,
  onClose,
  initialKey = "",
  onSave,
  onImportJson,
  onExportAll,
}) {
  const [key, setKey] = useState(initialKey);

  useEffect(() => {
    if (open) setKey(initialKey);
  }, [open, initialKey]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Settings}
      title="Settings"
      subtitle="API keys & data"
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
