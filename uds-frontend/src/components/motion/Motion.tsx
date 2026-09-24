"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion, useInView, useReducedMotion, useMotionValue, useSpring, type Variants,
} from "framer-motion";

/**
 * Shared motion primitives.
 *
 * Every component here collapses to a no-op when the visitor has
 * `prefers-reduced-motion` set — motion is decoration, never the only way
 * content becomes visible.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children into view once, on scroll. */
export const Reveal = ({
  children, delay = 0, y = 24, className,
}: { children: ReactNode; delay?: number; y?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

const listVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Wraps a grid/list so its children animate in one after another. */
export const Stagger = ({
  children, className,
}: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={listVariants}
      initial="hidden"
      animate={inView ? "shown" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

/** A single child of <Stagger>. */
export const StaggerItem = ({
  children, className,
}: { children: ReactNode; className?: string }) => {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
};

/**
 * Counts up to a number when scrolled into view. Accepts values like "200+"
 * and animates only the numeric part, preserving any prefix/suffix.
 */
export const CountUp = ({ value, className }: { value: string; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  const match = value.match(/^(\D*)(\d[\d,]*)(.*)$/);
  const prefix = match?.[1] ?? "";
  const target = match ? Number(match[2].replace(/,/g, "")) : NaN;
  const suffix = match?.[3] ?? "";

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1400, bounce: 0 });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (inView && !reduced && !Number.isNaN(target)) mv.set(target);
  }, [inView, reduced, target, mv]);

  useEffect(() => spring.on("change", (v) => setShown(Math.round(v))), [spring]);

  // Anything non-numeric (or reduced motion) just renders as-is.
  if (Number.isNaN(target) || reduced) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString()}
      {suffix}
    </span>
  );
};

/**
 * Continuously scrolling row, duplicated so the loop is seamless.
 * Freezes entirely under reduced motion.
 */
export const Marquee = ({
  children, speed = 40, className,
}: { children: ReactNode; speed?: number; className?: string }) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={`flex flex-wrap justify-center gap-3 ${className ?? ""}`}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {/* Fade the edges so items enter and leave rather than popping. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        {children}
        {/* aria-hidden: the duplicate exists only to make the loop seamless. */}
        <div className="flex gap-3" aria-hidden="true">{children}</div>
      </motion.div>
    </div>
  );
};
