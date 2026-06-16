import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Trash2,
  Edit3,
  Save,
  X,
  Plus,
  Play,
  Menu,
  Search,
  GripVertical,
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";

function SortableSetlistItem({ tab, idx, onPlay, onRemove }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={tab}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center justify-between p-4 md:p-6 bg-card border border-border rounded-2xl group transition-colors mb-2"
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-5 h-5 md:w-4 md:h-4" />
        </div>
        <span className="text-2xl font-display font-normal text-muted-foreground/30 w-8 text-center">
          {idx + 1}
        </span>
        <div>
          <h4 className="text-xl font-display font-normal tracking-wide">
            {tab.title}
          </h4>
          <p className="text-sm text-secondary font-medium tracking-wide">
            {tab.artist}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPlay(idx)}
          className="p-2.5 hover:bg-accent/20 hover:text-accent rounded-lg transition-all text-accent md:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Play Song"
          aria-label="Play Song"
        >
          <Play className="w-5 h-5 md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => onRemove(tab.id)}
          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Remove from Setlist"
          aria-label="Remove from Setlist"
        >
          <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function SetlistDetail({
  setlist,
  allTabs,
  onUpdate,
  onDelete,
  onBack,
  onMenu,
  onPlay,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(setlist.name || "Untitled Setlist");
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");

  const tabsInSetlist = useMemo(() => {
    return (setlist.tabs || [])
      .map((tabId) => allTabs.find((t) => t.id === tabId))
      .filter(Boolean);
  }, [setlist.tabs, allTabs]);

  const [localTabs, setLocalTabs] = useState(tabsInSetlist);

  React.useEffect(() => {
    setLocalTabs(tabsInSetlist);
  }, [tabsInSetlist]);

  const availableTabs = useMemo(() => {
    let tabs = allTabs.filter((t) => !(setlist.tabs || []).includes(t.id));
    if (addSearchQuery) {
      const q = addSearchQuery.toLowerCase();
      tabs = tabs.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.artist?.toLowerCase().includes(q),
      );
    }
    // Sort A-Z
    return tabs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [allTabs, setlist.tabs, addSearchQuery]);

  const handleSaveName = () => {
    onUpdate({ name });
    setIsEditing(false);
  };

  const addTabToSetlist = (tabId) => {
    onUpdate({ tabs: [...(setlist.tabs || []), tabId] });
  };

  const removeTabFromSetlist = (tabId) => {
    onUpdate({ tabs: (setlist.tabs || []).filter((id) => id !== tabId) });
  };

  const handleReorder = (newOrder) => {
    setLocalTabs(newOrder);
    onUpdate({ tabs: newOrder.map((t) => t.id) });
  };

  return (
    <div className="flex flex-col flex-1 bg-background relative h-full overflow-hidden min-h-0">
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-surface/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4 w-full">
          <button
            onClick={onMenu}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Show sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onBack}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border border-border px-3 py-1 rounded-md text-foreground font-bold focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Save Name"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-display font-normal text-primary tracking-wide">
                  {setlist.name || "Untitled Setlist"}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-muted-foreground hover:text-primary rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Edit Name"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {tabsInSetlist.length > 0 && (
            <button
              onClick={() => onPlay(0)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.97] transition-all shadow-lg min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Play Setlist</span>
            </button>
          )}

          <div className="h-6 w-px bg-border mx-2" />

          <button
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this setlist?")
              ) {
                onDelete();
              }
            }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete Setlist"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-display font-normal text-muted-foreground uppercase tracking-widest">
              Songs in Setlist
            </h3>
            <button
              onClick={() => setIsAddingMode(!isAddingMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors min-h-[44px]",
                isAddingMode
                  ? "bg-primary/20 text-primary"
                  : "bg-surface border border-border hover:bg-muted",
              )}
            >
              {isAddingMode ? (
                <X className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              {isAddingMode ? "Done" : "Add Songs"}
            </button>
          </div>

          <div className="space-y-2">
            {tabsInSetlist.length === 0 ? (
              <div className="p-8 text-center bg-surface/50 border border-border border-dashed rounded-xl">
                <p className="text-muted-foreground mb-4">
                  This setlist is empty.
                </p>
                <button
                  onClick={() => setIsAddingMode(true)}
                  className="px-4 py-2 bg-primary text-black rounded-lg font-bold text-sm min-h-[44px]"
                >
                  Add Songs
                </button>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={localTabs}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {localTabs.map((tab, idx) => (
                  <SortableSetlistItem
                    key={tab.id}
                    tab={tab}
                    idx={idx}
                    onPlay={onPlay}
                    onRemove={removeTabFromSetlist}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>

        {/* Add Songs Mode */}
        <AnimatePresence>
          {isAddingMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border pt-8 overflow-hidden flex flex-col"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-[10px] font-display font-normal text-muted-foreground uppercase tracking-widest">
                  Available Songs
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    placeholder="Search songs..."
                    className="w-full pl-9 pr-4 py-2 bg-surface/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto p-1 pr-2 scrollbar-thin">
                {availableTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex items-center justify-between p-4 bg-card/50 border border-border rounded-2xl hover:bg-card transition-colors"
                  >
                    <div>
                      <h4 className="font-display font-normal tracking-wide text-lg">
                        {tab.title}
                      </h4>
                      <p className="text-sm text-secondary font-medium tracking-wide">
                        {tab.artist}
                      </p>
                    </div>
                    <button
                      onClick={() => addTabToSetlist(tab.id)}
                      className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ))}
                {availableTabs.length === 0 && (
                  <p className="text-muted-foreground text-sm p-8 col-span-1 md:col-span-2 text-center bg-surface/30 rounded-xl border border-dashed border-border">
                    {addSearchQuery
                      ? "No songs match your search."
                      : "No more songs available to add."}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
