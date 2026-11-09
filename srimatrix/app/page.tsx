"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, getCurrentUserAction } from "./actions/auth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // If a valid session already exists in DB, immediately redirect to /dashboard
  useEffect(() => {
    async function verifySession() {
      try {
        const user = await getCurrentUserAction();
        if (user) {
          router.push("/dashboard");
          return;
        }
      } catch (e) {
        console.error("Session check error:", e);
      } finally {
        setCheckingSession(false);
      }
    }
    verifySession();
  }, [router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  if (checkingSession) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-50 flex items-center justify-center font-sans overflow-hidden">
        <div className="flex flex-col items-center justify-center animate-pulse">
          <img
            src="/srimatrix-health-logo.png"
            alt="SriMatrix Logo"
            className="h-14 sm:h-16 w-auto max-w-[220px] object-contain select-none drop-shadow-xs"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden select-none">
      {/* Top Header - Compact Brand Logo */}
      <header className="w-full bg-transparent px-4 sm:px-8 py-3 sm:py-4 relative z-20 shrink-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/srimatrix-health-logo.png"
              alt="SriMatrix Logo"
              className="h-7 sm:h-8.5 w-auto object-contain select-none transition-opacity hover:opacity-90 drop-shadow-xs"
            />
          </div>
        </div>
      </header>

      {/* Main Centered Login Section - Clean, Cardless, and Perfectly Fitted */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 py-2 relative z-10">
        <div className="w-full max-w-[360px] sm:max-w-[380px]">
          
          {/* Header Typography - Clean & Minimal */}
          <div className="text-center mb-5 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              SriMatrix Health Portal
            </p>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl text-xs flex items-start gap-2 border shadow-xs bg-rose-50 border-rose-200 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-semibold leading-tight">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Email Address */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-[11px] sm:text-xs font-semibold text-slate-600 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@srimatrix.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium transition-all shadow-2xs focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11px] sm:text-xs font-semibold text-slate-600 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-[11px] sm:text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium transition-all shadow-2xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/30 cursor-pointer accent-indigo-600"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-2.5 px-4 text-center text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0">
        &copy; 2026 SriMatrix Health &bull; All rights reserved.
      </footer>

    </div>
  );
}
