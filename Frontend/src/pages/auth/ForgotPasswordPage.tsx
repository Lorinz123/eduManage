
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import { authApi, ApiError } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || submitted) return;

    setError("");
    setLoading(true);

    try {
      await authApi.forgotPassword({
        email: email.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError(
            "Unable to connect to the server. Please check your connection and try again.",
          );
        } else if (err.status === 404 || err.status === 405) {
          setError(
            "Password recovery is not configured on the server yet.",
          );
        } else if (err.status === 422) {
          // Avoid exposing whether an email address has an account.
          setSubmitted(true);
        } else {
          setError(
            "We couldn't process your request right now. Please try again later.",
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
            <div className="mb-7 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-700/25 ring-4 ring-blue-50">
                <LockKeyhole size={30} strokeWidth={2.2} />
              </div>
            </div>

            <div className="text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
                Account Recovery
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">
                Forgot password?
              </h1>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
                It happens. Enter the email address associated with your
                account and we'll help you get back in.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 pb-8 pt-7 sm:px-9 sm:pb-9">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="recovery-email"
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
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setSubmitted(false);
                    }}
                    placeholder="you@example.com"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Use the email address you registered with.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Success */}
              {submitted && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"
                >
                  <CheckCircle2
                    size={21}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Check your email
                    </p>

                    <p className="mt-1 text-sm leading-5 text-emerald-800">
                      If your email is associated with an account, follow
                      the password-reset instructions sent to it.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || submitted}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 font-semibold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Sending request...
                  </>
                ) : submitted ? (
                  <>
                    Request submitted
                    <CheckCircle2 size={18} />
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 h-px bg-slate-200" />

            {/* Back to login */}
            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <ArrowLeft size={18} />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Security footer */}
        <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 px-4 text-center text-xs leading-5 text-slate-500">
          <ShieldCheck size={15} className="shrink-0 text-blue-600" />
          Your account security and privacy matter.
        </p>
      </div>
    </AuthLayout>
  );
}
