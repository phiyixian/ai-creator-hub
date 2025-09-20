"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type PostAnalytics = {
  id: string;
  title: string;
  platform: string;
  type: "text" | "visual";
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  reach: number;
  followers: number;
  postedAt: string; // ISO date string
};

// Mock data function
async function fetchMockAnalytics(): Promise<PostAnalytics[]> {
  await new Promise((res) => setTimeout(res, 500));
  return [
    {
      id: "1",
      title: "Spring Sale Launch",
      platform: "Instagram",
      type: "visual",
      likes: 120,
      shares: 30,
      comments: 15,
      saves: 10,
      reach: 2000,
      followers: 400,
      postedAt: "2025-09-01T20:00:00Z",
    },
    {
      id: "2",
      title: "Tips for SMEs",
      platform: "Facebook",
      type: "text",
      likes: 80,
      shares: 25,
      comments: 10,
      saves: 5,
      reach: 1500,
      followers: 505,
      postedAt: "2025-09-02T08:00:00Z",
    },
    {
      id: "3",
      title: "Behind the Scenes",
      platform: "TikTok",
      type: "visual",
      likes: 200,
      shares: 50,
      comments: 40,
      saves: 20,
      reach: 3500,
      followers: 520,
      postedAt: "2025-09-03T20:00:00Z",
    },
    {
      id: "4",
      title: "Customer Testimonial",
      platform: "LinkedIn",
      type: "text",
      likes: 90,
      shares: 20,
      comments: 35,
      saves: 12,
      reach: 1800,
      followers: 600,
      postedAt: "2025-09-07T10:00:00Z",
  },
  {
      id: "5",
      title: "Weekend Giveaway",
      platform: "Instagram",
      type: "visual",
      likes: 800,
      shares: 150,
      comments: 90,
      saves: 70,
      reach: 12000,
      followers: 2200,
      postedAt: "2025-09-10T18:00:00Z",
  },
  {
      id: "6",
      title: "Tech Blog Release",
      platform: "Twitter",
      type: "text",
      likes: 450,
      shares: 120,
      comments: 60,
      saves: 0,
      reach: 7000,
      followers: 1500,
      postedAt: "2025-09-12T09:45:00Z",
  },
  {
      id: "7",
      title: "Behind the Scenes",
      platform: "YouTube",
      type: "visual",
      likes: 1300,
      shares: 90,
      comments: 210,
      saves: 300,
      reach: 22000,
      followers: 5000,
      postedAt: "2025-09-14T21:00:00Z",
  },
  {
      id: "8",
      title: "Flash Sale Reminder",
      platform: "Instagram",
      type: "visual",
      likes: 270,
      shares: 40,
      comments: 22,
      saves: 18,
      reach: 3600,
      followers: 800,
      postedAt: "2025-09-16T13:00:00Z",
  },
  {
      id: "9",
      title: "Milestone Celebration - 10K Followers",
      platform: "Facebook",
      type: "visual",
      likes: 1100,
      shares: 220,
      comments: 95,
      saves: 50,
      reach: 15000,
      followers: 10000,
      postedAt: "2025-09-18T11:00:00Z",
  },
  ];
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, margin: 4 }}>
      <div style={{ fontSize: 14, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

export default function TrackPage() {
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendMetric, setTrendMetric] = useState<"followers" | "likes" | "shares" | "comments" | "reach" | "saves">("followers");

  const [startDate, setStartDate] = useState("2025-09-01");
  const [endDate, setEndDate] = useState("2025-09-30");

  useEffect(() => {
    fetchMockAnalytics()
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  }, []);


  // ✅ Filter analytics by date range
  const filteredAnalytics = analytics.filter((p) => {
    const d = new Date(p.postedAt).toISOString().slice(0, 10);
    return d >= startDate && d <= endDate;
  });

  // --- all your metric calculations should use filteredAnalytics ---
  const totalLikes = filteredAnalytics.reduce((sum, p) => sum + p.likes, 0);
  const totalShares = filteredAnalytics.reduce((sum, p) => sum + p.shares, 0);
  const totalComments = filteredAnalytics.reduce((sum, p) => sum + p.comments, 0);
  const totalSaves = filteredAnalytics.reduce((sum, p) => sum + p.saves, 0);
  const totalReach = filteredAnalytics.reduce((sum, p) => sum + p.reach, 0);

  // Growth Trend Data (dynamic by metric, but now filtered)
  const growthTrendMap: { [date: string]: number } = {};
  filteredAnalytics.forEach((p) => {
    const date = p.postedAt.slice(0, 10);
    growthTrendMap[date] = (growthTrendMap[date] || 0) + p[trendMetric];
  });
  const growthTrend = Object.entries(growthTrendMap).map(([date, value]) => ({ date, value }));
  
  // Best Performing Post
  const bestPost = analytics.reduce(
    (best, p) => (p.reach > (best?.reach || 0) ? p : best),
    undefined as PostAnalytics | undefined
  );

  // Text vs Visual
  const textPosts = analytics.filter((p) => p.type === "text");
  const visualPosts = analytics.filter((p) => p.type === "visual");
  const textAvg = textPosts.length ? textPosts.reduce((s, p) => s + p.reach, 0) / textPosts.length : 0;
  const visualAvg = visualPosts.length ? visualPosts.reduce((s, p) => s + p.reach, 0) / visualPosts.length : 0;

  // Post Timing Impact
  const timingData = Array.from({ length: 24 }, (_, hour) => {
    const posts = analytics.filter((p) => new Date(p.postedAt).getHours() === hour);
    const avgReach = posts.length ? posts.reduce((sum, p) => sum + p.reach, 0) / posts.length : 0;
    return { hour, avgReach };
  });

  // AI Recommendation
  const aiRecommendation =
    visualAvg > textAvg
      ? "Visual posts perform better. Try posting more visuals!"
      : "Text posts perform better. Try posting more text content!";
  const bestHour = timingData.reduce(
    (best, d) => (d.avgReach > (best?.avgReach || 0) ? d : best),
    { hour: 0, avgReach: 0 }
  ).hour;

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 16 }}>Track Your AI-Generated Content</h1>
      
      {loading ? (
        <div>Loading analytics...</div>
      ) : (
        <>
          {/* Metrics */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <MetricCard label="Likes" value={totalLikes} />
            <MetricCard label="Shares" value={totalShares} />
            <MetricCard label="Comments" value={totalComments} />
            <MetricCard label="Saves" value={totalSaves} />
            <MetricCard label="Total Reach" value={totalReach} />
          </div>

<<<<<<< HEAD
          

          {/* Growth Trend Chart with Metric Selector */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 18 }}>
              Growth Trend:{" "}
              <select
                value={trendMetric}
                onChange={e => setTrendMetric(e.target.value as typeof trendMetric)}
                style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}
              >
                <option value="followers">Followers</option>
                <option value="likes">Likes</option>
                <option value="shares">Shares</option>
                <option value="comments">Comments</option>
                <option value="reach">Reach</option>
                <option value="saves">Saves</option>
              </select>
=======
      {/* Calendar */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium flex items-center justify-between">
          <div className="text-base md:text-lg">Content calendar</div>
        </div>
        <div className="grid grid-cols-7 gap-2 p-4 text-sm">
          {calendar.map((d) => (
            <div key={d} className="rounded-lg border p-2 min-h-20">
              <div className="text-[10px] text-[var(--muted-foreground)]">{d}</div>
              {d % 5 === 0 && (
                <div className="mt-1 px-2 py-1 rounded-md bg-[var(--sidebar-primary)]/10 text-[var(--sidebar-primary)]">Post</div>
              )}
>>>>>>> 01ee255fffefda50537dd42f016164f1556eb17a
            </div>
            {/* Date filter controls */}
              <div style={{ marginBottom: 16 , marginTop: 16}}>
                <label>
                  Start Date:{" "}
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </label>
                <label style={{ marginLeft: 16, marginRight: 100 }}>
                  End Date:{" "}
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </label>
              </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growthTrend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Best Performing Post */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Best Performing Post</div>
            {bestPost ? (
              <div>
                <div style={{ fontWeight: "bold" }}>{bestPost.title}</div>
                <div>Type: {bestPost.type}</div>
                <div>Reach: {bestPost.reach}</div>
                <div>Platform: {bestPost.platform}</div>
              </div>
            ) : (
              <div>No data</div>
            )}
          </div>

          {/* Text vs Visual Performance */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Text vs Visual Post Performance</div>
            <BarChart width={400} height={200} data={[
              { type: "Text", avgReach: textAvg },
              { type: "Visual", avgReach: visualAvg },
            ]}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgReach" fill="#82ca9d" />
            </BarChart>
          </div>

          {/* Post Timing Impact */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Post Timing Impact</div>
            <BarChart width={600} height={200} data={timingData}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgReach" fill="#8884d8" />
            </BarChart>
          </div>

          {/* AI Recommendation */}
          <div style={{ border: "1px solid #ffe066", borderRadius: 8, padding: 16, background: "#fffbe6", marginBottom: 24 }}>
            <div style={{ fontWeight: "bold" }}>AI Recommendation</div>
            <div>{aiRecommendation} Try posting at {bestHour}:00 for best results.</div>
          </div>

          {/* Save/Print */}
          <button onClick={handlePrint} style={{ padding: "8px 16px", borderRadius: 4, background: "#8884d8", color: "#fff", border: "none" }}>
            Save/Print Analytics
          </button>
        </>
      )}
    </div>
  );
}
