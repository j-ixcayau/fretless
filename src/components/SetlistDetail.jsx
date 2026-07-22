import { useState, useMemo } from "react";
import {
  ChevronLeft,
  Trash2,
  Check,
  X,
  Plus,
  Play,
  Search,
  GripVertical,
  Pencil,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import IconButton from "./ui/IconButton";
import KeyBadge from "./ui/KeyBadge";
import { useConfirm } from "./ui/ConfirmDialog";

function SetlistRow({ tab, idx, onPlay, onRemove }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={tab}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-surface border border-border"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-[#4a4770] hover:text-icon-foreground transition-colors touch-none shrink-0"
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-[13px] font-bold text-muted-foreground-2 w-4 text-center shrink-0">
        {idx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-foreground truncate leading-tight">
          {tab.title}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {tab.artist}
        </div>
      </div>
      {tab.base_key && <KeyBadge musicKey={tab.base_key} />}
      <button
        onClick={() => onPlay(idx)}
        aria-label="Play song"
        className="text-muted-foreground-2 hover:text-secondary transition-colors shrink-0 p-1"
      >
        <Play className="w-4 h-4 fill-current" />
      </button>
      <button
        onClick={() => onRemove(tab.id)}
        aria-label="Remove from setlist"
        className="text-muted-foreground-2 hover:text-destructive transition-colors shrink-0 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </Reorder.Item>
  );
}

export default function SetlistDetail({
  setlist,
  allTabs,
  onUpdate,
  onDelete,
  onBack,
  onPlay,
}) {
  const confirm = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(setlist.name || "Untitled Setlist");
  const [isAdding, setIsAdding] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const tabsInSetlist = useMemo(
    () =>
      (setlist.tabs || [])
        .map((tabId) => allTabs.find((t) => t.id === tabId))
        .filter(Boolean),
    [setlist.tabs, allTabs],
  );

  // Local copy for optimistic drag-reordering. Re-sync during render (rather
  // than in an effect) whenever the underlying setlist order changes.
  const [localTabs, setLocalTabs] = useState(tabsInSetlist);
  const orderKey = (setlist.tabs || []).join(",");
  const [syncedKey, setSyncedKey] = useState(orderKey);
  if (orderKey !== syncedKey) {
    setSyncedKey(orderKey);
    setLocalTabs(tabsInSetlist);
  }

  const totalMinutes = useMemo(() => {
    const secs = tabsInSetlist.reduce(
      (sum, t) => sum + (parseInt(t.duration, 10) || 0),
      0,
    );
    return secs > 0 ? Math.round(secs / 60) : 0;
  }, [tabsInSetlist]);

  const availableTabs = useMemo(() => {
    let list = allTabs.filter((t) => !(setlist.tabs || []).includes(t.id));
    if (addSearch) {
      const q = addSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.artist?.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [allTabs, setlist.tabs, addSearch]);

  const saveName = () => {
    onUpdate({ name });
    setIsEditing(false);
  };
  const addTab = (tabId) => onUpdate({ tabs: [...(setlist.tabs || []), tabId] });
  const removeTab = (tabId) =>
    onUpdate({ tabs: (setlist.tabs || []).filter((id) => id !== tabId) });
  const handleReorder = (order) => {
    setLocalTabs(order);
    onUpdate({ tabs: order.map((t) => t.id) });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this setlist?",
      message: `"${setlist.name || "Untitled"}" will be removed. Your songs stay in the library.`,
      confirmLabel: "Delete",
    });
    if (ok) onDelete();
  };

  const count = tabsInSetlist.length;
  const subtitle = `${count} ${count === 1 ? "song" : "songs"}${
    totalMinutes ? ` · ~${totalMinutes} min` : ""
  }`;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-[var(--border-chrome)] shrink-0">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-3.5 w-full max-w-3xl mx-auto">
        <IconButton icon={ChevronLeft} label="Back" onClick={onBack} />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="flex-1 min-w-0 bg-surface border border-border-chrome rounded-lg px-2.5 py-1 text-[16px] font-extrabold focus:outline-none focus:border-primary/60"
              />
              <button
                onClick={saveName}
                aria-label="Save name"
                className="text-secondary p-1"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 group text-left max-w-full"
            >
              <span className="text-[18px] font-extrabold text-foreground truncate">
                {setlist.name || "Untitled Setlist"}
              </span>
              <Pencil className="w-3 h-3 text-muted-foreground-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        {count > 0 && (
          <button
            onClick={() => onPlay(0)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-extrabold text-secondary-foreground bg-gradient-to-br from-secondary to-secondary-hover shadow-md shadow-secondary/20 active:scale-[0.98] transition-transform"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play
          </button>
        )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 flex flex-col gap-2 w-full max-w-3xl mx-auto">
        {count === 0 && !isAdding ? (
          <div className="flex flex-col items-center text-center py-14 px-6">
            <p className="text-sm text-muted-foreground mb-4">
              This setlist is empty.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
            >
              Add songs
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={localTabs}
            onReorder={handleReorder}
            className="flex flex-col gap-2"
          >
            {localTabs.map((tab, idx) => (
              <SetlistRow
                key={tab.id}
                tab={tab}
                idx={idx}
                onPlay={onPlay}
                onRemove={removeTab}
              />
            ))}
          </Reorder.Group>
        )}

        {/* Add song affordance */}
        {!isAdding && count > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-[14px] border border-dashed border-border-chrome text-muted-foreground text-[12px] font-bold hover:text-foreground hover:border-primary/40 transition-colors mt-1"
          >
            <Plus className="w-4 h-4" />
            Add song
          </button>
        )}

        {/* Add panel */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground-2">
                    Add songs
                  </span>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setAddSearch("");
                    }}
                    className="text-[11px] font-bold text-primary"
                  >
                    Done
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground-2" />
                  <input
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="Search songs…"
                    className="w-full bg-surface border border-border-chrome rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground-2 focus:outline-none focus:border-primary/60 transition-all"
                  />
                </div>
                {availableTabs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {addSearch
                      ? "No songs match your search."
                      : "No more songs to add."}
                  </p>
                ) : (
                  availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => addTab(tab.id)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-surface border border-border hover:border-primary/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-foreground truncate leading-tight">
                          {tab.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {tab.artist}
                        </div>
                      </div>
                      {tab.base_key && <KeyBadge musicKey={tab.base_key} />}
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete setlist */}
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground-2 hover:text-destructive transition-colors mt-3 py-2"
        >
          <Trash2 className="w-3 h-3" />
          Delete setlist
        </button>
        </div>
      </div>
    </div>
  );
}
