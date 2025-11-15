import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, value, ...props }: React.ComponentProps<"textarea">) {
  // Coerce explicit `null` value to empty string to avoid React warning
  // If `value` is `undefined`, leave it undefined so the component can be uncontrolled.
  const safeValue = value === null ? '' : value;

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      // eslint-disable-next-line react/jsx-props-no-spreading
      value={safeValue as any}
      {...props}
    />
  );
}

export { Textarea };
