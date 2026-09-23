"use client";

import { Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import { useSection } from "@/contexts/SiteContentContext";

export default function ContactSection() {
  const { fields } = useSection("contact");

  return (
    <section id="contact" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
              Get In Touch
            </span>
            <h2 className="text-4xl font-black text-foreground mb-6">
              {fields.heading}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Whether you want to join the studio, collaborate on a project, partner with us, or
              simply learn more — our doors are open.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-0.5">Location</div>
                  <div className="text-sm text-muted-foreground">
                    {fields.address}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-0.5">Email</div>
                  <a
                    href={`mailto:${fields.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {fields.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-0.5">Phone</div>
                  <a href={`tel:${(fields.phone ?? "").replace(/\s/g, "")}`} className="text-sm text-primary hover:underline">
                    {fields.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-xl border border-border bg-card">
              <div className="text-sm font-semibold text-foreground mb-1">Studio Hours</div>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Monday – Friday</span>
                  <span>8:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM – 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-muted-foreground">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">Send us a message</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Emeka"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Okafor"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="emeka@unilag.edu.ng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                <select className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">Select a topic</option>
                  <option>Join the Studio</option>
                  <option>Internship Enquiry</option>
                  <option>Partnership / Sponsorship</option>
                  <option>Research Collaboration</option>
                  <option>Workshop Registration</option>
                  <option>General Enquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                <textarea
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  placeholder="Tell us what you have in mind..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Send Message
                <ExternalLink className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}