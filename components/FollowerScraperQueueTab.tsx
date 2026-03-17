"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ListOrdered,
  ExternalLink,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { followerScraperSupabase } from "@/lib/supabase-follower-scraper";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "tiktok" | "x" | "threads";
type JobStatus = "active" | "paused" | "archived";
type TabId = "instagram" | "tiktok" | "x" | "threads";

export interface ScrapingJob {
  id: string;
  influencer_name: string;
  platform: Platform;
  airtable_base_id: string;
  base_id: string;
  num_vas: number | null;
  status: JobStatus;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X (Twitter)",
  threads: "Threads",
};

const PAGE_SIZE = 10;

// ─── DB → UI Mapper ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbToJob(row: any): ScrapingJob {
  return {
    id: row.job_id,
    influencer_name: row.influencer_name || "",
    platform: row.platform,
    airtable_base_id: row.airtable_base_id || "",
    base_id: row.base_id || "",
    num_vas: row.num_vas,
    status: row.status || "active",
    created_at: row.created_at,
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { text: string; cls: string }> = {
    active: {
      text: "Active",
      cls: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    },
    paused: {
      text: "Paused",
      cls: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    },
    archived: {
      text: "Archived",
      cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    },
  };

  const { text, cls } = map[status];

  return (
    <span className={`inline-flex items-center justify-center text-[10px] px-1.5 py-px rounded-full font-medium w-[70px] flex-shrink-0 ${cls}`}>
      {text}
    </span>
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({
  onRemove,
}: {
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref[0] && !ref[0].contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, ref]);

  return (
    <div className="relative" ref={(el) => { ref[1](el); }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
      >
        <MoreHorizontal size={14} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute z-20 right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <button
            className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            onClick={() => { onRemove(); setOpen(false); }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Job Row ─────────────────────────────────────────────────────────────────

function JobRow({
  job,
  onClick,
  onRemove,
}: {
  job: ScrapingJob;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-8 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
    >
      {/* Status */}
      <StatusBadge status={job.status} />

      {/* Influencer */}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0 truncate">
        {job.influencer_name}
      </span>

      {/* Platform */}
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">
        {PLATFORM_LABELS[job.platform]}
      </span>

      {/* VAs */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
        <Users size={11} strokeWidth={1.8} />
        <span>{job.num_vas ?? "—"}</span>
      </div>

      {/* Airtable link */}
      <div className="flex-1 min-w-0">
        {job.airtable_base_id ? (
          <a
            href={`https://airtable.com/${job.airtable_base_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:underline transition-colors truncate"
          >
            <ExternalLink size={10} strokeWidth={1.8} />
            <span className="truncate">{job.airtable_base_id}</span>
          </a>
        ) : (
          <span className="text-[11px] text-gray-300 dark:text-gray-600">No base linked</span>
        )}
      </div>

      {/* Created at */}
      <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
        {format(new Date(job.created_at), "MMM d, h:mm a")}
      </span>

      {/* Actions */}
      <ActionMenu onRemove={onRemove} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ platform }: { platform: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <ListOrdered size={28} strokeWidth={1.3} className="text-gray-300 dark:text-gray-700 mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No campaigns found</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        No {PLATFORM_LABELS[platform as Platform] ?? platform} campaigns yet
      </p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
      >
        <ChevronLeft size={14} strokeWidth={1.8} />
      </button>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">
        Page {page} of {total}
      </span>
      <button
        onClick={onNext}
        disabled={page === total}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
      >
        <ChevronRight size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FollowerScraperQueueTab({
  onSelectJob,
}: {
  onSelectJob?: (job: ScrapingJob) => void;
}) {
  const [items, setItems] = useState<ScrapingJob[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("instagram");

  const [instagramPage, setInstagramPage] = useState(1);
  const [tiktokPage, setTiktokPage]       = useState(1);
  const [xPage, setXPage]                 = useState(1);
  const [threadsPage, setThreadsPage]     = useState(1);

  // ─── Fetch campaigns from Supabase ──────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    const { data, error } = await followerScraperSupabase
      .from("scraping_jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Failed to load campaigns: ${error.message}`);
      return;
    }
    setItems((data ?? []).map(mapDbToJob));
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ─── Derived lists ──────────────────────────────────────────────────────────

  const instagram = items.filter((j) => j.platform === "instagram");
  const tiktok    = items.filter((j) => j.platform === "tiktok");
  const x         = items.filter((j) => j.platform === "x");
  const threads   = items.filter((j) => j.platform === "threads");

  // ─── Pagination helpers ─────────────────────────────────────────────────────

  function paginate<T>(arr: T[], page: number): T[] {
    return arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }
  function totalPages(arr: unknown[]): number {
    return Math.max(1, Math.ceil(arr.length / PAGE_SIZE));
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setIsRefreshing(false);
    toast.info("Campaigns refreshed");
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setInstagramPage(1);
    setTiktokPage(1);
    setXPage(1);
    setThreadsPage(1);
  };

  const handleRemove = async (id: string) => {
    const { error } = await followerScraperSupabase
      .from("scraping_jobs")
      .delete()
      .eq("job_id", id);
    if (error) {
      toast.error(`Failed to remove: ${error.message}`);
      return;
    }
    setItems((prev) => prev.filter((j) => j.id !== id));
    toast.success("Campaign removed");
  };

  // ─── Tab definitions ────────────────────────────────────────────────────────

  const tabDef: { id: TabId; label: string }[] = [
    { id: "instagram", label: `Instagram (${instagram.length})` },
    { id: "tiktok",    label: `TikTok (${tiktok.length})` },
    { id: "x",         label: `X/Twitter (${x.length})` },
    { id: "threads",   label: `Threads (${threads.length})` },
  ];

  // Map tab to data + pagination
  const tabData: Record<TabId, { list: ScrapingJob[]; page: number; setPage: (p: number | ((p: number) => number)) => void }> = {
    instagram: { list: instagram, page: instagramPage, setPage: setInstagramPage },
    tiktok:    { list: tiktok,    page: tiktokPage,    setPage: setTiktokPage },
    x:         { list: x,         page: xPage,         setPage: setXPage },
    threads:   { list: threads,   page: threadsPage,   setPage: setThreadsPage },
  };

  const current = tabData[activeTab];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col -m-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">Campaign Summary</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 tabular-nums">
              {items.length} total
              {instagram.length > 0 && <> · {instagram.length} Instagram</>}
              {tiktok.length > 0 && <> · {tiktok.length} TikTok</>}
              {x.length > 0 && <> · {x.length} X</>}
              {threads.length > 0 && <> · {threads.length} Threads</>}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center justify-center w-7 h-7 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              title="Refresh campaigns"
            >
              <RefreshCw
                size={12}
                strokeWidth={1.8}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex items-end gap-0.5 px-8 pt-5">
        {tabDef.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={
              activeTab === id
                ? "text-xs font-medium px-3.5 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg text-gray-800 dark:text-gray-100 border border-b-0 border-gray-200 dark:border-gray-700"
                : "text-xs px-3.5 py-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors rounded-t-lg"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab border line */}
      <div className="border-t border-gray-200 dark:border-gray-700 mx-8" />

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      {current.list.length === 0 ? (
        <EmptyState platform={activeTab} />
      ) : (
        <>
          {paginate(current.list, current.page).map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onClick={() => onSelectJob?.(job)}
              onRemove={() => handleRemove(job.id)}
            />
          ))}
          <Pagination
            page={current.page}
            total={totalPages(current.list)}
            onPrev={() => current.setPage((p) => p - 1)}
            onNext={() => current.setPage((p) => p + 1)}
          />
        </>
      )}

    </div>
  );
}
