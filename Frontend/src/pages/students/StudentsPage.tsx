
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Users,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  ArrowRight,
  UserRound,
  Filter,
  UserCheck,
} from "lucide-react";
import {
  ApiError,
  studentsApi,
  type EnrollmentStatus,
} from "@/services/api";
import Button from "@/components/common/Button"

const statusStyles: Record<EnrollmentStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/15",
  transferred: "bg-amber-50 text-amber-700 ring-amber-600/15",
  archived: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

const formatStatus = (status: EnrollmentStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const pageSize = 10;
const apiPageSize = 100;

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export default function StudentsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    EnrollmentStatus | "all"
  >("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortAscending, setSortAscending] = useState(true);
  const [page, setPage] = useState(1);

  const studentsQuery = useQuery({
    queryKey: ["students", "directory"],
    queryFn: async ({ signal }) => {
      const firstPage = await studentsApi.list(
        { page: 1, per_page: apiPageSize },
        signal,
      );

      const allStudents = [...firstPage.data];

      for (
        let nextPage = 2;
        nextPage <= firstPage.last_page;
        nextPage += 1
      ) {
        const response = await studentsApi.list(
          { page: nextPage, per_page: apiPageSize },
          signal,
        );

        allStudents.push(...response.data);
      }

      return allStudents;
    },
    retry: false,
  });

  const students = useMemo(
    () => studentsQuery.data ?? [],
    [studentsQuery.data],
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students
      .filter((student) => {
        const fullName =
          `${student.first_name} ${student.last_name}`.toLowerCase();

        const reverseName =
          `${student.last_name} ${student.first_name}`.toLowerCase();

        const matchesSearch =
          !query ||
          fullName.includes(query) ||
          reverseName.includes(query) ||
          (student.student_number ?? "").toLowerCase().includes(query) ||
          (student.email ?? "").toLowerCase().includes(query) ||
          (student.program ?? "").toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          student.enrollment_status === statusFilter;

        const matchesYear =
          yearFilter === "all" ||
          student.year_level === Number(yearFilter);

        return matchesSearch && matchesStatus && matchesYear;
      })
      .sort((a, b) => {
        const comparison = `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`,
        );

        return sortAscending ? comparison : -comparison;
      });
  }, [students, search, statusFilter, yearFilter, sortAscending]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / pageSize),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedStudents = useMemo(
    () =>
      filteredStudents.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [filteredStudents, currentPage],
  );

  const activeCount = useMemo(
    () =>
      filteredStudents.filter(
        (student) => student.enrollment_status === "active",
      ).length,
    [filteredStudents],
  );

  const inactiveCount = useMemo(
    () =>
      filteredStudents.filter(
        (student) => student.enrollment_status === "inactive",
      ).length,
    [filteredStudents],
  );

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    yearFilter !== "all";

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setYearFilter("all");
    setPage(1);
  }

  function handleRetry() {
    void studentsQuery.refetch();
  }

  const errorMessage =
    studentsQuery.error instanceof ApiError &&
    studentsQuery.error.status === 401
      ? "Your session may have expired. Please log in again."
      : studentsQuery.error instanceof Error
        ? studentsQuery.error.message
        : "An unexpected error occurred while loading student records.";

  return (
    <div className="min-w-0 space-y-6 pb-6 sm:space-y-7">
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-blue-600">Workspace</span>
            <span aria-hidden="true">/</span>
            <span>Students</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#172B45] sm:text-[28px]">
            Student Directory
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            View, search, and manage student information and enrollment
            records.
          </p>
        </div><Button
  type="button"
  variant="primary"
  size="lg"
  onClick={() => navigate("/students/new")}
  leftIcon={<Plus size={18} strokeWidth={2} />}
>
  Add student
</Button>
      </header>

      {/* Summary cards */}
      <section aria-label="Student records overview">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#172B45]">
            Directory overview
          </h2>

          <span className="text-xs text-slate-400">
            Current results
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Total matching students"
            value={
              studentsQuery.isPending || studentsQuery.isError
                ? "—"
                : filteredStudents.length.toLocaleString()
            }
            description="Students matching your filters"
            icon={<Users size={19} />}
            tone="blue"
          />

          <SummaryCard
            label="Active students"
            value={
              studentsQuery.isPending || studentsQuery.isError
                ? "—"
                : activeCount.toLocaleString()
            }
            description="Currently marked as active"
            icon={<UserCheck size={19} />}
            tone="emerald"
          />

          <SummaryCard
            label="Inactive students"
            value={
              studentsQuery.isPending || studentsQuery.isError
                ? "—"
                : inactiveCount.toLocaleString()
            }
            description="Currently marked as inactive"
            icon={<GraduationCap size={19} />}
            tone="slate"
          />
        </div>
      </section>

      {/* Student directory */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white">
        {/* Search and filter header */}
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#172B45]">
                All students
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Search and filter the student directory.
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <label className="relative block min-w-0 sm:w-72">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search students..."
                  aria-label="Search by name, student number, email, or program"
                  className={[
                    "min-h-11 w-full rounded-lg border border-slate-200",
                    "bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800",
                    "outline-none transition placeholder:text-slate-400",
                    "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
                  ].join(" ")}
                />
              </label>

              <button
                type="button"
                onClick={() => setSortAscending((value) => !value)}
                aria-label={
                  sortAscending
                    ? "Sort by last name descending"
                    : "Sort by last name ascending"
                }
                className={[
                  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2",
                  "rounded-lg border border-slate-200 bg-white px-3.5",
                  "text-sm font-medium text-slate-600 transition-colors",
                  "hover:bg-slate-50 hover:text-[#172B45]",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                ].join(" ")}
              >
                <ArrowUpDown size={16} />
                {sortAscending ? "A–Z" : "Z–A"}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-blue-600" />

              <span className="text-xs font-semibold text-slate-700">
                Filters
              </span>

              {hasFilters && (
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  Active
                </span>
              )}

              <div className="flex-1" />

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
                >
                  <X size={13} />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Enrollment status
                </span>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value as EnrollmentStatus | "all",
                    );
                    setPage(1);
                  }}
                  className={[
                    "min-h-10 w-full rounded-lg border border-slate-200",
                    "bg-white px-3 text-sm text-slate-700 outline-none",
                    "transition focus:border-blue-500",
                    "focus:ring-4 focus:ring-blue-500/10",
                  ].join(" ")}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Year level
                </span>

                <select
                  value={yearFilter}
                  onChange={(event) => {
                    setYearFilter(event.target.value);
                    setPage(1);
                  }}
                  className={[
                    "min-h-10 w-full rounded-lg border border-slate-200",
                    "bg-white px-3 text-sm text-slate-700 outline-none",
                    "transition focus:border-blue-500",
                    "focus:ring-4 focus:ring-blue-500/10",
                  ].join(" ")}
                >
                  <option value="all">All year levels</option>
                  <option value="1">1st year</option>
                  <option value="2">2nd year</option>
                  <option value="3">3rd year</option>
                  <option value="4">4th year</option>
                  <option value="5">5th year</option>
                  <option value="6">6th year</option>
                </select>
              </label>
            </div>
          </div>

          {/* Results summary */}
          {!studentsQuery.isPending && !studentsQuery.isError && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {filteredStudents.length.toLocaleString()}
                </span>{" "}
                {filteredStudents.length === 1 ? "student" : "students"} found
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
                >
                  Reset search and filters
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {studentsQuery.isPending ? (
          <div
            className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center"
            role="status"
            aria-live="polite"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
              <RefreshCw
                size={20}
                className="animate-spin text-blue-600"
              />
            </span>

            <p className="text-sm font-semibold text-[#172B45]">
              Loading students
            </p>

            <p className="text-xs text-slate-500">
              Please wait while your directory is prepared.
            </p>
          </div>
        ) : studentsQuery.isError ? (
          /* Error state */
          <div
            className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center"
            role="alert"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={23} />
            </div>

            <h3 className="text-sm font-semibold text-[#172B45]">
              Unable to load students
            </h3>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className={`mt-1 ${primaryButtonClass}`}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : paginatedStudents.length === 0 ? (
          /* Empty state */
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
              {students.length === 0 ? (
                <UserRound size={25} />
              ) : (
                <Filter size={25} />
              )}
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#172B45]">
              {students.length === 0
                ? "No student records yet"
                : "No matching students"}
            </h3>

            <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
              {students.length === 0
                ? "Get started by adding your first student to the directory."
                : "Try another name or adjust the filters to find the student you need."}
            </p>

            {students.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate("/students/new")}
                className={`mt-5 ${primaryButtonClass}`}
              >
                <Plus size={17} />
                Add first student
              </button>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
              >
                <X size={15} />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* Student table */
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200">
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Student
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Student number
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Program / department
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Academic level
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Status
                    </th>

                    <th scope="col" className="px-5 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                            {`${student.first_name?.charAt(0) ?? ""}${student.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
                              "ST"}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[190px] truncate text-[13px] font-semibold text-[#172B45]">
                              {student.last_name}, {student.first_name}
                            </p>

                            <p className="mt-1 max-w-[190px] truncate text-xs text-slate-500">
                              {student.email || "No email recorded"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-700">
                        {student.student_number || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[190px] truncate text-xs font-medium text-slate-700">
                          {student.program || "—"}
                        </p>

                        <p className="mt-1 max-w-[190px] truncate text-xs text-slate-500">
                          {student.department || "No department"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-slate-700">
                          {student.year_level
                            ? `Year ${student.year_level}`
                            : "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.section || "No section assigned"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[student.enrollment_status]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {formatStatus(student.enrollment_status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/students/${student.id}`)
                          }
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                        >
                          View
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * pageSize + 1}–
                  {Math.min(
                    currentPage * pageSize,
                    filteredStudents.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredStudents.length.toLocaleString()}
                </span>{" "}
                students
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  className={[
                    "inline-flex min-h-10 items-center gap-1.5 rounded-lg",
                    "border border-slate-200 bg-white px-3 text-xs font-medium",
                    "text-slate-600 transition-colors hover:bg-slate-50",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  ].join(" ")}
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                <span
                  className="min-w-[64px] text-center text-xs font-medium tabular-nums text-slate-600"
                  aria-live="polite"
                >
                  {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) =>
                      Math.min(totalPages, value + 1),
                    )
                  }
                  className={[
                    "inline-flex min-h-10 items-center gap-1.5 rounded-lg",
                    "border border-slate-200 bg-white px-3 text-xs font-medium",
                    "text-slate-600 transition-colors hover:bg-slate-50",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  ].join(" ")}
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone: "blue" | "emerald" | "slate";
};

function SummaryCard({
  label,
  value,
  description,
  icon,
  tone,
}: SummaryCardProps) {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-700",
      accent: "bg-blue-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
    },
    slate: {
      icon: "bg-slate-100 text-slate-700",
      accent: "bg-slate-400",
    },
  };

  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
      <div
        className={`absolute inset-y-0 left-0 w-[3px] ${tones[tone].accent}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-[#172B45]">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone].icon}`}
        >
          {icon}
        </span>
      </div>
    </article>
  );
}
