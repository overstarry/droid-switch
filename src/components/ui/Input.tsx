import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-8 w-full rounded-md border border-border bg-surface-elevated px-2.5 text-[13px] text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        mono && "font-mono text-xs",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
