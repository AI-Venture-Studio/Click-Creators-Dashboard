"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function ActionSkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <div className={`flex items-center gap-6 py-3.5 px-0 ${!isLast ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="h-3 flex-1 rounded" />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
  );
}

// ─── iPhone-style app icon ────────────────────────────────────────────────────
function AppIcon({
  iconSrc,
  name,
  href,
  disabled,
  isHovered,
  isDimmed,
  onMouseEnter,
  onMouseLeave,
}: {
  iconSrc: string;
  name: string;
  href: string;
  disabled?: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-1.5 w-32 cursor-not-allowed" style={{ opacity: 0.35 }}>
        <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm grayscale">
          <Image src={iconSrc} alt={name} width={112} height={112} className="object-cover w-28 h-28" />
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-600 text-center leading-tight">{name}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 w-32 cursor-pointer"
      style={{
        opacity: isDimmed ? 0.25 : 1,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative w-28 h-28">
        <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm">
          <Image src={iconSrc} alt={name} width={112} height={112} className="object-cover w-28 h-28" />
        </div>

        {/* Arrow overlay — slides in from left on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-3xl"
          style={{
            background: "rgba(0,0,0,0.18)",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.18s ease",
          }}
        >
          <ArrowRight
            size={28}
            strokeWidth={1.8}
            className="text-white"
            style={{
              transform: isHovered ? "translateX(0)" : "translateX(-6px)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
      </div>

      <span className="text-[11px] text-gray-500 dark:text-gray-500 text-center leading-tight">{name}</span>
    </Link>
  );
}

// ─── Applications section ─────────────────────────────────────────────────────
const apps = [
  { id: "post-bot",        iconSrc: "/post-bot-icon.png",        name: "Post Bot",        href: "/post-bot",        disabled: false },
  { id: "comment-bot",     iconSrc: "/comment-bot-icon.png",     name: "Comment Bot",     href: "/comment-bot",     disabled: false },
  { id: "follower-scraper", iconSrc: "/follower-scraper-icon.png", name: "Follower Scraper", href: "/follower-scraper", disabled: false },
  { id: "viral-app",       iconSrc: "/viral-app-icon.png",       name: "Viral App",       href: "/viral-app",       disabled: true  },
  { id: "account-scraper", iconSrc: "/account-scraper-icon.png", name: "Account Scraper", href: "/account-scraper", disabled: true  },
];

function ApplicationsSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section>
      <div className="flex items-center mb-4">
        <h2 className="text-sm text-gray-500 dark:text-gray-500">Applications</h2>
      </div>
      <div className="flex gap-5">
        {apps.map((app) => (
          <AppIcon
            key={app.id}
            iconSrc={app.iconSrc}
            name={app.name}
            href={app.href}
            disabled={app.disabled}
            isHovered={hovered === app.id}
            isDimmed={hovered !== null && hovered !== app.id}
            onMouseEnter={() => { if (!app.disabled) setHovered(app.id); }}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="bg-white dark:bg-gray-950 font-[var(--font-inter)] md:h-[calc(100vh-52px)] md:overflow-hidden flex flex-col">
      <main className="max-w-4xl mx-auto w-full px-10 py-10 flex flex-col gap-10 flex-1">

        {/* ── Recent Actions ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-gray-500 dark:text-gray-500">Recent Actions</h2>
            <Link href="/actions" className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-500">
              All Actions
              <ChevronRight size={13} strokeWidth={1.8} />
            </Link>
          </div>
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <ActionSkeletonRow key={i} isLast={i === 4} />
            ))}
          </div>
        </section>

        <ApplicationsSection />

      </main>

      <footer className="max-w-4xl mx-auto w-full px-10 py-6">
        <p className="text-[11px] text-gray-300 dark:text-gray-700 text-center">Built by AIVS, 2026</p>
      </footer>
    </div>
  );
}
