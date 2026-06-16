import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";
import TabDetail from "./components/TabDetail";
import TabEditor from "./components/TabEditor";
import Auth from "./components/Auth";
import { useTabs } from "./hooks/useTabs";
import { useSetlists } from "./hooks/useSetlists";
import SetlistDetail from "./components/SetlistDetail";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Menu,
  FileJson,
  Save,
  Wand2,
  ImagePlus,
  Loader2,
  Settings,
} from "lucide-react";
import { analyzeSong } from "./lib/gemini";
import { cn } from "./lib/utils";

function TabDetailWrapper({
  tabs,
  deleteTab,
  updateTab,
  showToast,
  setIsSidebarOpen,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const tab = tabs.find((t) => t.id === id);

  if (!tab)
    return (
      <div className="p-8 text-center text-muted-foreground w-full">
        Tab not found
      </div>
    );

  return (
    <motion.div
      key={`detail-${id}`}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex-1 flex flex-col min-h-0 w-full"
    >
      <TabDetail
        tab={tab}
        onEdit={() => navigate(`/tabs/${id}/edit`)}
        onBack={() => navigate("/")}
        onMenu={() => setIsSidebarOpen(true)}
        onDelete={() => {
          deleteTab(id);
          navigate("/");
        }}
        onUpdatePreferredKey={(newKey) => {
          updateTab(id, { preferred_key: newKey })
            .then(() => showToast("Changes saved successfully"))
            .catch(() => showToast("Failed to save tab", "error"));
        }}
      />
    </motion.div>
  );
}

function TabEditorWrapper({ tabs, addTab, updateTab, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const tab = id ? tabs.find((t) => t.id === id) : null;

  const handleSave = async (tabData) => {
    try {
      if (id) {
        await updateTab(id, tabData);
        showToast("Changes saved successfully");
        navigate(`/tabs/${id}`);
      } else {
        const newTab = await addTab(tabData);
        showToast("Tab created successfully");
        if (newTab) navigate(`/tabs/${newTab.id}`);
        else navigate("/");
      }
    } catch (error) {
      showToast("Failed to save tab", "error");
    }
  };

  return (
    <motion.div
      key={`editor-${id || "new"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col min-h-0 w-full"
    >
      <TabEditor tab={tab} onSave={handleSave} onCancel={() => navigate(-1)} />
    </motion.div>
  );
}

function SetlistDetailWrapper({
  setlists,
  tabs,
  updateSetlist,
  deleteSetlist,
  setIsSidebarOpen,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const setlist = setlists.find((s) => s.id === id);

  if (!setlist)
    return (
      <div className="p-8 text-center text-muted-foreground w-full">
        Setlist not found
      </div>
    );

  return (
    <motion.div
      key={`setlist-${id}`}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex-1 flex flex-col min-h-0 w-full"
    >
      <SetlistDetail
        setlist={setlist}
        allTabs={tabs}
        onUpdate={(updates) => updateSetlist(id, updates)}
        onDelete={() => {
          deleteSetlist(id);
          navigate("/");
        }}
        onBack={() => navigate("/")}
        onMenu={() => setIsSidebarOpen(true)}
        onPlay={(index) => {
          const tabId = setlist.tabs[index];
          if (tabId) navigate(`/tabs/${tabId}`);
        }}
      />
    </motion.div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const {
    tabs,
    loading: tabsLoading,
    addTab,
    updateTab,
    deleteTab,
  } = useTabs();
  const {
    setlists,
    loading: setlistsLoading,
    addSetlist,
    updateSetlist,
    deleteSetlist,
  } = useSetlists();
  const [activeView, setActiveView] = useState("tabs"); // 'tabs' or 'setlists'
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (location.pathname.startsWith("/setlists")) {
      setActiveView("setlists");
    } else {
      setActiveView("tabs");
    }
  }, [location.pathname]);
  const [isImporting, setIsImporting] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [isSmartImporting, setIsSmartImporting] = useState(false);
  const [smartImportText, setSmartImportText] = useState("");
  const [smartImportFile, setSmartImportFile] = useState(null);
  const [isSmartImportLoading, setIsSmartImportLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem("geminiApiKey") || "",
  );

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }

      // Esc to close editor or deselect
      if (e.key === "Escape") {
        if (
          location.pathname.endsWith("/edit") ||
          location.pathname === "/tabs/new"
        ) {
          navigate(-1);
        } else if (location.pathname !== "/") {
          navigate("/");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Sort tabs A-Z by title
  const sortedTabs = [...tabs].sort((a, b) =>
    (a.title || "").localeCompare(b.title || ""),
  );

  const filteredTabs = sortedTabs.filter((tab) => {
    const search = searchQuery.toLowerCase();
    return (
      tab.title?.toLowerCase().includes(search) ||
      tab.artist?.toLowerCase().includes(search) ||
      tab.tags?.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  const handleCreateNew = () => {
    navigate("/tabs/new");
  };

  const handleCreateSetlist = async () => {
    try {
      const newSetlist = await addSetlist({ name: "New Setlist", tabs: [] });
      if (newSetlist) {
        navigate(`/setlists/${newSetlist.id}`);
      }
      showToast("Setlist created");
    } catch (error) {
      showToast("Failed to create setlist", "error");
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importJson);
      if (Array.isArray(data)) {
        for (const tab of data) {
          const { id, ...tabData } = tab;
          await addTab(tabData);
        }
        showToast(`${data.length} tabs imported successfully`);
      } else {
        const { id, ...tabData } = data;
        await addTab(tabData);
        showToast("Tab imported successfully");
      }
      setIsImporting(false);
      setImportJson("");
    } catch (error) {
      showToast("Invalid JSON format", "error");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setImportJson(evt.target.result);
    reader.readAsText(file);
  };

  const handleExportAll = () => {
    try {
      const dataStr = JSON.stringify(tabs, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bass-tabs-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Export successful");
    } catch (error) {
      showToast("Export failed", "error");
    }
  };

  const executeSmartImport = async () => {
    if (!smartImportText.trim() && !smartImportFile) return;
    setIsSmartImportLoading(true);
    try {
      const tabData = await analyzeSong(smartImportText, smartImportFile);
      const newTab = await addTab(tabData);
      showToast(`${tabData.title || "Song"} imported successfully!`);
      if (newTab) navigate(`/tabs/${newTab.id}`);
      setIsSmartImporting(false);
      setSmartImportText("");
      setSmartImportFile(null);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to analyze song", "error");
    } finally {
      setIsSmartImportLoading(false);
    }
  };

  const handleSmartFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSmartImportFile(file);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem("geminiApiKey", geminiApiKey.trim());
    setIsSettingsOpen(false);
    showToast("Settings saved successfully");
  };

  return (
    <>
      {/* Import Modal */}
      <AnimatePresence>
        {isImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 90 }}
              className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Import from JSON</h2>
                    <p className="text-xs text-muted-foreground">
                      Paste the tab JSON structure here
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImporting(false)}
                  aria-label="Close"
                  className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{ "title": "...", "artist": "...", ... }'
                  className="w-full h-64 p-4 bg-background border border-border rounded-xl font-mono text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="p-6 bg-muted/50 border-t border-border flex gap-3 justify-between items-center">
                <div>
                  <input
                    type="file"
                    accept=".json"
                    id="json-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="json-upload"
                    className="px-4 py-2 text-sm font-bold border border-border hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  >
                    Upload .json File
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsImporting(false)}
                    className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importJson.trim()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Import Modal */}
      <AnimatePresence>
        {isSmartImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 90 }}
              className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Smart Import</h2>
                    <p className="text-xs text-muted-foreground">
                      AI-powered song tab extraction
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSmartImporting(false)}
                  disabled={isSmartImportLoading}
                  aria-label="Close"
                  className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Paste a URL, song lyrics, or chords. You can also upload a
                  screenshot or photo of a tab, and our AI will automatically
                  format it for you.
                </p>
                <textarea
                  value={smartImportText}
                  onChange={(e) => setSmartImportText(e.target.value)}
                  placeholder="Paste URL or text here..."
                  className="w-full h-32 p-4 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  disabled={isSmartImportLoading}
                />

                <div className="flex items-center gap-4">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    OR
                  </span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="smart-image-upload"
                    className="hidden"
                    onChange={handleSmartFileChange}
                    disabled={isSmartImportLoading}
                  />
                  <label
                    htmlFor="smart-image-upload"
                    className={cn(
                      "flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                      smartImportFile
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-muted/50 hover:border-primary/30",
                      isSmartImportLoading &&
                        "opacity-50 cursor-not-allowed pointer-events-none",
                    )}
                  >
                    <ImagePlus
                      className={cn(
                        "w-5 h-5",
                        smartImportFile
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm font-bold">
                      {smartImportFile
                        ? smartImportFile.name
                        : "Upload Image or Screenshot"}
                    </span>
                  </label>
                  {smartImportFile && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSmartImportFile(null);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface rounded-md text-muted-foreground transition-colors"
                      disabled={isSmartImportLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 bg-muted/50 border-t border-border flex justify-end gap-3 items-center">
                <button
                  onClick={() => setIsSmartImporting(false)}
                  disabled={isSmartImportLoading}
                  className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSmartImport}
                  disabled={
                    (!smartImportText.trim() && !smartImportFile) ||
                    isSmartImportLoading
                  }
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSmartImportLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Import Song
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 90 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Settings</h2>
                    <p className="text-xs text-muted-foreground">
                      App configuration & API keys
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  aria-label="Close"
                  className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">
                    Gemini API Key
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Required for the Smart Import feature. Your key is stored
                    securely in your browser's local storage and is only used to
                    communicate with the Google Gemini API.
                  </p>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  />
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline font-bold inline-block mt-2"
                  >
                    Get a free API key from Google AI Studio &rarr;
                  </a>
                </div>
              </div>
              <div className="p-6 bg-muted/50 border-t border-border flex justify-end gap-3 items-center">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-sm font-bold hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-[100dvh] overflow-hidden bg-background">
        {/* Sidebar Drawer */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <div
          className={cn(
            "fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar
            tabs={filteredTabs}
            setlists={setlists}
            loading={tabsLoading || setlistsLoading}
            activeView={activeView}
            setActiveView={setActiveView}
            onSelectTab={(id) => {
              navigate(`/tabs/${id}`);
              setIsSidebarOpen(false); // Close on selection
            }}
            onSelectSetlist={(id) => {
              navigate(`/setlists/${id}`);
              setIsSidebarOpen(false);
            }}
            onCreateNew={() => {
              handleCreateNew();
              setIsSidebarOpen(false);
            }}
            onCreateSetlist={() => {
              handleCreateSetlist();
              setIsSidebarOpen(false);
            }}
            onImportJSON={() => {
              setIsImporting(true);
              setIsSidebarOpen(false);
            }}
            onSmartImport={() => {
              setIsSmartImporting(true);
              setIsSidebarOpen(false);
            }}
            onOpenSettings={() => {
              setIsSettingsOpen(true);
              setIsSidebarOpen(false);
            }}
            onExportAll={() => {
              handleExportAll();
              setIsSidebarOpen(false);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <main className="flex-1 relative overflow-hidden flex flex-col w-full">
          <Routes
            location={location}
            key={location.pathname.split("/")[1] || "/"}
          >
            <Route
              path="/tabs/new"
              element={
                <TabEditorWrapper
                  tabs={tabs}
                  addTab={addTab}
                  updateTab={updateTab}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/tabs/:id/edit"
              element={
                <TabEditorWrapper
                  tabs={tabs}
                  addTab={addTab}
                  updateTab={updateTab}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/tabs/:id"
              element={
                <TabDetailWrapper
                  tabs={tabs}
                  deleteTab={deleteTab}
                  updateTab={updateTab}
                  showToast={showToast}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              }
            />
            <Route
              path="/setlists/:id"
              element={
                <SetlistDetailWrapper
                  setlists={setlists}
                  tabs={tabs}
                  updateSetlist={updateSetlist}
                  deleteSetlist={deleteSetlist}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              }
            />
            <Route
              path="/"
              element={
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 relative w-full"
                >
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open Menu"
                    className="lg:hidden absolute top-4 left-4 p-2 bg-card/50 backdrop-blur-md border border-border rounded-xl text-foreground hover:bg-card/80 hover:border-primary/50 transition-all shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-24 h-24 mb-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                  >
                    <svg
                      className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                  </motion.div>
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-display font-normal text-foreground mb-3 tracking-wide text-center"
                  >
                    Nothing selected
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center max-w-sm mb-8 text-lg"
                  >
                    Select a tab or setlist from the sidebar or create a new one
                    to get started.
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4 sm:px-0"
                  >
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden w-full sm:flex-1 px-6 py-4 bg-card/30 backdrop-blur-sm border border-border text-foreground rounded-xl font-bold hover:bg-card/50 hover:border-primary/50 transition-all text-center group min-h-[44px]"
                    >
                      <span className="group-hover:text-primary transition-colors">
                        Browse Collection
                      </span>
                    </button>
                    <button
                      onClick={handleCreateNew}
                      className="w-full sm:flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] text-center min-h-[44px]"
                    >
                      Add First Tab
                    </button>
                  </motion.div>
                </motion.div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md",
              toast.type === "error"
                ? "bg-red-500/10 border-red-500/50 text-red-500"
                : "bg-primary/10 border-primary/50 text-primary",
            )}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span className="font-bold text-sm">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss Toast"
              className="ml-2 hover:opacity-70 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
