
import { useState, type FormEvent } from "react";
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

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your teacher account information.
        </p>
      </div>

      {/* Profile summary */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400" />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-700 ring-1 ring-blue-100">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-bold text-slate-900">
              {name || "Teacher"}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              {email}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" />
              Authenticated account
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-bold text-slate-900">
            Personal Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the name and email associated with your account.
          </p>
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

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs leading-5 text-slate-500">
              Only information supported by your current account is shown.
              Additional details such as phone number, department, and
              profile photo require corresponding backend fields.
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
    </section>
  );
}
