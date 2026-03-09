"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Play,
  StopCircle,
  MoreHorizontal,
  X,
  Image as ImageIcon,
  ListOrdered,
  AlertTriangle,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const BOT_URL = process.env.NEXT_PUBLIC_POST_BOT_URL || "http://localhost:8001";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "x" | "threads" | "tiktok";
type PostStatus = "not-started" | "in-progress" | "completed" | "failed" | "aborted";
type TargetingMode = "posts" | "date";
type TabId = "queued" | "completed" | "failed" | "aborted";

interface PostCampaign {
  id: string;
  platform: Platform;
  status: PostStatus;
  caption: string;
  target_profiles: string[];
  user_accounts: string[];
  queue_position: number;
  image_count?: number;
  targeting_mode: TargetingMode;
  number_of_posts?: number;
  target_date?: string;
  post_delay: number;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  x: "X (Twitter)",
  threads: "Threads",
  tiktok: "TikTok",
};

const PLATFORM_FILTER_ITEMS = [
  { value: "all",       label: "All Platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "x",         label: "X (Twitter)" },
  { value: "threads",   label: "Threads" },
  { value: "tiktok",    label: "TikTok", disabled: true },
];

const PAGE_SIZE = 10;

// ─── DB → UI mapper ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbToPost(row: any): PostCampaign {
  return {
    id: row.campaign_id,
    platform: row.platform,
    status: row.status,
    caption: row.caption || "",
    target_profiles: row.target_profiles || [],
    user_accounts: row.user_accounts || [],
    queue_position: row.queue_position || 0,
    image_count: row.media_urls?.length || 0,
    targeting_mode: row.number_of_posts && row.number_of_posts > 0 ? "posts" : "date",
    number_of_posts: row.number_of_posts,
    target_date: row.target_date,
    post_delay: row.post_delay || 15,
    updated_at: row.updated_at || row.created_at,
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, withDot }: { status: PostStatus; withDot?: boolean }) {
  const map: Record<PostStatus, { text: string; cls: string }> = {
    "not-started": {
      text: "Queued",
      cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    },
    "in-progress": {
      text: "Running",
      cls: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    },
    completed: {
      text: "Completed",
      cls: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    },
    failed: {
      text: "Failed",
      cls: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    },
    aborted: {
      text: "Aborted",
      cls: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    },
  };

  const { text, cls } = map[status];

  return (
    <span className={`inline-flex items-center justify-center gap-1 text-[10px] px-1.5 py-px rounded-full font-medium w-[70px] flex-shrink-0 ${cls}`}>
      {withDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
        </span>
      )}
      {text}
    </span>
  );
}

// ─── Outline Badge ────────────────────────────────────────────────────────────

function OutlineBadge({
  label,
  onRemove,
  small,
}: {
  label: string;
  onRemove?: () => void;
  small?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full ${
        small ? "text-[10px] px-1.5 py-px" : "text-xs px-2.5 py-1"
      }`}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity">
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
}

function CustomDropdown({
  items,
  value,
  placeholder,
  onSelect,
  width,
}: {
  items: DropdownItem[];
  value: string;
  placeholder: string;
  onSelect: (v: string) => void;
  width?: string;
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
    <div className="relative" ref={ref} style={width ? { width } : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <span className={`text-xs ${selected ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={13} strokeWidth={1.8} className="text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  onSelect(item.value);
                  setOpen(false);
                }
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Date Picker (used inside Edit Sheet) ─────────────────────────────────────

function DatePicker({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
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
        className="flex items-center gap-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <CalendarIcon size={12} strokeWidth={1.8} className="text-gray-400" />
        {value ? format(value, "MMM d, yyyy") : "Pick a date"}
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange(d);
              setOpen(false);
            }}
            disabled={{ after: new Date() }}
            initialFocus
          />
        </div>
      )}
    </div>
  );
}

// ─── Post Progress Panel ───────────────────────────────────────────────────────

