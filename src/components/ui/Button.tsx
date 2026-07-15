import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "border border-accent bg-accent text-accent-foreground hover:bg-accent/90",
  secondary:
    "border border-border-strong bg-surface-elevated text-foreground hover:border-accent/70 hover:bg-surface",
  outline:
    "border border-border bg-transparent text-foreground hover:border-border-strong hover:bg-surface-elevated",
  ghost: "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
  destructive:
    "border border-destructive/50 bg-transparent text-destructive hover:bg-destructive-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[10px]",
  md: "h-10 px-3.5 text-[11px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-none font-mono font-semibold tracking-[0.07em] transition-colors whitespace-nowrap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
