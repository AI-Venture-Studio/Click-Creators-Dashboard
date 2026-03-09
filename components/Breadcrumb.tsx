"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-3 mb-7">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors duration-150"
        aria-label="Go back"
      >
        <ArrowLeft size={13} strokeWidth={1.6} />
      </button>

      {/* Divider */}
      <span className="text-gray-200 text-sm">|</span>

      {/* Crumbs */}
      <div className="flex items-center gap-1.5">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-sm text-gray-300 dark:text-gray-700">/</span>
              )}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">{crumb.label}</span>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
