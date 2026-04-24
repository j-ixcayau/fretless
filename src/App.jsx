import React, { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import TabDetail from './components/TabDetail'
import TabEditor from './components/TabEditor'
import Auth from './components/Auth'
import { useTabs } from './hooks/useTabs'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, AlertCircle, X, Menu } from 'lucide-react'
import { cn } from './lib/utils'
import { useEffect } from 'react'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { tabs, loading: tabsLoading, addTab, updateTab, deleteTab } = useTabs()
  const [selectedTabId, setSelectedTabId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector('input[placeholder*="Search"]')?.focus()
      }
      
      // Esc to close editor or deselect
      if (e.key === 'Escape') {
        if (isEditing) setIsEditing(false)
        else setSelectedTabId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  const selectedTab = tabs.find(t => t.id === selectedTabId)

  const filteredTabs = tabs.filter(tab => {
    const search = searchQuery.toLowerCase()
    return (
      tab.title?.toLowerCase().includes(search) ||
      tab.artist?.toLowerCase().includes(search) ||
      tab.tags?.some(tag => tag.toLowerCase().includes(search))
    )
  })

  const handleCreateNew = () => {
    setSelectedTabId(null)
    setIsEditing(true)
  }

  const handleSave = async (tabData) => {
    try {
      if (selectedTabId) {
        await updateTab(selectedTabId, tabData)
        showToast('Changes saved successfully')
      } else {
        const newTab = await addTab(tabData)
        showToast('Tab created successfully')
        if (newTab) setSelectedTabId(newTab.id)
      }
      setIsEditing(false)
    } catch (error) {
      showToast('Failed to save tab', 'error')
    }
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar Drawer */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        <div className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar 
            tabs={filteredTabs}
            loading={tabsLoading}
            selectedTabId={selectedTabId}
            onSelectTab={(id) => {
              setSelectedTabId(id)
              setIsEditing(false)
              setIsSidebarOpen(false) // Close on selection
            }}
            onCreateNew={() => {
              handleCreateNew()
              setIsSidebarOpen(false)
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        
        <main className="flex-1 overflow-y-auto relative h-full">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <TabEditor 
                  tab={selectedTab} 
                  onSave={handleSave} 
                  onCancel={() => setIsEditing(false)} 
                />
              </motion.div>
            ) : selectedTab ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full"
              >
                <TabDetail 
                  tab={selectedTab} 
                  onEdit={() => setIsEditing(true)}
                  onBack={() => setSelectedTabId(null)}
                  onMenu={() => setIsSidebarOpen(true)}
                  onDelete={() => {
                    deleteTab(selectedTabId)
                    setSelectedTabId(null)
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 relative"
              >
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden absolute top-4 left-4 p-2 bg-surface border border-border rounded-lg text-foreground"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 mb-4 rounded-full bg-surface border border-border flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">No tab selected</h3>
                <p className="text-center max-w-xs mb-6">Select a tab from the sidebar or create a new one to start practicing.</p>
                <button 
                  onClick={handleCreateNew}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Add Your First Tab
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
              toast.type === 'error' ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-primary/10 border-primary/50 text-primary"
            )}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
