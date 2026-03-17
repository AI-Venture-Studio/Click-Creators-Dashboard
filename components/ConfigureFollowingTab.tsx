"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import AirtableLinkDialog from "@/components/AirtableLinkDialog";
import AirtableProgressDialog from "@/components/AirtableProgressDialog";

// ─── Types & Constants ─────────────────────────────────────────────────────────

type Platform = "instagram" | "tiktok" | "x" | "threads" | "";
type DialogState = "none" | "airtable-link" | "progress";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "x",         label: "X (Twitter)" },
  { value: "threads",   label: "Threads" },
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X (Twitter)",
  threads: "Threads",
};

// ─── Custom Dropdown ───────────────────────────────────────────────────────────

function CustomDropdown({
  items,
  value,
  placeholder,
  onSelect,
}: {
  items: { value: string; label: string }[];
  value: string;
  placeholder: string;
  onSelect: (v: string) => void;
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

  const selected = items.find((i) => i.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <span className={`text-xs ${selected ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={13} strokeWidth={1.8} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onSelect(item.value);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Summary Row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-20 flex-shrink-0">
        {label}
      </span>
      <span className="text-[11px] text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ConfigureFollowingTab() {
  // Form state
  const [influencerName, setInfluencerName] = useState("");
  const [platform, setPlatform] = useState<Platform>("");
  const [numVAs, setNumVAs] = useState<number | "">(80);

  // Dialog state machine
  const [dialogState, setDialogState] = useState<DialogState>("none");
  const [airtableUrl, setAirtableUrl] = useState("");
  const [baseId, setBaseId] = useState("");

  const isFormComplete = () =>
    influencerName.trim() !== "" && platform !== "" && numVAs !== "" && numVAs > 0;

  const handleClear = () => {
    setInfluencerName("");
    setPlatform("");
    setNumVAs(80);
  };

  const handleSubmit = () => {
    if (!isFormComplete()) return;
    setDialogState("airtable-link");
  };

  const handleAirtableLinkSubmit = (url: string, extractedBaseId: string) => {
    setAirtableUrl(url);
    setBaseId(extractedBaseId);
    setDialogState("progress");
  };

  const handleProgressComplete = (jobId: string) => {
    setDialogState("none");
    setAirtableUrl("");
    setBaseId("");
    handleClear();
    toast.success("Campaign created successfully", {
      description: `Job ID: ${jobId.slice(0, 8)}...`,
    });
  };

  const handleProgressError = (error: string) => {
    setDialogState("none");
    setAirtableUrl("");
    setBaseId("");
    toast.error("Failed to create campaign", { description: error });
  };

  return (
    <div className="flex flex-col -m-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Create Scraping Campaign
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Set up a new follower-scraping campaign for an influencer account
        </p>
      </div>

      {/* ── Section 1 — Influencer + Platform ───────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-6">

          {/* Left — Influencer Name */}
          <div className="border-r border-gray-100 dark:border-gray-800 pr-6">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Influencer Name
            </label>
            <input
              type="text"
              value={influencerName}
              onChange={(e) => setInfluencerName(e.target.value)}
              placeholder="e.g. @john_doe"
              className="w-full text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              The social media campaign handle
            </p>
          </div>

          {/* Right — Platform */}
          <div className="pl-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Campaign Platform
            </label>
            <CustomDropdown
              items={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
              value={platform}
              placeholder="Select platform..."
              onSelect={(v) => setPlatform(v as Platform)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2 — Number of VAs ───────────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Number of VAs
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              How many virtual assistant tables to create for distributing outreach work
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
            <input
              type="number"
              min={1}
              max={180}
              value={numVAs}
              onChange={(e) =>
                setNumVAs(e.target.value === "" ? "" : Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))
              }
              className="w-16 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">VAs</span>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={180}
          step={1}
          value={numVAs || 80}
          onChange={(e) => setNumVAs(parseInt(e.target.value))}
          className="w-full accent-gray-700 dark:accent-gray-300 cursor-pointer"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">1 VA</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">180 VAs</span>
        </div>
      </div>

      {/* ── Campaign Summary (conditional) ──────────────────────────────────── */}
      {isFormComplete() && (
        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Campaign Summary
            </p>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Influencer" value={`@${influencerName.trim().replace(/^@/, "")}`} />
              <SummaryRow label="Platform" value={PLATFORM_LABELS[platform] ?? platform} />
              <SummaryRow label="VAs" value={`${numVAs} virtual assistants`} />
            </div>
          </div>
        </div>
      )}

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="px-8 py-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormComplete()}
          className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          Create Campaign
        </button>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <AirtableLinkDialog
        open={dialogState === "airtable-link"}
        influencerName={influencerName.trim()}
        platform={platform}
        onClose={() => setDialogState("none")}
        onSubmit={handleAirtableLinkSubmit}
      />

      <AirtableProgressDialog
        open={dialogState === "progress"}
        airtableUrl={airtableUrl}
        baseId={baseId}
        influencerName={influencerName.trim()}
        platform={platform}
        numVAs={numVAs as number}
        onComplete={handleProgressComplete}
        onError={handleProgressError}
      />

    </div>
  );
}
