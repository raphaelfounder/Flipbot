"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type MenuItem = {
  label: string;
  href: string;
  items?: Array<{ title: string; copy: string; href: string }>;
};

export function MotionNavigationMenu({ items }: { items: MenuItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const activeItem = items.find((item) => item.label === active);

  return (
    <div onMouseLeave={() => setActive(null)} className="relative hidden md:block">
      <div className="flex items-center gap-2 rounded-xl p-1 text-sm text-slate-300">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onMouseEnter={() => setActive(item.label)}
            onFocus={() => setActive(item.label)}
            className="relative rounded-lg px-4 py-2 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
          >
            {active === item.label ? (
              <motion.span
                layoutId="flipbot-nav-pill"
                className="absolute inset-0 rounded-lg bg-blue-400/10 ring-1 ring-blue-200/10"
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </a>
        ))}
      </div>
      <AnimatePresence>
        {activeItem?.items?.length ? (
          <motion.div
            key={activeItem.label}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="absolute left-1/2 top-full mt-3 w-[430px] -translate-x-1/2 rounded-2xl border border-blue-200/10 bg-[#040812]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl"
          >
            <div className="grid grid-cols-2 gap-1">
              {activeItem.items.map((subItem) => (
                <a
                  key={subItem.title}
                  href={subItem.href}
                  className="rounded-xl p-4 transition-colors hover:bg-blue-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
                >
                  <span className="block text-sm font-semibold text-white">{subItem.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{subItem.copy}</span>
                </a>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SquarePattern({ className, gridSize = 10 }: { className?: string; gridSize?: number }) {
  const reduceMotion = useReducedMotion();
  const cells = useMemo(() => Array.from({ length: gridSize * gridSize }, (_, i) => i), [gridSize]);

  return (
    <div className={cn("pointer-events-none grid opacity-45", className)} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
      {cells.map((cell) => (
        <motion.span
          key={cell}
          className="aspect-square border border-blue-100/[0.035] bg-blue-400/[0.015]"
          animate={
            reduceMotion
              ? undefined
              : {
                  backgroundColor: ["rgba(59,130,246,0.015)", "rgba(76,141,255,0.12)", "rgba(59,130,246,0.015)"],
                  opacity: [0.35, 0.9, 0.35],
                }
          }
          transition={{
            duration: 2.8,
            repeat: Infinity,
            delay: (cell % gridSize) * 0.08 + Math.floor(cell / gridSize) * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function SideBySideSlide({
  beforeImage,
  afterImage,
  beforeAlt,
  afterAlt,
  children,
  className,
}: {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  children?: ReactNode;
  className?: string;
}) {
  const pointer = useMotionValue(52);
  const x = useSpring(pointer, { stiffness: 420, damping: 38 });
  const xPercent = useTransform(x, (latest) => `${latest}%`);

  return (
    <motion.div
      className={cn("relative overflow-hidden rounded-2xl border border-blue-200/15 bg-[#030711]", className)}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.set(Math.max(10, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100)));
      }}
      onPointerLeave={() => pointer.set(52)}
    >
      <Image src={afterImage} alt={afterAlt} fill sizes="360px" className="object-cover" />
      <motion.div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: xPercent }}>
        <div className="relative h-full w-full">
          <Image src={beforeImage} alt={beforeAlt} fill sizes="360px" className="object-cover" />
        </div>
      </motion.div>
      <motion.div className="absolute inset-y-0 w-0.5 bg-blue-200 shadow-[0_0_20px_rgba(76,141,255,.9)]" style={{ left: xPercent }} />
      <motion.div className="absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-blue-100/40 bg-blue-500 text-xs font-semibold text-white shadow-[0_0_24px_rgba(36,107,253,.45)]" style={{ left: xPercent }}>
        ↔
      </motion.div>
      {children}
    </motion.div>
  );
}