function PostProgressPanel({
  campaign,
  onStatusChange,
}: {
  campaign: PostCampaign;
  onStatusChange: (status: PostStatus) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [latestSentence, setLatestSentence] = useState("Starting campaign…");
  const [postCount, setPostCount] = useState(0);
  const notifiedLocked = useRef(new Set<string>());

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`${BOT_URL}/api/progress/current`);
        if (!res.ok || !active) return;
        const data = await res.json();

        setProgress(data.progress ?? 0);
        setLatestSentence(data.latest_sentence || "Processing…");
        setPostCount(data.post_count ?? 0);

        // Notify about locked accounts (once per account)
        if (data.locked_accounts?.length) {
          for (const username of data.locked_accounts) {
            if (!notifiedLocked.current.has(username)) {
              toast.warning(`@${username} is in use by another bot — skipped`, {
                description: "The account will be available once the other campaign finishes.",
                duration: 6000,
              });
              notifiedLocked.current.add(username);
            }
          }
        }

        if (data.status === "completed") {
          onStatusChange("completed");
          toast.success(`Campaign completed — ${data.post_count ?? 0} posts published`);
          notifiedLocked.current.clear();
        } else if (data.status === "error") {
          onStatusChange("failed");
          toast.error("Campaign failed — check account status");
          notifiedLocked.current.clear();
        } else if (data.status === "aborted") {
          onStatusChange("aborted");
          toast.warning("Campaign aborted");
          notifiedLocked.current.clear();
        }
      } catch {
        // server unreachable — keep polling
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => { active = false; clearInterval(interval); };
  }, [campaign.id, onStatusChange]);

  return (
    <div className="px-8 py-3 bg-blue-50/40 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-900/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-blue-600 dark:text-blue-400 truncate mr-3">
          {latestSentence}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {postCount > 0 && (
            <span className="text-[11px] text-blue-500 dark:text-blue-400 tabular-nums">
              {postCount} posted
            </span>
          )}
          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 tabular-nums">
            {progress}%
          </span>
        </div>
      </div>
      <div className="w-full h-1 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-[1800ms] ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

function ActionMenu({
  status,
  onEdit,
  onRemove,
  onRetry,
  onRerun,
}: {
  status: PostStatus;
  onEdit?: () => void;
  onRemove: () => void;
  onRetry?: () => void;
  onRerun?: () => void;
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
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
      >
        <MoreHorizontal size={14} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute z-20 right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {status === "not-started" && onEdit && (
            <button
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { onEdit(); setOpen(false); }}
            >
              Edit
            </button>
          )}
          {(status === "failed" || status === "aborted") && onRetry && (
            <button
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { onRetry(); setOpen(false); }}
            >
              Retry
            </button>
          )}
          {status === "completed" && onRerun && (
            <button
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { onRerun(); setOpen(false); }}
            >
              Re-run
            </button>
          )}
          <div className="border-t border-gray-100 dark:border-gray-800" />
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

// ─── Running Row ──────────────────────────────────────────────────────────────

function RunningRow({
  campaign,
  onAbort,
  onStatusChange,
}: {
  campaign: PostCampaign;
  onAbort: () => void;
  onStatusChange: (status: PostStatus) => void;
}) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 bg-blue-50/20 dark:bg-blue-950/10">
      <div className="flex items-center gap-4 px-8 py-4">
        {/* Pulsing dot — in w-4 container to align with QueueRow's grip column */}
        <div className="w-4 flex-shrink-0 flex items-center">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </div>
        </div>

        {/* Position spacer — aligns with QueueRow's position column */}
        <span className="w-6 flex-shrink-0" />

        {/* Platform */}
        <span className="text-xs text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">
          {PLATFORM_LABELS[campaign.platform]}
        </span>

        {/* Targets */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <OutlineBadge small label={`@${campaign.user_accounts[0]}`} />
          {campaign.user_accounts.length > 1 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              +{campaign.user_accounts.length - 1}
            </span>
          )}
        </div>

        {/* Caption */}
        <div className="flex-[2] min-w-0 flex items-center gap-1.5">
          {campaign.caption && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{campaign.caption}</p>
          )}
          {!!campaign.image_count && campaign.image_count > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
              <ImageIcon size={10} strokeWidth={1.8} />
              {campaign.image_count} image{campaign.image_count > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Status */}
        <StatusBadge status="in-progress" withDot />

        {/* Abort */}
        <button
          onClick={onAbort}
          className="p-1 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
          title="Abort post campaign"
        >
          <StopCircle size={15} strokeWidth={1.8} />
        </button>
      </div>

      <PostProgressPanel campaign={campaign} onStatusChange={onStatusChange} />
    </div>
  );
}

