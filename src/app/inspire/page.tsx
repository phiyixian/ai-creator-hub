"use client";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

type TrendData = {
  tag: string;
  growth: number;
  category: string;
  description?: string;
  imageUrl?: string;
  source?: string;
  timestamp?: string;
};

type TopicSuggestion = {
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  platforms: string[];
  tags: string[];
  engagement: "high" | "medium" | "low";
  source?: string;
  timestamp?: string;
};

export default function InspirePage() {
  const [query, setQuery] = useState("");
  const [persona, setPersona] = useState("videographer");
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState(""); // <-- NEW

  // Fetch trends data
  useEffect(() => {
    fetchTrends();
  }, [query]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("limit", "10");
      
      const response = await fetch(`/api/ai/trends?${params}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTrends(data.trends || []);
      }
    } catch (err) {
      setError("Failed to fetch trends");
      console.error("Error fetching trends:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return trends.filter((t) => t.tag.toLowerCase().includes(q));
  }, [query, trends]);

  async function suggestTopics() {
  setLoading(true);
  setError(null);
  try {
    const payload = {
      persona,
      query: (topic || "").trim() || undefined, // <-- use TOPIC here
      preferences: { contentTypes: ["short-form", "long-form"] },
      count: 5,
    };

    // (optional) debug in browser console
    console.log("[client] /api/ai/topics payload:", payload);

    const response = await fetch("/api/ai/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[client] /api/ai/topics response:", data); // optional debug

    if (data.error) {
      setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
    } else {
      setTopics(data.suggestions || []);
    }
  } catch (err) {
    setError("Failed to generate topics");
    console.error("Error generating topics:", err);
  } finally {
    setLoading(false);
  }
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
          <h1 className="page-title">
            <span className="bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,0,255,0.25)]">
              Inspire
            </span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-[var(--muted-foreground)]">Discover trends, spark ideas, and tailor inspiration to your creator persona.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border overflow-hidden bg-gradient-to-b from-transparent to-[var(--card)]">
          <div className="p-4 border-b flex items-center justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]">
            <div className="font-medium flex items-center gap-2 text-base md:text-lg">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]" />
              Trend discovery
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trends..."
              className="input-soft w-52 md:w-60"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 p-4">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading trends...</span>
              </div>
            ) : error ? (
              <div className="col-span-2 text-center py-8">
                <div className="text-red-400 text-sm">{error}</div>
                <button 
                  onClick={fetchTrends}
                  className="mt-2 px-3 py-1.5 btn-soft text-sm"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-[var(--muted-foreground)]">
                No trends found. Try a different search term.
              </div>
            ) : (
              filtered.map((t, idx) => (
                <motion.div
                  key={t.tag}
                  className="group rounded-lg border p-4 flex items-center gap-3 bg-background/60 backdrop-blur-sm hover:border-cyan-400/60 transition shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * idx, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                >
                  <img
                    src={t.imageUrl || `https://source.unsplash.com/featured/320x180?${t.category}`}
                    alt={t.category}
                    className="w-28 h-16 object-cover rounded-md"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="font-medium tracking-tight group-hover:text-cyan-300 transition">
                      {t.tag}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {t.growth}% growth this week
                    </div>
                    {t.description && (
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">
                        {t.description}
                      </div>
                    )}
                    {t.source && (
                      <div className="text-xs text-cyan-400 mt-1">
                        Powered by {t.source}
                      </div>
                    )}
                  </div>
                  <button className="px-3 py-1.5 btn-gradient text-sm">
                    Save
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border p-4 space-y-4 bg-[var(--card)] relative overflow-hidden">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl z-0" />
          <div className="font-medium">Creator customization</div>
          <label className="text-sm">Persona</label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="input-soft w-full"
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
          <button className="px-3 py-2 w-full btn-gradient">
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
  className="input-soft flex-1 min-w-64"
  value={topic}                    // <-- bind
  onChange={(e) => setTopic(e.target.value)}  // <-- bind
/>
          <button
            onClick={suggestTopics}
            disabled={loading}
            className="px-4 py-2 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "AI Topic Suggester"}
          </button>
          {/* <button className="px-4 py-2 btn-soft text-sm md:text-base">
            Connect AWS
          </button> */}
        </div>
        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm">
            {error}
          </div>
        )}
        {!!topics.length && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {topics.map((topic, i) => (
              <motion.div
                key={i}
                className="rounded-lg border p-4 bg-background/60 backdrop-blur-sm hover:border-fuchsia-400/60 transition"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * i, duration: 0.3 }}
              >
                <div className="space-y-2">
                  <div className="font-medium text-sm">{topic.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {topic.description}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topic.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-fuchsia-500/20 text-fuchsia-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span className="capitalize">{topic.difficulty}</span>
                    <span>{topic.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-cyan-400">Platforms:</span>
                    <span>{topic.platforms.join(", ")}</span>
                  </div>
                  {topic.source && (
                    <div className="text-xs text-cyan-400">
                      Powered by {topic.source}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}