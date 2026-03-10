"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/Breadcrumb";

const ROWS_PER_PAGE = 10;
const TOTAL_PAGES = 5;

function ActionSkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <div className={`flex items-center gap-6 py-3.5 px-0 ${!isLast ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="h-3 flex-1 rounded" />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
  );
}

export default function ActionsPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="bg-white dark:bg-gray-950 font-[var(--font-inter)] h-[calc(100vh-52px)] flex flex-col overflow-hidden">
      <main className="max-w-4xl mx-auto w-full px-10 py-6 flex flex-col flex-1">
        <Breadcrumb
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Actions" },
          ]}
        />

        {/* Column headers */}
        <div className="flex items-center gap-6 pb-2.5 border-b border-gray-200 dark:border-gray-800">
          <span className="text-[11px] text-gray-400 dark:text-gray-600 w-28">Timestamp</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-600 flex-1">Action</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-600 w-20">Application</span>
        </div>

        {/* Skeleton rows */}
        <div>
          {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
            <ActionSkeletonRow key={i} isLast={i === ROWS_PER_PAGE - 1} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-[11px] text-gray-400 dark:text-gray-600">
            Page {page} of {TOTAL_PAGES}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-600 dark:hover:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} strokeWidth={1.6} />
            </button>
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-md text-[11px] transition-colors duration-150 ${
                  page === i + 1
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    : "text-gray-400 dark:text-gray-600 hover:text-gray-600 hover:bg-gray-50 dark:hover:text-gray-400 dark:hover:bg-gray-900"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              disabled={page === TOTAL_PAGES}
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-600 dark:hover:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
              aria-label="Next page"
            >
              <ChevronRight size={14} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </main>
      <footer className="max-w-4xl mx-auto w-full px-10 py-6">
        <p className="text-[11px] text-gray-300 dark:text-gray-700 text-center">Built by AIVS, 2026</p>
      </footer>
    </div>
  );
}
