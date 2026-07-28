import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Play,
  RotateCcw,
  Trash2,
  X,
  Pause,
} from "lucide-react";
import { transposeTab, transposeChord, getInterval } from "../lib/transposer";
import { renderChart } from "../lib/chart";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import IconButton from "./ui/IconButton";
import { useConfirm } from "./ui/ConfirmDialog";

export default function TabDetail({
  tab,
  onEdit,
  onDelete,
  onBack,
  onUpdatePreferredKey,
  onEnterPlayMode,
}) {
  const confirm = useConfirm();
  const playScrollRef = useRef(null);
  const [transpose, setTranspose] = useState(0);
  const [preferSharps, setPreferSharps] = useState(true);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [speedOpen, setSpeedOpen] = useState(false);

  // Inactivity timer for Play Mode controls
  useEffect(() => {
    let timeoutId;
    if (isPlayMode) {
      const resetTimer = () => {
        setShowControls(true);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setShowControls(false), 3000);
      };
      resetTimer();
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("touchstart", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("click", resetTimer);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("mousemove", resetTimer);
        window.removeEventListener("touchstart", resetTimer);
        window.removeEventListener("keydown", resetTimer);
        window.removeEventListener("click", resetTimer);
      };
    } else {
      setShowControls(true);
    }
  }, [isPlayMode]);

  // Auto-transpose to preferred key on load
  useEffect(() => {
    if (tab.preferred_key && tab.base_key && tab.preferred_key !== tab.base_key) {
      const interval = getInterval(tab.base_key, tab.preferred_key);
      if (interval !== 0) setTranspose(interval);
    } else {
      setTranspose(0);
    }
  }, [tab.id, tab.preferred_key, tab.base_key]);

  const transposedContent = useMemo(
    () => transposeTab(tab.content, transpose, preferSharps),
    [tab.content, transpose, preferSharps],
  );

  const currentKey = useMemo(() => {
    if (!tab.base_key) return null;
    return transposeChord(tab.base_key, transpose, preferSharps);
  }, [tab.base_key, transpose, preferSharps]);

  const handleTranspose = (delta) => {
    setTranspose((prev) => Math.max(-12, Math.min(12, prev + delta)));
  };

  const exitPlayMode = () => {
    setIsPlayMode(false);
    setIsAutoScrolling(false);
    setSpeedOpen(false);
  };

  const togglePlayMode = () => {
    if (!isPlayMode) {
      // In a standalone PWA the app already fills the screen, so Play Mode is
      // just a normal full-height in-app view — no browser-fullscreen portal,
      // which was the source of the iOS bottom-inset positioning bug.
      setIsPlayMode(true);
      setIsAutoScrolling(false);
      onEnterPlayMode?.();
    } else {
      exitPlayMode();
    }
  };

  // Escape exits Play Mode (no browser fullscreen to leave anymore).
  useEffect(() => {
    if (!isPlayMode) return;
    const onKey = (e) => {
      if (e.key === "Escape") exitPlayMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayMode]);

  // Auto-scroll loop (Play Mode). Scales the duration-derived speed by the
  // manual multiplier so the band can nudge tempo live.
  useEffect(() => {
    let raf;

    const container = playScrollRef.current;

    const stopOnInteraction = () => {
      if (isAutoScrolling) {
        setIsAutoScrolling(false);
        setShowControls(true);
      }
    };
    if (isPlayMode && container) {
      container.addEventListener("wheel", stopOnInteraction, { passive: true });
      container.addEventListener("touchstart", stopOnInteraction, {
        passive: true,
      });
      container.addEventListener("mousedown", stopOnInteraction, {
        passive: true,
      });
    }

    if (isPlayMode && isAutoScrolling && tab.duration && container) {
      const durationMs = parseInt(tab.duration, 10) * 1000 * 0.8;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (!isNaN(durationMs) && durationMs > 0 && maxScroll > 0) {
        let lastTime = null;
        let exactScrollTop = container.scrollTop;
        const step = (timestamp) => {
          if (!lastTime) lastTime = timestamp;
          const delta = timestamp - lastTime;
          lastTime = timestamp;
          const speed = (maxScroll / durationMs) * scrollSpeedMultiplier;
          exactScrollTop += speed * delta;
          container.scrollTop = exactScrollTop;
          if (Math.ceil(container.scrollTop) >= maxScroll) {
            setIsAutoScrolling(false);
          } else {
            raf = requestAnimationFrame(step);
          }
        };
        raf = requestAnimationFrame(step);
      }
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (container) {
        container.removeEventListener("wheel", stopOnInteraction);
        container.removeEventListener("touchstart", stopOnInteraction);
        container.removeEventListener("mousedown", stopOnInteraction);
      }
    };
  }, [isPlayMode, isAutoScrolling, tab.duration, scrollSpeedMultiplier]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this song?",
      message: `"${tab.title || "Untitled"}" will be permanently removed.`,
      confirmLabel: "Delete",
    });
    if (ok) onDelete();
  };

  const contextLabel =
    transpose !== 0 && tab.base_key
      ? `from ${tab.base_key} · ${transpose > 0 ? "+" : ""}${transpose}`
      : "Original key";

  const showSaveKey =
    currentKey && currentKey !== (tab.preferred_key || tab.base_key);

  // ---- Play Mode (normal full-height in-app view, not a fullscreen portal) --
  const playModeView = isPlayMode ? (
    <div
      data-overlay-open
      className="absolute inset-0 z-40 bg-play-bg flex flex-col"
    >
      {/* Title */}
      <div className="pt-2 px-5 pb-2 text-center shrink-0">
        <div className="text-[17px] font-extrabold text-primary leading-tight">
          {tab.title}
          {currentKey && (
            <span className="text-secondary"> · {currentKey}</span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div ref={playScrollRef} className="flex-1 overflow-y-auto px-6 pb-20">
        <pre
          className="font-mono font-semibold whitespace-pre text-play-foreground m-0 w-full max-w-4xl mx-auto overflow-x-auto"
          style={{ fontSize: `${fontSize}px`, lineHeight: 2.1 }}
        >
          {renderChart(transposedContent)}
        </pre>
      </div>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute inset-x-0 bottom-0 z-10"
          >
            <AnimatePresence>
              {speedOpen && tab.duration && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="mx-4 mb-2 p-4 rounded-2xl bg-popover border border-border-chrome backdrop-blur-xl w-[calc(100%-2rem)] max-w-4xl sm:mx-auto"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground-2">
                      Scroll speed
                    </span>
                    <span className="text-sm font-bold text-secondary">
                      {scrollSpeedMultiplier.toFixed(1)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={scrollSpeedMultiplier}
                    onChange={(e) =>
                      setScrollSpeedMultiplier(parseFloat(e.target.value))
                    }
                    className="w-full accent-[var(--secondary)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-gradient-to-t from-play-bg via-play-bg to-transparent px-4 pt-8 pb-2">
              <div className="flex items-center gap-2.5 w-full max-w-4xl mx-auto">
                {/* Scroll toggle + speed */}
                <div
                  className={cn(
                    "flex-1 flex items-center rounded-[14px] overflow-hidden border transition-colors",
                    isAutoScrolling
                      ? "bg-secondary border-secondary text-secondary-foreground"
                      : "bg-surface border-border-chrome text-foreground",
                    !tab.duration && "opacity-40",
                  )}
                >
                  <button
                    onClick={() => tab.duration && setIsAutoScrolling((v) => !v)}
                    disabled={!tab.duration}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-extrabold flex-1 justify-center"
                  >
                    {isAutoScrolling ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    Scroll
                  </button>
                  <button
                    onClick={() => tab.duration && setSpeedOpen((v) => !v)}
                    disabled={!tab.duration}
                    className={cn(
                      "px-3 py-2.5 text-[13px] font-extrabold border-l",
                      isAutoScrolling
                        ? "border-secondary-foreground/20"
                        : "border-border-chrome",
                    )}
                  >
                    {scrollSpeedMultiplier.toFixed(1)}×
                  </button>
                </div>

                {/* Font size stepper */}
                <div className="flex-1 flex items-center justify-center gap-3 rounded-[14px] bg-surface border border-border-chrome py-2.5">
                  <button
                    onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                    aria-label="Decrease font size"
                    className="text-chip-foreground font-bold text-[15px] px-1"
                  >
                    A−
                  </button>
                  <span className="text-muted-foreground-2 text-[11px] font-bold w-8 text-center">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(40, s + 1))}
                    aria-label="Increase font size"
                    className="text-chip-foreground font-bold text-[15px] px-1"
                  >
                    A+
                  </button>
                </div>

                {/* Close */}
                <button
                  onClick={togglePlayMode}
                  aria-label="Exit Play Mode"
                  className="w-10 h-10 shrink-0 rounded-[14px] bg-primary text-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : null;

  // ---- Song Detail --------------------------------------------------------
  return (
    <div className="relative flex flex-col h-full bg-background">
      {playModeView}

      {/* Header */}
      <div className="border-b border-[var(--border-chrome)] shrink-0">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-3.5 w-full max-w-3xl mx-auto">
          <IconButton icon={ChevronLeft} label="Back" onClick={onBack} />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-foreground truncate leading-tight">
              {tab.title || "Untitled"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {tab.artist || "Unknown artist"}
              {tab.tuning && tab.tuning !== "Standard" && ` · ${tab.tuning}`}
            </div>
          </div>
          <IconButton icon={Edit3} label="Edit" onClick={onEdit} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 flex flex-col gap-3.5 w-full max-w-3xl mx-auto">
        {/* Key / transpose card */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleTranspose(-1)}
                aria-label="Transpose down"
                className="w-9 h-9 rounded-[10px] bg-surface-elevated text-chip-foreground font-bold flex items-center justify-center hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[36px]">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground-2">
                  Key
                </div>
                <motion.div
                  key={currentKey}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className="text-[22px] font-extrabold text-secondary leading-tight"
                >
                  {currentKey || "—"}
                </motion.div>
              </div>
              <button
                onClick={() => handleTranspose(1)}
                aria-label="Transpose up"
                className="w-9 h-9 rounded-[10px] bg-surface-elevated text-chip-foreground font-bold flex items-center justify-center hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground-2 text-center flex-1">
              {contextLabel}
            </div>

            <AnimatePresence mode="popLayout">
              {showSaveKey ? (
                <motion.button
                  key="save"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => onUpdatePreferredKey(currentKey)}
                  className="px-2.5 py-1.5 rounded-[9px] bg-surface-elevated text-icon-foreground text-[11px] font-bold hover:text-white transition-colors"
                >
                  Save key
                </motion.button>
              ) : (
                transpose !== 0 && (
                  <motion.button
                    key="reset"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setTranspose(0)}
                    aria-label="Reset transpose"
                    className="w-8 h-8 rounded-[9px] bg-surface-elevated text-icon-foreground flex items-center justify-center hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>
                )
              )}
            </AnimatePresence>
          </div>

          {/* Sharps / flats */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--border-chrome)]">
            <button
              onClick={() => setPreferSharps(true)}
              className={cn(
                "flex-1 py-1.5 rounded-[9px] text-[11px] font-bold transition-colors",
                preferSharps
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted-foreground-2 hover:text-foreground",
              )}
            >
              Sharps ♯
            </button>
            <button
              onClick={() => setPreferSharps(false)}
              className={cn(
                "flex-1 py-1.5 rounded-[9px] text-[11px] font-bold transition-colors",
                !preferSharps
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted-foreground-2 hover:text-foreground",
              )}
            >
              Flats ♭
            </button>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={togglePlayMode}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-extrabold text-secondary-foreground bg-gradient-to-br from-secondary to-secondary-hover shadow-lg shadow-secondary/25 hover:brightness-105 active:scale-[0.99] transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          Enter Play Mode
        </button>

        {/* Chart card */}
        <div className="relative bg-surface border border-border rounded-[18px] p-[18px] pt-11">
          <span className="absolute top-3.5 left-[18px] text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/15 px-2 py-[3px] rounded-md">
            Chart
          </span>
          {tab.tags?.length > 0 && (
            <div className="absolute top-3 right-[18px] flex gap-1.5 flex-wrap justify-end max-w-[55%]">
              {tab.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold capitalize text-muted-foreground-2 bg-surface-elevated px-2 py-[3px] rounded-md"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <pre
            className="font-mono font-semibold whitespace-pre text-[#e8e7f5] m-0 overflow-x-auto"
            style={{ fontSize: "15px", lineHeight: 1.9 }}
          >
            {transposedContent ? renderChart(transposedContent) : "No chart content yet."}
          </pre>
        </div>

        {/* Meta + delete */}
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-muted-foreground-2 pt-1">
          <span>
            Added {tab.created_at?.toDate?.().toLocaleDateString() || "recently"}
          </span>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-muted-foreground-2 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete song
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
