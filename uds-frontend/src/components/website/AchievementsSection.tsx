"use client";

import { useSection } from "@/contexts/SiteContentContext";
import { resolveIcon } from "@/lib/site-content";

const categoryColor: Record<string, string> = {
  Competition: "hsl(9 55% 32%)",
  Research: "hsl(342 43% 35%)",
  Grant: "hsl(41 87% 44%)",
  Milestone: "hsl(25 70% 45%)",
};

export default function AchievementsSection() {
  const { fields, items: achievements } = useSection("achievements");

  return (
    <section id="achievements" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Student Achievements
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            Design Studio students consistently punch above their weight, winning competitions,
            publishing research, and securing grants that put UNILAG on the global engineering map.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {achievements.map((item) => {
            const Icon = resolveIcon(item.icon);
            const color = categoryColor[item.category] || "hsl(9 55% 32%)";
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all duration-300"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ background: `${color}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                      style={{
                        color,
                        background: `${color}15`,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.year}</span>
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-3 leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}