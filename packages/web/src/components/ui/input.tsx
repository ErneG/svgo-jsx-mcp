import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm ring-offset-[rgb(var(--background))] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-[rgb(var(--destructive))] focus-visible:ring-[rgb(var(--destructive))]",
          className
        )}
        ref={ref}
        aria-invalid={ariaInvalid ?? !!error}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
