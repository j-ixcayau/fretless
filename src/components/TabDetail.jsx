import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Edit3,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Music,
  RotateCcw,
  Menu,
  Save,
  Play,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { transposeTab, transposeChord, getInterval } from "../lib/transposer";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TabDetail({
  tab,
  onEdit,
  onDelete,
  onBack,
  onMenu,
  onUpdatePreferredKey,
}) {
  const [transpose, setTranspose] = useState(0);
  const [preferSharps, setPreferSharps] = useState(true);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const scrollRef = React.useRef(null);

  // Inactivity timer for Play Mode controls
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (
      tab.preferred_key &&
      tab.base_key &&
      tab.preferred_key !== tab.base_key
    ) {
      const interval = getInterval(tab.base_key, tab.preferred_key);
      if (interval !== 0) {
        setTranspose(interval);
      }
    } else {
      setTranspose(0);
    }
  }, [tab.id, tab.preferred_key, tab.base_key]);

  const transposedContent = useMemo(() => {
    return transposeTab(tab.content, transpose, preferSharps);
  }, [tab.content, transpose, preferSharps]);

  const currentKey = useMemo(() => {
    if (!tab.base_key) return null;
    return transposeChord(tab.base_key, transpose, preferSharps);
  }, [tab.base_key, transpose, preferSharps]);

  const handleTranspose = (delta) => {
    setTranspose((prev) => {
      const next = prev + delta;
      // Keep within -12 to +12 semitones
      if (next < -12) return -12;
      if (next > 12) return 12;
      return next;
    });
  };

  const togglePlayMode = () => {
    if (!isPlayMode) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable full-screen mode: ${err.message}`,
          );
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
      setIsPlayMode(true);
      setIsAutoScrolling(false);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsPlayMode(false);
      setIsAutoScrolling(false);
    }
  };

  // Handle escape key to exit play mode
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsPlayMode(false);
        setIsAutoScrolling(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Handle body scroll for Play Mode (forces iOS Safari to hide navbars)
  React.useEffect(() => {
    if (isPlayMode) {
      document.body.classList.add("play-mode-active");
      return () => {
        document.body.classList.remove("play-mode-active");
        window.scrollTo(0, 0); // reset scroll when exiting
      };
    }
  }, [isPlayMode]);

  // Auto-scroll logic
  React.useEffect(() => {
    let animationFrameId;
    const scrollableNode = isPlayMode ? window : scrollRef.current;

    const handleUserInteraction = () => {
      if (isAutoScrolling) {
        setIsAutoScrolling(false);
        setShowControls(true);
      }
    };

    if (scrollableNode) {
      scrollableNode.addEventListener("wheel", handleUserInteraction, {
        passive: true,
      });
      scrollableNode.addEventListener("touchstart", handleUserInteraction, {
        passive: true,
      });
      scrollableNode.addEventListener("mousedown", handleUserInteraction, {
        passive: true,
      });
    }

    if (isPlayMode && isAutoScrolling && tab.duration) {
      const durationMs = parseInt(tab.duration, 10) * 1000 * 0.8;
      if (isNaN(durationMs) || durationMs <= 0) return;

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      let lastTime = null;
      let exactScrollTop = window.scrollY;

      const step = (timestamp) => {
        if (!lastTime) lastTime = timestamp;
        const delta = timestamp - lastTime;
        lastTime = timestamp;

        const speed = maxScroll / durationMs;
        exactScrollTop += speed * delta;
        window.scrollTo(0, exactScrollTop);

        if (Math.ceil(window.scrollY) >= maxScroll) {
          setIsAutoScrolling(false);
        } else {
          animationFrameId = requestAnimationFrame(step);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    } else if (!isPlayMode && isAutoScrolling && tab.duration) {
      if (!scrollRef.current) return;

      const durationMs = parseInt(tab.duration, 10) * 1000 * 0.8;
      if (isNaN(durationMs) || durationMs <= 0) return;

      const maxScroll =
        scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
      if (maxScroll <= 0) return;

      let lastTime = null;
      let exactScrollTop = scrollRef.current.scrollTop;

      const step = (timestamp) => {
        if (!lastTime) lastTime = timestamp;
        const delta = timestamp - lastTime;
        lastTime = timestamp;

        const speed = maxScroll / durationMs;
        exactScrollTop += speed * delta;
        scrollRef.current.scrollTop = exactScrollTop;

        if (Math.ceil(scrollRef.current.scrollTop) >= maxScroll) {
          setIsAutoScrolling(false);
        } else {
          animationFrameId = requestAnimationFrame(step);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (scrollableNode) {
        scrollableNode.removeEventListener("wheel", handleUserInteraction);
        scrollableNode.removeEventListener("touchstart", handleUserInteraction);
        scrollableNode.removeEventListener("mousedown", handleUserInteraction);
      }
    };
  }, [isPlayMode, isAutoScrolling, tab.duration]);

  const playModePortal = isPlayMode
    ? createPortal(
        <div className="absolute top-0 left-0 w-full min-h-screen z-[200] bg-background">
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:transform-none md:top-6 md:right-6 z-[210] flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl w-max max-w-[90vw]"
              >
                {tab.duration && (
                  <>
                    <button
                      onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                        isAutoScrolling
                          ? "bg-primary text-black border-primary"
                          : "bg-surface text-primary border-primary/30 hover:bg-primary/10",
                      )}
                    >
                      {isAutoScrolling ? "Pause Scroll" : "Auto-Scroll"}
                    </button>
                    <div className="w-px h-6 bg-border" />
                  </>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-xl border border-border">
                  <button
                    onClick={() => setFontSize((s) => Math.max(10, s - 2))}
                    className="p-1 hover:text-primary"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-black w-8 text-center">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(40, s + 2))}
                    className="p-1 hover:text-primary"
                  >
                    +
                  </button>
                </div>
                <div className="w-px h-6 bg-border" />
                <button
                  onClick={togglePlayMode}
                  className="p-2 bg-primary text-black rounded-xl hover:scale-110 transition-transform shadow-lg shadow-primary/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 md:p-20 flex flex-col items-start md:items-center max-w-5xl mx-auto w-full min-h-screen relative">
            <div className="mb-8 md:mb-12 text-center w-full">
              <h1 className="text-4xl md:text-6xl font-display font-normal uppercase tracking-wide text-primary mb-4">
                {tab.title}
              </h1>
              <p className="text-xl md:text-2xl text-secondary font-medium tracking-wide">
                {tab.artist} •{" "}
                <span className="text-muted-foreground">{currentKey}</span>
              </p>
            </div>
            <pre
              className="font-mono leading-relaxed whitespace-pre select-text transition-all duration-300 w-full md:w-auto overflow-x-auto pb-24"
              style={{ fontSize: `${fontSize}px` }}
            >
              {transposedContent}
            </pre>

            <div className="fixed right-4 bottom-4 opacity-10 pointer-events-none">
              <Music className="w-24 h-24" />
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="flex flex-col flex-1 bg-background relative min-h-0">
      {playModePortal}

      {/* Header / Actions */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-surface/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onMenu}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            title="Show sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onBack}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Tab</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <button
            onClick={togglePlayMode}
            className="flex items-center gap-2 px-4 py-2 bg-surface/50 backdrop-blur-sm border border-border rounded-xl font-bold hover:bg-surface hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <Play className="w-4 h-4 text-primary fill-primary/20 group-hover:fill-primary transition-colors" />
            <span className="hidden sm:inline text-foreground group-hover:text-primary transition-colors">
              Play Mode
            </span>
            <span className="sm:hidden text-foreground group-hover:text-primary transition-colors">
              Play
            </span>
          </button>
          <div className="h-6 w-px bg-border" />
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this tab?")) {
                onDelete();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 font-bold"
            title="Delete Tab"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete Tab</span>
            <span className="sm:hidden">Delete</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl xl:max-w-7xl 2xl:max-w-none mx-auto w-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tab.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary/20 backdrop-blur-lg border border-primary/30 rounded-full text-[10px] font-display font-normal uppercase tracking-widest text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-normal tracking-wide mb-2 leading-none uppercase text-foreground">
              {tab.title || "Untitled Tab"}
            </h1>
            <p className="text-sm md:text-lg text-secondary font-medium tracking-wide">
              {tab.artist || "Unknown Artist"}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            <div className="flex items-center justify-between gap-3 p-4 bg-surface/50 backdrop-blur-lg rounded-2xl border border-border shadow-inner w-full md:w-auto overflow-x-auto">
              <div className="text-center flex-1 md:flex-none px-4">
                <p className="text-[10px] font-display font-normal text-muted-foreground uppercase tracking-widest mb-1">
                  Base
                </p>
                <p className="text-2xl font-display font-normal text-muted-foreground/50">
                  {tab.base_key}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1 md:flex-none px-4 relative group">
                <p className="text-[10px] font-display font-normal text-primary uppercase tracking-widest mb-1">
                  Current
                </p>
                <p className="text-2xl font-display font-normal text-primary">
                  {currentKey}
                </p>

                {/* Preferred Key Indicator */}
                {tab.preferred_key === currentKey && (
                  <div
                    className="absolute top-0 -right-2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(124,58,237,0.8)]"
                    title="Preferred Key"
                  />
                )}
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1 md:flex-none px-4">
                <p className="text-[10px] font-display font-normal text-muted-foreground uppercase tracking-widest mb-1">
                  Tuning
                </p>
                <p className="text-lg mt-1 font-display font-normal">
                  {tab.tuning}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {currentKey &&
                currentKey !== (tab.preferred_key || tab.base_key) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => onUpdatePreferredKey(currentKey)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/50 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full md:w-auto justify-center shadow-[0_0_10px_rgba(168,85,247,0.15)] min-h-[44px]"
                  >
                    <Save className="w-3 h-3" />
                    Save as Preferred Key
                  </motion.button>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* Transposition Controls */}
        <div className="mb-6 p-4 bg-surface/30 rounded-xl border border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTranspose(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-background border border-border hover:border-primary transition-colors min-w-[44px] min-h-[44px]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center min-w-[60px]">
                <motion.span
                  key={transpose}
                  initial={{ scale: 1.2, color: "#22c55e" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  className="text-3xl font-display font-normal leading-none"
                >
                  {transpose > 0 ? `+${transpose}` : transpose}
                </motion.span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                  Steps
                </span>
              </div>

              <button
                onClick={() => handleTranspose(1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-background border border-border hover:border-primary transition-colors min-w-[44px] min-h-[44px]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setTranspose(0)}
              disabled={transpose === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border min-h-[44px]",
                transpose === 0
                  ? "opacity-30 border-transparent text-muted-foreground cursor-not-allowed"
                  : "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary",
              )}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          <div className="flex bg-background p-1 rounded-lg border border-border w-full md:w-auto">
            <button
              onClick={() => setPreferSharps(true)}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-md text-[10px] font-bold transition-all min-h-[44px]",
                preferSharps
                  ? "bg-primary text-black"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sharps (#)
            </button>
            <button
              onClick={() => setPreferSharps(false)}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-md text-[10px] font-bold transition-all min-h-[44px]",
                !preferSharps
                  ? "bg-primary text-black"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Flats (b)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative group">
          <div className="absolute -top-3 -left-3 px-3 py-1 bg-primary text-black text-[10px] font-black rounded-md z-10 shadow-lg">
            BASS TAB
          </div>
          <div
            ref={scrollRef}
            className="bg-surface border border-border overflow-auto shadow-2xl relative transition-all duration-500 flex-1 flex flex-col p-8 rounded-3xl"
          >
            <pre
              className="font-mono leading-relaxed whitespace-pre select-text transition-all duration-300"
              style={{ fontSize: `${fontSize}px` }}
            >
              {transposedContent}
            </pre>

            {/* Decoration */}
            <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
              <Music className="w-24 h-24" />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <span>
            Created:{" "}
            {tab.created_at?.toDate?.().toLocaleDateString() || "Recently"}
          </span>
          <span>
            Last Edited:{" "}
            {tab.updated_at?.toDate?.().toLocaleDateString() || "Never"}
          </span>
        </div>
      </div>
    </div>
  );
}
