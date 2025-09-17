"use client";
import { useMemo, useState } from "react";

const mockTrends = [
  { tag: "#AIshorts", growth: 128, category: "tech" },
  { tag: "#StudioVlog", growth: 74, category: "creator" },
  { tag: "#MorningRoutine", growth: 45, category: "lifestyle" },
  { tag: "#Unboxing", growth: 32, category: "products" },
  { tag: "#TinyDesk", growth: 58, category: "music" },
];

export default function InspirePage() {
  const [query, setQuery] = useState("");
  const [persona, setPersona] = useState("videographer");
  const [topics, setTopics] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return mockTrends.filter((t) => t.tag.toLowerCase().includes(q));
  }, [query]);

  function suggestTopics() {
    const seed = `${persona}-${query || "general"}`;
    const base = [
      `Behind the scenes of ${persona}`,
      `Top 5 tips for ${persona}s`,
      `How I plan a ${persona} project`,
      `Budget gear for ${persona}s`,
      `Mistakes to avoid as a ${persona}`,
    ];
    setTopics(base.map((b) => `${b} • ${seed}`));
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium">Trend discovery</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trends..."
              className="px-3 py-2 rounded-md border w-60"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 p-4">
            {filtered.map((t) => (
              <div key={t.tag} className="rounded-lg border p-4 flex items-center gap-3">
                <img
                  src={`https://source.unsplash.com/collection/190727/160x90?${t.category}`}
                  alt={t.category}
                  className="w-28 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <div className="font-medium">{t.tag}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{t.growth}% growth this week</div>
                </div>
                <button className="px-3 py-1.5 rounded-md border">Save</button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4 space-y-4 bg-[var(--card)]">
          <div className="font-medium">Creator customization</div>
          <label className="text-sm">Persona</label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="px-3 py-2 rounded-md border w-full"
          >
            <option value="videographer">Videographer</option>
            <option value="photographer">Photographer</option>
            <option value="educator">Educator</option>
            <option value="streamer">Streamer</option>
            <option value="musician">Musician</option>
          </select>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Short-form
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Long-form
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Live streams
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Podcasts
            </label>
          </div>
          <button className="px-3 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] w-full">Save preferences</button>
        </div>
      </div>

      <div className="rounded-xl border p-4 bg-[var(--card)]">
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Describe your niche or prompt..."
            className="px-3 py-2 rounded-md border flex-1 min-w-64"
          />
          <button onClick={suggestTopics} className="px-4 py-2 rounded-md bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">
            AI Topic Suggester
          </button>
          <button className="px-4 py-2 rounded-md border">Connect AWS</button>
        </div>
        {!!topics.length && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {topics.map((t, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">{t}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}