import { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useTabs } from "./hooks/useTabs";
import { useSetlists } from "./hooks/useSetlists";
import { analyzeSong } from "./lib/gemini";

import Auth from "./components/Auth";
import Library from "./components/Library";
import TabDetail from "./components/TabDetail";
import TabEditor from "./components/TabEditor";
import SetlistDetail from "./components/SetlistDetail";
import ImportJsonModal from "./components/modals/ImportJsonModal";
import SmartImportModal from "./components/modals/SmartImportModal";
import SettingsModal from "./components/modals/SettingsModal";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";

// Gentle per-page transition (enter only, keeps navigation snappy).
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function TabDetailWrapper({ tabs, deleteTab, updateTab, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const tab = tabs.find((t) => t.id === id);

  if (!tab) {
    return (
      <div className="p-8 text-center text-muted-foreground h-full flex items-center justify-center">
        Song not found
      </div>
    );
  }

  return (
    <Page>
      <TabDetail
        tab={tab}
        onEdit={() => navigate(`/tabs/${id}/edit`)}
        onBack={() => navigate("/")}
        onDelete={() => {
          deleteTab(id);
          navigate("/");
        }}
        onEnterPlayMode={() =>
          updateTab(id, { last_played_at: serverTimestamp() }).catch(() => {})
        }
        onUpdatePreferredKey={(newKey) => {
          updateTab(id, { preferred_key: newKey })
            .then(() => showToast("Preferred key saved"))
            .catch(() => showToast("Failed to save", "error"));
        }}
      />
    </Page>
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
        showToast("Changes saved");
        navigate(`/tabs/${id}`);
      } else {
        const newTab = await addTab(tabData);
        showToast("Song created");
        navigate(newTab ? `/tabs/${newTab.id}` : "/");
      }
    } catch {
      showToast("Failed to save", "error");
    }
  };

  return (
    <Page>
      <TabEditor tab={tab} onSave={handleSave} onCancel={() => navigate(-1)} />
    </Page>
  );
}

