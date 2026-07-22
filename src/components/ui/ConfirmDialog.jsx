import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

const ConfirmContext = createContext(() => Promise.resolve(false));

/**
 * In-app replacement for window.confirm. Wrap the app in <ConfirmProvider>
 * and call `const confirm = useConfirm()` -> `await confirm({ ... })`.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({
        title: "Are you sure?",
        message: "",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        tone: "danger",
        ...options,
      });
    });
  }, []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => close(false)}
              data-overlay-open
              className="fixed inset-0 z-[300] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 16, opacity: 0 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-border w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-5 flex flex-col items-center text-center gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center",
                      state.tone === "danger"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {state.title}
                  </h3>
                  {state.message && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {state.message}
                    </p>
                  )}
                </div>
                <div className="p-4 pt-0 flex gap-2">
                  <button
                    onClick={() => close(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-foreground bg-surface-elevated border border-border-chrome hover:bg-muted transition-colors"
                  >
                    {state.cancelLabel}
                  </button>
                  <button
                    onClick={() => close(true)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors",
                      state.tone === "danger"
                        ? "bg-destructive hover:bg-destructive/90"
                        : "bg-primary hover:bg-primary-hover",
                    )}
                  >
                    {state.confirmLabel}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
