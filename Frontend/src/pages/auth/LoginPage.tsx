
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import { authApi, authToken, ApiError } from "@/services/api";

const AUTH_TOKEN_KEY = "sms_auth_token";
const REMEMBERED_EMAIL_KEY = "sms_remembered_email";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    try {
      return Boolean(
        window.localStorage.getItem(REMEMBERED_EMAIL_KEY),
      );
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      if (!response.user || !response.token) {
        authToken.clear();
        throw new ApiError(
          "The server returned an incomplete login response. Please try again.",
          500,
        );
      }

      try {
        if (remember) {
          window.localStorage.setItem(
            REMEMBERED_EMAIL_KEY,
            email.trim(),
          );
          window.localStorage.setItem(
            AUTH_TOKEN_KEY,
            response.token,
          );
          window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
        } else {
          window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          window.sessionStorage.setItem(
            AUTH_TOKEN_KEY,
            response.token,
          );
        }
      } catch {
        // authApi.login already stores the token in sessionStorage.
        // Continue with the current-tab session if storage is restricted.
      }

      setPassword("");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError(
            "Cannot connect to the server. Check that your Laravel backend is running.",
          );
        } else if (err.status === 401 || err.status === 422) {
          setError(
            "Unable to sign in. Check your email and password, then try again.",
          );
        } else if (err.status === 404 || err.status === 405) {
          setError(
            "The login endpoint could not be found. Please check the Laravel API routes.",
          );
        } else {
          setError(
            err.message || "Something went wrong. Please try again.",
          );
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          {/* Header */}
          <div className="px-6 pb-2 pt-8 sm:px-9 sm:pt-10">
            <div className="mb-7 flex items-center justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-700/25 ring-4 ring-blue-50">
                <GraduationCap size={35} strokeWidth={2.2} />
              </div>
            </div>

            <div className="text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
                Student Management System
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">
                Welcome back
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
                Sign in to access your dashboard and manage student records.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 pb-8 pt-7 sm:px-9 sm:pb-9">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <Mail
                    size={19}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="you@example.com"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-700 transition hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <LockKeyhole
                    size={19}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((visible) => !visible)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={loading}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(event) =>
                      setRemember(event.target.checked)
                    }
                    disabled={loading}
                    className="size-4 cursor-pointer rounded border-slate-300 accent-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  />
                  Remember me
                </label>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck size={14} />
                  Secure sign in
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold"
                  >
                    !
                  </span>

                  <p className="leading-5">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 font-semibold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-700/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <ArrowRight
                      size={19}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                New here?
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Register */}
            <Link
              to="/register"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <UserRound size={18} />
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mx-auto mt-5 max-w-sm px-4 text-center text-xs leading-5 text-slate-500">
          Authorized access only. Your student management workspace is
          protected by your account credentials.
        </p>
      </div>
    </AuthLayout>
  );
}