// ─── Queue Row (not-started, draggable) ───────────────────────────────────────

function QueueRow({
  campaign,
  position,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onStart,
  onEdit,
  onRemove,
}: {
  campaign: PostCampaign;
  position: number;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onStart: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  if (isDragging) {
    return (
      <div
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
        className="flex items-center gap-4 px-8 py-4 border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/20 select-none"
      >
        <div className="w-4 flex-shrink-0 text-gray-200 dark:text-gray-700">
          <GripVertical size={14} strokeWidth={1.8} />
        </div>
        <span className="text-xs font-mono text-gray-200 dark:text-gray-700 w-6 flex-shrink-0">{position}</span>
        <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className="flex items-center gap-4 px-8 py-4 border-b border-gray-100 dark:border-gray-800 transition-colors select-none group hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
    >
      {/* Drag handle */}
      <div className="w-4 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors">
        <GripVertical size={14} strokeWidth={1.8} />
      </div>

      {/* Position */}
      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0">
        {position}
      </span>

      {/* Platform */}
      <span className="text-xs text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">
        {PLATFORM_LABELS[campaign.platform]}
      </span>

      {/* Targets */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <OutlineBadge small label={`@${campaign.user_accounts[0]}`} />
        {campaign.user_accounts.length > 1 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            +{campaign.user_accounts.length - 1}
          </span>
        )}
      </div>

      {/* Caption */}
      <div className="flex-[2] min-w-0 flex items-center gap-1.5">
        {campaign.caption && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{campaign.caption}</p>
        )}
        {!!campaign.image_count && campaign.image_count > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
            <ImageIcon size={10} strokeWidth={1.8} />
            {campaign.image_count} image{campaign.image_count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Status */}
      <StatusBadge status={campaign.status} />

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onStart}
          className="p-1 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors"
          title="Start post campaign"
        >
          <Play size={13} strokeWidth={1.8} fill="currentColor" />
        </button>
        <ActionMenu status="not-started" onEdit={onEdit} onRemove={onRemove} />
      </div>
    </div>
  );
}

// ─── Static Row (completed / failed / aborted) ────────────────────────────────

function StaticRow({
  campaign,
  onRemove,
  onRetry,
  onRerun,
}: {
  campaign: PostCampaign;
  onRemove: () => void;
  onRetry?: () => void;
  onRerun?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-8 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${
        campaign.status === "failed" ? "bg-red-50/40 dark:bg-red-950/10" : ""
      }`}
    >
      {/* Platform */}
      <span className="text-xs text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">
        {PLATFORM_LABELS[campaign.platform]}
      </span>

      {/* Targets */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <OutlineBadge small label={`@${campaign.user_accounts[0]}`} />
        {campaign.user_accounts.length > 1 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            +{campaign.user_accounts.length - 1}
          </span>
        )}
      </div>

      {/* Caption */}
      <div className="flex-[2] min-w-0 flex items-center gap-1.5">
        {campaign.caption && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{campaign.caption}</p>
        )}
        {!!campaign.image_count && campaign.image_count > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
            <ImageIcon size={10} strokeWidth={1.8} />
            {campaign.image_count} image{campaign.image_count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Status */}
      <StatusBadge status={campaign.status} />

      {/* Updated at */}
      <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
        {format(new Date(campaign.updated_at), "MMM d, h:mm a")}
      </span>

      {/* Actions */}
      <ActionMenu
        status={campaign.status}
        onRemove={onRemove}
        onRetry={onRetry}
        onRerun={onRerun}
      />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <ListOrdered size={28} strokeWidth={1.3} className="text-gray-300 dark:text-gray-700 mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No posts found</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add a post campaign to get started</p>
    </div>
  );
}

// ─── Insert Line (drag-and-drop position indicator) ──────────────────────────

function InsertLine() {
  return (
    <div className="flex items-center gap-1.5 px-8 -my-px z-10 relative pointer-events-none">
      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      <div className="flex-1 h-0.5 bg-blue-500 rounded-full" />
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

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

interface EditForm {
  caption: string;
  user_accounts: string[];
  target_profiles: string[];
  targeting_mode: TargetingMode;
  number_of_posts: number;
  target_date: Date | undefined;
  post_delay: number;
}

function EditSheet({
  campaign,
  open,
  onClose,
  onSave,
}: {
  campaign: PostCampaign | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, changes: Partial<PostCampaign>) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    caption: "",
    user_accounts: [],
    target_profiles: [],
    targeting_mode: "posts",
    number_of_posts: 5,
    target_date: undefined,
    post_delay: 15,
  });
  const [accountInput, setAccountInput] = useState("");
  const [profileInput, setProfileInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setForm({
      caption: campaign.caption,
      user_accounts: [...campaign.user_accounts],
      target_profiles: [...campaign.target_profiles],
      targeting_mode: campaign.targeting_mode,
      number_of_posts: campaign.number_of_posts ?? 5,
      target_date: campaign.target_date ? new Date(campaign.target_date) : undefined,
      post_delay: campaign.post_delay,
    });
    setAccountInput("");
    setProfileInput("");
  }, [campaign]);

  const addAccount = () => {
    const val = accountInput.trim().replace(/^@/, "");
    if (!val || form.user_accounts.includes(val)) return;
    setForm((f) => ({ ...f, user_accounts: [...f.user_accounts, val] }));
    setAccountInput("");
  };

  const addProfile = () => {
    const val = profileInput.trim().replace(/^@/, "");
    if (!val || form.target_profiles.includes(val) || form.target_profiles.length >= 5) return;
    setForm((f) => ({ ...f, target_profiles: [...f.target_profiles, val] }));
    setProfileInput("");
  };

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);
    // TODO: patch in Supabase
    await new Promise((r) => setTimeout(r, 600));
    onSave(campaign.id, {
      caption: form.caption,
      user_accounts: form.user_accounts,
      target_profiles: form.target_profiles,
      targeting_mode: form.targeting_mode,
      number_of_posts: form.number_of_posts,
      target_date: form.target_date?.toISOString(),
      post_delay: form.post_delay,
    });
    setSaving(false);
  };

  const clampDelay = (v: number) => Math.min(60, Math.max(8, v));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 dark:bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col transition-[transform,visibility] duration-200 ease-in-out ${
          open ? "translate-x-0 visible" : "translate-x-full invisible"
        }`}
      >
        {/* ── Sheet Header ──────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Edit Post Campaign</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {campaign ? PLATFORM_LABELS[campaign.platform] : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-0.5"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Caption */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Caption
            </label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              rows={3}
              placeholder="Enter post caption…"
              className="w-full resize-none text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">
              {form.caption.length} characters
            </p>
          </div>

          {/* User Accounts */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              User Accounts
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAccount(); } }}
                placeholder="@username"
                className="flex-1 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
              <button
                type="button"
                onClick={addAccount}
                className="text-xs px-4 py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            {form.user_accounts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.user_accounts.map((u) => (
                  <OutlineBadge
                    key={u}
                    label={`@${u}`}
                    onRemove={() =>
                      setForm((f) => ({ ...f, user_accounts: f.user_accounts.filter((x) => x !== u) }))
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Target Profiles */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Target Profiles
              </label>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                {form.target_profiles.length}/5
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProfile(); } }}
                disabled={form.target_profiles.length >= 5}
                placeholder="@username"
                className="flex-1 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={addProfile}
                disabled={form.target_profiles.length >= 5}
                className="text-xs px-4 py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {form.target_profiles.length >= 5 && (
              <div className="flex items-center gap-1.5 mt-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={12} strokeWidth={1.8} />
                <span className="text-[11px]">Maximum limit reached. Remove a profile to add another.</span>
              </div>
            )}
            {form.target_profiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.target_profiles.map((p) => (
                  <OutlineBadge
                    key={p}
                    label={`@${p}`}
                    onRemove={() =>
                      setForm((f) => ({ ...f, target_profiles: f.target_profiles.filter((x) => x !== p) }))
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Targeting Mode */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
              Post Targeting
            </label>
            <div className="flex flex-col gap-3">

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="pb-edit-targeting"
                  value="posts"
                  checked={form.targeting_mode === "posts"}
                  onChange={() => setForm((f) => ({ ...f, targeting_mode: "posts" }))}
                  className="mt-0.5 accent-gray-700 dark:accent-gray-300"
                />
                <div className="flex-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300">Number of posts</span>
                  {form.targeting_mode === "posts" && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {form.number_of_posts} posts
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        step={1}
                        value={form.number_of_posts}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, number_of_posts: parseInt(e.target.value) }))
                        }
                        className="w-full accent-gray-700 dark:accent-gray-300 cursor-pointer"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">1</span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">50</span>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="pb-edit-targeting"
                  value="date"
                  checked={form.targeting_mode === "date"}
                  onChange={() => setForm((f) => ({ ...f, targeting_mode: "date" }))}
                  className="mt-0.5 accent-gray-700 dark:accent-gray-300"
                />
                <div className="flex-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300">Posts from date to now</span>
                  {form.targeting_mode === "date" && (
                    <div className="mt-1.5">
                      <DatePicker
                        value={form.target_date}
                        onChange={(d) => setForm((f) => ({ ...f, target_date: d }))}
                      />
                    </div>
                  )}
                </div>
              </label>

            </div>
          </div>

          {/* Post Delay */}
          <div className="px-8 py-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Delay Between Posts
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Randomized ±20%
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                <input
                  type="number"
                  min={8}
                  max={60}
                  value={form.post_delay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, post_delay: clampDelay(parseInt(e.target.value) || 15) }))
                  }
                  className="w-16 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">sec</span>
              </div>
            </div>
            <input
              type="range"
              min={8}
              max={60}
              step={1}
              value={form.post_delay}
              onChange={(e) => setForm((f) => ({ ...f, post_delay: parseInt(e.target.value) }))}
              className="w-full accent-gray-700 dark:accent-gray-300 cursor-pointer"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">Faster (8s)</span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">Safer (60s)</span>
            </div>
          </div>

        </div>

        {/* ── Sheet Footer ──────────────────────────────────────────────────── */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostBotQueueTab() {
  const [items, setItems] = useState<PostCampaign[]>([]);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drag state
  const dragId = useRef<string | null>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const insertBeforeIdRef = useRef<string | null>(null);
  const [insertBeforeId, setInsertBeforeId] = useState<string | null>(null);
  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);

  // Move floating preview to follow cursor via direct DOM update (no re-render)
  useEffect(() => {
    const handler = (e: DragEvent) => {
      if (dragPreviewRef.current && dragId.current) {
        dragPreviewRef.current.style.transform =
          `translate(${e.clientX + 12}px, ${e.clientY - 22}px)`;
      }
    };
    document.addEventListener("dragover", handler);
    return () => document.removeEventListener("dragover", handler);
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>("queued");
  const [editingCampaign, setEditingCampaign] = useState<PostCampaign | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const [queuePage, setQueuePage]         = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [failedPage, setFailedPage]       = useState(1);
  const [abortedPage, setAbortedPage]     = useState(1);

  // ─── Fetch campaigns from Supabase ──────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    const { data, error } = await supabase
      .from("post_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Failed to load campaigns: ${error.message}`);
      return;
    }
    setItems((data ?? []).map(mapDbToPost));
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // ─── Derived lists ──────────────────────────────────────────────────────────

  const running    = items.filter((c) => c.status === "in-progress");
  const notStarted = items.filter((c) => c.status === "not-started");
  const completed  = items.filter((c) => c.status === "completed");
  const failed     = items.filter((c) => c.status === "failed");
  const aborted    = items.filter((c) => c.status === "aborted");

  const filteredQueue = notStarted
    .filter((c) => platformFilter === "all" || c.platform === platformFilter)
    .sort((a, b) => a.queue_position - b.queue_position);

  const sortedCompleted = [...completed].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const sortedFailed = [...failed].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const sortedAborted = [...aborted].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

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
    await fetchCampaigns();
    setIsRefreshing(false);
    toast.info("Queue refreshed");
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setQueuePage(1);
    setCompletedPage(1);
    setFailedPage(1);
    setAbortedPage(1);
  };

  const handlePlatformFilter = (v: string) => {
    setPlatformFilter(v as Platform | "all");
    setQueuePage(1);
  };

  const handleDragStart = (id: string, e: React.DragEvent) => {
    dragId.current = id;
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.transform =
        `translate(${e.clientX + 12}px, ${e.clientY - 22}px)`;
    }
    setIsDraggingId(id);
    if (dragGhostRef.current) {
      e.dataTransfer.setDragImage(dragGhostRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, rowId: string, nextRowId: string | null) => {
    e.preventDefault();
    if (!dragId.current || dragId.current === rowId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const insertTarget = e.clientY < rect.top + rect.height / 2
      ? rowId
      : (nextRowId ?? "END");
    if (insertBeforeIdRef.current !== insertTarget) {
      insertBeforeIdRef.current = insertTarget;
      setInsertBeforeId(insertTarget);
    }
  };

  const handleDragEnd = () => {
    dragId.current = null;
    insertBeforeIdRef.current = null;
    setInsertBeforeId(null);
    setIsDraggingId(null);
  };

  const handleDrop = () => {
    const sourceId = dragId.current;
    const beforeId = insertBeforeIdRef.current;
    if (!sourceId || !beforeId) { handleDragEnd(); return; }

    setItems((prev) => {
      const queue = [...prev.filter((c) => c.status === "not-started")].sort(
        (a, b) => a.queue_position - b.queue_position
      );
      const fromIdx = queue.findIndex((c) => c.id === sourceId);
      if (fromIdx === -1) return prev;

      const next = [...queue];
      const [moved] = next.splice(fromIdx, 1);

      if (beforeId === "END") {
        next.push(moved);
      } else {
        const toIdx = next.findIndex((c) => c.id === beforeId);
        next.splice(toIdx === -1 ? next.length : toIdx, 0, moved);
      }

      const reindexed = next.map((c, i) => ({ ...c, queue_position: i + 1 }));
      // Persist reordered positions to Supabase
      reindexed.forEach((c) => {
        supabase
          .from("post_campaigns")
          .update({ queue_position: c.queue_position })
          .eq("campaign_id", c.id)
          .then(({ error }) => {
            if (error) toast.error(`Failed to reorder: ${error.message}`);
          });
      });
      return prev.map((c) => reindexed.find((x) => x.id === c.id) ?? c);
    });

    handleDragEnd();
  };

  const handleStart = async (id: string) => {
    const campaign = items.find((c) => c.id === id);
    if (!campaign) return;
    try {
      const res = await fetch(`${BOT_URL}/api/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start campaign");
        return;
      }
      toast.success(`Post campaign started on ${PLATFORM_LABELS[campaign.platform]}`);
      setItems((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "in-progress" as PostStatus, updated_at: new Date().toISOString() } : c
        )
      );
    } catch {
      toast.error("Could not reach the post bot server");
    }
  };

  const handleAbort = async (id: string) => {
    try {
      const res = await fetch(`${BOT_URL}/api/abort`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id }),
      });
      const data = await res.json();
      if (data.status === "aborting") {
        toast.warning("Abort signal sent — campaign will stop after current action");
      } else if (data.status === "not_running") {
        toast.info("No campaign is currently running");
        fetchCampaigns();
      } else {
        toast.info(data.message || "Abort acknowledged");
      }
    } catch {
      toast.error("Could not reach the post bot server");
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from("post_campaigns")
      .delete()
      .eq("campaign_id", id);
    if (error) {
      toast.error(`Failed to remove campaign: ${error.message}`);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== id));
    toast.warning("Post campaign removed");
  };

  const handleRetry = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("post_campaigns")
      .update({ status: "not-started", updated_at: now })
      .eq("campaign_id", id);
    if (error) {
      toast.error(`Failed to retry campaign: ${error.message}`);
      return;
    }
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "not-started" as PostStatus, updated_at: now }
          : c
      )
    );
    toast.success("Post campaign moved back to queue");
  };

  const handleRerun = async (campaign: PostCampaign) => {
    const newId = "post_" + crypto.randomUUID();
    const now = new Date().toISOString();

    // Compute next queue position from DB
    const { data: maxRow } = await supabase
      .from("post_campaigns")
      .select("queue_position")
      .order("queue_position", { ascending: false })
      .limit(1);
    const newPosition = (maxRow?.[0]?.queue_position ?? 0) + 1;

    // Fetch the original row to get all DB columns
    const { data: original, error: fetchErr } = await supabase
      .from("post_campaigns")
      .select("*")
      .eq("campaign_id", campaign.id)
      .single();

    if (fetchErr || !original) {
      toast.error("Failed to load original campaign for re-run");
      return;
    }

    const { error } = await supabase
      .from("post_campaigns")
      .insert({
        campaign_id: newId,
        platform: original.platform,
        post_type: original.post_type,
        caption: original.caption,
        media_urls: original.media_urls,
        post_delay: original.post_delay,
        user_accounts: original.user_accounts,
        queue_position: newPosition,
        status: "not-started",
      });

    if (error) {
      toast.error(`Failed to re-run campaign: ${error.message}`);
      return;
    }

    const duplicate: PostCampaign = {
      ...campaign,
      id: newId,
      status: "not-started",
      queue_position: newPosition,
      updated_at: now,
    };
    setItems((prev) => [...prev, duplicate]);
    toast.success("Post campaign added back to queue");
  };

  const handleEdit = (campaign: PostCampaign) => {
    setEditingCampaign(campaign);
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = async (id: string, changes: Partial<PostCampaign>) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("post_campaigns")
      .update({ ...changes, updated_at: now })
      .eq("campaign_id", id);
    if (error) {
      toast.error(`Failed to update campaign: ${error.message}`);
      return;
    }
    setItems((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...changes, updated_at: now } : c
      )
    );
    setIsEditSheetOpen(false);
    toast.success("Post campaign updated");
  };

  // ─── Tab definitions ────────────────────────────────────────────────────────

  const tabDef: { id: TabId; label: string }[] = [
    { id: "queued",    label: `Queued (${notStarted.length + running.length})` },
    { id: "completed", label: `Completed (${completed.length})` },
    { id: "failed",    label: `Failed (${failed.length})` },
    { id: "aborted",   label: `Aborted (${aborted.length})` },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col -m-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">Post Queue</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 tabular-nums">
              {notStarted.length} queued
              {running.length > 0 && (
                <> · <span className="text-green-600 dark:text-green-500">{running.length} running</span></>
              )}
              {completed.length > 0 && <> · {completed.length} completed</>}
              {failed.length > 0 && (
                <> · <span className="text-red-500">{failed.length} failed</span></>
              )}
              {aborted.length > 0 && <> · {aborted.length} aborted</>}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center justify-center w-7 h-7 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw
                size={12}
                strokeWidth={1.8}
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>
            <CustomDropdown
              items={PLATFORM_FILTER_ITEMS}
              value={platformFilter}
              placeholder="All Platforms"
              onSelect={handlePlatformFilter}
              width="150px"
            />
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

      {/* ── Queued Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "queued" && (
        <>
          {running.map((c) => (
            <RunningRow
              key={c.id}
              campaign={c}
              onAbort={() => handleAbort(c.id)}
              onStatusChange={(status) => {
                setItems((prev) =>
                  prev.map((item) =>
                    item.id === c.id ? { ...item, status, updated_at: new Date().toISOString() } : item
                  )
                );
              }}
            />
          ))}

          {filteredQueue.length === 0 && running.length === 0 ? (
            <EmptyState />
          ) : filteredQueue.length === 0 ? null : (
            <>
              <div
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    insertBeforeIdRef.current = null;
                    setInsertBeforeId(null);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {(() => {
                  const paginatedQueue = paginate(filteredQueue, queuePage);
                  return paginatedQueue.map((c, i) => {
                    const globalIdx = (queuePage - 1) * PAGE_SIZE + i;
                    const nextId = i + 1 < paginatedQueue.length ? paginatedQueue[i + 1].id : null;
                    return (
                      <div key={c.id}>
                        {insertBeforeId === c.id && <InsertLine />}
                        <QueueRow
                          campaign={c}
                          position={globalIdx + 1}
                          isDragging={isDraggingId === c.id}
                          onDragStart={(e) => handleDragStart(c.id, e)}
                          onDragOver={(e) => handleDragOver(e, c.id, nextId)}
                          onDragEnd={handleDragEnd}
                          onDrop={handleDrop}
                          onStart={() => handleStart(c.id)}
                          onEdit={() => handleEdit(c)}
                          onRemove={() => handleRemove(c.id)}
                        />
                      </div>
                    );
                  });
                })()}
                {insertBeforeId === "END" && <InsertLine />}
              </div>
              <Pagination
                page={queuePage}
                total={totalPages(filteredQueue)}
                onPrev={() => setQueuePage((p) => p - 1)}
                onNext={() => setQueuePage((p) => p + 1)}
              />
            </>
          )}
        </>
      )}

      {/* ── Completed Tab ───────────────────────────────────────────────────── */}
      {activeTab === "completed" && (
        <>
          {sortedCompleted.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {paginate(sortedCompleted, completedPage).map((c) => (
                <StaticRow
                  key={c.id}
                  campaign={c}
                  onRemove={() => handleRemove(c.id)}
                  onRerun={() => handleRerun(c)}
                />
              ))}
              <Pagination
                page={completedPage}
                total={totalPages(sortedCompleted)}
                onPrev={() => setCompletedPage((p) => p - 1)}
                onNext={() => setCompletedPage((p) => p + 1)}
              />
            </>
          )}
        </>
      )}

      {/* ── Failed Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "failed" && (
        <>
          {sortedFailed.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {paginate(sortedFailed, failedPage).map((c) => (
                <StaticRow
                  key={c.id}
                  campaign={c}
                  onRemove={() => handleRemove(c.id)}
                  onRetry={() => handleRetry(c.id)}
                />
              ))}
              <Pagination
                page={failedPage}
                total={totalPages(sortedFailed)}
                onPrev={() => setFailedPage((p) => p - 1)}
                onNext={() => setFailedPage((p) => p + 1)}
              />
            </>
          )}
        </>
      )}

      {/* ── Aborted Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "aborted" && (
        <>
          {sortedAborted.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {paginate(sortedAborted, abortedPage).map((c) => (
                <StaticRow
                  key={c.id}
                  campaign={c}
                  onRemove={() => handleRemove(c.id)}
                  onRetry={() => handleRetry(c.id)}
                />
              ))}
              <Pagination
                page={abortedPage}
                total={totalPages(sortedAborted)}
                onPrev={() => setAbortedPage((p) => p - 1)}
                onNext={() => setAbortedPage((p) => p + 1)}
              />
            </>
          )}
        </>
      )}

      {/* Edit Sheet */}
      <EditSheet
        campaign={editingCampaign}
        open={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        onSave={handleSaveEdit}
      />

      {/* Floating drag preview */}
      <div
        ref={dragPreviewRef}
        className="fixed top-0 left-0 z-50 pointer-events-none"
        style={{ willChange: "transform" }}
        aria-hidden
      >
        {isDraggingId && (() => {
          const c = items.find((x) => x.id === isDraggingId);
          if (!c) return null;
          const pos = items
            .filter((x) => x.status === "not-started")
            .sort((a, b) => a.queue_position - b.queue_position)
            .findIndex((x) => x.id === c.id) + 1;
          return (
            <div className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 shadow-xl shadow-gray-300/40 dark:shadow-black/40 w-[520px] opacity-95">
              <GripVertical size={14} strokeWidth={1.8} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 flex-shrink-0">{pos}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">{PLATFORM_LABELS[c.platform]}</span>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <OutlineBadge small label={`@${c.user_accounts[0]}`} />
                {c.user_accounts.length > 1 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">+{c.user_accounts.length - 1}</span>
                )}
              </div>
              <div className="flex-[2] min-w-0 flex items-center gap-1.5">
                {c.caption && <p className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{c.caption}</p>}
                {!!c.image_count && c.image_count > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    <ImageIcon size={10} strokeWidth={1.8} />{c.image_count} image{c.image_count > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <StatusBadge status="not-started" />
            </div>
          );
        })()}
      </div>

      {/* Invisible drag ghost — suppresses browser's native ghost image */}
      <div ref={dragGhostRef} className="fixed opacity-0 pointer-events-none w-px h-px" aria-hidden />

    </div>
  );
}
