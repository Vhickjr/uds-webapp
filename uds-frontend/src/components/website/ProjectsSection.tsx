"use client";

import { useSection } from "@/contexts/SiteContentContext";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";
import { ProjectVisual } from "@/components/website/ProjectVisual";

// Fallback accent for items added through the CMS, which carry no colour.
const ACCENT = "hsl(9 55% 32%)";
import { ExternalLink, Users, Tag } from "lucide-react";

export default function ProjectsSection() {
  const { fields, items: projects } = useSection("projects");

  return (
    <section id="projects" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Reveal className="mb-14 max-w-2xl">
          <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Innovation Projects
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
            <p className="text-muted-foreground text-lg">
              Our students tackle challenges across agriculture, health, energy, and infrastructure —
              using the studio&apos;s resources to go from idea to working prototype.
            </p>
          </div>
        </Reveal>

        {/* Grid */}
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <StaggerItem key={project.title} className="h-full">
            <div
              className="group relative flex h-full flex-col rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
            >
              <ProjectVisual title={project.title} image={project.image} className="h-40 w-full shrink-0" />
              <div className="p-6 flex flex-col flex-1">
              {/* Accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 z-10"
                style={{ background: project.color || ACCENT }}
              />

              {/* Status badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs px-2 py-0.5 rounded-full border font-medium"
                  style={{
                    color: project.color || ACCENT,
                    borderColor: `${project.color || ACCENT}40`,
                    background: `${project.color || ACCENT}15`,
                  }}
                >
                  {project.status}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {project.team} members
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                {project.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {(project.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
                </div>
              </div>
            </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
          >
            Interested in joining a project? Get in touch
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}