import type { HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" className={`skeleton ${className}`.trim()} {...props} />;
}
