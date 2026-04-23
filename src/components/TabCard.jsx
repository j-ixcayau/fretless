import React from 'react';
import { cn } from '../lib/utils';

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
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
        isActive 
          ? "bg-surface border-primary shadow-lg shadow-primary/5" 
          : "bg-transparent border-transparent hover:bg-surface/50 hover:border-border"
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
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}
    </button>
  );
}
