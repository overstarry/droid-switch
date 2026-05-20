import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary:
    "bg-surface-elevated text-foreground border border-border-strong hover:bg-surface",
  outline:
    "border border-border-strong bg-transparent text-foreground hover:bg-surface-elevated",
  ghost: "text-foreground hover:bg-surface-elevated",
  destructive:
    "bg-transparent text-destructive hover:bg-destructive-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[11px]",
  md: "h-8 px-3.5 text-xs",
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
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors whitespace-nowrap",
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
