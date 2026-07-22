import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Settings,
  Sparkles,
  Plus,
  ChevronRight,
  Check,
  ListMusic,
} from "lucide-react";
import SongRow from "./SongRow";
import Segmented from "./ui/Segmented";
import IconButton from "./ui/IconButton";
import { cn } from "../lib/utils";

const SORT_OPTIONS = [
  { value: "az", label: "A–Z" },
  { value: "recent", label: "Recently added" },
  { value: "played", label: "Recently played" },
];

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
}

export default function Library({
  tabs,
  setlists,
  loading,
  activeView,
  setActiveView,
  searchQuery,
  onSearchChange,
  selectedTags,
  onToggleTag,
  onClearTags,
  sortMode,
  onSortMode,
  onSelectTab,
  onSelectSetlist,
  onSmartImport,
  onCreateNew,
  onCreateSetlist,
  onOpenSettings,
}) {
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set();
    tabs.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tabs]);

  const visibleTabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = tabs.filter((tab) => {
      const matchesText =
        !q ||
        tab.title?.toLowerCase().includes(q) ||
        tab.artist?.toLowerCase().includes(q) ||
        tab.tags?.some((tag) => tag.toLowerCase().includes(q));
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => (tab.tags || []).includes(tag));
      return matchesText && matchesTags;
    });

    list = [...list];
    if (sortMode === "az") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortMode === "played") {
      list.sort(
        (a, b) =>
          toMillis(b.last_played_at) - toMillis(a.last_played_at) ||
          toMillis(b.created_at) - toMillis(a.created_at),
      );
    } else {
      list.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
    }
    return list;
  }, [tabs, searchQuery, selectedTags, sortMode]);

  const visibleSetlists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return setlists.filter(
      (s) => !q || (s.name || "").toLowerCase().includes(q),
    );
  }, [setlists, searchQuery]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortMode)?.label || "A–Z";
  const isSongs = activeView === "tabs";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 shrink-0 w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-primary to-secondary" />
            <span className="text-lg font-extrabold tracking-tight">
              Chordly
            </span>
          </div>
          <IconButton icon={Settings} label="Settings" onClick={onOpenSettings} />
        </div>

        <Segmented
          className="mb-3.5"
          value={activeView}
          onChange={setActiveView}
          options={[
            { value: "tabs", label: "Songs" },
            { value: "setlists", label: "Setlists" },
          ]}
        />

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isSongs ? "Search title, artist, tag…" : "Search setlists…"}
            className="w-full bg-surface border border-border-chrome rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground-2 focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        {isSongs && allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3.5 -mx-1 px-1">
            <button
              onClick={onClearTags}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors",
                selectedTags.length === 0
                  ? "bg-primary text-white"
                  : "bg-surface border border-border-chrome text-chip-foreground",
              )}
            >
              All
            </button>
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "bg-surface border border-border-chrome text-chip-foreground",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {isSongs && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground-2">
              {visibleTabs.length} {visibleTabs.length === 1 ? "song" : "songs"} ·{" "}
              {sortLabel}
            </span>
            <button
              onClick={() => setSortSheetOpen(true)}
              className="text-[11px] font-bold uppercase tracking-wide text-icon-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Sort <ChevronRight className="w-3 h-3 rotate-90" />
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 w-full max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[62px] rounded-[14px] bg-surface border border-border animate-pulse"
              />
            ))}
          </div>
        ) : isSongs ? (
          visibleTabs.length === 0 ? (
            <EmptyState
              title={
                tabs.length === 0 ? "No songs yet" : "Nothing matches"
              }
              subtitle={
                tabs.length === 0
                  ? "Use Smart Import or the + button to add your first song."
                  : "Try clearing filters or a different search."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {visibleTabs.map((tab) => (
                <SongRow
                  key={tab.id}
                  tab={tab}
                  isActive={false}
                  onClick={() => onSelectTab(tab.id)}
                />
              ))}
            </div>
          )
        ) : visibleSetlists.length === 0 ? (
          <EmptyState
            title="No setlists yet"
            subtitle="Create a setlist to group songs for a service or show."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {visibleSetlists.map((setlist) => {
              const count = (setlist.tabs || []).filter((id) =>
                tabs.some((t) => t.id === id),
              ).length;
              return (
                <button
                  key={setlist.id}
                  onClick={() => onSelectSetlist(setlist.id)}
                  className="flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-[14px] border bg-surface border-border hover:border-primary/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-[10px] bg-surface-elevated flex items-center justify-center text-primary shrink-0">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-bold text-[15px] truncate leading-tight">
                      {setlist.name || "Untitled setlist"}
                    </div>
                    <div className="text-muted-foreground text-xs truncate mt-0.5">
                      {count} {count === 1 ? "song" : "songs"}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground-2" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex gap-2.5 bg-gradient-to-t from-background to-transparent w-full max-w-6xl mx-auto">
        {isSongs ? (
          <>
            <button
              onClick={onSmartImport}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13px] font-bold text-white bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Smart Import
            </button>
            <button
              onClick={onCreateNew}
              aria-label="New song"
              className="w-12 shrink-0 flex items-center justify-center rounded-[14px] bg-surface border border-border-chrome text-chip-foreground hover:border-primary/40 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={onCreateSetlist}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13px] font-bold text-white bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Setlist
          </button>
        )}
      </div>

      {/* Sort sheet */}
      <AnimatePresence>
        {sortSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSortSheetOpen(false)}
            className="absolute inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-surface border-t border-border rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <div className="w-10 h-1 rounded-full bg-border-chrome mx-auto mb-4" />
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground-2 px-2 mb-2">
                Sort by
              </p>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSortMode(opt.value);
                    setSortSheetOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-3.5 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  {opt.label}
                  {sortMode === opt.value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4 text-primary">
        <ListMusic className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">{subtitle}</p>
    </div>
  );
}
