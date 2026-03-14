"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, X, LayoutGrid, List, ChevronDown, ChevronLeft, ChevronRight,
  Search, MoreVertical, Pencil, Trash2,
  Loader2, Users, Info,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Integration icon ─────────────────────────────────────────────────────────
function IntegrationIcon({
  iconSrc,
  name,
  isHovered,
  isDimmed,
  onMouseEnter,
  onMouseLeave,
}: {
  iconSrc: string;
  name: string;
  isHovered: boolean;
  isDimmed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 w-32 cursor-pointer"
      style={{ opacity: isDimmed ? 0.25 : 1, transition: "opacity 0.2s ease" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative w-28 h-28">
        <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm flex items-center justify-center">
          <Image src={iconSrc} alt={name} width={112} height={112} className="object-contain w-28 h-28" />
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center rounded-3xl"
          style={{
            background: "rgba(0,0,0,0.18)",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.18s ease",
          }}
        >
          <Pencil
            size={24}
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
    </div>
  );
}

// ─── Integrations section ─────────────────────────────────────────────────────
const integrations = [
  { id: "dolphin-anty", iconSrc: "/dolphin-anty.png", name: "Dolphin Anty" },
  { id: "airtable",     iconSrc: "/airtable.png",     name: "Airtable"     },
  { id: "apify",        iconSrc: "/apify.png",        name: "Apify"        },
];

function IntegrationsSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section>
      <div className="flex items-center mb-4">
        <h2 className="text-xs text-gray-500 dark:text-gray-500">Integrations</h2>
      </div>
      <div className="flex gap-5">
        {integrations.map((integration) => (
          <IntegrationIcon
            key={integration.id}
            iconSrc={integration.iconSrc}
            name={integration.name}
            isHovered={hovered === integration.id}
            isDimmed={hovered !== null && hovered !== integration.id}
            onMouseEnter={() => setHovered(integration.id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialAccount {
  id: string;
  username: string;
  password: string | null;
  platform: string;
  browser_profile: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  locked_by: string | null;
  locked_at: string | null;
}

type SocialPlatform = "instagram" | "x" | "threads" | "tiktok";
type ActiveFilter   = "all" | "active" | "inactive";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram",   disabled: false },
  { value: "x",         label: "X (Twitter)", disabled: false },
  { value: "threads",   label: "Threads",     disabled: false },
  { value: "tiktok",    label: "TikTok",      disabled: false },
];

const LIST_PLATFORMS: { id: SocialPlatform; label: string; disabled: boolean }[] = [
  { id: "instagram", label: "Instagram",   disabled: false },
  { id: "x",         label: "X (Twitter)", disabled: false },
  { id: "threads",   label: "Threads",     disabled: false },
  { id: "tiktok",    label: "TikTok",      disabled: false },
];

// ─── Custom Select ────────────────────────────────────────────────────────────

interface SelectItem {
  value: string;
  label: string;
  disabled?: boolean;
  note?: string;
}

function CustomSelect({
  items,
  value,
  placeholder,
  onSelect,
  width,
}: {
  items: SelectItem[];
  value: string;
  placeholder?: string;
  onSelect: (v: string) => void;
  width?: number;
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

  const selected = items.find(i => i.value === value);

  return (
    <div className="relative" ref={ref} style={width ? { width } : undefined}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <span className={selected ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"}>
          {selected ? selected.label : (placeholder ?? "Select…")}
        </span>
        <ChevronDown size={12} strokeWidth={1.8} className="text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {items.map(item => (
            <button
              key={item.value}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) { onSelect(item.value); setOpen(false); }
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <span>{item.label}</span>
              {item.note && (
                <span className="text-[10px] text-gray-400 dark:text-gray-600 ml-2">{item.note}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared field classes ─────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full text-xs bg-gray-50 dark:bg-gray-900 border rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-colors ${
    hasError
      ? "border-red-400 dark:border-red-600 focus:ring-red-300 dark:focus:ring-red-700"
      : "border-gray-200 dark:border-gray-700 focus:ring-gray-300 dark:focus:ring-gray-600"
  }`;

// ─── Error mapper ─────────────────────────────────────────────────────────────
function getErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "An account with this username already exists for this platform";
  if (error.code === "23502") return "Required fields are missing";
  if (error.code === "23514") return "Invalid platform selected";
  if (error.message?.includes("JWT"))     return "Session expired. Please refresh the page.";
  if (error.message?.includes("network")) return "Network error. Check your connection.";
  return error.message || "Something went wrong. Try again.";
}

// ─── Add Individual Account Modal (card-view trigger) ─────────────────────────

interface AddAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddAccountModal({ onClose, onSuccess }: AddAccountModalProps) {
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [platform, setPlatform]             = useState("");
  const [browserProfile, setBrowserProfile] = useState("");
  const [saving, setSaving]                 = useState(false);

  const isValid = username.trim() !== "" && platform !== "" && browserProfile.trim() !== "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("social_accounts").insert({
        username:        username.trim(),
        password:        password.trim() || null,
        platform,
        browser_profile: browserProfile.trim(),
        is_active:       true,
      });
      if (error) { toast.error(error.message || "Failed to add account"); setSaving(false); return; }
      toast.success("Account added successfully");
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Add Individual Account</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Connect a new social media account</p>
          </div>
          <button type="button" onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={13} strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Platform <span className="text-red-400">*</span></label>
            <CustomSelect
              items={PLATFORM_OPTIONS.map(p => ({ value: p.value, label: p.label, disabled: p.disabled, note: p.disabled ? "coming soon" : undefined }))}
              value={platform}
              placeholder="Select platform…"
              onSelect={setPlatform}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Username <span className="text-red-400">*</span></label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. johndoe" required className={inputCls()} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span></label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls()} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Browser Profile <span className="text-red-400">*</span></label>
            <input type="text" value={browserProfile} onChange={(e) => setBrowserProfile(e.target.value)} placeholder="e.g. Profile 1" required className={inputCls()} />
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
            <button type="button" onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" disabled={!isValid || saving} className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium">
              {saving ? "Adding…" : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Account Setup section — card-view dropdown ───────────────────────────────

function AddAccountDropdown({ onClose, onAddIndividual }: { onClose: () => void; onAddIndividual: () => void }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm z-10 overflow-hidden">
      <button className="w-full text-left px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150" onClick={() => { onAddIndividual(); onClose(); }}>
        Add Individual Account
      </button>
      <div className="border-t border-gray-100 dark:border-gray-800" />
      <button disabled className="w-full text-left px-4 py-3 text-xs text-gray-400 dark:text-gray-600 flex items-center justify-between cursor-not-allowed">
        <span>Add Bulk Accounts via CSV</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600">coming soon</span>
      </button>
    </div>
  );
}

// ─── List View — Row Dropdown ─────────────────────────────────────────────────

function AccountRowDropdown({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <MoreVertical size={14} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm z-30 overflow-hidden">
          <button type="button" onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
            <Pencil size={11} strokeWidth={1.8} /> Edit
          </button>
          <button type="button" onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors">
            <Trash2 size={11} strokeWidth={1.8} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── List View — Account Row ──────────────────────────────────────────────────

function isAccountLocked(account: SocialAccount): boolean {
  if (!account.locked_by || !account.locked_at) return false;
  const lockAge = Date.now() - new Date(account.locked_at).getTime();
  return lockAge < 30 * 60 * 1000; // 30 minutes
}

function getLockedByLabel(lockedBy: string): string {
  const bot = lockedBy.split(":")[0];
  if (bot === "post-bot") return "Post Bot";
  if (bot === "comment-bot") return "Comment Bot";
  return "Bot";
}

function AccountRow({ account, onEdit, onDelete }: { account: SocialAccount; onEdit: () => void; onDelete: () => void }) {
  const locked = isAccountLocked(account);

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      {/* Status dot */}
      <div className="w-3 flex-shrink-0 flex items-center">
        <div className="relative flex-shrink-0 w-1.5 h-1.5">
          {locked ? (
            <>
              <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
              <span className="relative block w-1.5 h-1.5 rounded-full bg-amber-500" />
            </>
          ) : account.is_active ? (
            <>
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
              <span className="relative block w-1.5 h-1.5 rounded-full bg-green-500" />
            </>
          ) : (
            <span className="block w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </div>
      </div>

      {/* Username */}
      <span className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate flex-1 min-w-0">@{account.username}</span>

      {/* Browser Profile */}
      <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-28 flex-shrink-0">{account.browser_profile}</span>

      {/* Status label */}
      <span className={`inline-flex items-center justify-center text-[10px] px-1.5 py-px rounded-full font-medium w-[56px] flex-shrink-0 ${
        locked
          ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          : account.is_active
            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
      }`}>
        {locked ? getLockedByLabel(account.locked_by!) : account.is_active ? "Active" : "Inactive"}
      </span>

      {/* Actions */}
      <AccountRowDropdown onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// ─── List View — Add Modal ────────────────────────────────────────────────────

function ListViewAddModal({
  defaultPlatform,
  onClose,
  onSuccess,
}: { defaultPlatform: SocialPlatform; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ platform: defaultPlatform, username: "", password: "", browser_profile: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const set = (k: string, v: string) => {
    setFormData(prev => ({ ...prev, [k]: v }));
    setFormErrors(prev => ({ ...prev, [k]: "" }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim())        errors.username        = "Username is required";
    if (!formData.browser_profile.trim()) errors.browser_profile = "Browser profile is required";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("social_accounts").insert({
        username:        formData.username.trim(),
        password:        formData.password.trim() || null,
        platform:        formData.platform,
        browser_profile: formData.browser_profile.trim(),
        is_active:       true,
      });
      if (error) { toast.error(getErrorMessage(error)); setIsSaving(false); return; }
      toast.success("Account added successfully");
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong. Try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Configure New Account</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Add a new social media account for automation</p>
          </div>
          <button type="button" onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={13} strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Social Media Platform</label>
            <CustomSelect
              items={PLATFORM_OPTIONS.map(p => ({ value: p.value, label: p.label, disabled: p.disabled, note: p.disabled ? "coming soon" : undefined }))}
              value={formData.platform}
              onSelect={v => set("platform", v)}
            />
          </div>
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Username <span className="text-red-400">*</span></label>
            <input type="text" value={formData.username} onChange={(e) => set("username", e.target.value)} placeholder="e.g. johndoe" className={inputCls(!!formErrors.username)} />
            {formErrors.username && <p className="text-[11px] text-red-400 mt-1">{formErrors.username}</p>}
          </div>
          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span></label>
            <input type="password" value={formData.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" className={inputCls()} />
          </div>
          {/* Browser Profile */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Browser Profile <span className="text-red-400">*</span></label>
            <input type="text" value={formData.browser_profile} onChange={(e) => set("browser_profile", e.target.value)} placeholder="e.g. Profile 1" className={inputCls(!!formErrors.browser_profile)} />
            {formErrors.browser_profile
              ? <p className="text-[11px] text-red-400 mt-1">{formErrors.browser_profile}</p>
              : <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">Assigned browser profile for automation</p>
            }
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
            <button type="button" onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5">
              {isSaving && <Loader2 size={11} strokeWidth={2} className="animate-spin" />}
              {isSaving ? "Saving…" : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── List View — Edit Modal ───────────────────────────────────────────────────

function ListViewEditModal({
  account,
  onClose,
  onSuccess,
}: { account: SocialAccount; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ username: account.username, password: "", browser_profile: account.browser_profile });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const set = (k: string, v: string) => {
    setFormData(prev => ({ ...prev, [k]: v }));
    setFormErrors(prev => ({ ...prev, [k]: "" }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim())        errors.username        = "Username is required";
    if (!formData.browser_profile.trim()) errors.browser_profile = "Browser profile is required";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setIsSaving(true);
    try {
      const updates: Record<string, string | null> = {
        username:        formData.username.trim(),
        browser_profile: formData.browser_profile.trim(),
      };
      if (formData.password.trim()) updates.password = formData.password.trim();
      const { error } = await supabase.from("social_accounts").update(updates).eq("id", account.id);
      if (error) { toast.error(getErrorMessage(error)); setIsSaving(false); return; }
      toast.success("Account updated");
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong. Try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">Edit Account</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Update account details for @{account.username}</p>
          </div>
          <button type="button" onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={13} strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Inactive warning */}
          {!account.is_active && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl px-3.5 py-3">
              <Info size={13} strokeWidth={1.8} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">Manually resolve account before proceeding with it</p>
            </div>
          )}
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Username <span className="text-red-400">*</span></label>
            <input type="text" value={formData.username} onChange={(e) => set("username", e.target.value)} placeholder="e.g. johndoe" className={inputCls(!!formErrors.username)} />
            {formErrors.username && <p className="text-[11px] text-red-400 mt-1">{formErrors.username}</p>}
          </div>
          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span></label>
            <input type="password" value={formData.password} onChange={(e) => set("password", e.target.value)} placeholder="Leave blank to keep current" className={inputCls()} />
          </div>
          {/* Browser Profile */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Browser Profile <span className="text-red-400">*</span></label>
            <input type="text" value={formData.browser_profile} onChange={(e) => set("browser_profile", e.target.value)} placeholder="e.g. Profile 1" className={inputCls(!!formErrors.browser_profile)} />
            {formErrors.browser_profile
              ? <p className="text-[11px] text-red-400 mt-1">{formErrors.browser_profile}</p>
              : <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">Assigned browser profile for automation</p>
            }
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
            <button type="button" onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5">
              {isSaving && <Loader2 size={11} strokeWidth={2} className="animate-spin" />}
              {isSaving ? "Saving…" : "Update Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── List View — Delete Dialog ────────────────────────────────────────────────

function DeleteConfirmDialog({
  account,
  onClose,
  onSuccess,
}: { account: SocialAccount; onClose: () => void; onSuccess: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("social_accounts").delete().eq("id", account.id);
      if (error) { toast.error(getErrorMessage(error)); setIsDeleting(false); return; }
      toast.success(`@${account.username} deleted`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong. Try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">Delete Account</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <span className="font-medium text-gray-700 dark:text-gray-300">@{account.username}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="text-xs px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1.5">
            {isDeleting && <Loader2 size={11} strokeWidth={2} className="animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function AccountsListView({ onAccountsChange, initialPlatform, initialFilter }: { onAccountsChange: () => void; initialPlatform?: SocialPlatform; initialFilter?: ActiveFilter }) {
  const [accounts, setAccounts]               = useState<SocialAccount[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(initialPlatform ?? "instagram");
  const [platformCounts, setPlatformCounts]   = useState<Record<SocialPlatform, number>>({ instagram: 0, x: 0, threads: 0, tiktok: 0 });
  const [isLoading, setIsLoading]             = useState(true);
  const [searchQuery, setSearchQuery]         = useState("");
  const [activeFilter, setActiveFilter]       = useState<ActiveFilter>(initialFilter ?? "all");
  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen]       = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage]         = useState(1);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!addDropdownOpen) return;
    function handler(e: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) setAddDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addDropdownOpen]);

  const anyModalOpen = isAddModalOpen || isEditModalOpen || isDeleteOpen;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [anyModalOpen]);

  const fetchAccounts = useCallback(async () => {
    const { data, error } = await supabase.from("social_accounts").select("*");
    if (error || !data) return;
    setAccounts(data);
    const counts: Record<SocialPlatform, number> = { instagram: 0, x: 0, threads: 0, tiktok: 0 };
    for (const a of data) {
      if (a.platform in counts) counts[a.platform as SocialPlatform]++;
    }
    setPlatformCounts(counts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000);
    return () => clearInterval(interval);
  }, [fetchAccounts]);

  const handleSuccess = async () => {
    await fetchAccounts();
    onAccountsChange();
  };

  const platformAccounts = accounts.filter(a => a.platform === selectedPlatform);
  const filteredAccounts = platformAccounts
    .filter(a => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === "" || a.username.toLowerCase().includes(q) || a.browser_profile.toLowerCase().includes(q);
      const matchesFilter = activeFilter === "all" || (activeFilter === "active" && a.is_active) || (activeFilter === "inactive" && !a.is_active);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => Number(a.is_active) - Number(b.is_active));

  const hasFilters = searchQuery !== "" || activeFilter !== "all";
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const paginatedAccounts = filteredAccounts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-medium text-gray-800 dark:text-gray-100">Social Media Accounts</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Manage your social media accounts for automation</p>
        </div>
        <div className="relative" ref={addDropdownRef}>
          <button
            type="button"
            onClick={() => setAddDropdownOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            <Plus size={11} strokeWidth={2.2} />
            Configure New Account
          </button>
          {addDropdownOpen && (
            <AddAccountDropdown
              onClose={() => setAddDropdownOpen(false)}
              onAddIndividual={() => setIsAddModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Platform tabs */}
      <div className="grid grid-cols-4 border-b border-gray-100 dark:border-gray-800">
        {LIST_PLATFORMS.map(p => (
          <button
            key={p.id}
            type="button"
            disabled={p.disabled}
            onClick={() => { setSelectedPlatform(p.id); setSearchQuery(""); setActiveFilter("all"); setCurrentPage(1); }}
            className={`relative px-3 py-3 text-xs transition-colors flex items-center justify-center gap-1.5 ${
              p.disabled
                ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                : selectedPlatform === p.id
                ? "text-gray-800 dark:text-gray-100 font-medium border-b-2 border-gray-800 dark:border-gray-100"
                : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            {p.label}
            {platformCounts[p.id] > 0 && !p.disabled && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium ${
                selectedPlatform === p.id
                  ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}>
                {platformCounts[p.id]}
              </span>
            )}
            {p.disabled && (
              <span className="text-[9px] text-gray-300 dark:text-gray-700">soon</span>
            )}
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative flex-1">
          <Search size={12} strokeWidth={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search accounts..."
            className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-7 pr-7 py-1.5 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X size={11} strokeWidth={2} />
            </button>
          )}
        </div>
        <CustomSelect
          items={[
            { value: "all",      label: "All Status"    },
            { value: "active",   label: "Active Only"   },
            { value: "inactive", label: "Inactive Only" },
          ]}
          value={activeFilter}
          onSelect={v => { setActiveFilter(v as ActiveFilter); setCurrentPage(1); }}
          width={140}
        />
      </div>

      {/* Accounts list */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} strokeWidth={1.6} className="animate-spin text-gray-400" />
          </div>
        ) : platformAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Users size={16} strokeWidth={1.6} className="text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">No accounts configured</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Add your first account to get started</p>
            </div>
            <div className="relative" ref={addDropdownRef}>
              <button
                type="button"
                onClick={() => setAddDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-medium"
              >
                <Plus size={11} strokeWidth={2.2} />
                Configure New Account
              </button>
              {addDropdownOpen && (
                <AddAccountDropdown
                  onClose={() => setAddDropdownOpen(false)}
                  onAddIndividual={() => setIsAddModalOpen(true)}
                />
              )}
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Search size={16} strokeWidth={1.6} className="text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">No accounts found</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
                {searchQuery ? `No results for "${searchQuery}"` : "No accounts match the selected filter"}
              </p>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              {paginatedAccounts.map(account => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={() => { setSelectedAccount(account); setIsEditModalOpen(true); }}
                  onDelete={() => { setSelectedAccount(account); setIsDeleteOpen(true); }}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-1 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} strokeWidth={1.8} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors ${
                        page === currentPage
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <ListViewAddModal
          defaultPlatform={selectedPlatform}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {isEditModalOpen && selectedAccount && (
        <ListViewEditModal
          account={selectedAccount}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {isDeleteOpen && selectedAccount && (
        <DeleteConfirmDialog
          account={selectedAccount}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

// ─── Account Setup section ────────────────────────────────────────────────────
const platforms = [
  { id: "instagram", name: "Instagram" },
  { id: "twitter",   name: "Twitter / X" },
  { id: "threads",   name: "Threads" },
  { id: "tiktok",    name: "TikTok" },
];

// Map card platform IDs to list-view SocialPlatform IDs
const cardToListPlatform: Record<string, SocialPlatform> = {
  instagram: "instagram",
  twitter:   "x",
  threads:   "threads",
  tiktok:    "tiktok",
};

function AccountSetupSection() {
  const [viewMode, setViewMode]       = useState<"cards" | "list">("cards");
  const [listInitialPlatform, setListInitialPlatform] = useState<SocialPlatform>("instagram");
  const [listInitialFilter, setListInitialFilter]     = useState<ActiveFilter>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [accountCounts, setAccountCounts]   = useState<Record<string, number>>({ instagram: 0, twitter: 0, threads: 0, tiktok: 0 });
  const [inactiveCounts, setInactiveCounts] = useState<Record<string, number>>({ instagram: 0, twitter: 0, threads: 0, tiktok: 0 });

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [modalOpen]);

  const fetchCounts = async () => {
    const { data, error } = await supabase.from("social_accounts").select("platform, is_active");
    if (error || !data) return;
    const active: Record<string, number>   = { instagram: 0, twitter: 0, threads: 0, tiktok: 0 };
    const inactive: Record<string, number> = { instagram: 0, twitter: 0, threads: 0, tiktok: 0 };
    for (const row of data) {
      const key = row.platform === "x" ? "twitter" : row.platform;
      if (row.is_active) active[key] = (active[key] || 0) + 1;
      else inactive[key] = (inactive[key] || 0) + 1;
    }
    setAccountCounts(active);
    setInactiveCounts(inactive);
  };

  useEffect(() => { fetchCounts(); }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-gray-500 dark:text-gray-500">Account Setup</h2>

        <div className="flex items-center gap-1.5">
          {/* View toggles */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Card view"
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                viewMode === "cards"
                  ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              }`}
            >
              <LayoutGrid size={11} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List view"
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              }`}
            >
              <List size={11} strokeWidth={1.8} />
            </button>
          </div>

          {/* Add dropdown (only in card view) */}
          {viewMode === "cards" && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <Plus size={11} strokeWidth={2.2} />
              </button>
              {dropdownOpen && (
                <AddAccountDropdown
                  onClose={() => setDropdownOpen(false)}
                  onAddIndividual={() => setModalOpen(true)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <AddAccountModal onClose={() => setModalOpen(false)} onSuccess={fetchCounts} />
      )}

      {viewMode === "cards" ? (
        <div className="grid grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              onClick={() => {
                setListInitialPlatform(cardToListPlatform[platform.id]);
                setListInitialFilter("all");
                setViewMode("list");
              }}
              className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col cursor-pointer hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              {inactiveCounts[platform.id] > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setListInitialPlatform(cardToListPlatform[platform.id]);
                    setListInitialFilter("inactive");
                    setViewMode("list");
                  }}
                  className="absolute top-3 right-3 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                  title={`${inactiveCounts[platform.id]} inactive account${inactiveCounts[platform.id] !== 1 ? "s" : ""} — click to view`}
                >
                  <span className="text-white font-bold leading-none" style={{ fontSize: "9px" }}>!</span>
                </button>
              )}
              <span className="text-[11px] text-gray-400 dark:text-gray-600 mb-3">{platform.name}</span>
              <span className="text-5xl font-light text-gray-800 dark:text-gray-100 leading-none tabular-nums">
                {accountCounts[platform.id]}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-600 mt-2">Active Accounts</span>
            </div>
          ))}
        </div>
      ) : (
        <AccountsListView
          key={`${listInitialPlatform}-${listInitialFilter}`}
          onAccountsChange={fetchCounts}
          initialPlatform={listInitialPlatform}
          initialFilter={listInitialFilter}
        />
      )}
    </section>
  );
}

// ─── Connections Page ─────────────────────────────────────────────────────────
export default function ConnectionsPage() {
  return (
    <div className="bg-white dark:bg-gray-950 font-[var(--font-inter)] md:min-h-[calc(100vh-52px)] flex flex-col">
      <main className="max-w-4xl mx-auto w-full px-10 py-10 flex flex-col gap-10 flex-1">
        <Breadcrumb
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Connections" },
          ]}
        />

        <IntegrationsSection />
        <AccountSetupSection />

      </main>

      <footer className="max-w-4xl mx-auto w-full px-10 py-6">
        <p className="text-[11px] text-gray-300 dark:text-gray-700 text-center">Built by AIVS, 2026</p>
      </footer>
    </div>
  );
}
