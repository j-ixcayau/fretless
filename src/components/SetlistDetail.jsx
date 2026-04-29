import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, Save, X, Plus, Play, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SetlistDetail({ setlist, allTabs, onUpdate, onDelete, onBack, onMenu, onPlay }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(setlist.name || 'Untitled Setlist');
  const [isAddingMode, setIsAddingMode] = useState(false);

  const tabsInSetlist = (setlist.tabs || []).map(tabId => allTabs.find(t => t.id === tabId)).filter(Boolean);
  const availableTabs = allTabs.filter(t => !(setlist.tabs || []).includes(t.id));

  const handleSaveName = () => {
    onUpdate({ name });
    setIsEditing(false);
  };

  const addTabToSetlist = (tabId) => {
    onUpdate({ tabs: [...(setlist.tabs || []), tabId] });
  };

  const removeTabFromSetlist = (tabId) => {
    onUpdate({ tabs: (setlist.tabs || []).filter(id => id !== tabId) });
  };

  return (
    <div className="flex flex-col flex-1 bg-background relative h-full overflow-hidden min-h-0">
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-surface/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4 w-full">
          <button 
            onClick={onMenu}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button 
            onClick={onBack}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-background border border-border px-3 py-1 rounded-md text-foreground font-bold focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{setlist.name || 'Untitled Setlist'}</h2>
                <button onClick={() => setIsEditing(true)} className="p-1 text-muted-foreground hover:text-primary rounded-md">
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {tabsInSetlist.length > 0 && (
            <button 
              onClick={() => onPlay(0)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg"
            >
              <Play className="w-4 h-4 fill-black" />
              <span className="hidden sm:inline">Play Setlist</span>
            </button>
          )}

          <div className="h-6 w-px bg-border mx-2" />
          
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this setlist?')) {
                onDelete();
              }
            }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Songs in Setlist</h3>
            <button 
              onClick={() => setIsAddingMode(!isAddingMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                isAddingMode ? "bg-primary/20 text-primary" : "bg-surface border border-border hover:bg-muted"
              )}
            >
              {isAddingMode ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {isAddingMode ? "Done" : "Add Songs"}
            </button>
          </div>

          <div className="space-y-2">
            {tabsInSetlist.length === 0 ? (
              <div className="p-8 text-center bg-surface/50 border border-border border-dashed rounded-xl">
                <p className="text-muted-foreground mb-4">This setlist is empty.</p>
                <button 
                  onClick={() => setIsAddingMode(true)}
                  className="px-4 py-2 bg-primary text-black rounded-lg font-bold text-sm"
                >
                  Add Songs
                </button>
              </div>
            ) : (
              tabsInSetlist.map((tab, idx) => (
                <div key={tab.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl group hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-muted-foreground/30 w-6 text-center">{idx + 1}</span>
                    <div>
                      <h4 className="font-bold">{tab.title}</h4>
                      <p className="text-xs text-muted-foreground">{tab.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onPlay(idx)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-primary/20 hover:text-primary rounded-lg transition-all"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeTabFromSetlist(tab.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Songs Mode */}
        <AnimatePresence>
          {isAddingMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border pt-8 overflow-hidden"
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Available Songs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableTabs.map(tab => (
                  <div key={tab.id} className="flex items-center justify-between p-3 bg-surface/50 border border-border rounded-xl hover:bg-surface transition-colors">
                    <div>
                      <h4 className="font-bold text-sm">{tab.title}</h4>
                      <p className="text-xs text-muted-foreground">{tab.artist}</p>
                    </div>
                    <button 
                      onClick={() => addTabToSetlist(tab.id)}
                      className="p-1.5 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {availableTabs.length === 0 && (
                  <p className="text-muted-foreground text-sm p-4 col-span-2 text-center">No more songs available to add.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
