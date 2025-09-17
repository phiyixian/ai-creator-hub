"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

const nav = [
  { href: "/inspire", label: "Inspire" },
  { href: "/create", label: "Create" },
  { href: "/release", label: "Release" },
  { href: "/track", label: "Track" },
  { href: "/profile", label: "Profile" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="bg-[var(--sidebar)] border-r border-[var(--color-sidebar-border)] text-[var(--sidebar-foreground)] hidden lg:flex lg:flex-col">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-[var(--color-sidebar-border)]">
          <span className="inline-block w-8 h-8 rounded-md bg-[var(--sidebar-primary)]" />
          <div className="font-semibold">CreatorFlow AI</div>
        </div>
        <nav className="p-2 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "block px-3 py-2 rounded-md transition-colors " +
                  (active
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                    : "hover:bg-[var(--sidebar-accent)]/60")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 text-xs text-[var(--muted-foreground)]">
          AWS-ready scaffold
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            aria-label="Toggle navigation"
            className="p-2 rounded-md border"
            onClick={() => setOpen((s) => !s)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="font-semibold">CreatorFlow AI</div>
          <div className="w-9" />
        </div>
        {open && (
          <div className="border-t">
            <nav className="p-2 grid gap-1">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      "block px-3 py-2 rounded-md " +
                      (active
                        ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                        : "hover:bg-[var(--sidebar-accent)]/60")
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="min-h-screen flex flex-col">
        <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b bg-background">
          <div className="text-sm text-[var(--muted-foreground)]">
            Empowering digital creators with AWS AI
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link className="underline decoration-dotted" href="/profile">
              Profile
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}