
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
  LoaderCircle,
  School,
  X,
} from "lucide-react";
import { authApi, type AuthUser } from "@/services/api";

type TopbarProps = {
  user?: AuthUser | null;
  onMenuClick?: () => void;
  onLogout?: () => void | Promise<void>;
};

export default function Topbar({ user, onLogout }: TopbarProps) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.name || "Administrator";
  const displayEmail = user?.email || "Signed-in user";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "A";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setProfileOpen(false);

    try {
      if (onLogout) {
        await onLogout();
      } else {
        await authApi.logout();
        authApi.logoutLocal();
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Logout request failed:", error);

      if (!onLogout) {
        authApi.logoutLocal();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white">
      <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Page identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3 pl-11 md:pl-0">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#183657] sm:flex">
            <School size={19} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-[#172B45] sm:text-[15px]">
              Student Portal
            </h1>
            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              Manage students and academic records
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
              }}
              aria-label={
                notificationsOpen
                  ? "Close notifications"
                  : "Open notifications"
              }
              aria-expanded={notificationsOpen}
              className={[
                "flex h-10 w-10 items-center justify-center rounded-lg",
                "text-slate-500 transition-colors",
                "hover:bg-slate-100 hover:text-[#183657]",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              ].join(" ")}
            >
              {notificationsOpen ? (
                <X size={19} strokeWidth={1.8} />
              ) : (
                <Bell size={19} strokeWidth={1.8} />
              )}
            </button>

            {notificationsOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications panel"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setNotificationsOpen(false)}
                />

                <section
                  aria-label="Notifications panel"
                  className={[
                    "absolute right-0 top-12 z-50",
                    "w-[min(300px,calc(100vw-24px))]",
                    "rounded-xl border border-slate-200 bg-white",
                    "shadow-lg shadow-slate-900/[0.08]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-[#172B45]">
                      Notifications
                    </h2>

                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Close notifications"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="px-4 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Bell size={18} strokeWidth={1.8} />
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      You're all caught up
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      No new notifications.
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

          {/* Profile menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className={[
                "flex items-center gap-2 rounded-lg p-1.5",
                "transition-colors hover:bg-slate-50",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "sm:gap-2.5 sm:pl-2",
              ].join(" ")}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0F7] text-xs font-semibold text-[#183657] ring-1 ring-inset ring-[#D9E3EF]">
                {initials}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-36 truncate text-[13px] font-semibold text-slate-800">
                  {displayName}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Administrator
                </p>
              </div>

              <ChevronDown
                size={15}
                className={[
                  "hidden text-slate-400 transition-transform sm:block",
                  profileOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileOpen(false)}
                />

                <section
                  aria-label="Profile menu"
                  className={[
                    "absolute right-0 top-12 z-50",
                    "w-[min(280px,calc(100vw-24px))]",
                    "overflow-hidden rounded-xl border border-slate-200",
                    "bg-white shadow-lg shadow-slate-900/[0.08]",
                  ].join(" ")}
                >
                  {/* User details */}
                  <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF0F7] text-sm font-semibold text-[#183657]">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {displayName}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account links */}
                  <div className="space-y-1 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profile");
                      }}
                      className={[
                        "flex min-h-10 w-full items-center gap-3 rounded-lg px-3",
                        "text-[13px] font-medium text-slate-600",
                        "transition-colors hover:bg-slate-50 hover:text-[#183657]",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-blue-500",
                      ].join(" ")}
                    >
                      <UserRound size={17} strokeWidth={1.8} />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                      className={[
                        "flex min-h-10 w-full items-center gap-3 rounded-lg px-3",
                        "text-[13px] font-medium text-slate-600",
                        "transition-colors hover:bg-slate-50 hover:text-[#183657]",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-blue-500",
                      ].join(" ")}
                    >
                      <Settings size={17} strokeWidth={1.8} />
                      Settings
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className={[
                        "flex min-h-10 w-full items-center gap-3 rounded-lg px-3",
                        "text-[13px] font-medium text-red-600",
                        "transition-colors hover:bg-red-50",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-red-400",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      ].join(" ")}
                    >
                      {loggingOut ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <LogOut size={17} strokeWidth={1.8} />
                      )}

                      {loggingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
