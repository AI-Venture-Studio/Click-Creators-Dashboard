"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown, Paperclip, Film, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "threads" | "";
type PostType = "carousel" | "reel";

interface Account {
  username: string;
  is_active: boolean;
}

interface MediaPreview {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

interface PostConfig {
  platform: Platform;
  postType: PostType;
  caption: string;
  postDelay: number;
  userAccounts: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string; disabled: boolean; note?: string }[] = [
  { value: "instagram", label: "Instagram",   disabled: false },
  { value: "threads",   label: "Threads",     disabled: false },
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  threads: "Threads",
};

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

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

export default function ConfigurePostsTab() {
  // Form state
  const [platform, setPlatform] = useState<Platform>("");
  const [postType, setPostType] = useState<PostType>("carousel");
  const [caption, setCaption] = useState("");
  const [postDelay, setPostDelay] = useState(15);
  const [userAccounts, setUserAccounts] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaPreview[]>([]);

  // Account picker state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [saving, setSaving] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("postConfig");
      if (saved) {
        const c: PostConfig = JSON.parse(saved);
        setPlatform(c.platform ?? "");
        setPostType(c.postType ?? "carousel");
        setCaption(c.caption ?? "");
        setPostDelay(c.postDelay ?? 15);
        setUserAccounts(c.userAccounts ?? []);
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  // ─── Persist to localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const config: PostConfig = {
      platform,
      postType,
      caption,
      postDelay,
      userAccounts,
    };
    localStorage.setItem("postConfig", JSON.stringify(config));
  }, [platform, postType, caption, postDelay, userAccounts]);

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

  // ─── Reset media when post type changes ──────────────────────────────────
  useEffect(() => {
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMedia([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postType]);

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

  // ─── Media handling ───────────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    if (postType === "reel") {
      // Single video only
      const file = files[0];
      if (!file || !file.type.startsWith("video/")) return;
      media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      setMedia([{ file, previewUrl: URL.createObjectURL(file), isVideo: true }]);
      return;
    }

    // Carousel: multiple images + videos, max 10
    const MAX = 10;
    const remaining = MAX - media.length;
    const next: MediaPreview[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;
      if (platform === "instagram" && file.type === "image/webp") continue;
      next.push({ file, previewUrl: URL.createObjectURL(file), isVideo });
    }
    setMedia((prev) => [...prev, ...next]);
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ─── Form validation ──────────────────────────────────────────────────────
  const isFormComplete = () => {
    if (!platform) return false;
    if (!caption.trim() && media.length === 0) return false;
    if (postType === "reel" && media.length === 0) return false;
    if (userAccounts.length === 0) return false;
    return true;
  };

  // ─── Clear ────────────────────────────────────────────────────────────────
  const handleClear = () => {
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMedia([]);
    setPlatform("");
    setPostType("carousel");
    setCaption("");
    setPostDelay(15);
    setUserAccounts([]);
    localStorage.removeItem("postConfig");
    toast.info("Form cleared");
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isFormComplete() || saving) return;
    setSaving(true);
    try {
      const campaignId = "post_" + crypto.randomUUID();

      // 1. Upload media to Supabase Storage
      const mediaUrls: string[] = [];
      for (const m of media) {
        const storagePath = `campaigns/${campaignId}/${m.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("campaign-media")
          .upload(storagePath, m.file);
        if (uploadError) {
          toast.error(`Failed to upload ${m.file.name}: ${uploadError.message}`);
          setSaving(false);
          return;
        }
        mediaUrls.push(storagePath);
      }

      // 2. Compute next queue position
      const { data: maxRow } = await supabase
        .from("post_campaigns")
        .select("queue_position")
        .order("queue_position", { ascending: false })
        .limit(1);
      const nextPosition = (maxRow?.[0]?.queue_position ?? 0) + 1;

      // 3. Insert row into post_campaigns table
      const { error } = await supabase
        .from("post_campaigns")
        .insert({
          campaign_id: campaignId,
          platform,
          post_type: postType,
          caption: caption || null,
          media_urls: mediaUrls,
          post_delay: postDelay,
          user_accounts: userAccounts,
          queue_position: nextPosition,
          status: "not-started",
        });

      if (error) {
        toast.error(error.message || "Failed to create post campaign");
        setSaving(false);
        return;
      }

      handleClear();
      toast.success("Post added to queue!");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const clampDelay = (v: number) => Math.min(20, Math.max(8, v));

  const filteredAccounts = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(accountSearch.toLowerCase()) &&
      !userAccounts.includes(a.username)
  );

  const carouselFull = postType === "carousel" && media.length >= 10;
  const reelFull = postType === "reel" && media.length >= 1;

  const acceptAttr =
    postType === "reel"
      ? "video/*"
      : platform === "instagram"
        ? "image/jpeg,image/png,video/*"
        : "image/*,video/*";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col -m-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Configure Post Campaign
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Set up your automated posting campaign across social media platforms
        </p>
      </div>

      {/* ── Section 1 — Platform + Post Type ────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className={`grid ${platform === "threads" ? "grid-cols-1" : "grid-cols-2"} gap-6`}>

          {/* Left — Platform */}
          <div className={`${platform !== "threads" ? "border-r border-gray-100 dark:border-gray-800 pr-6" : ""}`}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Campaign Platform
            </label>
            <CustomDropdown
              items={PLATFORMS.map((p) => ({
                value: p.value,
                label: p.label,
                disabled: p.disabled,
                note: p.note,
              }))}
              value={platform}
              placeholder="Select platform…"
              onSelect={(v) => {
                setPlatform(v as Platform);
                if (v === "threads") {
                  setPostType("carousel");
                }
                media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
                setMedia([]);
              }}
            />
          </div>

          {/* Right — Post Type (hidden for Threads) */}
          {platform !== "threads" && (
            <div className="pl-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Post Type
              </label>
              <div className="flex flex-col gap-3">

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="postType"
                    value="carousel"
                    checked={postType === "carousel"}
                    onChange={() => setPostType("carousel")}
                    className="mt-0.5 accent-gray-700 dark:accent-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid size={12} strokeWidth={1.8} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Carousel</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Multiple photos and/or videos
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="postType"
                    value="reel"
                    checked={postType === "reel"}
                    onChange={() => setPostType("reel")}
                    className="mt-0.5 accent-gray-700 dark:accent-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <Film size={12} strokeWidth={1.8} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Reel</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Single video only
                    </p>
                  </div>
                </label>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2 — Post & Caption ──────────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Post &amp; Caption
        </label>
        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your post caption here…"
            className="w-full resize-none min-h-[100px] text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 pb-9 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={carouselFull || reelFull}
            className="absolute bottom-2.5 right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
            title="Attach media"
          >
            <Paperclip size={14} strokeWidth={1.8} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={postType === "carousel"}
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-gray-400 dark:text-gray-600">
            {caption.length} characters
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-600">
            {postType === "reel"
              ? media.length === 0 ? "No video selected" : "1 video selected"
              : `${media.length}/10 files`}
            {" · "}
            {postType === "reel" ? "MP4, MOV, WEBM" : "Images & videos"}
          </span>
        </div>

        {media.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {media.map((m, i) => (
              <div
                key={i}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-800"
              >
                {m.isVideo ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={20} strokeWidth={1.6} className="text-gray-400 dark:text-gray-500" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.previewUrl} alt={m.file.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <span className="text-[8px] text-white truncate block leading-tight">
                    {m.file.name}
                  </span>
                </div>
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4 — Time Between Posts ──────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Time Between Posts
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Delay applied between posting (randomized ±20%)
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

      {/* ── Section 5 — Your User Accounts ──────────────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
          Your User Accounts
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
          {!platform
            ? "Select a platform to see available accounts"
            : "Accounts that will publish the posts"}
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

      {/* ── Section 6 — Campaign Summary (conditional) ──────────────────────── */}
      {isFormComplete() && (
        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Campaign Summary
            </p>
            <div className="flex flex-col gap-2">
              <SummaryRow
                label="Caption"
                value={
                  caption.trim()
                    ? caption.slice(0, 40) + (caption.length > 40 ? "…" : "")
                    : "[Media only]"
                }
              />
              <SummaryRow label="Platform" value={PLATFORM_LABELS[platform] ?? platform} />
              {platform !== "threads" && (
                <SummaryRow
                  label="Post Type"
                  value={postType === "carousel" ? "Carousel" : "Reel"}
                />
              )}
              <SummaryRow
                label="Media"
                value={
                  media.length === 0
                    ? "None"
                    : postType === "reel"
                    ? "1 video"
                    : `${media.length} file${media.length !== 1 ? "s" : ""}`
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
