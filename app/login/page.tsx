"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ENV_USERNAME = process.env.NEXT_PUBLIC_LOGIN_USERNAME ?? "";
const ENV_PASSWORD = process.env.NEXT_PUBLIC_LOGIN_PASSWORD ?? "";
const ENV_OTP = process.env.NEXT_PUBLIC_LOGIN_OTP ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 60_000; // 1 minute

  function getRemainingLockSeconds() {
    if (!lockedUntil) return 0;
    return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Too many attempts. Try again in ${getRemainingLockSeconds()}s.`);
      return;
    }

    if (lockedUntil && Date.now() >= lockedUntil) {
      setLockedUntil(null);
      setFailedAttempts(0);
    }

    if (
      username !== ENV_USERNAME ||
      password !== ENV_PASSWORD ||
      otp !== ENV_OTP
    ) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION);
        setError(`Too many failed attempts. Locked for 60s.`);
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }
      return;
    }

    setLoading(true);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auth_session=true; path=/; expires=${expires}; SameSite=Lax`;

    router.replace("/");
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F5F5F5] dark:bg-gray-950">
      {/* Login Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-sm mx-4 pt-10">
          {/* Logo - overlaps top edge of card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-16 h-16 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-md bg-white">
            <Image
              src="/aivs-logo.JPG"
              alt="AIVS"
              width={64}
              height={64}
              className="object-cover w-16 h-16"
              priority
            />
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            className="page-animate rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-6 pb-6 pt-16 flex flex-col gap-4 shadow-sm"
          >
            {/* Header */}
            <div className="text-center">
              {username.length > 0 && username === ENV_USERNAME ? (
                <>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Welcome back, <span className="capitalize">{username}</span>
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    Enter your credentials to access the dashboard
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Welcome back
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    Enter your credentials to access the dashboard
                  </p>
                </>
              )}
            </div>

            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter username"
                required
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter password"
                required
              />
            </div>

            {/* OTP Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Pin
              </label>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => {
                        const newOtp = otp.split("");
                        newOtp[index] = e.target.value.replace(/\D/g, "");
                        setOtp(newOtp.join(""));

                        // Auto-focus next input
                        if (e.target.value && index < 5) {
                          const nextInput = document.querySelector(
                            `input[data-otp-index="${index + 1}"]`
                          ) as HTMLInputElement;
                          nextInput?.focus();
                        }
                      }}
                      data-otp-index={index}
                      className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-900 dark:text-white placeholder-gray-400"
                      placeholder="•"
                      required
                    />
                    {index === 2 && (
                      <span className="text-lg text-gray-400 dark:text-gray-500">
                        −
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-500 text-center">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!!lockedUntil && Date.now() < lockedUntil)}
              className="w-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-sm font-medium py-2.5 mt-1 transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Built by AIVS, 2026
        </p>
      </div>
    </div>
  );
}
