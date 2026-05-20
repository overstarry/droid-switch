import * as React from "react";
import { cn } from "@/lib/cn";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mb-1.5 block text-[12px] font-medium leading-none tracking-[0.01em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";
