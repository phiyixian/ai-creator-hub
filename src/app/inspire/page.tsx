"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header / Hero */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-fuchsia-500/10 via-cyan-500/10 to-purple-500/10">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(400px_200px_at_20%_0%,black,transparent)]">
          <div className="absolute -top-10 left-1/4 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute -bottom-10 right-1/4 h-40 w-40 rounded-full bg-cyan-500/30 blur-3xl" />
        </div>
        <div className="relative p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,0,255,0.25)]">
              Inspire
            </span>
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Discover trends, spark ideas, and tailor inspiration to your creator persona.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border overflow-hidden bg-gradient-to-b from-transparent to-[var(--card)]">
          <div className="p-4 border-b flex items-center justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]">
            <div className="font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]" />
              Trend discovery
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trends..."
              className="px-3 py-2 rounded-md border w-60 bg-background/70 backdrop-blur-sm focus:ring-2 focus:ring-fuchsia-500/60 focus:border-fuchsia-500/60 transition"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 p-4">
            {filtered.map((t, idx) => (
              <motion.div
                key={t.tag}
                className="group rounded-lg border p-4 flex items-center gap-3 bg-background/60 backdrop-blur-sm hover:border-cyan-400/60 transition shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * idx, duration: 0.35 }}
                whileHover={{ y: -2 }}
              >
                <img
                  src={`https://source.unsplash.com/featured/320x180?${t.category}`}
                  alt={t.category}
                  className="w-28 h-16 object-cover rounded-md"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="font-medium tracking-tight group-hover:text-cyan-300 transition">
                    {t.tag}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">{t.growth}% growth this week</div>
                </div>
                <button className="px-3 py-1.5 rounded-md border bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 hover:from-fuchsia-500/20 hover:to-cyan-500/20 text-foreground transition">
                  Save
                </button>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4 space-y-4 bg-[var(--card)] relative overflow-hidden">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="font-medium">Creator customization</div>
          <label className="text-sm">Persona</label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="px-3 py-2 rounded-md border w-full bg-background/70 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60 transition"
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
          <button className="px-3 py-2 rounded-md w-full border bg-gradient-to-r from-cyan-500/15 via-fuchsia-500/15 to-purple-500/15 hover:from-cyan-500/25 hover:via-fuchsia-500/25 hover:to-purple-500/25 transition">
            Save preferences
          </button>
        </div>
      </div>

      <div className="rounded-xl border p-4 bg-[var(--card)] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(300px_150px_at_right,black,transparent)]">
          <div className="absolute right-10 top-0 h-24 w-24 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Describe your niche or prompt..."
            className="px-3 py-2 rounded-md border flex-1 min-w-64 bg-background/70 backdrop-blur-sm focus:ring-2 focus:ring-fuchsia-500/60 focus:border-fuchsia-500/60 transition"
          />
          <button
            onClick={suggestTopics}
            className="px-4 py-2 rounded-md border bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 hover:from-fuchsia-500/30 hover:to-cyan-500/30 text-foreground transition shadow-[0_0_20px_-6px_rgba(217,70,239,0.35)]"
          >
            AI Topic Suggester
          </button>
          <button className="px-4 py-2 rounded-md border hover:border-cyan-400/60 hover:shadow-[0_0_18px_-6px_rgba(34,211,238,0.45)] transition">
            Connect AWS
          </button>
        </div>
        {!!topics.length && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {topics.map((t, i) => (
              <motion.div
                key={i}
                className="rounded-lg border p-3 text-sm bg-background/60 backdrop-blur-sm hover:border-fuchsia-400/60 transition"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * i, duration: 0.3 }}
              >
                {t}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}