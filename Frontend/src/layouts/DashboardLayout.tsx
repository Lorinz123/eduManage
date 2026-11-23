
import { useEffect, useState } from "react";
import { Outlet } from "react-router";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { authApi, authToken, type AuthUser } from "@/services/api";

type DashboardOutletContext = {
  teacher: AuthUser | null;
  loggingOut: boolean;
  handleLogout: () => Promise<void>;
};

export default function DashboardLayout() {
  const [teacher, setTeacher] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTeacher() {
      if (!authToken.get()) return;

      try {
        const user = await authApi.me();

        if (active) {
          setTeacher(user as AuthUser);
        }
      } catch (error) {
        if (active) {
          console.error("Unable to load teacher details:", error);
        }
      }
    }

    void loadTeacher();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout(): Promise<void> {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API request failed:", error);
    } finally {
      // Clear the local session even if the API request fails.
      authApi.logoutLocal();
      authToken.clear();
      setLoggingOut(false);

      window.location.replace("/login");
    }
  }

  return (
    <div className="dashboard-canvas min-h-screen min-w-0">
      {/* Existing sidebar component */}
      <Sidebar onLogout={handleLogout} onCollapsedChange={setSidebarCollapsed} />

      {/* Main application area */}
      <div
        className={[
          "min-h-screen min-w-0 transition-[margin] duration-300 ease-out",
          "motion-reduce:transition-none",
          sidebarCollapsed ? "md:ml-[84px]" : "md:ml-[260px]",
        ].join(" ")}
      >
        {/* Existing topbar component */}
        <Topbar
          user={teacher}
          onLogout={handleLogout}
        />

        {/* Current protected page */}
        <main className="mx-auto min-w-0 max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
          <Outlet
            context={
              {
                teacher,
                loggingOut,
                handleLogout,
              } satisfies DashboardOutletContext
            }
          />
        </main>
      </div>
    </div>
  );
}
