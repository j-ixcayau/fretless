import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Info, Code, Eye, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function TabEditor({ tab, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    base_key: 'E',
    preferred_key: '',
    tuning: 'Standard',
    tags: '',
    content: '',
    ...tab
  });

  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'split', 'preview'
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'
  
  const textareaRef = useRef(null);

  // Convert tags array to string for editing
  useEffect(() => {
    if (tab?.tags) {
      setFormData(prev => ({ ...prev, tags: tab.tags.join(', ') }));
    }
  }, [tab]);

  // Handle Cmd+S shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveStatus('dirty');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ ...formData, tags: tagsArray });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Cheatsheet content
  const CHEATSHEET = `
Standard 4-String Bass:
G |----------------|
D |----------------|
A |----------------|
E |----------------|

Common Symbols:
/ : Slide up
\\ : Slide down
h : Hammer-on
p : Pull-off
b : Bend
~ : Vibrato
(n) : Ghost note
  `.trim();

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-border" />
          <h2 className="font-bold text-lg">{tab ? 'Edit Tab' : 'New Tab'}</h2>
          {saveStatus !== 'idle' && (
            <span className="text-xs font-medium text-muted-foreground animate-pulse">
              {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <button 
              onClick={() => setViewMode('edit')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'edit' ? "bg-surface shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Edit Mode"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={cn(
                "p-2 rounded-md transition-all hidden md:block",
                viewMode === 'split' ? "bg-surface shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Split View"
            >
              <Code className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'preview' ? "bg-surface shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Preview Mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Side */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden p-4 md:p-6 gap-4",
          viewMode === 'preview' ? 'hidden' : 'flex'
        )}>
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Song Title"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-lg font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Artist</label>
              <input
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                placeholder="Artist / Band"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Base Key</label>
                <select
                  name="base_key"
                  value={formData.base_key}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 appearance-none"
                >
                  {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preferred Key</label>
                <select
                  name="preferred_key"
                  value={formData.preferred_key || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 appearance-none"
                >
                  <option value="">None (Use Base)</option>
                  {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tuning</label>
                <input
                  name="tuning"
                  value={formData.tuning}
                  onChange={handleChange}
                  placeholder="Standard, Drop D..."
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags (comma separated)</label>
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="rock, simple, beginner..."
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tab Content (ASCII)</label>
              <button 
                onClick={() => setShowCheatsheet(!showCheatsheet)}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Info className="w-3 h-3" />
                Formatting Cheatsheet
              </button>
            </div>

            {showCheatsheet && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl font-mono text-xs whitespace-pre text-primary"
              >
                {CHEATSHEET}
              </motion.div>
            )}

            <textarea
              ref={textareaRef}
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="G |----------------|
D |----------------|
A |----------------|
E |----------------|"
              className="flex-1 w-full h-full p-6 bg-surface border border-border rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono text-sm resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        </div>

        {/* Preview Side */}
        <div className={cn(
          "flex-1 bg-background border-l border-border flex flex-col overflow-hidden",
          viewMode === 'edit' ? 'hidden' : 'flex'
        )}>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 block">Live Preview</label>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black">{formData.title || 'Untitled Tab'}</h1>
                <p className="text-xl text-muted-foreground">{formData.artist || 'Unknown Artist'}</p>
              </div>
              
              <div className="flex gap-4">
                <div className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-bold">
                  Key: {formData.base_key}
                </div>
                <div className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-bold">
                  Tuning: {formData.tuning}
                </div>
              </div>

              <div className="p-6 bg-surface rounded-2xl border border-border overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed whitespace-pre">
                  {formData.content || 'Start typing to see preview...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
