import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useComponents } from '@/contexts/ComponentContext';

type Idea = {
  id: string;
  title: string;
  summary: string;
  requiredComponents: string[]; // component ids
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  guidance?: string[];
};

const SAVED_KEY = 'uds_savedIdeas';

export const ProjectIdeaGenerator: React.FC = () => {
  const { components } = useComponents();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [skill, setSkill] = useState<Idea['skillLevel']>('beginner');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [saved, setSaved] = useState<Idea[]>(() => {
    try { const raw = localStorage.getItem(SAVED_KEY); return raw ? JSON.parse(raw) as Idea[] : []; } catch { return []; }
  });

  useEffect(() => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch {} }, [saved]);

  const inventoryOptions = useMemo(() => components, [components]);

  const toggleSelect = (id: string) => {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const generateIdeas = async () => {
    if (selectedIds.length === 0) {
      toast({ title: 'Pick at least one inventory item', description: 'Select components to base the ideas on.' });
      return;
    }

    setLoading(true);
    setIdeas([]);

    const payload = {
      components: inventoryOptions.filter(c => selectedIds.includes(c.id)).map(c => ({ id: c.id, name: c.name })),
      skill,
      exampleCount: 3,
    };

    // Try backend LLM endpoint first
    try {
      const res = await fetch('/api/llm/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setIdeas(Array.isArray(data) ? data : []);
        setLoading(false);
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback: simple deterministic generator (frontend-only)
    const comps = inventoryOptions.filter(c => selectedIds.includes(c.id));
    const fallback: Idea[] = Array.from({ length: 3 }).map((_, idx) => ({
      id: Date.now().toString() + '-' + idx,
      title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} project using ${comps.map(c => c.name).slice(0, 2).join(' & ')}`,
      summary: `Build a ${skill} level project that uses ${comps.map(c => c.name).join(', ')}. Focus on hands-on learning and incremental milestones.`,
      requiredComponents: comps.map(c => c.id),
      skillLevel: skill,
    }));

    setIdeas(fallback);
    setLoading(false);
    toast({ title: 'Using frontend fallback', description: 'No LLM backend found — generated example ideas locally.' });
  };

  const saveIdea = async (idea: Idea) => {
    setSaved(s => [idea, ...s]);
    toast({ title: 'Saved', description: 'Idea saved locally.' });

    // try to persist to backend
    try {
      await fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(idea) });
    } catch (e) {
      // ignore
    }
  };

  const viewGuidance = async (idea: Idea) => {
    // Try backend guidance first
    try {
      const res = await fetch('/api/llm/guidance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea }) });
      if (res.ok) {
        const data = await res.json();
        setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, guidance: Array.isArray(data) ? data : [String(data)] } : i));
        return;
      }
    } catch {}

    // Fallback guidance: simple steps
    const steps = [
      `1) Gather parts: ${idea.requiredComponents.map(id => inventoryOptions.find(c => c.id === id)?.name).filter(Boolean).join(', ')}`,
      '2) Prototype basic circuit and test components individually',
      '3) Integrate components and write firmware (if needed)',
      '4) Build enclosure and document steps',
      '5) Test and iterate'
    ];

    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, guidance: steps } : i));
    toast({ title: 'Guidance ready', description: 'Provided a simple step-by-step plan (frontend fallback).' });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Project Idea Generator</h2>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block mb-2 font-medium">Select inventory items</label>
          <div className="grid grid-cols-2 gap-2">
            {inventoryOptions.map(it => (
              <label key={it.id} className={`p-2 border rounded cursor-pointer ${selectedIds.includes(it.id) ? 'bg-primary/10 border-primary' : 'bg-card'}`}>
                <input className="mr-2" type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} />
                <span className="font-medium">{it.name}</span>
                <div className="text-xs text-muted-foreground">{it.category} • {it.available}/{it.quantity}</div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">Skill level</label>
          <select value={skill} onChange={e => setSkill(e.target.value as Idea['skillLevel'])} className="w-full p-2 border rounded">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <div className="mt-4">
            <button disabled={loading} onClick={generateIdeas} className="px-4 py-2 bg-primary text-white rounded">{loading ? 'Generating...' : 'Generate Ideas'}</button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold">Ideas</h3>
        <div className="grid gap-3 mt-2">
          {ideas.length === 0 && <div className="text-sm text-muted-foreground">No ideas yet — select inventory and click Generate Ideas.</div>}
          {ideas.map(idea => (
            <div key={idea.id} className="p-3 border rounded bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{idea.title}</div>
                  <div className="text-xs text-muted-foreground">{idea.skillLevel}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveIdea(idea)} className="text-sm text-primary">Save Idea</button>
                  <button onClick={() => viewGuidance(idea)} className="text-sm text-secondary">View Guidance</button>
                </div>
              </div>
              <div className="mt-2 text-sm">{idea.summary}</div>
              {idea.guidance && (
                <ol className="mt-2 list-decimal list-inside text-sm">
                  {idea.guidance.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold">Saved Ideas</h3>
        <div className="grid gap-2 mt-2">
          {saved.length === 0 && <div className="text-sm text-muted-foreground">You have no saved ideas.</div>}
          {saved.map(s => (
            <div key={s.id} className="p-2 border rounded bg-card">
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.skillLevel}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProjectIdeaGenerator;
