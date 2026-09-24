"use client";

import Image from "next/image";
import { cld } from "@/lib/cloudinary";

/**
 * Header visual for a project card.
 *
 * When the CMS has an image for the project it is shown (through Cloudinary's
 * f_auto,q_auto). Until real studio photography exists, the fallback is a
 * generated circuit motif seeded from the project title — deterministic, so a
 * given project always looks the same, and on-brand rather than an empty box.
 */

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

// Brand-derived tints; index chosen by the seed so cards vary but stay in family.
const TINTS = [
  { from: "hsl(9 55% 22%)", to: "hsl(9 45% 14%)", trace: "hsl(41 87% 55%)" },
  { from: "hsl(342 43% 24%)", to: "hsl(342 35% 14%)", trace: "hsl(36 90% 62%)" },
  { from: "hsl(25 55% 22%)", to: "hsl(25 45% 13%)", trace: "hsl(41 80% 58%)" },
  { from: "hsl(85 30% 20%)", to: "hsl(85 25% 12%)", trace: "hsl(60 60% 60%)" },
  { from: "hsl(200 35% 20%)", to: "hsl(200 30% 12%)", trace: "hsl(190 70% 60%)" },
];

export const ProjectVisual = ({
  title, image, className = "",
}: { title: string; image?: string; className?: string }) => {
  if (image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={cld(image, "f_auto,q_auto,w_700")}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 380px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-oxblood/50 to-transparent" />
      </div>
    );
  }

  const seed = hash(title);
  const tint = TINTS[seed % TINTS.length];

  // Lay nodes on a jittered grid and wire them with right-angle traces.
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const s = hash(title + i);
    return { x: 20 + ((s % 5) * 68) + (i % 2) * 18, y: 24 + ((s >> 3) % 4) * 42 };
  });

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${tint.from}, ${tint.to})` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 380 190"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
      >
        {/* Traces: horizontal run, then a vertical drop, like a PCB route. */}
        {nodes.slice(0, -1).map((n, i) => {
          const m = nodes[i + 1];
          return (
            <path
              key={i}
              d={`M ${n.x} ${n.y} H ${(n.x + m.x) / 2} V ${m.y} H ${m.x}`}
              fill="none"
              stroke={tint.trace}
              strokeOpacity={0.28}
              strokeWidth={1.5}
            />
          );
        })}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x} cy={n.y} r={i % 3 === 0 ? 4 : 2.5}
            fill={tint.trace}
            fillOpacity={i % 3 === 0 ? 0.55 : 0.32}
          />
        ))}
      </svg>
    </div>
  );
};

export default ProjectVisual;