function SetlistDetailWrapper({
  setlists,
  tabs,
  updateSetlist,
  deleteSetlist,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const setlist = setlists.find((s) => s.id === id);

  if (!setlist) {
    return (
      <div className="p-8 text-center text-muted-foreground h-full flex items-center justify-center">
        Setlist not found
      </div>
    );
  }

  return (
    <Page>
      <SetlistDetail
        setlist={setlist}
        allTabs={tabs}
        onUpdate={(updates) => updateSetlist(id, updates)}
        onDelete={() => {
          deleteSetlist(id);
          navigate("/");
        }}
        onBack={() => navigate("/")}
        onPlay={(index) => {
          const tabId = setlist.tabs[index];
          if (tabId) navigate(`/tabs/${tabId}`);
        }}
      />
    </Page>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { tabs, loading: tabsLoading, addTab, updateTab, deleteTab } = useTabs();
  const {
    setlists,
    loading: setlistsLoading,
    addSetlist,
    updateSetlist,
    deleteSetlist,
  } = useSetlists();

  // Library filter/sort state (persisted where noted).
  const [activeView, setActiveView] = useState(
    () => localStorage.getItem("chordly.view") || "tabs",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortMode, setSortMode] = useState(
    () => localStorage.getItem("chordly.sort") || "az",
  );

  useEffect(() => localStorage.setItem("chordly.view", activeView), [activeView]);
  useEffect(() => localStorage.setItem("chordly.sort", sortMode), [sortMode]);

  // Modals
  const [isImporting, setIsImporting] = useState(false);
  const [isSmartImporting, setIsSmartImporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem("geminiApiKey") || "",
  );

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(
      () => setToast(null),
      type === "error" ? 6000 : 3000,
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector('input[placeholder^="Search"]')?.focus();
      }
      if (e.key === "Escape") {
        // Don't navigate while an overlay owns Escape (modal, confirm dialog,
        // or Play Mode) — those close themselves.
        if (
          document.querySelector("[data-overlay-open]") ||
          document.fullscreenElement ||
          document.webkitFullscreenElement
        ) {
          return;
        }
        if (location.pathname.endsWith("/edit") || location.pathname === "/tabs/new") {
          navigate(-1);
        } else if (location.pathname !== "/") {
          navigate("/");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location.pathname, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth />;

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  // Delete a tab and scrub it from any setlist that references it.
  const handleDeleteTab = async (tabId) => {
    await deleteTab(tabId);
    const affected = setlists.filter((s) => (s.tabs || []).includes(tabId));
    await Promise.all(
      affected.map((s) =>
        updateSetlist(s.id, {
          tabs: (s.tabs || []).filter((id) => id !== tabId),
        }),
      ),
    );
  };

  const handleCreateSetlist = async () => {
    try {
      const newSetlist = await addSetlist({ name: "New Setlist", tabs: [] });
      if (newSetlist) navigate(`/setlists/${newSetlist.id}`);
      showToast("Setlist created");
    } catch {
      showToast("Failed to create setlist", "error");
    }
  };

  const handleImportJson = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      const items = Array.isArray(data) ? data : [data];
      Promise.all(
        items.map((item) => {
          const rest = { ...item };
          delete rest.id;
          return addTab(rest);
        }),
      ).then(() =>
        showToast(
          `${items.length} ${items.length === 1 ? "song" : "songs"} imported`,
        ),
      );
    } catch {
      showToast("Invalid JSON format", "error");
    }
  };

  const handleExportAll = () => {
    try {
      const blob = new Blob([JSON.stringify(tabs, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chordly-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Export successful");
    } catch {
      showToast("Export failed", "error");
    }
  };

  const handleSmartImport = async ({ text, file }) => {
    try {
      const tabData = await analyzeSong(text, file);
      const newTab = await addTab(tabData);
      showToast(`${tabData.title || "Song"} imported`);
      if (newTab) navigate(`/tabs/${newTab.id}`);
    } catch (error) {
      showToast(error.message || "Failed to analyze song", "error");
      throw error; // keep modal open to retry
    }
  };

  const handleSaveSettings = (key) => {
    localStorage.setItem("geminiApiKey", key);
    setGeminiApiKey(key);
    setIsSettingsOpen(false);
    showToast("Settings saved");
  };

  return (
    <div
      className="relative h-[100dvh] w-full bg-background overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="h-full w-full">
        <Routes location={location}>
          <Route
            path="/"
            element={
              <Page>
                <Library
                  tabs={tabs}
                  setlists={setlists}
                  loading={tabsLoading || setlistsLoading}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedTags={selectedTags}
                  onToggleTag={toggleTag}
                  onClearTags={() => setSelectedTags([])}
                  sortMode={sortMode}
                  onSortMode={setSortMode}
                  onSelectTab={(id) => navigate(`/tabs/${id}`)}
                  onSelectSetlist={(id) => navigate(`/setlists/${id}`)}
                  onSmartImport={() => setIsSmartImporting(true)}
                  onCreateNew={() => navigate("/tabs/new")}
                  onCreateSetlist={handleCreateSetlist}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </Page>
            }
          />
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
                deleteTab={handleDeleteTab}
                updateTab={updateTab}
                showToast={showToast}
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
              />
            }
          />
        </Routes>
      </div>

      {/* Modals */}
      <ImportJsonModal
        open={isImporting}
        onClose={() => setIsImporting(false)}
        onImport={handleImportJson}
      />
      <SmartImportModal
        open={isSmartImporting}
        onClose={() => setIsSmartImporting(false)}
        onImport={handleSmartImport}
      />
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialKey={geminiApiKey}
        onSave={handleSaveSettings}
        onImportJson={() => setIsImporting(true)}
        onExportAll={handleExportAll}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className={cnToast(toast.type)}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span className="font-bold text-sm">{toast.message}</span>
            <button
              onClick={() => {
                if (toastTimer.current) clearTimeout(toastTimer.current);
                setToast(null);
              }}
              aria-label="Dismiss"
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cnToast(type) {
  const base =
    "fixed bottom-5 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md max-w-[92vw]";
  return type === "error"
    ? `${base} bg-red-500/10 border-red-500/40 text-red-400`
    : `${base} bg-primary/15 border-primary/40 text-primary`;
}

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
