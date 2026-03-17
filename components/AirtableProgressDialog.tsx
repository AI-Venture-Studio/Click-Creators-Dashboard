"use client";

import { useEffect, useRef, useState } from "react";
import { followerScraperSupabase } from "@/lib/supabase-follower-scraper";

const FOLLOWER_SCRAPER_URL = process.env.NEXT_PUBLIC_FOLLOWER_SCRAPER_URL || "http://localhost:6001";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  threads: "Threads",
};

type Step = "creating-tables" | "saving-campaign" | "complete" | "error";

export default function AirtableProgressDialog({
  open,
  baseId,
  influencerName,
  platform,
  numVAs,
  onComplete,
  onError,
}: {
  open: boolean;
  airtableUrl: string;
  baseId: string;
  influencerName: string;
  platform: string;
  numVAs: number;
  onComplete: (jobId: string) => void;
  onError: (error: string) => void;
}) {
  const [step, setStep] = useState<Step>("creating-tables");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparing...");
  const isRunning = useRef(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open || isRunning.current) return;
    isRunning.current = true;

    async function run() {
      try {
        // Step 1: Create Airtable tables
        setStep("creating-tables");
        setMessage("Creating VA tables in Airtable...");
        setProgress(20);

        const baseName = `${influencerName.replace(/^@/, "")}'s ${PLATFORM_LABELS[platform] ?? platform} Campaign`;

        const res = await fetch(`${FOLLOWER_SCRAPER_URL}/api/airtable/create-base`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Base-Id": baseId,
          },
          body: JSON.stringify({
            base_id: baseId,
            num_vas: numVAs,
            base_name: baseName,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409 && data.error === "duplicate_base_id") {
            throw new Error(
              `This Airtable base is already linked to an existing campaign${
                data.existing_job?.influencer_name
                  ? ` ("${data.existing_job.influencer_name}")`
                  : ""
              }. Please create a new base.`
            );
          }
          throw new Error(data.error || data.message || `Server error (${res.status})`);
        }

        if (!data.success) {
          throw new Error(data.error || "Failed to create tables");
        }

        setProgress(50);

        // Step 2: Save campaign to Supabase
        setStep("saving-campaign");
        setMessage("Saving campaign...");
        setProgress(70);

        const { data: job, error: dbError } = await followerScraperSupabase
          .from("scraping_jobs")
          .insert({
            influencer_name: influencerName.replace(/^@/, ""),
            platform: platform,
            airtable_base_id: baseId,
            base_id: baseId,
            num_vas: numVAs,
            status: "active",
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(dbError.message || "Failed to save campaign");
        }

        // Done
        setStep("complete");
        setMessage("Campaign created!");
        setProgress(100);

        // Brief pause to show 100% before closing
        await new Promise((r) => setTimeout(r, 800));
        onComplete(job.job_id);
      } catch (err) {
        setStep("error");
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setMessage(msg);
        onError(msg);
      } finally {
        isRunning.current = false;
      }
    }

    run();
  }, [open, baseId, influencerName, platform, numVAs, onComplete, onError]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("creating-tables");
      setProgress(0);
      setMessage("Preparing...");
      isRunning.current = false;
    }
  }, [open]);

  if (!open) return null;

  const stepLabels: Record<Step, string> = {
    "creating-tables": "Step 1 of 2",
    "saving-campaign": "Step 2 of 2",
    complete: "Done",
    error: "Error",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — no click handler, non-dismissible */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialog card */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 flex flex-col items-center gap-5">

          {/* Step indicator */}
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {stepLabels[step]}
          </span>

          {/* Message */}
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
            {message}
          </p>

          {/* Progress bar */}
          <div className="w-full">
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-800 dark:bg-gray-200 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2 tabular-nums">
              {progress}%
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
