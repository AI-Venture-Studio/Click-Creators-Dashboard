"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import ConfigureFollowingTab from "@/components/ConfigureFollowingTab";
import FollowerScraperQueueTab from "@/components/FollowerScraperQueueTab";
import CampaignDetailPanel from "@/components/CampaignDetailPanel";
import type { ScrapingJob } from "@/components/FollowerScraperQueueTab";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  threads: "Threads",
};

const fixedTabs = [
  { id: "configure", label: "Configure Following" },
  { id: "queue", label: "Campaign Summary" },
];

export default function FollowerScraperPage() {
  const [active, setActive] = useState("configure");
  const [openCampaigns, setOpenCampaigns] = useState<ScrapingJob[]>([]);

  const handleSelectJob = (job: ScrapingJob) => {
    // Don't duplicate if already open
    if (!openCampaigns.find((c) => c.id === job.id)) {
      setOpenCampaigns((prev) => [...prev, job]);
    }
    setActive(`campaign:${job.id}`);
  };

  const handleCloseCampaign = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenCampaigns((prev) => prev.filter((c) => c.id !== jobId));
    if (active === `campaign:${jobId}`) {
      setActive("queue");
    }
  };

  const getCampaignTabLabel = (job: ScrapingJob) => {
    const name = job.influencer_name.replace(/^@/, "");
    const platform = PLATFORM_LABELS[job.platform] ?? job.platform;
    return `${name}'s ${platform} Campaign`;
  };

  // Find the active campaign (if any)
  const activeCampaign = openCampaigns.find(
    (c) => active === `campaign:${c.id}`
  );

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
        <span className="text-sm text-gray-500 dark:text-gray-400">Follower Scraper</span>
      </nav>

      {/* Page title — centered */}
      <p className="text-sm text-gray-400 dark:text-gray-500 font-normal mb-6 text-center">
        Follower Scraper
      </p>

      {/* Tab row + Panel */}
      <div className="flex flex-col flex-1">

        {/* Tab row — sits above the panel */}
        <div className="flex items-end gap-3">
          {/* Fixed tabs */}
          {fixedTabs.map(({ id, label }) =>
            active === id ? (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="text-sm font-medium px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-b-0 rounded-t-lg text-gray-800 dark:text-gray-100 relative z-10 mb-[-1px] flex-shrink-0"
              >
                {label}
              </button>
            ) : (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="text-sm px-4 pb-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-150 flex-shrink-0"
              >
                {label}
              </button>
            )
          )}

          {/* Dynamic campaign tabs */}
          {openCampaigns.map((job) => {
            const isActive = active === `campaign:${job.id}`;
            const label = getCampaignTabLabel(job);
            return isActive ? (
              <button
                key={job.id}
                onClick={() => setActive(`campaign:${job.id}`)}
                className="text-sm font-medium pl-4 pr-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-b-0 rounded-t-lg text-gray-800 dark:text-gray-100 relative z-10 mb-[-1px] flex-shrink-0 flex items-center gap-2"
              >
                <span className="truncate max-w-[180px]">{label}</span>
                <span
                  onClick={(e) => handleCloseCampaign(job.id, e)}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={12} strokeWidth={2} />
                </span>
              </button>
            ) : (
              <button
                key={job.id}
                onClick={() => setActive(`campaign:${job.id}`)}
                className="text-sm pl-4 pr-2 pb-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-150 flex-shrink-0 flex items-center gap-2"
              >
                <span className="truncate max-w-[180px]">{label}</span>
                <span
                  onClick={(e) => handleCloseCampaign(job.id, e)}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={12} strokeWidth={2} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel — rounded-tl-none where active tab connects */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none p-8">
          {active === "configure" && <ConfigureFollowingTab />}
          {active === "queue" && <FollowerScraperQueueTab onSelectJob={handleSelectJob} />}
          {activeCampaign && <CampaignDetailPanel job={activeCampaign} />}
        </div>

      </div>

      <footer className="py-6">
        <p className="text-[11px] text-gray-300 dark:text-gray-700 text-center">Built by AIVS, 2026</p>
      </footer>

    </div>
  );
}
