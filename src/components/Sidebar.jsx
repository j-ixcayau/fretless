import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Plus, LogOut, Music, ChevronRight, Code, Download } from 'lucide-react';
import TabCard from './TabCard';
import { cn } from '../lib/utils';

export default function Sidebar({ 
  tabs, 
  loading, 
  selectedTabId, 
  onSelectTab, 
  onCreateNew,
  onImportJSON,
  onExportAll,
  searchQuery,
  onSearchChange
}) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-full md:w-80 h-full bg-surface border-r border-border flex flex-col z-20">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Music className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="font-sans font-black text-xl tracking-tight leading-none">BASS TABS</h1>
            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Manager</span>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by title, artist, tag..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
              {tabs.length}
            </span>
          )}
        </div>
      </div>

      {/* Tab List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Collection</span>
          <div className="flex items-center gap-1">
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
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface/50 rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : tabs.length === 0 ? (
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
