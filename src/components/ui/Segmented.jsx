import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Two-or-more option segmented control.
 * options: [{ value, label }]
 */
export default function Segmented({ options, value, onChange, className }) {
  return (
    <div
      className={cn(
        "flex bg-surface border border-border-chrome rounded-xl p-[3px]",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex-1 py-2 rounded-[9px] text-xs font-bold transition-colors",
              active ? "text-white" : "text-icon-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.div
                layoutId="segmentedActive"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 bg-primary rounded-[9px]"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
