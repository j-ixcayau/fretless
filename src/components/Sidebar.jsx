import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Plus, LogOut, Music, ChevronRight, Code, Download, ListMusic, FileText } from 'lucide-react';
import TabCard from './TabCard';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function Sidebar({ 
  tabs, 
  setlists,
  loading, 
  activeView, // 'tabs' or 'setlists'
  setActiveView,
  selectedTabId, 
  onSelectTab, 
  selectedSetlistId,
  onSelectSetlist,
  onCreateNew,
  onCreateSetlist,
  onImportJSON,
  onExportAll,
  searchQuery,
  onSearchChange
}) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-full md:w-80 h-full bg-card backdrop-blur-lg border-r border-border flex flex-col z-20">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Music className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="font-sans font-black text-xl tracking-tight leading-none">BASS TABS</h1>
            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Manager</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-background p-1 rounded-xl border border-border mb-4">
          <button
            onClick={() => setActiveView('tabs')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              activeView === 'tabs' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3 h-3" />
            Songs
          </button>
          <button
            onClick={() => setActiveView('setlists')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              activeView === 'setlists' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListMusic className="w-3 h-3" />
            Setlists
          </button>
        </div>

        {activeView === 'tabs' && (
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by title, artist, tag..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 mt-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {activeView === 'tabs' ? 'Your Collection' : 'Your Setlists'}
          </span>
          <div className="flex items-center gap-1">
            {activeView === 'tabs' ? (
              <>
                <button 
                  onClick={onImportJSON}
                  className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-all group"
                  title="Import from JSON"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button 
                  onClick={onExportAll}
                  className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-all"
                  title="Export all tabs to JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={onCreateNew}
                  className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-all"
                  title="Create New Tab"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={onCreateSetlist}
                className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-all"
                title="Create New Setlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface/50 rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : activeView === 'tabs' ? (
          tabs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground">No tabs found matching your search.</p>
            </div>
          ) : (
            tabs.map(tab => (
              <TabCard
                key={tab.id}
                tab={tab}
                isActive={selectedTabId === tab.id}
                onClick={() => onSelectTab(tab.id)}
              />
            ))
          )
        ) : (
          /* Setlists View */
          setlists?.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground">You haven't created any setlists yet.</p>
              <button 
                onClick={onCreateSetlist}
                className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-black transition-colors"
              >
                Create Setlist
              </button>
            </div>
          ) : (
            setlists?.map(setlist => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={setlist.id}
                onClick={() => onSelectSetlist(setlist.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-300 group flex items-center justify-between relative overflow-hidden backdrop-blur-sm",
                  selectedSetlistId === setlist.id
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "bg-surface/30 border-border hover:border-primary/50 hover:bg-surface/60"
                )}
              >
                <div>
                  <h3 className={cn("font-bold truncate text-lg transition-colors", selectedSetlistId === setlist.id ? "text-primary" : "text-foreground group-hover:text-primary")}>
                    {setlist.name || 'Untitled Setlist'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(setlist.tabs || []).length} songs
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  selectedSetlistId === setlist.id ? "text-primary translate-x-1" : "text-muted-foreground group-hover:text-primary group-hover:translate-x-1"
                )} />
                {selectedSetlistId === setlist.id && (
                  <motion.div 
                    layoutId="activeSetlistIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
                  />
                )}
              </motion.button>
            ))
          )
        )}
      </div>

      {/* User Section */}
      <div className="p-4 mt-auto border-t border-border bg-surface/50">
        <div className="flex items-center gap-3">
          <img 
            src={user?.photoURL} 
            alt={user?.displayName} 
            className="w-10 h-10 rounded-full border border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
