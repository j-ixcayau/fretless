import { useRef, useState } from "react";
import { FileJson } from "lucide-react";
import Modal from "../ui/Modal";
import { MAX_IMPORT_BYTES } from "../../lib/songValidation";

export default function ImportJsonModal({ open, onClose, onImport }) {
  const [json, setJson] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const importing = useRef(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("Import must be smaller than 5 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (evt) => setJson(evt.target.result);
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file);
  };

  const close = () => {
    if (importing.current) return;
    setJson("");
    setError("");
    onClose();
  };

  const handleImport = async () => {
    if (importing.current) return;
    importing.current = true;
    setPending(true);
    setError("");
    try {
      await onImport(json);
      setJson("");
      onClose();
    } catch (err) {
      setError(err.message || "Import failed. Please try again.");
    } finally {
      importing.current = false;
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      closeDisabled={pending}
      icon={FileJson}
      title="Import from JSON"
      subtitle="Paste your song JSON structure"
      footer={
        <>
          <label
            htmlFor="json-upload"
            className="mr-auto px-4 py-2 text-sm font-bold border border-border-chrome hover:bg-muted rounded-xl cursor-pointer transition-colors"
          >
            Upload .json
          </label>
          <input
            type="file"
            accept=".json"
            id="json-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={pending}
          />
          <button
            onClick={close}
            disabled={pending}
            className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!json.trim() || pending}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {pending ? "Importing…" : "Import"}
          </button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <textarea
        value={json}
        disabled={pending}
        onChange={(e) => setJson(e.target.value)}
        placeholder='{ "title": "...", "artist": "...", ... }'
        className="w-full h-56 p-4 bg-background border border-border rounded-xl font-mono text-sm resize-none focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
      />
    </Modal>
  );
}
