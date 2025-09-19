"use client";
import { useMemo, useState } from "react";

type Metric = { label: string; value: string; delta: string };

const initialMetrics: Metric[] = [
  { label: "Total Views", value: "1.2M", delta: "+8%" },
  { label: "Watch Time", value: "38.4k h", delta: "+3%" },
  { label: "Followers", value: "92.1k", delta: "+1.2%" },
  { label: "Engagement", value: "6.4%", delta: "+0.9%" },
];

function daysInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export default function TrackPage() {
  const [metrics] = useState(initialMetrics);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const today = new Date();
  const dim = daysInMonth(today);
  const calendar = useMemo(() => Array.from({ length: dim }, (_, i) => i + 1), [dim]);

  const contentList = [
    { id: "vid-101", title: "Neon City Short", platform: "YouTube" },
    { id: "clip-204", title: "Studio Vlog 12", platform: "TikTok" },
    { id: "post-331", title: "Lighting Tips", platform: "Instagram" },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border p-4 bg-[var(--card)]">
            <div className="text-sm text-[var(--muted-foreground)]">{m.label}</div>
            <div className="text-2xl font-semibold">{m.value}</div>
            <div className="text-xs mt-1 text-emerald-600 dark:text-emerald-400">{m.delta} vs last 7d</div>
            <div className="mt-3 h-10 bg-[var(--secondary)] rounded-md" />
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium flex items-center justify-between">
          <div>Content calendar</div>
          <button className="px-3 py-1.5 btn-soft">Connect AWS</button>
        </div>
        <div className="grid grid-cols-7 gap-2 p-4 text-sm">
          {calendar.map((d) => (
            <div key={d} className="rounded-lg border p-2 min-h-20">
              <div className="text-[10px] text-[var(--muted-foreground)]">{d}</div>
              {d % 5 === 0 && (
                <div className="mt-1 px-2 py-1 rounded-md bg-[var(--sidebar-primary)]/10 text-[var(--sidebar-primary)]">Post</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium">Content rating</div>
        <div className="p-4 grid gap-3">
          {contentList.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{c.platform}</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    aria-label={`rate ${n}`}
                    onClick={() => setRatings((r) => ({ ...r, [c.id]: n }))}
                    className={
                      "w-7 h-7 rounded-full border grid place-items-center " +
                      ((ratings[c.id] || 0) >= n
                        ? "bg-yellow-400/80 text-black"
                        : "bg-transparent")
                    }
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}