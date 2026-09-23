"use client";

import { useSection } from "@/contexts/SiteContentContext";
import { resolveIcon } from "@/lib/site-content";

export default function ResearchSection() {
  const { fields, items: groups } = useSection("research");

  return (
    <section id="research" className="py-24 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Research Activities
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            Our research groups work at the intersection of technology and societal need, producing
            work published in international journals and presented at global conferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => {
            const Icon = resolveIcon(group.icon);
            return (
              <div
                key={group.name}
                className="rounded-2xl border border-border bg-card p-8 hover:border-primary/40 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{group.name}</h3>
                    <p className="text-xs text-primary font-medium">{group.focus}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {group.description}
                </p>

                <div className="flex gap-6 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-2xl font-black text-foreground">{group.papers}</div>
                    <div className="text-xs text-muted-foreground">Publications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-foreground">{group.members}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}