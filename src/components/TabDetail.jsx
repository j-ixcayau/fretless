import React, { useState, useMemo } from 'react';
import { Edit3, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Music, RotateCcw, Menu, Save, Play, X, Maximize2, Minimize2 } from 'lucide-react';
import { transposeTab, transposeChord, getInterval } from '../lib/transposer';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function TabDetail({ tab, onEdit, onDelete, onBack, onMenu, onUpdatePreferredKey }) {
  const [transpose, setTranspose] = useState(0);
  const [preferSharps, setPreferSharps] = useState(true);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  // Auto-transpose to preferred key on load
  React.useEffect(() => {
    if (tab.preferred_key && tab.base_key && tab.preferred_key !== tab.base_key) {
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
    setTranspose(prev => {
      const next = prev + delta;
      // Keep within -12 to +12 semitones
      if (next < -12) return -12;
      if (next > 12) return 12;
      return next;
    });
  };

  const togglePlayMode = () => {
    if (!isPlayMode) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
      setIsPlayMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsPlayMode(false);
    }
  };

  // Handle escape key to exit play mode
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPlayMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-background relative">
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Tab</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <button 
            onClick={togglePlayMode}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg font-bold hover:bg-muted transition-all"
          >
            <Play className="w-4 h-4 text-primary fill-primary/20" />
            <span className="hidden sm:inline">Play Mode</span>
            <span className="sm:hidden">Play</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this tab?')) {
                onDelete();
              }
            }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            title="Delete Tab"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Play Mode Overlay Controls */}
      <AnimatePresence>
        {isPlayMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[100] flex items-center gap-3 p-3 bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-xl border border-border">
              <button onClick={() => setFontSize(s => Math.max(10, s - 2))} className="p-1 hover:text-primary">-</button>
              <span className="text-[10px] font-black w-8 text-center">{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(40, s + 2))} className="p-1 hover:text-primary">+</button>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl xl:max-w-7xl 2xl:max-w-none mx-auto w-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {tab.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-surface border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-2 leading-none uppercase">{tab.title || 'Untitled Tab'}</h1>
            <p className="text-2xl text-muted-foreground font-medium">{tab.artist || 'Unknown Artist'}</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4">
             <div className="flex items-center gap-4 md:gap-6 p-4 bg-surface rounded-2xl border border-border shadow-inner w-full md:w-auto">
               <div className="text-center flex-1 md:flex-none">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Base Key</p>
                 <p className="text-2xl font-black text-muted-foreground/50">{tab.base_key}</p>
               </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center flex-1 md:flex-none relative group">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Current Key</p>
                  <p className="text-2xl font-black text-primary">{currentKey}</p>
                  
                  {/* Preferred Key Indicator */}
                  {tab.preferred_key === currentKey && (
                    <div className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full animate-pulse" title="Preferred Key" />
                  )}
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center flex-1 md:flex-none">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tuning</p>
                  <p className="text-xl font-bold">{tab.tuning}</p>
                </div>
              </div>
              
              <AnimatePresence>
                {currentKey && currentKey !== (tab.preferred_key || tab.base_key) && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={() => onUpdatePreferredKey(currentKey)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-primary/30 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/10 transition-all w-full md:w-auto justify-center"
                  >
                    <Save className="w-3 h-3" />
                    Save as Preferred Key
                  </motion.button>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Transposition Controls */}
        <div className="mb-8 p-6 bg-surface/50 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start order-2 md:order-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Transposition</h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleTranspose(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border hover:border-primary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center min-w-[80px]">
                <motion.span 
                  key={transpose}
                  initial={{ scale: 1.2, color: '#f59e0b' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-2xl font-black"
                >
                  {transpose > 0 ? `+${transpose}` : transpose}
                </motion.span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Semitones</span>
              </div>

              <button 
                onClick={() => handleTranspose(1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border hover:border-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center order-1 md:order-2">
            <button 
              onClick={() => setTranspose(0)}
              disabled={transpose === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                transpose === 0 
                  ? "opacity-30 border-transparent text-muted-foreground cursor-not-allowed" 
                  : "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
              )}
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Original
            </button>
          </div>

          <div className="flex flex-col items-center md:items-end order-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Notation</h3>
            <div className="flex bg-background p-1 rounded-xl border border-border">
              <button 
                onClick={() => setPreferSharps(true)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  preferSharps ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sharps (#)
              </button>
              <button 
                onClick={() => setPreferSharps(false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  !preferSharps ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Flats (b)
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative group">
           {!isPlayMode && (
             <div className="absolute -top-3 -left-3 px-3 py-1 bg-primary text-black text-[10px] font-black rounded-md z-10 shadow-lg">
               BASS TAB
             </div>
           )}
            <div className={cn(
              "bg-surface border border-border overflow-auto shadow-2xl relative transition-all duration-500 flex-1 flex flex-col",
              isPlayMode ? "fixed inset-0 z-[60] p-6 md:p-20 items-start md:items-center bg-background" : "p-8 rounded-3xl"
            )}>
              {isPlayMode && (
                <div className="mb-12 text-center w-full">
                  <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">{tab.title}</h1>
                  <p className="text-xl text-muted-foreground font-medium">{tab.artist} • <span className="text-primary">{currentKey}</span></p>
                </div>
              )}
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
          <span>Created: {tab.created_at?.toDate?.().toLocaleDateString() || 'Recently'}</span>
          <span>Last Edited: {tab.updated_at?.toDate?.().toLocaleDateString() || 'Never'}</span>
        </div>
      </div>
    </div>
  );
}
