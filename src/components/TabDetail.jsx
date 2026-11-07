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
  ArrowUp,
} from "lucide-react";
import { transposeTab, transposeChord, getInterval } from "../lib/transposer";
import { renderChart } from "../lib/chart";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import IconButton from "./ui/IconButton";
import { useConfirm } from "./ui/ConfirmDialog";
import {
  readChartFontSize,
  saveChartFontSize,
  MIN_CHART_FONT_SIZE,
  MAX_CHART_FONT_SIZE,
} from "../lib/playPreferences";
import { keepScreenAwake } from "../lib/wakeLock";

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
  const controlsRef = useRef(null);
  const [transpose, setTranspose] = useState(0);
  const [preferSharps, setPreferSharps] = useState(true);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [fontSize, setFontSize] = useState(readChartFontSize);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [showTopFab, setShowTopFab] = useState(false);
  const [controlsFocused, setControlsFocused] = useState(false);

  useEffect(() => saveChartFontSize(fontSize), [fontSize]);

  useEffect(() => {
    if (!isPlayMode) return;
    const releaseWakeLock = keepScreenAwake(navigator.wakeLock, document);
    const pauseWhenHidden = () => {
      if (document.hidden) setIsAutoScrolling(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [isPlayMode]);

  // Inactivity timer for Play Mode controls
  useEffect(() => {
    let timeoutId;
    if (isPlayMode && !speedOpen && !controlsFocused) {
      const resetTimer = () => {
        setShowControls(true);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setShowControls(false);
          setSpeedOpen(false);
        }, 3000);
      };
      const onPointerMove = (event) => {
        if (event.pointerType === "mouse") resetTimer();
      };
      resetTimer();
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("click", resetTimer);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("keydown", resetTimer);
        window.removeEventListener("click", resetTimer);
      };
    } else {
      setShowControls(true);
    }
  }, [isPlayMode, speedOpen, controlsFocused]);

  const changeFontSize = (delta) => {
    setIsAutoScrolling(false);
    setFontSize((size) =>
      Math.max(
        MIN_CHART_FONT_SIZE,
        Math.min(MAX_CHART_FONT_SIZE, size + delta),
      ),
    );
  };

  // Auto-transpose to preferred key on load
  useEffect(() => {
    if (
      tab.preferred_key &&
      tab.base_key &&
      tab.preferred_key !== tab.base_key
    ) {
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
    setControlsFocused(false);
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

    if (isPlayMode && isAutoScrolling && container) {
      const durationMs = Number(tab.duration) * 1000 * 0.8;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        let lastTime = null;
        let exactScrollTop = container.scrollTop;
        const step = (timestamp) => {
          if (!lastTime) lastTime = timestamp;
          const delta = timestamp - lastTime;
          lastTime = timestamp;
          const baseSpeed =
            Number.isFinite(durationMs) && durationMs > 0
              ? maxScroll / durationMs
              : 0.02;
          const speed = baseSpeed * scrollSpeedMultiplier;
          exactScrollTop += speed * delta;
          container.scrollTop = exactScrollTop;
          if (Math.ceil(container.scrollTop) >= maxScroll) {
            setIsAutoScrolling(false);
          } else {
            raf = requestAnimationFrame(step);
          }
        };
        raf = requestAnimationFrame(step);
      } else {
        setIsAutoScrolling(false);
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
  }, [
    isPlayMode,
    isAutoScrolling,
    tab.duration,
    scrollSpeedMultiplier,
    fontSize,
  ]);

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
      className="absolute inset-0 z-40 bg-play-bg flex flex-col overflow-hidden"
    >
      {/* Title */}
      <div className="pt-2 px-5 pb-2 text-center shrink-0">
        <div className="text-[17px] font-extrabold text-play-foreground leading-tight">
          {tab.title}
          {currentKey && (
            <span className="text-secondary"> · {currentKey}</span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={playScrollRef}
        onScroll={(e) => setShowTopFab(e.currentTarget.scrollTop > 300)}
        onPointerDown={() => {
          if (controlsRef.current?.contains(document.activeElement))
            document.activeElement.blur();
        }}
        className="flex-1 min-h-0 min-w-0 overflow-y-auto pl-6 pr-[max(1.5rem,env(safe-area-inset-right))] pb-32"
      >
        <pre
          className="font-mono font-semibold whitespace-pre text-play-foreground m-0 w-full max-w-4xl mx-auto overflow-x-auto"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
        >
          {renderChart(transposedContent)}
        </pre>
      </div>

      {/* Right control drawer */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            ref={controlsRef}
            onFocus={() => setControlsFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setControlsFocused(false);
            }}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            className="absolute top-1/2 -translate-y-1/2 right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex items-center pointer-events-none"
          >
            {/* Speed slider (opens to the left of the rail) */}
            <AnimatePresence>
              {speedOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="absolute right-[70px] top-1/2 -translate-y-1/2 w-52 p-4 rounded-2xl bg-popover border border-border-chrome backdrop-blur-xl pointer-events-auto"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-chip-foreground">
                      Scroll speed
                    </span>
                    <span className="text-sm font-bold text-secondary">
                      {scrollSpeedMultiplier.toFixed(1)}×
                    </span>
                  </div>
                  <input
                    aria-label="Auto-scroll speed"
                    aria-valuetext={`${scrollSpeedMultiplier.toFixed(1)} times normal speed`}
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={scrollSpeedMultiplier}
                    onChange={(e) =>
                      setScrollSpeedMultiplier(parseFloat(e.target.value))
                    }
                    className="w-full min-h-11 accent-[var(--secondary)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-stretch gap-2.5 w-14">
              {/* Close */}
              <button
                onClick={togglePlayMode}
                aria-label="Exit Play Mode"
                className="h-11 rounded-[14px] bg-primary text-white flex items-center justify-center pointer-events-auto"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scroll toggle + speed */}
              <div
                className={cn(
                  "rounded-[14px] overflow-hidden border flex flex-col transition-colors pointer-events-auto",
                  isAutoScrolling
                    ? "bg-secondary border-secondary text-secondary-foreground"
                    : "bg-surface border-border-chrome text-foreground",
                )}
              >
                <button
                  onClick={() => setIsAutoScrolling((v) => !v)}
                  aria-label={
                    isAutoScrolling ? "Pause auto-scroll" : "Start auto-scroll"
                  }
                  aria-pressed={isAutoScrolling}
                  className="min-h-11 flex items-center justify-center"
                >
                  {isAutoScrolling ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>
                <button
                  onClick={() => setSpeedOpen((v) => !v)}
                  aria-label="Adjust auto-scroll speed"
                  aria-expanded={speedOpen}
                  className={cn(
                    "min-h-11 text-[12px] font-extrabold border-t",
                    isAutoScrolling
                      ? "border-secondary-foreground/20"
                      : "border-border-chrome",
                  )}
                >
                  {scrollSpeedMultiplier.toFixed(1)}×
                </button>
              </div>

              {/* Font size stepper */}
              <div className="rounded-[14px] bg-surface border border-border-chrome flex flex-col items-center py-1.5 text-chip-foreground pointer-events-auto">
                <button
                  onClick={() => changeFontSize(1)}
                  aria-label="Increase font size"
                  disabled={fontSize >= MAX_CHART_FONT_SIZE}
                  className="min-h-11 w-full font-bold text-[15px] disabled:opacity-40"
                >
                  A+
                </button>
                <span className="text-chip-foreground text-[12px] font-bold py-0.5">
                  {fontSize}
                </span>
                <button
                  onClick={() => changeFontSize(-1)}
                  aria-label="Decrease font size"
                  disabled={fontSize <= MIN_CHART_FONT_SIZE}
                  className="min-h-11 w-full font-bold text-[15px] disabled:opacity-40"
                >
                  A−
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-to-top FAB (appears once you've scrolled down) */}
      <AnimatePresence>
        {showTopFab && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setIsAutoScrolling(false);
              playScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Scroll to top"
            className="absolute right-4 bottom-4 z-20 w-11 h-11 rounded-full bg-surface/90 border border-border-chrome text-chip-foreground flex items-center justify-center shadow-lg backdrop-blur-md"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
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
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.9 }}
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
