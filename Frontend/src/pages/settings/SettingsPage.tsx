
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, api } from "@/services/api";

type Preferences = {
  email_notifications: boolean;
  attendance_reminders: boolean;
  enrollment_alerts: boolean;
};

type SettingsResponse = {
  data?: Partial<Preferences> & {
    theme?: "light" | "dark" | "system";
  };
  message?: string;
};

const defaults: Preferences = {
  email_notifications: true,
  attendance_reminders: true,
  enrollment_alerts: true,
};

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<SettingsResponse>("/settings"),
  });

  const serverPreferences = settingsQuery.data?.data;

  const [editedPreferences, setEditedPreferences] =
    useState<Partial<Preferences>>({});

  const preferences: Preferences = {
    ...defaults,
    ...serverPreferences,
    ...editedPreferences,
  };

  const saveMutation = useMutation({
    mutationFn: (payload: Preferences) =>
      api.put<SettingsResponse>("/settings", payload),

    onSuccess: async (response) => {
      if (response.data) {
        queryClient.setQueryData<SettingsResponse>(
          ["settings"],
          {
            ...response,
            data: {
              ...response.data,
              ...preferences,
            },
          }
        );
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["settings"],
        });
      }

      setEditedPreferences({});
    },
  });

  function updatePreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setEditedPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));

    saveMutation.reset();
  }

  function handleSave() {
    saveMutation.mutate(preferences);
  }

  function handleDiscard() {
    setEditedPreferences({});
    saveMutation.reset();
  }

  if (settingsQuery.isPending) {
    return (
      <section
        className="flex min-h-64 items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          Loading settings...
        </div>
      </section>
    );
  }

  if (settingsQuery.isError) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            Preferences
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your application preferences.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-800">
            Unable to load settings
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "Please check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => void settingsQuery.refetch()}
            className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Preferences
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your notification preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-bold text-slate-900">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose which notifications you want to receive.
          </p>
        </div>

        <div className="divide-y divide-slate-100 px-5 sm:px-7">
          <PreferenceToggle
            title="Email Notifications"
            description="Receive important updates through email."
            checked={preferences.email_notifications}
            onChange={(checked) =>
              updatePreference("email_notifications", checked)
            }
          />

          <PreferenceToggle
            title="Attendance Reminders"
            description="Receive reminders related to attendance records."
            checked={preferences.attendance_reminders}
            onChange={(checked) =>
              updatePreference("attendance_reminders", checked)
            }
          />

          <PreferenceToggle
            title="Enrollment Alerts"
            description="Receive updates about student enrollment."
            checked={preferences.enrollment_alerts}
            onChange={(checked) =>
              updatePreference("enrollment_alerts", checked)
            }
          />
        </div>
      </div>

      {saveMutation.isSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          Settings saved successfully.
        </div>
      )}

      {saveMutation.isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {saveMutation.error instanceof ApiError
            ? saveMutation.error.message
            : saveMutation.error.message ||
              "Unable to save your settings."}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleDiscard}
          disabled={
            saveMutation.isPending ||
            Object.keys(editedPreferences).length === 0
          }
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Discard Changes
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            saveMutation.isPending ||
            Object.keys(editedPreferences).length === 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending && (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </section>
  );
}

type PreferenceToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-700" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}