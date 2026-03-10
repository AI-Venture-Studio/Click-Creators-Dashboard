"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Paperclip, X, ChevronDown, AlertTriangle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "x" | "threads" | "";
type TargetingMode = "posts" | "date";

interface Account {
  username: string;
  is_active: boolean;
}

interface AttachmentPreview {
  file: File;
  previewUrl: string;
}

interface CampaignConfig {
  platform: Platform;
  targetingMode: TargetingMode;
  numberOfPosts: number;
  targetDate: string;
  customComment: string;
  postDelay: number;
  userAccounts: string[];
  targetProfiles: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: "instagram" as Platform, label: "Instagram",   disabled: false },
  { value: "x"         as Platform, label: "X (Twitter)", disabled: false },
  { value: "threads"   as Platform, label: "Threads",     disabled: false },
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  x: "X (Twitter)",
  threads: "Threads",

};

const ATTACHMENT_CONFIG: Record<
  string,
  { maxFiles: number; maxSizeMB: number; formats: string; accept: string }
> = {
  x: {
    maxFiles: 4,
    maxSizeMB: 5,
    formats: "JPEG, PNG, GIF, WEBP",
    accept: "image/jpeg,image/png,image/gif,image/webp",
  },
  threads: {
    maxFiles: 10,
    maxSizeMB: 8,
    formats: "JPEG, PNG, WEBP",
    accept: "image/jpeg,image/png,image/webp",
  },
};

const SUPPORTS_ATTACHMENTS = (p: Platform) => p === "x" || p === "threads";

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
// Shared floating-list pattern used for both platform and account pickers.

interface DropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
  note?: string;
}

