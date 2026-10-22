
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Users,
  X,
  LoaderCircle,
  PanelLeft,
  UserRound,
  Settings,
} from "lucide-react";
import { authApi } from "@/services/api";

type SidebarProps = {
  onLogout?: () => void | Promise<void>;
  onCollapsedChange?: (collapsed: boolean) => void;
};

const mainNavigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Students", path: "/students", icon: Users },
  { label: "Classes & Sections", path: "/classes", icon: BookOpen },
];

const accountNavigation = [
  { label: "My Profile", path: "/profile", icon: UserRound },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({
  onLogout,
  onCollapsedChange,
}: SidebarProps) {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      onCollapsedChange?.(next);
      return next;
    });
  }

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobile();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

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
      authApi.logoutLocal();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
      closeMobile();
    }
  }

  function renderNavigation(
    items: typeof mainNavigation | typeof accountNavigation,
  ) {
    return items.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/dashboard" || item.path === "/profile" || item.path === "/settings"}
          onClick={closeMobile}
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            [
              "group relative flex min-h-11 items-center gap-3 rounded-lg",
              "px-3 text-[13px] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-inset focus-visible:ring-sky-300",
              collapsed ? "justify-center px-2" : "",
              isActive
                ? "bg-[#244A78] text-white"
                : "text-slate-200 hover:bg-white/[0.07] hover:text-white",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-sky-300"
                />
              )}

              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  isActive
                    ? "text-white"
                    : "text-slate-300 group-hover:text-white",
                ].join(" ")}
              >
                <Icon size={19} strokeWidth={isActive ? 2 : 1.8} />
              </span>

              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.label}
                  </span>

                  {isActive && (
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-slate-300"
                    />
                  )}
                </>
              )}
            </>
          )}
        </NavLink>
      );
    });
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        aria-controls="student-portal-sidebar"
        className={[
          "fixed left-3 top-3 z-40 flex h-10 w-10 items-center",
          "justify-center rounded-lg border border-slate-200",
          "bg-white text-[#152D4D] shadow-sm",
          "transition-colors hover:bg-slate-100",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "md:hidden",
        ].join(" ")}
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={closeMobile}
        className={[
          "fixed inset-0 z-40 bg-slate-950/40 transition-opacity",
          "duration-200 md:hidden",
          mobileOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        id="student-portal-sidebar"
        aria-label="Student Portal navigation"
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-white/[0.08] bg-[#142B49] text-white",
          "transition-[width,transform] duration-200 ease-out",
          "motion-reduce:transition-none",
          "w-[min(288px,calc(100vw-48px))]",
          collapsed ? "md:w-[84px]" : "md:w-[260px]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div
          className={[
            "flex h-[68px] shrink-0 items-center",
            "border-b border-white/10",
            collapsed ? "justify-center px-3" : "gap-3 px-4",
          ].join(" ")}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#244A78] text-white">
            <School size={20} strokeWidth={1.8} />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold tracking-tight text-white">
                Student Management
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Academic workspace
              </p>
            </div>
          )}

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "hidden h-8 w-8 shrink-0 items-center justify-center",
              "rounded-lg text-slate-300 transition-colors",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-sky-300 md:flex",
            ].join(" ")}
          >
            <PanelLeft size={19} strokeWidth={1.8} />
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation"
            className={[
              "ml-auto flex h-9 w-9 shrink-0 items-center justify-center",
              "rounded-lg text-slate-300 transition-colors",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-sky-300 md:hidden",
            ].join(" ")}
          >
            <X size={19} strokeWidth={1.8} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto overscroll-contain px-3 py-5"
        >
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Menu
            </p>
          )}

          <div className="space-y-1">
            {renderNavigation(mainNavigation)}
          </div>

          {/* Account links: same alignment, subtle separation */}
          <div className="mt-5 border-t border-white/10 pt-4">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Account
              </p>
            )}

            <div className="space-y-1">
              {renderNavigation(accountNavigation)}
            </div>
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-3 px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-slate-300">
                <GraduationCap size={19} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-200">
                  Academic workspace
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  Student administration
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Sign out" : undefined}
            className={[
              "flex min-h-11 w-full items-center gap-3 rounded-lg px-3",
              "text-[13px] font-medium text-slate-300",
              "transition-colors hover:bg-red-400/10 hover:text-red-200",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-inset focus-visible:ring-red-300",
              "disabled:cursor-not-allowed disabled:opacity-60",
              collapsed ? "justify-center px-2" : "",
            ].join(" ")}
          >
            {loggingOut ? (
              <LoaderCircle
                size={19}
                className="shrink-0 animate-spin"
              />
            ) : (
              <LogOut size={19} strokeWidth={1.8} className="shrink-0" />
            )}

            {!collapsed && (
              <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
