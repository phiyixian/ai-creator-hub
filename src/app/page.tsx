"use client";
import Link from "next/link";

export default function Home() {
  const cards = [
    {
      title: "Inspire",
      href: "/inspire",
      img:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
      desc: "Discover trends and AI-suggested topics tailored to you.",
    },
    {
      title: "Create",
      href: "/create",
      img:
        "https://images.unsplash.com/photo-1497493292307-31c376b6e479?q=80&w=1600&auto=format&fit=crop",
      desc: "Generate images, edit videos, and craft scripts/storyboards.",
    },
    {
      title: "Release",
      href: "/release",
      img:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
      desc: "Get feedback, schedule perfectly, and publish everywhere.",
    },
    {
      title: "Track",
      href: "/track",
      img:
        "https://images.unsplash.com/photo-1454165205744-3b78555e5572?q=80&w=1600&auto=format&fit=crop",
      desc: "Analyze performance, plan your calendar, and rate content.",
    },
    {
      title: "Profile",
      href: "/profile",
      img:
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1600&auto=format&fit=crop",
      desc: "Manage your creator identity and connect AWS.",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-2 items-center">
        <div className="space-y-4">
          <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight">
            CreatorFlow AI
          </h1>
          <p className="text-[var(--muted-foreground)] max-w-prose">
            A unified workspace for digital creators. Discover what to make,
            generate assets with AI, release at the right time, and track
            performance — powered by AWS AI.
          </p>
          <div className="flex gap-3">
            <Link href="/inspire" className="px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]">
              Get Inspired
            </Link>
            <Link href="/create" className="px-4 py-2 rounded-md border">
              Start Creating
            </Link>
          </div>
        </div>
        <div className="aspect-video rounded-xl overflow-hidden border">
          <img
            alt="hero"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop"
          />
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="group rounded-lg overflow-hidden border hover:shadow-sm transition-shadow">
            <div className="aspect-[16/9] overflow-hidden">
              <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="p-4">
              <div className="font-medium text-lg">{c.title}</div>
              <p className="text-sm text-[var(--muted-foreground)]">{c.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border p-6 bg-[var(--card)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-medium text-lg">Connect to AWS</div>
            <p className="text-sm text-[var(--muted-foreground)] max-w-prose">
              Link your AWS account to unlock Bedrock models, Lambda workflows, and cloud publishing.
            </p>
          </div>
          <button className="px-4 py-2 rounded-md bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">
            Connect AWS
          </button>
        </div>
      </section>
    </div>
  );
}