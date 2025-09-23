"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type PostAnalytics = {
  id: string;
  title: string;
  platform: string;
  type: "video" | "shorts" | "image";
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  reach: number;
  followers: number;
  postedAt: string; // ISO date string
};

// ✅ Modified fetchLambdaAnalytics
async function fetchLambdaAnalytics(platform: string): Promise<PostAnalytics[]> {
  if (platform === "all") {
    // Fetch all platforms in parallel
    const platforms = ["instagram", "youtube", "tiktok"];
    const results = await Promise.all(
      platforms.map(async (p) => {
        const res = await fetch(
          `https://uwesp89f8b.execute-api.ap-southeast-1.amazonaws.com/socialstage/social/${p}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        if (!res.ok) {
          console.error(`❌ Failed to fetch ${p}`);
          return [];
        }
        return res.json();
      })
    );
    // Merge all data into one array
    return results.flat();
  } else {
    // Fetch single platform
    const res = await fetch(
      `https://uwesp89f8b.execute-api.ap-southeast-1.amazonaws.com/socialstage/social/${platform}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) {
      throw new Error("Failed to fetch from Lambda");
    }
    return res.json();
  }
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
  const [selectedMetrics, setSelectedMetrics] = useState<{ date: string; posts: PostAnalytics[] } | null>(null);

  // AI Insights API Call
  async function getInsights(metrics: any) {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metrics }),
  });
  return res.json();
}

  const [platform, setPlatform] = useState("instagram");

  useEffect(() => {
    setLoading(true);
    fetchLambdaAnalytics(platform)
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  }, [platform]);

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
    const d = p.postedAt ? new Date(p.postedAt).toISOString().slice(0, 10) : "";
    if (d) {
      growthTrendMap[d] = (growthTrendMap[d] || 0) + (p[trendMetric] || 0);
    }
  });

  const growthTrend = Object.entries(growthTrendMap).map(([date, value]) => ({ date, value }));
  
  // Best Performing Post
  const bestPost = filteredAnalytics.reduce(
    (best, p) => (p.reach > (best?.reach || 0) ? p : best),
    undefined as PostAnalytics | undefined
  );


  // Text vs Visual
  const videoPosts = analytics.filter((p) => p.type === "video");
  const shortsPosts = analytics.filter((p) => p.type === "shorts");
  const imagePosts = analytics.filter((p) => p.type === "image");
  const videoAvg = videoPosts.length ? videoPosts.reduce((s, p) => s + p.reach, 0) / videoPosts.length : 0;
  const shortsAvg = shortsPosts.length ? shortsPosts.reduce((s, p) => s + p.reach, 0) / shortsPosts.length : 0;
  const imageAvg = imagePosts.length ? imagePosts.reduce((s, p) => s + p.reach, 0) / imagePosts.length : 0;


  // Post Timing Impact
  const timingData = Array.from({ length: 24 }, (_, hour) => {
    const posts = analytics.filter((p) => new Date(p.postedAt).getHours() === hour);
    const avgReach = posts.length ? posts.reduce((sum, p) => sum + p.reach, 0) / posts.length : 0;
    return { hour, avgReach };
  });

  //AI Insights
  const [insights, setInsights] = useState<any>(null);
  async function handleGenerateInsights() {
  const analytics = filteredAnalytics.map(post => ({
      title: post.title,
      platform: post.platform,
      type: post.type,
      likes: post.likes,
      shares: post.shares,
      comments: post.comments,
      saves: post.saves,
      reach: post.reach,
      postedAt: post.postedAt,
    }));

    const res = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analytics }),
    });

    const data = await res.json();
    setInsights(data);
}

  // AI Recommendation
  // Find which type (video, image, shorts) has the highest average reach
  const maxAvg = Math.max(videoAvg, imageAvg, shortsAvg);
  let bestType = "video";
  if (imageAvg === maxAvg) bestType = "image";
  if (shortsAvg === maxAvg) bestType = "shorts";

  const aiRecommendation =
    bestType === "video"
      ? "Video posts perform best. Try posting more videos!"
      : bestType === "image"
      ? "Image posts perform best. Try posting more images!"
      : "Shorts perform best. Try posting more shorts!";
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

          <label>
            Platform:{" "}
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="all">All</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </label>

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
              <LineChart 
                data={growthTrend}
                onClick={(e: any) => {
                  if (e && e.activeLabel) {
                    const postsOnDate = analytics.filter(
                      (p) => p.postedAt.slice(0, 10) === e.activeLabel
                    );
                    setSelectedMetrics({ date: e.activeLabel, posts: postsOnDate });
                  }
                }}
              >
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
                <div style={{ fontWeight: "bold" }}>Title: {bestPost.title}</div>
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
              { type: "Video", avgReach: videoAvg },
              { type: "Shorts", avgReach: shortsAvg },
              { type: "Image", avgReach: imageAvg },
            ]}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgReach" fill="#82ca9d" />
            </BarChart>
          </div>

          {/* Post Timing Impact */}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24}}>
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

          <div id="button-container">
            {/* AI Insights Section */}
            <button type="button" onClick={handleGenerateInsights} style={{ padding: "8px 16px", borderRadius: 4, background: "#8884d8", color: "#fff", border: "none" , marginRight: 50, display: "inline-block"  }}>
              Generate AI Insights
            </button>
            {insights && (
              <div className="p-4 border rounded-lg mt-4 shadow">
                <h3 className="text-xl font-bold">AI Insights</h3>

                <p><strong>Best Times:</strong> {insights.best_posting_times?.join(", ")}</p>
                <p><strong>Platforms:</strong> {insights.recommended_platforms?.join(", ")}</p>
                <p><strong>Content Focus:</strong> {insights.content_type_focus}</p>

                <ul>
                  {insights.engagement_tips?.map((tip: string, i: number) => (
                    <li key={i}>✅ {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save/Print */}
            <button onClick={handlePrint} style={{ padding: "8px 16px", borderRadius: 4, background: "#8884d8", color: "#fff", border: "none", float: "right", display: "inline-block", marginTop: 16  }}>
              Save/Print Analytics
            </button>
          </div>
        </>
      )}
    </div>
  );
}
