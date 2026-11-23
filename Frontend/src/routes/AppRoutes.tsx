import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router";

import { ApiError, authApi, authToken } from "@/services/api";
import DashboardLayout from "@/layouts/DashboardLayout";

// Authentication pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";

// Dashboard
import DashboardPage from "@/pages/dashboard/DashboardPage";

// Student pages
import StudentsPage from "@/pages/students/StudentsPage";
import StudentFormPage from "@/pages/students/StudentFormPage";
import StudentProfilePage from "@/pages/students/StudentProfilePage";

// Classes and sections
import ClassesPage from "@/pages/classes/ClassesPage";
import SectionDetailsPage from "@/pages/classes/SectionDetailsPage";

// Other application pages

import ProfilePage from "@/pages/profile/ProfilePage";
import SettingsPage from "@/pages/settings/SettingsPage";

function ProtectedRoutes() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (!authToken.get()) {
        if (active) {
          setAuthenticated(false);
          setChecking(false);
        }
        return;
      }

      try {
        await authApi.me();

        if (active) {
          setAuthenticated(true);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 0) {
          // Preserve the token during a temporary connection failure.
          if (active) {
            setAuthenticated(false);
          }
        } else {
          authToken.clear();

          if (active) {
            setAuthenticated(false);
          }
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-50"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <span className="size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          Verifying your teacher session...
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Public authentication routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      {/* Protected application routes */}
      <Route element={<ProtectedRoutes />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
          {/* Students */}
          <Route
            path="/students"
            element={<StudentsPage />}
          />
          <Route
            path="/students/new"
            element={<StudentFormPage />}
          />
          <Route
            path="/students/:studentId"
            element={<StudentProfilePage />}
          />
          <Route
            path="/students/:studentId/edit"
            element={<StudentFormPage />}
          />

          {/* Classes and sections */}
          <Route
            path="/classes"
            element={<ClassesPage />}
          />
          <Route
            path="/classes/:program/:year/:section"
            element={<SectionDetailsPage />}
          />


          {/* Teacher profile */}
          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          {/* Application settings */}
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
