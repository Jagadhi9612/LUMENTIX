import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass min-w-0 rounded-lg p-5 sm:p-6", className)} {...props} />;
}
