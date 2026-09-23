"use client";

import { useSection } from "@/contexts/SiteContentContext";
import { resolveIcon } from "@/lib/site-content";

export default function OutreachSection() {
  const { fields, items: programs } = useSection("outreach");

  return (
    <section id="outreach" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Outreach Programs
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            We believe technology should serve everyone. Our outreach programmes extend the
            studio&apos;s expertise to schools, communities, and partner institutions across Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {programs.map((program) => {
            const Icon = resolveIcon(program.icon);
            return (
              <div
                key={program.title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all duration-300 flex flex-col"
              >
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-4">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-bold text-foreground mb-3 leading-snug">{program.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                  {program.description}
                </p>
                <div className="flex flex-col gap-1 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reach</span>
                    <span className="text-foreground font-medium">{program.reach}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="text-primary font-medium">{program.frequency}</span>
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
