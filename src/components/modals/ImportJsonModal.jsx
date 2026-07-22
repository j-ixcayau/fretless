import { useState } from "react";
import { FileJson } from "lucide-react";
import Modal from "../ui/Modal";

export default function ImportJsonModal({ open, onClose, onImport }) {
  const [json, setJson] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setJson(evt.target.result);
    reader.readAsText(file);
  };

  const close = () => {
    setJson("");
    onClose();
  };

  const handleImport = () => {
    onImport(json);
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
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
          />
          <button
            onClick={close}
            className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!json.trim()}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            Import
          </button>
        </>
      }
    >
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='{ "title": "...", "artist": "...", ... }'
        className="w-full h-56 p-4 bg-background border border-border rounded-xl font-mono text-sm resize-none focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
      />
    </Modal>
  );
}
