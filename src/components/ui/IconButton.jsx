import React from "react";
import { cn } from "../../lib/utils";

/**
 * Consistent icon-button used across the app chrome (back, edit, settings…).
 * Default: 34×34, #16152c bg, #2a2947 border, 10px radius.
 */
const IconButton = React.forwardRef(function IconButton(
  { icon: Icon, label, onClick, className, variant = "default", size = 34, ...rest },
  ref,
) {
  const variants = {
    default:
      "bg-surface border border-border-chrome text-icon-foreground hover:text-foreground hover:border-primary/50",
    ghost:
      "bg-transparent border border-transparent text-muted-foreground hover:text-foreground hover:bg-surface",
    danger:
      "bg-surface border border-border-chrome text-muted-foreground hover:text-destructive hover:border-destructive/50",
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-[10px] transition-colors shrink-0",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className="w-[18px] h-[18px]" /> : null}
    </button>
  );
});

export default IconButton;
