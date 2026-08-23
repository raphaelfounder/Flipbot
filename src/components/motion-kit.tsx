"use client";

import { ArrowRight } from "lucide-react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { MouseEvent, ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CursorGlow() {
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const x = useSpring(mouseX, { stiffness: 70, damping: 22 });
  const y = useSpring(mouseY, { stiffness: 70, damping: 22 });

  useEffect(() => {
    if (reduceMotion) return;
    const move = (event: PointerEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [mouseX, mouseY, reduceMotion]);

  const background = useMotionTemplate`radial-gradient(820px circle at ${x}px ${y}px, rgba(36,107,253,0.16), transparent 60%)`;

  return (
    <>
      <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden md:block" style={{ background }} />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-20 z-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[140px] md:hidden"
        animate={reduceMotion ? undefined : { x: [-30, 30, -30], y: [0, 35, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 22, filter: reduceMotion ? "none" : "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MagneticButton({
  children,
  href = "#",
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 180, damping: 18 });
  const y = useSpring(my, { stiffness: 180, damping: 18 });

  function move(event: MouseEvent<HTMLAnchorElement>) {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set((event.clientX - rect.left - rect.width / 2) * 0.12);
    my.set((event.clientY - rect.top - rect.height / 2) * 0.12);
  }

  return (
    <motion.a
      href={href}
      style={{ x, y }}
      onMouseMove={move}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.025 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      className={cn(
        "group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl border px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300",
        variant === "primary"
          ? "border-blue-300/30 bg-blue-600 text-white shadow-[0_0_32px_rgba(36,107,253,0.45),0_0_80px_rgba(36,107,253,0.18)] hover:bg-blue-500 hover:shadow-[0_0_42px_rgba(76,141,255,0.58),0_0_110px_rgba(36,107,253,0.28)]"
          : "border-white/10 bg-white/[0.035] text-white hover:border-blue-300/30 hover:bg-white/[0.06]",
        className,
      )}
    >
      {variant === "primary" ? (
        <span
          aria-hidden
          className="absolute -inset-10 animate-[spin_7s_linear_infinite] bg-[conic-gradient(from_90deg,transparent,rgba(56,189,248,.9),rgba(36,107,253,1),rgba(99,102,241,.85),rgba(20,184,166,.75),transparent_42%)] opacity-50 blur-xl transition-opacity duration-300 group-hover:opacity-95"
        />
      ) : null}
      <span
        className={cn(
          "absolute inset-[1px] rounded-[11px] transition-colors",
          variant === "primary" ? "bg-blue-600/95 group-hover:bg-blue-500/95" : "bg-[#070b14]/95 group-hover:bg-[#0b1322]/95",
        )}
        aria-hidden
      />
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </motion.a>
  );
}

export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(360px circle at ${mouseX}px ${mouseY}px, rgba(60,120,255,0.14), transparent 60%)`;
  return (
    <motion.div
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseX.set(event.clientX - rect.left);
        mouseY.set(event.clientY - rect.top);
      }}
      className={cn("group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06080d]", className)}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glow }} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => `${prefix}${Math.round(latest).toLocaleString("en-GB")}${suffix}`);
  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [motionValue, value]);
  return <motion.span>{rounded}</motion.span>;
}

export function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
