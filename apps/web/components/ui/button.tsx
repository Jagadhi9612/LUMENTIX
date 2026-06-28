import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#E10600]",
        variant === "primary" && "bg-[#E10600] text-white shadow-[0_12px_32px_rgba(225,6,0,0.28)] hover:bg-[#ff1710]",
        variant === "secondary" && "border border-white/12 bg-white/8 text-white hover:bg-white/12",
        variant === "ghost" && "text-white/80 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    />
  );
}
