import * as React from "react";
import { cn } from "@/lib/cn";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mb-2 block font-mono text-[10px] font-semibold leading-none tracking-[0.09em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";
