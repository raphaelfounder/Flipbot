"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TypingAnimation({
  text,
  speed = 42,
  delay = 250,
  className,
  cursorClassName,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const start = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(start);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;

    const timeout = window.setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);

    return () => window.clearTimeout(timeout);
  }, [displayed, speed, started, text]);

  return (
    <span className={cn("inline", className)} aria-label={text}>
      <span aria-hidden="true">{displayed}</span>
      <span
        aria-hidden="true"
        className={cn("ml-1 inline-block h-[0.9em] w-[0.06em] translate-y-[0.08em] animate-pulse bg-current", cursorClassName)}
      />
    </span>
  );
}
