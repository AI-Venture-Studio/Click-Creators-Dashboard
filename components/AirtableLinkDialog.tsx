"use client";

import { useState, useEffect } from "react";
import { ExternalLink, X, Copy, Check } from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  threads: "Threads",
};

const AIRTABLE_URL_REGEX = /^https?:\/\/(airtable\.com|www\.airtable\.com)\/.+/;
const BASE_ID_REGEX = /app[a-zA-Z0-9]+/;

function extractBaseId(url: string): string | null {
  const match = url.match(BASE_ID_REGEX);
  return match ? match[0] : null;
}

export default function AirtableLinkDialog({
  open,
  influencerName,
  platform,
  onClose,
  onSubmit,
}: {
  open: boolean;
  influencerName: string;
  platform: string;
  onClose: () => void;
  onSubmit: (airtableUrl: string, baseId: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const isValid = AIRTABLE_URL_REGEX.test(url.trim());
  const baseId = isValid ? extractBaseId(url.trim()) : null;
  const canSubmit = isValid && baseId !== null;

  const suggestedName = `${influencerName.replace(/^@/, "")}'s ${PLATFORM_LABELS[platform] ?? platform} Campaign`;

  function handleSubmit() {
    if (!canSubmit || !baseId) return;
    onSubmit(url.trim(), baseId);
    setUrl("");
  }

  function handleClose() {
    setUrl("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* Dialog card */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Connect Airtable Base
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Link your campaign to an Airtable workspace
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Please create a new Airtable base in the AIVS Scraper Workspace before proceeding.
          </p>

          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Follow these steps
          </p>

          <ol className="flex flex-col gap-2.5 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0 mt-px">1.</span>
              <span>
                Click to open the{" "}
                <a
                  href="https://airtable.com/workspaces/wspQtCYFXE7T72rkW?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 font-medium hover:text-gray-900 dark:hover:text-gray-100 hover:underline transition-colors"
                >
                  AIVS Scraper Workspace
                  <ExternalLink size={10} strokeWidth={2} />
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0 mt-px">2.</span>
              <span>Click on <span className="font-medium text-gray-700 dark:text-gray-300">&quot;Create&quot;</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0 mt-px">3.</span>
              <span>Select <span className="font-medium text-gray-700 dark:text-gray-300">&quot;Build an app on your own&quot;</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0 mt-px">4.</span>
              <div>
                <span>Rename the base to:</span>
                <div className="flex items-center justify-between mt-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
                  <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 select-all">
                    {suggestedName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(suggestedName);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={12} strokeWidth={2} className="text-green-500" /> : <Copy size={12} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0 mt-px">5.</span>
              <span>Copy the base URL from your browser&apos;s address bar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 w-4 flex-shrink-0 mt-px">6.</span>
              <span>Paste it below</span>
            </li>
          </ol>
        </div>

        {/* URL Input */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Airtable Base URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://airtable.com/appXYZ123..."
            className="w-full text-xs bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
          {url.trim() !== "" && !isValid && (
            <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5">
              Please enter a valid Airtable URL
            </p>
          )}
          {baseId && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              Base ID: <span className="font-mono text-gray-600 dark:text-gray-300">{baseId}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-xs px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            Connect Base
          </button>
        </div>
      </div>
    </div>
  );
}
