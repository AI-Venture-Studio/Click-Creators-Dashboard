"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PostBotQueueTab from "@/components/PostBotQueueTab";
import ConfigurePostsTab from "@/components/ConfigurePostsTab";

type Section = "configure" | "queue";

const tabs: { id: Section; label: string }[] = [
  { id: "configure", label: "Configure Posts" },
  { id: "queue", label: "Post Queue" },
];

export default function PostBotPage() {
  const [active, setActive] = useState<Section>("configure");

  return (
    <div className="min-h-[calc(100vh-52px)] bg-white dark:bg-gray-950 px-10 py-8 flex flex-col max-w-4xl mx-auto w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-1.5">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
          aria-label="Go back"
        >
          <ArrowLeft size={13} strokeWidth={1.6} />
        </Link>
        <span className="text-sm text-gray-300 dark:text-gray-700">/</span>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
        >
          Dashboard
        </Link>
        <span className="text-sm text-gray-300 dark:text-gray-700">/</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">Post Bot</span>
      </nav>

      {/* Page title */}
      <p className="text-sm text-gray-400 dark:text-gray-500 font-normal mb-6 text-center">
        Post Bot
      </p>

      {/* Tab row + Panel */}
      <div className="flex flex-col flex-1">

        {/* Tab row — sits above the panel */}
        <div className="flex items-end gap-3">
          {tabs.map(({ id, label }) =>
            active === id ? (
              /* Active tab — bottom border removed, overlaps panel top by 1px */
              <button
                key={id}
                onClick={() => setActive(id)}
                className="text-sm font-medium px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-b-0 rounded-t-lg text-gray-800 dark:text-gray-100 relative z-10 mb-[-1px]"
              >
                {label}
              </button>
            ) : (
              /* Inactive tab — plain text, no border */
              <button
                key={id}
                onClick={() => setActive(id)}
                className="text-sm px-4 pb-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-150"
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* Panel — rounded-tl-none where active tab connects */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none p-8 min-h-[500px]">
            {active === "configure" && <ConfigurePostsTab />}
          {active === "queue" && <PostBotQueueTab />}
        </div>

      </div>

      <footer className="py-6">
        <p className="text-[11px] text-gray-300 dark:text-gray-700 text-center">Built by AIVS, 2026</p>
      </footer>

    </div>
  );
}