function CustomDropdown({
  items,
  value,
  placeholder,
  onSelect,
  disabled: triggerDisabled,
}: {
  items: DropdownItem[];
  value: string;
  placeholder: string;
  onSelect: (v: string) => void;
  disabled?: boolean;
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
        disabled={triggerDisabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  onSelect(item.value);
                  setOpen(false);
                }
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <span>{item.label}</span>
              {item.note && (
                <span className="text-[10px] text-gray-400 dark:text-gray-600">{item.note}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Date Picker ──────────────────────────────────────────────────────────────

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

// ─── Account Badge ────────────────────────────────────────────────────────────

function AccountBadge({
  username,
  isActive,
  onRemove,
}: {
  username: string;
  isActive: boolean;
  onRemove: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
        isActive
          ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
      }`}
    >
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

// ─── Summary Row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">
        {label}
      </span>
      <span className="text-[11px] text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConfigureCommentsTab() {
  // Form state
  const [platform, setPlatform] = useState<Platform>("");
  const [targetingMode, setTargetingMode] = useState<TargetingMode>("posts");
  const [numberOfPosts, setNumberOfPosts] = useState(5);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [customComment, setCustomComment] = useState("");
  const [postDelay, setPostDelay] = useState(15);
  const [userAccounts, setUserAccounts] = useState<string[]>([]);
  const [targetProfiles, setTargetProfiles] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);

  // Account picker state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Profile input
  const [profileInput, setProfileInput] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("campaignConfig");
      if (saved) {
        const c: CampaignConfig = JSON.parse(saved);
        setPlatform(c.platform ?? "");
        setTargetingMode(c.targetingMode ?? "posts");
        setNumberOfPosts(c.numberOfPosts ?? 5);
        setTargetDate(c.targetDate ? new Date(c.targetDate) : undefined);
        setCustomComment(c.customComment ?? "");
        setPostDelay(c.postDelay ?? 15);
        setUserAccounts(c.userAccounts ?? []);
        setTargetProfiles(c.targetProfiles ?? []);
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  // ─── Persist to localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const config: CampaignConfig = {
      platform,
      targetingMode,
      numberOfPosts,
      targetDate: targetDate ? targetDate.toISOString() : "",
      customComment,
      postDelay,
      userAccounts,
      targetProfiles,
    };
    localStorage.setItem("campaignConfig", JSON.stringify(config));
  }, [platform, targetingMode, numberOfPosts, targetDate, customComment, postDelay, userAccounts, targetProfiles]);

  // ─── Fetch accounts on platform change ───────────────────────────────────
  useEffect(() => {
    if (!platform) {
      setAccounts([]);
      return;
    }
    setAccountsLoading(true);
    setUserAccounts([]);

    (async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("username, is_active")
        .eq("platform", platform);
      if (error) {
        toast.error(`Failed to load accounts: ${error.message}`);
        setAccounts([]);
      } else {
        setAccounts(data ?? []);
      }
      setAccountsLoading(false);
    })();
  }, [platform]);

  // ─── Close account picker on outside click ───────────────────────────────
  useEffect(() => {
    if (!pickerOpen) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // ─── Attachment handling ─────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files || !platform) return;
    const cfg = ATTACHMENT_CONFIG[platform];
    if (!cfg) return;
    const remaining = cfg.maxFiles - attachments.length;
    const next: AttachmentPreview[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > cfg.maxSizeMB * 1024 * 1024) continue;
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ─── Form validation ──────────────────────────────────────────────────────
  const isFormComplete = () => {
    if (!platform) return false;
    if (targetingMode === "date" && !targetDate) return false;
    const hasText = customComment.trim().length > 0;
    const hasImages = attachments.length > 0;
    if (platform === "x") {
      if (!hasText && !hasImages) return false;
    } else {
      if (!hasText) return false;
    }
    if (userAccounts.length === 0) return false;
    if (targetProfiles.length === 0) return false;
    return true;
  };

  // ─── Clear ────────────────────────────────────────────────────────────────
  const handleClear = () => {
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setPlatform("");
    setTargetingMode("posts");
    setNumberOfPosts(5);
    setTargetDate(undefined);
    setCustomComment("");
    setPostDelay(15);
    setUserAccounts([]);
    setTargetProfiles([]);
    setProfileInput("");
    localStorage.removeItem("campaignConfig");
    toast.info("Form cleared");
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isFormComplete() || saving) return;
    setSaving(true);
    try {
      const campaignId = "campaign_" + crypto.randomUUID();

      // 1. Upload attachments to Supabase Storage (if any)
      const mediaAttachments: { storage_path: string; file_name: string }[] = [];
      for (const att of attachments) {
        const storagePath = `campaigns/${campaignId}/${att.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("campaign-media")
          .upload(storagePath, att.file);
        if (uploadError) {
          toast.error(`Failed to upload ${att.file.name}: ${uploadError.message}`);
          setSaving(false);
          return;
        }
        mediaAttachments.push({ storage_path: storagePath, file_name: att.file.name });
      }

      // 2. Insert campaign row
      const { error } = await supabase
        .from("comment_campaigns")
        .insert({
          campaign_id: campaignId,
          platform,
          user_accounts: userAccounts,
          target_profiles: targetProfiles,
          targeting_mode: targetingMode,
          custom_comment: customComment || null,
          media_attachments: mediaAttachments.length > 0 ? mediaAttachments : null,
          number_of_posts: targetingMode === "posts" ? numberOfPosts : null,
          target_date: targetingMode === "date" && targetDate ? targetDate.toISOString() : null,
          post_delay: postDelay,
          queue_position: 1,
          status: "not-started",
        });

      if (error) {
        toast.error(error.message || "Failed to create campaign");
        setSaving(false);
        return;
      }

      handleClear();
      toast.success("Campaign added to queue");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Add profile ──────────────────────────────────────────────────────────
  const addProfile = () => {
    const val = profileInput.trim().replace(/^@/, "");
    if (!val || targetProfiles.includes(val) || targetProfiles.length >= 5) return;
    setTargetProfiles((prev) => [...prev, val]);
    setProfileInput("");
  };

  const clampDelay = (v: number) => Math.min(20, Math.max(8, v));

  const filteredAccounts = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(accountSearch.toLowerCase()) &&
      !userAccounts.includes(a.username)
  );

  const attachCfg = platform && ATTACHMENT_CONFIG[platform] ? ATTACHMENT_CONFIG[platform] : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col -m-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Configure Comment Campaign
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Set up your automated commenting campaign across social media platforms
        </p>
      </div>

      {/* ── Section 1 — Platform + Post Targeting ───────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-6">

          {/* Left — Platform */}
          <div className="border-r border-gray-100 dark:border-gray-800 pr-6">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Campaign Platform
            </label>
            <CustomDropdown
              items={PLATFORMS.map((p) => ({
                value: p.value,
                label: p.label,
                disabled: p.disabled,
              }))}
              value={platform}
              placeholder="Select platform…"
              onSelect={(v) => {
                setPlatform(v as Platform);
                setAttachments([]);
              }}
            />
          </div>

          {/* Right — Targeting */}
          <div className="pl-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Post Targeting
            </label>
            <div className="flex flex-col gap-3">

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="targeting"
                  value="posts"
                  checked={targetingMode === "posts"}
                  onChange={() => setTargetingMode("posts")}
                  className="mt-0.5 accent-gray-700 dark:accent-gray-300"
                />
                <div className="flex-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300">Number of posts</span>
                  {targetingMode === "posts" && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <input
                        type="number"
                        min={1}
                        value={numberOfPosts}
                        onChange={(e) =>
                          setNumberOfPosts(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-16 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500">latest posts</span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="targeting"
                  value="date"
                  checked={targetingMode === "date"}
                  onChange={() => setTargetingMode("date")}
                  className="mt-0.5 accent-gray-700 dark:accent-gray-300"
                />
                <div className="flex-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300">Posts from date to now</span>
                  {targetingMode === "date" && (
                    <div className="mt-1.5">
                      <DatePicker value={targetDate} onChange={setTargetDate} />
                    </div>
                  )}
                </div>
              </label>

            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2 — Custom Comment ──────────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Custom Comment
        </label>
        <div className="relative">
          <textarea
            value={customComment}
            onChange={(e) => setCustomComment(e.target.value)}
            placeholder="Enter the comment you want to post on targeted profiles…"
            className="w-full resize-none min-h-[100px] text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 pb-9 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
          {SUPPORTS_ATTACHMENTS(platform) && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!attachCfg && attachments.length >= attachCfg.maxFiles}
                className="absolute bottom-2.5 right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
                title="Attach image"
              >
                <Paperclip size={14} strokeWidth={1.8} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={attachCfg?.accept}
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-gray-400 dark:text-gray-600">
            {customComment.length} characters
          </span>
          {attachCfg && (
            <span className="text-[11px] text-gray-400 dark:text-gray-600">
              {attachments.length}/{attachCfg.maxFiles} images • {attachCfg.formats} • Max{" "}
              {attachCfg.maxSizeMB}MB each
            </span>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {attachments.map((a, i) => (
              <div
                key={i}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.previewUrl} alt={a.file.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <span className="text-[8px] text-white truncate block leading-tight">
                    {a.file.name}
                  </span>
                </div>
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 3 — Time Between Comments ──────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Time Between Comments
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Delay applied between commenting on posts (randomized ±20%)
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
            <input
              type="number"
              min={8}
              max={20}
              value={postDelay}
              onChange={(e) => setPostDelay(clampDelay(parseInt(e.target.value) || 15))}
              className="w-16 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 text-center focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">sec</span>
          </div>
        </div>
        <input
          type="range"
          min={8}
          max={20}
          step={1}
          value={postDelay}
          onChange={(e) => setPostDelay(parseInt(e.target.value))}
          className="w-full accent-gray-700 dark:accent-gray-300 cursor-pointer"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Faster (8s)</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Safer (20s)</span>
        </div>
      </div>

      {/* ── Section 4 — Your User Accounts ─────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
          Your User Accounts
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
          {!platform
            ? "Select a platform to see available accounts"
            : "Accounts that will post the comments"}
        </p>

        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            disabled={!platform || accountsLoading}
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xs">
              {accountsLoading
                ? "Loading accounts…"
                : !platform
                ? "Select a platform first"
                : accounts.length === 0
                ? "No accounts available — add accounts first"
                : "Search and select account"}
            </span>
            <ChevronDown size={13} strokeWidth={1.8} className="text-gray-400 flex-shrink-0" />
          </button>

          {pickerOpen && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search
                    size={12}
                    strokeWidth={1.8}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search accounts…"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    autoFocus
                    className="w-full text-xs bg-gray-50 dark:bg-gray-800 rounded-lg pl-7 pr-3 py-1.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none border-0"
                  />
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-600 px-3 py-3">
                    No accounts found
                  </p>
                ) : (
                  filteredAccounts.map((a) => (
                    <button
                      key={a.username}
                      type="button"
                      className="w-full text-left text-xs px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-150"
                      onClick={() => {
                        setUserAccounts((prev) => [...prev, a.username]);
                        setPickerOpen(false);
                        setAccountSearch("");
                      }}
                    >
                      @{a.username}
                      {!a.is_active && (
                        <span className="ml-1.5 text-[10px] text-red-400">(inactive)</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {userAccounts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {userAccounts.map((u) => {
              const acc = accounts.find((a) => a.username === u);
              return (
                <AccountBadge
                  key={u}
                  username={u}
                  isActive={acc?.is_active ?? true}
                  onRemove={() =>
                    setUserAccounts((prev) => prev.filter((x) => x !== u))
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 5 — Target Profiles ─────────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Target Profiles</p>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
            {targetProfiles.length}/5 profiles
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProfile();
              }
            }}
            disabled={targetProfiles.length >= 5}
            placeholder="@username"
            className="flex-1 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={addProfile}
            disabled={targetProfiles.length >= 5}
            className="text-xs px-4 py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Add
          </button>
        </div>

        {targetProfiles.length >= 5 && (
          <div className="flex items-center gap-1.5 mt-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={12} strokeWidth={1.8} />
            <span className="text-[11px]">
              Maximum limit reached. Remove a profile to add another.
            </span>
          </div>
        )}

        {targetProfiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {targetProfiles.map((p) => (
              <ProfileBadge
                key={p}
                username={p}
                onRemove={() =>
                  setTargetProfiles((prev) => prev.filter((x) => x !== p))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Section 6 — Campaign Summary (conditional) ──────────────────────── */}
      {isFormComplete() && (
        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Campaign Summary
            </p>
            <div className="flex flex-col gap-2">
              <SummaryRow
                label="Comment"
                value={
                  customComment.trim()
                    ? customComment.slice(0, 40) + (customComment.length > 40 ? "…" : "")
                    : "[Images only]"
                }
              />
              <SummaryRow label="Platform" value={PLATFORM_LABELS[platform] ?? platform} />
              <SummaryRow
                label="Targets"
                value={targetProfiles.map((p) => `@${p}`).join(", ")}
              />
              <SummaryRow
                label="Posts"
                value={
                  targetingMode === "posts"
                    ? `Latest ${numberOfPosts} posts`
                    : targetDate
                    ? `Posts from ${format(targetDate, "MMM d, yyyy")} to now`
                    : ""
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Section 7 — Action Buttons ──────────────────────────────────────── */}
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
          disabled={!isFormComplete() || saving}
          className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        >
          {saving ? "Adding… ⏳" : "Add to Queue"}
        </button>
      </div>

    </div>
  );
}
