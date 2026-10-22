
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import { authApi, ApiError } from "@/services/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearError() {
    if (error) setError("");
  }

  function getValidationMessage(details: unknown): string | null {
    if (
      typeof details !== "object" ||
      details === null ||
      !("errors" in details)
    ) {
      return null;
    }

    const errors = details.errors;

    if (typeof errors !== "object" || errors === null) {
      return null;
    }

    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedInvitationCode = invitationCode.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      setError("Please complete your name and email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match. Please check and try again.");
      return;
    }

    if (!trimmedInvitationCode) {
      setError("Enter the teacher invitation code provided by your school.");
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        name: `${trimmedFirstName} ${trimmedLastName}`,
        email: trimmedEmail,
        password,
        password_confirmation: confirmPassword,
        invitation_code: trimmedInvitationCode,
      });

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
          email: trimmedEmail,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError(
            "Cannot connect to the Laravel server. Make sure your backend is running.",
          );
        } else if (err.status === 404 || err.status === 405) {
          setError(
            "Teacher registration is not configured on the Laravel backend yet.",
          );
        } else if (err.status === 401 || err.status === 403) {
          setError(
            "Teacher registration was not authorized. Check your invitation code or contact your administrator.",
          );
        } else if (err.status === 409 || err.status === 422) {
          setError(
            getValidationMessage(err.details) ||
              err.message ||
              "Please check your registration details and try again.",
          );
        } else {
          setError(
            err.message ||
              "Unable to create your teacher account. Please try again.",
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
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          {/* Header */}
          <div className="px-6 pb-2 pt-8 sm:px-9 sm:pt-9">
            <div className="mb-6 flex justify-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-700/25 ring-4 ring-blue-50">
                <GraduationCap size={32} strokeWidth={2.2} />
              </div>
            </div>

            <div className="text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
                Student Management System
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Teacher Registration
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Create your teacher account to manage student records,
                monitor enrollment information, and organize your classes.
              </p>
            </div>
          </div>

          {/* Teacher registration form */}
          <div className="px-6 pb-8 pt-6 sm:px-9 sm:pb-9">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="register-first-name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    First name
                  </label>

                  <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <UserRound
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400"
                    />

                    <input
                      id="register-first-name"
                      name="first_name"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                      value={firstName}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                        clearError();
                      }}
                      placeholder="First name"
                      disabled={loading}
                      className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="register-last-name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Last name
                  </label>

                  <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <UserRound
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400"
                    />

                    <input
                      id="register-last-name"
                      name="last_name"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                      value={lastName}
                      onChange={(event) => {
                        setLastName(event.target.value);
                        clearError();
                      }}
                      placeholder="Last name"
                      disabled={loading}
                      className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* School email */}
              <div className="space-y-2">
                <label
                  htmlFor="register-email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  School email address
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearError();
                    }}
                    placeholder="you@school.edu"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Use the email address associated with your teaching position.
                </p>
              </div>

              {/* Teacher invitation code */}
              <div className="space-y-2">
                <label
                  htmlFor="register-invitation-code"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Teacher invitation code
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <KeyRound
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="register-invitation-code"
                    name="invitation_code"
                    type="password"
                    autoComplete="off"
                    required
                    maxLength={128}
                    value={invitationCode}
                    onChange={(event) => {
                      setInvitationCode(event.target.value);
                      clearError();
                    }}
                    placeholder="Enter your school-issued code"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Request an invitation code from your school administrator
                  if you do not have one.
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="register-password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearError();
                    }}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    disabled={loading}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Use at least 8 characters. The server may enforce additional
                  password requirements.
                </p>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label
                  htmlFor="register-confirm-password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="register-confirm-password"
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearError();
                    }}
                    placeholder="Re-enter your password"
                    disabled={loading}
                    className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                    disabled={loading}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
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
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 font-semibold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Creating teacher account...
                  </>
                ) : (
                  <>
                    Create teacher account
                    <ArrowRight
                      size={18}
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
                Already registered?
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Sign in */}
            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <ArrowLeft size={18} />
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 px-4 text-center text-xs leading-5 text-slate-500">
          <CheckCircle2 size={14} className="shrink-0 text-blue-600" />
          Teacher accounts are intended for authorized school personnel.
        </p>
      </div>
    </AuthLayout>
  );
}
