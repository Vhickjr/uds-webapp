"use client";

import { useSection } from "@/contexts/SiteContentContext";

// Fallback accent for items added through the CMS, which carry no colour.
const ACCENT = "hsl(41 87% 44%)";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";

export default function EventsSection() {
  const { fields, items: events } = useSection("events");

  return (
    <section id="events" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Events & Workshops
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            From beginner workshops to industry hackathons, our events calendar keeps the studio
            buzzing with activity year-round.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.title}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Date + type */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-secondary text-center border border-border">
                    <span className="text-xl font-black text-foreground leading-none">
                      {event.day}
                    </span>
                    <span className="text-xs text-primary font-semibold">{event.month}</span>
                  </div>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium border"
                  style={{
                    color: event.typeColor || ACCENT,
                    borderColor: `${event.typeColor || ACCENT}40`,
                    background: `${event.typeColor || ACCENT}15`,
                  }}
                >
                  {event.type}
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                {event.description}
              </p>

              <div className="space-y-1.5 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  {event.spots}
                </div>
              </div>

              <a
                href="#contact"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Register <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}