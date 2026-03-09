"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutDialog({ isOpen, onClose }: LogoutDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function handleLogout() {
    setIsLoading(true);
    // Clear the auth cookie
    document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    // Redirect to login
    router.push("/login");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm mx-4 shadow-lg">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Sign out
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            You will be signed out of your account and redirected to the login page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
