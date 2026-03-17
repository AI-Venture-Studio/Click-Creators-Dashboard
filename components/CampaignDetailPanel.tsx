"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ExternalLink, Users, X, Search, ChevronLeft, ChevronRight, Plus, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { followerScraperSupabase } from "@/lib/supabase-follower-scraper";
import type { ScrapingJob } from "@/components/FollowerScraperQueueTab";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X (Twitter)",
  threads: "Threads",
};

const STATUS_STYLES: Record<string, { text: string; cls: string }> = {
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

const CAMPAIGNS_PAGE_SIZE = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignRecord {
  campaign_id: string;
  campaign_date: string;
  total_assigned: number;
  status: boolean;
}

// ─── Profile Badge ────────────────────────────────────────────────────────────

function ProfileBadge({ username, onRemove }: { username: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
      @{username}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:opacity-70 transition-opacity"
        aria-label={`Remove ${username}`}
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}

// ─── Source Profiles Menu ──────────────────────────────────────────────────────

function SourceProfilesMenu({
  onLoad,
  onEdit,
}: {
  onLoad: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        Source Profiles
        <ChevronDown size={11} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute z-20 right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <button
            className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() => { onLoad(); setOpen(false); }}
          >
            Load source profiles
          </button>
          <button
            className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() => { onEdit(); setOpen(false); }}
          >
            Edit source profiles
          </button>
        </div>
      )}
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
    <div className="flex items-center justify-center gap-3 py-3">
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

export default function CampaignDetailPanel({ job }: { job: ScrapingJob }) {
  // Header state
  const [availableCount, setAvailableCount] = useState<number | null>(null);

  // Find accounts state
  const [accountInput, setAccountInput] = useState("");
  const [sourceAccounts, setSourceAccounts] = useState<string[]>([]);
  const [scrapeCount, setScrapeCount] = useState<number | "">(150);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [campaignPage, setCampaignPage] = useState(1);

  // ─── Fetch available count ──────────────────────────────────────────────────

  const fetchAvailable = useCallback(async () => {
    const { count, error } = await followerScraperSupabase
      .from("global_usernames")
      .select("*", { count: "exact", head: true })
      .eq("base_id", job.base_id)
      .eq("used", false);

    if (!error && count !== null) {
      setAvailableCount(count);
    }
  }, [job.base_id]);

  useEffect(() => { fetchAvailable(); }, [fetchAvailable]);

  // ─── Fetch campaigns ───────────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    const { data, error } = await followerScraperSupabase
      .from("campaigns")
      .select("campaign_id, campaign_date, total_assigned, status")
      .eq("base_id", job.base_id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data);
    }
  }, [job.base_id]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const addAccount = () => {
    const val = accountInput.trim().replace(/^@/, "");
    if (!val || sourceAccounts.includes(val)) return;
    setSourceAccounts((prev) => [...prev, val]);
    setAccountInput("");
  };

  const removeAccount = (username: string) => {
    setSourceAccounts((prev) => prev.filter((a) => a !== username));
  };

  const handleFindAccounts = () => {
    if (sourceAccounts.length === 0) return;
    // TODO: wire to POST /api/scrape-followers
    console.log({ sourceAccounts, scrapeCount, base_id: job.base_id });
  };

  const handleLoadSourceProfiles = () => {
    // TODO: fetch from source_profiles table and populate sourceAccounts
    console.log("Load source profiles", job.base_id);
  };

  const handleEditSourceProfiles = () => {
    // TODO: open edit dialog for source_profiles
    console.log("Edit source profiles", job.base_id);
  };

  // ─── Derived ────────────────────────────────────────────────────────────────

  const status = STATUS_STYLES[job.status] ?? STATUS_STYLES.active;
  const platformLabel = PLATFORM_LABELS[job.platform] ?? job.platform;

  const totalCampaignPages = Math.max(1, Math.ceil(campaigns.length / CAMPAIGNS_PAGE_SIZE));
  const paginatedCampaigns = campaigns.slice(
    (campaignPage - 1) * CAMPAIGNS_PAGE_SIZE,
    campaignPage * CAMPAIGNS_PAGE_SIZE
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col -m-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {job.influencer_name}
              </h2>
              <span className={`inline-flex items-center text-[10px] px-1.5 py-px rounded-full font-medium ${status.cls}`}>
                {status.text}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
              <span>{platformLabel}</span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="flex items-center gap-1">
                <Users size={10} strokeWidth={1.8} />
                {job.num_vas ?? "—"} VAs
              </span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span>{format(new Date(job.created_at), "MMM d, yyyy")}</span>
              {job.airtable_base_id && (
                <>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                  <a
                    href={`https://airtable.com/${job.airtable_base_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 hover:underline transition-colors"
                  >
                    <ExternalLink size={9} strokeWidth={1.8} />
                    Airtable
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tabular-nums leading-none">
              {availableCount !== null ? availableCount.toLocaleString() : "—"}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              usernames available
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Find Accounts ────────────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-6">

          {/* Left — Source accounts */}
          <div className="border-r border-gray-100 dark:border-gray-800 pr-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Find {platformLabel} Accounts
              </p>
              <SourceProfilesMenu
                onLoad={handleLoadSourceProfiles}
                onEdit={handleEditSourceProfiles}
              />
            </div>
            <div className="relative">
              <Search
                size={12}
                strokeWidth={1.8}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAccount();
                  }
                }}
                placeholder="@username or profile URL"
                className="w-full text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-9 py-1.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
              <button
                type="button"
                onClick={addAccount}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Add account"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            </div>
            {sourceAccounts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {sourceAccounts.map((a) => (
                  <ProfileBadge key={a} username={a} onRemove={() => removeAccount(a)} />
                ))}
              </div>
            )}
          </div>

          {/* Right — Scrape settings */}
          <div className="pl-2 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Accounts to Scrape
              </label>
              <input
                type="number"
                min={1}
                value={scrapeCount}
                onChange={(e) =>
                  setScrapeCount(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 tabular-nums"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                Split evenly across source accounts
              </p>
            </div>
            <button
              type="button"
              onClick={handleFindAccounts}
              disabled={sourceAccounts.length === 0}
              className="w-full text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium mt-4"
            >
              Find Accounts
            </button>
          </div>

        </div>
      </div>

      {/* ── Section 2: Distributed Campaigns ────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Distributed Campaigns
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Failed</span>
            </div>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">No distributions yet</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="flex items-center gap-4 px-3 py-2 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <span className="w-3 flex-shrink-0" />
              <span className="flex-1">Date</span>
              <span className="w-24 text-right">Assigned</span>
            </div>

            {/* Table rows */}
            {paginatedCampaigns.map((c) => (
              <div
                key={c.campaign_id}
                className="flex items-center gap-4 px-3 py-2.5 border-b border-gray-50 dark:border-gray-800/60"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    c.status ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                  {c.campaign_date
                    ? format(new Date(c.campaign_date), "MMM d, yyyy")
                    : "—"}
                </span>
                <span className="w-24 text-right text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                  {c.total_assigned.toLocaleString()}
                </span>
              </div>
            ))}

            <Pagination
              page={campaignPage}
              total={totalCampaignPages}
              onPrev={() => setCampaignPage((p) => p - 1)}
              onNext={() => setCampaignPage((p) => p + 1)}
            />
          </>
        )}
      </div>

    </div>
  );
}
