import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function TabCard({ tab, isActive, onClick }) {
  // Key color family logic
  const getKeyColor = (key) => {
    if (!key) return 'bg-muted';
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    
    if (sharpKeys.includes(key)) return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    if (flatKeys.includes(key)) return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const firstLine = tab.content?.split('\n').find(l => l.includes('|')) || '';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden backdrop-blur-sm",
        isActive 
          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
          : "bg-surface/30 border-border hover:bg-surface/60 hover:border-primary/50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold truncate text-lg transition-colors",
            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
          )}>
            {tab.title || 'Untitled Tab'}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {tab.artist || 'Unknown Artist'}
          </p>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider",
          getKeyColor(tab.base_key)
        )}>
          {tab.base_key || '??'}
        </span>
      </div>

      <div className="mt-3 relative">
        <div className="font-mono text-[10px] text-muted-foreground/50 truncate leading-none">
          {firstLine}
        </div>
      </div>

      {isActive && (
        <motion.div 
          layoutId="activeTabIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
        />
      )}
    </motion.button>
  );
}
