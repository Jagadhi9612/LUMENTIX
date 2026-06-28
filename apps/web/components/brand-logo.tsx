import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  mark?: boolean;
};

export function BrandLogo({ className, imageClassName, mark = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black", className)}>
      <img
        src={mark ? "/logo-mark.jpeg" : "/logo.jpeg"}
        alt="Elite Fitness logo"
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
