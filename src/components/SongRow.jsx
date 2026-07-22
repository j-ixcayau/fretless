import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import KeyBadge from "./ui/KeyBadge";

/**
 * Single library list row. Replaces the old TabCard styling.
 * 14px radius; active row gets an elevated fill, primary border and a
 * 4px accent bar.
 */
export default function SongRow({ tab, isActive, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-[14px] border transition-colors",
        isActive
          ? "bg-surface-elevated border-primary"
          : "bg-surface border-border hover:border-primary/40",
      )}
    >
      <div className="w-1 h-9 rounded-sm shrink-0">
        {isActive && <div className="w-full h-full rounded-sm bg-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-foreground font-bold text-[15px] truncate leading-tight">
          {tab.title || "Untitled"}
        </div>
        <div className="text-muted-foreground text-xs truncate mt-0.5">
          {tab.artist || "Unknown artist"}
        </div>
      </div>
      {tab.base_key && <KeyBadge musicKey={tab.base_key} />}
    </motion.button>
  );
}
