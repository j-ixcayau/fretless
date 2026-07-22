import { useState } from "react";
import { Wand2, ImagePlus, Loader2, X } from "lucide-react";
import Modal from "../ui/Modal";
import { cn } from "../../lib/utils";

/**
 * onImport({ text, file }) should be async and throw on failure.
 * The modal owns its loading state and closes itself on success.
 */
export default function SmartImportModal({ open, onClose, onImport }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setText("");
    setFile(null);
    setLoading(false);
  };

  const close = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleImport = async () => {
    if (!text.trim() && !file) return;
    setLoading(true);
    try {
      await onImport({ text, file });
      reset();
      onClose();
    } catch {
      // parent surfaces the error toast; keep the modal open to retry
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      closeDisabled={loading}
      icon={Wand2}
      title="Smart Import"
      subtitle="AI-powered song extraction"
      footer={
        <>
          <button
            onClick={close}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={(!text.trim() && !file) || loading}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Import Song
              </>
            )}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Paste a URL, lyrics, or chords — or upload a screenshot / photo of a
          chart, and the AI will format it for you.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste URL or text here…"
          disabled={loading}
          className="w-full h-28 p-4 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
        />

        <div className="flex items-center gap-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs font-bold text-muted-foreground-2 uppercase">
            or
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        <div className="relative">
          <input
            type="file"
            accept="image/*"
            id="smart-image-upload"
            className="hidden"
            onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
            disabled={loading}
          />
          <label
            htmlFor="smart-image-upload"
            className={cn(
              "flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
              file
                ? "border-primary/50 bg-primary/5 text-primary"
                : "border-border hover:bg-muted/50 hover:border-primary/40 text-muted-foreground",
              loading && "opacity-50 cursor-not-allowed pointer-events-none",
            )}
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-sm font-bold truncate">
              {file ? file.name : "Upload image or screenshot"}
            </span>
          </label>
          {file && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setFile(null);
              }}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface rounded-md text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
