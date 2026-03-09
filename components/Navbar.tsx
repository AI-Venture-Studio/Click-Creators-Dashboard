"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Bell, Sun, Moon, LogOut } from "lucide-react";
import LogoutDialog from "./LogoutDialog";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {dark
        ? <Sun size={15} strokeWidth={1.6} />
        : <Moon size={15} strokeWidth={1.6} />
      }
    </button>
  );
}

function UserAvatarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hover:opacity-80 transition-opacity p-1"
      aria-label="User menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="30" height="30">
        <mask id="viewboxMask">
          <rect width="64" height="64" rx="32" ry="32" x="0" y="0" fill="#fff" />
        </mask>
        <g mask="url(#viewboxMask)">
          <path d="M45.89 36.1c0 8.5-1.26 18.86-10.89 19.82v9.95S31.36 68 26.5 68c-4.86 0-8.5-3.48-8.5-3.48V42a5 5 0 0 1-1.3-9.83C15.36 22.64 17.5 13 32 13c14.59 0 14.24 11.08 13.96 19.81-.04 1.15-.07 2.25-.07 3.29Z" fill="#836055" />
          <path d="M35 55.92c-.48.05-.98.07-1.5.07-8.88 0-13.9-7.15-15.5-14.6v23.13S21.64 68 26.5 68c4.86 0 8.5-2.13 8.5-2.13v-9.95Z" fill="#000" fillOpacity=".07" />
          <path d="M34.63 55.95c-.37.03-.74.04-1.13.04-6.53 0-10.97-3.86-13.5-8.87V48.24c0 5.38 2.61 9.75 8.28 9.75h1.35c3.34.03 4.59.04 5-2.04ZM16.7 32.17A5 5 0 0 0 18.14 42c-.48-1.98-.71-3.99-.71-5.9a46.7 46.7 0 0 1-.73-3.93Z" fill="#000" fillOpacity=".07" />
          <rect x="36" y="41" width="3" height="2" rx="1" fill="#000" fillOpacity=".07" />
          <rect x="7" y="60" width="40" height="23" rx="9" fill="#e05a33" />
          <g fill="#1b0b47">
            <path d="M45.97 32.48a4 4 0 0 0 1.78-4.88 4 4 0 0 0-2.97-7.41c1.42 3.67 1.31 8.22 1.19 12.3Z" />
            <path d="M36.3 22.76a4.98 4.98 0 0 1-6.36.2 6.98 6.98 0 0 1-6.99 1.74c-.26.28-.56.53-.89.73a3.98 3.98 0 0 1-1.35 6.19c.2.24.3.55.3.88a1.5 1.5 0 0 1-1.53 1.5 4 4 0 0 1-7.3-3.17 3.99 3.99 0 0 1 0-5.66 4 4 0 0 1 .74-3.71 7 7 0 0 1 4.1-10.17V11a4 4 0 0 1 5.94-3.5 7 7 0 0 1 9.8-2.42 6.48 6.48 0 0 1 10.78 1.95 4 4 0 0 1 3.43 4.58 7.33 7.33 0 0 1 3.05 5.9c0 4.14-3.58 7.5-8 7.5a8.25 8.25 0 0 1-5.7-2.24Z" />
          </g>
          <g transform="translate(1)">
            <path d="M27.93 46a1 1 0 0 1 1-1h9.14a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-1.14a5 5 0 0 1-5-5Z" fill="#66253C" />
            <path d="M35.76 50.7a5 5 0 0 1-1.69.3h-1.14a5 5 0 0 1-5-4.8c.77-.29 1.9-.25 3.02-.22L32 46c2.21 0 4 1.57 4 3.5 0 .42-.09.83-.24 1.2Z" fill="#B03E67" />
            <path d="M29 45h10v1a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-1Z" fill="#fff" />
          </g>
          <g transform="translate(0 -1)">
            <path d="M43 37.5a1.5 1.5 0 0 1-3 0v-1.23c0-.15.12-.27.27-.27h2.46c.15 0 .27.12.27.27v1.23ZM33 37.5a1.5 1.5 0 0 1-3 0v-1.23c0-.15.12-.27.27-.27h2.46c.15 0 .27.12.27.27v1.23Z" fill="#1b0b47" />
            <path stroke="#1b0b47" strokeLinecap="round" d="M29.5 36.5h4M39.5 36.5h4" />
          </g>
          <path d="M37.5 43c-6.5 1.5-11 2-11 2s1 2.5 3.5 2c2-.4 6-1.33 7.5-2v-2ZM38 43c6 1 10 1.76 10 1.76s-1.12 2.18-3.5 1.74l-.32-.06c-1.92-.35-4.83-.89-6.18-1.44v-2Z" fill="#1b0b47" />
        </g>
      </svg>
    </button>
  );
}

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/actions",
    label: "Actions",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/connections",
    label: "Connections",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
];

// Routes considered "under" each nav item
const activeFor: Record<string, string[]> = {
  "/": ["/", "/post-bot", "/comment-bot", "/viral-app", "/account-scraper"],
  "/actions": ["/actions"],
  "/connections": ["/connections"],
};

export default function Navbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  function handleSignOut() {
    setDropdownOpen(false);
    setLogoutDialogOpen(true);
  }

  return (
    <>
      <nav className="bg-gray-100 dark:bg-gray-900 flex items-center px-8 justify-between shrink-0" style={{ height: "52px" }}>
        {/* Left: logo + slash + brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            <Image src="/aivs-logo.JPG" alt="AIVS Logo" width={28} height={28} className="object-cover w-7 h-7" />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-600">/</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Click Creators</span>
        </div>

        {/* Center: nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon }) => {
            const isActive = (activeFor[href] ?? [href]).includes(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all duration-200",
                  isActive
                    ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-700/40",
                ].join(" ")}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: bell + theme toggle + avatar dropdown */}
        <div className="flex items-center gap-3 relative">
          <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 p-1">
            <Bell size={16} strokeWidth={1.6} />
          </button>
          <ThemeToggle />

          {/* User Avatar + Dropdown */}
          <div ref={dropdownRef} className="relative">
            <UserAvatarButton onClick={() => setDropdownOpen(!dropdownOpen)} />

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <LogOut size={14} strokeWidth={2} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog isOpen={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} />
    </>
  );
}
