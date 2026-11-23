
import { useState, type FormEvent, type ReactNode } from "react";
import {
  BadgeCheck,
  CalendarDays,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, api, authApi } from "@/services/api";

type ProfileUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string | null;
};

type ProfileUpdateResponse = {
  user?: ProfileUser;
  data?: ProfileUser;
  message?: string;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["teacher", "profile"],
    queryFn: () => authApi.me(),
  });

  const profile = profileQuery.data as ProfileUser | undefined;

  // null means the user has not edited the field.
  // API values appear automatically when the query finishes.
  const [editedName, setEditedName] = useState<string | null>(null);
  const [editedEmail, setEditedEmail] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const name = editedName ?? profile?.name ?? "";
  const email = editedEmail ?? profile?.email ?? "";

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string }) => {
      return api.put<ProfileUpdateResponse>("/profile", payload);
    },
    onSuccess: async (response) => {
      const updatedUser = response.user ?? response.data;

      if (updatedUser) {
        queryClient.setQueryData(["teacher", "profile"], updatedUser);
        queryClient.setQueryData(["teacher"], updatedUser);
      } else {
        // Reload the profile if the backend returns only a message.
        await queryClient.invalidateQueries({
          queryKey: ["teacher", "profile"],
        });
      }

      setEditedName(null);
      setEditedEmail(null);
      setErrorMessage("");
      setSuccessMessage(
        response.message ?? "Profile updated successfully."
      );
    },
    onError: (error: Error) => {
      setSuccessMessage("");
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : error.message || "Unable to update your profile."
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (response) => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(response.message ?? "Password changed successfully.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    saveMutation.mutate({
      name: trimmedName,
      email: trimmedEmail,
    });
  }

  if (profileQuery.isPending) {
    return (
      <section
        className="flex min-h-64 items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          Loading your profile...
        </div>
      </section>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <section className="mx-auto w-full max-w-4xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage your teacher account information.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-800">
            Unable to load your profile
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Please check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => void profileQuery.refetch()}
            className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "T";
  const memberSince = profile.created_at
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
      }).format(new Date(profile.created_at))
    : "Not available";

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Account</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Profile</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage your teacher account information.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck size={15} /> Teacher account
        </div>
      </div>

      {/* Profile summary */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#173c75] via-[#2459a6] to-[#327ac1] px-5 py-7 text-white sm:px-8">
          <div className="absolute -right-8 -top-16 size-56 rounded-full border-[28px] border-white/10" />
          <div className="absolute -bottom-24 right-36 size-48 rounded-full border-[24px] border-white/5" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl font-bold shadow-lg backdrop-blur">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Teacher profile</p>
            <h2 className="mt-1 break-words text-xl font-bold text-white sm:text-2xl">
              {name || "Teacher"}
            </h2>
            <p className="mt-1 flex items-center gap-2 break-all text-sm text-blue-100"><Mail size={15} className="shrink-0" />{email}</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white sm:self-center">
            {profile.email_verified_at ? <BadgeCheck size={15} /> : <UserRound size={15} />}
            {profile.email_verified_at ? "Email verified" : "Account active"}
          </div>
          </div>
        </div>
        <div className="grid divide-y divide-slate-100 border-t border-slate-100 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <AccountDetail label="Account ID" value={`#${String(profile.id).padStart(4, "0")}`} icon={<UserRound size={16} />} />
          <AccountDetail label="Member since" value={memberSince} icon={<CalendarDays size={16} />} />
          <AccountDetail label="Email status" value={profile.email_verified_at ? "Verified" : "Not verified"} icon={<BadgeCheck size={16} />} />
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={18} /></div>
            <div><h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the name and email associated with your account.
          </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
          {successMessage && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="profile-name"
                className="block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={255}
                value={name}
                onChange={(event) => {
                  setEditedName(event.target.value);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="profile-email"
                className="block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(event) => {
                  setEditedEmail(event.target.value);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <CalendarDays size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-xs leading-5 text-slate-500">
              Your profile details are used to identify your teacher account. Changes are saved to your account when you select Save Changes.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setEditedName(null);
                setEditedEmail(null);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              disabled={
                saveMutation.isPending ||
                (editedName === null && editedEmail === null)
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Discard Changes
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending && (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {saveMutation.isPending
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <LockKeyhole size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Password &amp; security</h2>
            <p className="mt-1 text-sm text-slate-500">Change your password to keep your account secure.</p>
          </div>
        </div>

        <form
          className="space-y-5 p-5 sm:p-7"
          onSubmit={(event) => {
            event.preventDefault();
            setPasswordSuccess("");
            if (newPassword !== confirmPassword) {
              passwordMutation.reset();
              return;
            }
            passwordMutation.mutate({
              current_password: currentPassword,
              password: newPassword,
              password_confirmation: confirmPassword,
            });
          }}
        >
          {passwordSuccess && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {passwordSuccess}
            </div>
          )}
          {passwordMutation.isError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {passwordMutation.error instanceof ApiError
                ? passwordMutation.error.message
                : passwordMutation.error.message || "Unable to change your password."}
            </div>
          )}
          {newPassword !== confirmPassword && confirmPassword.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              The new passwords do not match.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <PasswordField
              id="current-password"
              label="Current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <PasswordField
              id="new-password"
              label="New password"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              minLength={8}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Use at least 8 characters. Your current password is required.</p>
            <button
              type="submit"
              disabled={passwordMutation.isPending || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordMutation.isPending && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {passwordMutation.isPending ? "Updating password..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
};

function PasswordField({ id, label, autoComplete, value, onChange, minLength }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

function AccountDetail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
