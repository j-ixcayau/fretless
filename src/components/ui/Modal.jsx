import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Reusable modal shell. Renders a blurred backdrop and a spring-in panel
 * anchored to the bottom on phones, centered on wider screens.
 */
export default function Modal({
  open,
  onClose,
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
  closeDisabled = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !closeDisabled) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, closeDisabled]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !closeDisabled && onClose?.()}
          data-overlay-open
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="p-5 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{title}</h2>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => !closeDisabled && onClose?.()}
                disabled={closeDisabled}
                aria-label="Close"
                className="w-10 h-10 flex items-center justify-center rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">{children}</div>

            {footer && (
              <div className="p-5 border-t border-border flex justify-end gap-3 items-center bg-background/40">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
