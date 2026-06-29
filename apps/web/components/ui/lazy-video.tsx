"use client";

import { useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LazyVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
  src: string;
  eager?: boolean;
};

function shouldAvoidVideo() {
  if (typeof window === "undefined") {
    return true;
  }

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

export function LazyVideo({ src, eager = false, className, ...props }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [activeSrc, setActiveSrc] = useState("");

  useEffect(() => {
    if (eager || activeSrc || shouldAvoidVideo()) {
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    const load = () => setActiveSrc(src);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load();
          observer.disconnect();
        }
      },
      { rootMargin: eager ? "1200px" : "360px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activeSrc, eager, src]);

  useEffect(() => {
    if (!eager || activeSrc || shouldAvoidVideo()) {
      return;
    }

    const timer = window.setTimeout(() => setActiveSrc(src), 900);
    return () => window.clearTimeout(timer);
  }, [activeSrc, eager, src]);

  return (
    <video
      ref={ref}
      className={cn("bg-[#111111]", className)}
      src={activeSrc || undefined}
      preload={activeSrc ? "metadata" : "none"}
      {...props}
    />
  );
}
