import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Search,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { studentsApi } from "@/services/api";

const PAGE_SIZE = 10;

type EnrollmentStatus = "active" | "inactive" | "graduated" | "all";

type Student = {
  id: number | string;
  student_number?: string | null;
  student_id?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  program?: string | { name?: string | null } | null;
  year_level?: string | number | null;
  section?: string | null;
  enrollment_status?: string | null;
  status?: string | null;
};

type StudentPage = {
  data?: Student[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function getProgramName(program: Student["program"]): string {
  if (typeof program === "string") return program.trim();
  return program?.name?.trim() ?? "";
}

function getStudentName(student: Student): string {
  const fullName = [
    student.first_name,
    student.middle_name,
    student.last_name,
  ]
    .filter((part) => String(part ?? "").trim())
    .join(" ")
    .trim();

  return fullName || student.name?.trim() || "Unnamed Student";
}

function getStudentNumber(student: Student): string {
  return (
    student.student_number?.trim() ||
    student.student_id?.trim() ||
    "No student number"
  );
}

function getStatus(student: Student): string {
  return normalize(student.enrollment_status ?? student.status) || "unknown";
}

function formatStatus(status: string): string {
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "active":
    case "enrolled":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
    case "inactive":
    case "dropped":
      return "bg-amber-50 text-amber-700 ring-amber-600/15";
    case "graduated":
      return "bg-blue-50 text-blue-700 ring-blue-600/15";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/10";
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getYearLabel(year: string | number | null | undefined): string {
  const value = String(year ?? "").trim();
  if (!value) return "Year not specified";

  const numericYear = Number(value);
  if (Number.isInteger(numericYear) && numericYear >= 1 && numericYear <= 6) {
    const suffix =
      numericYear === 1
        ? "st"
        : numericYear === 2
          ? "nd"
          : numericYear === 3
            ? "rd"
            : "th";

    return `${numericYear}${suffix} Year`;
  }

  return value;
}

async function fetchAllStudents(signal?: AbortSignal): Promise<Student[]> {
  const firstPage = (await studentsApi.list(
    { page: 1, per_page: 100 },
    signal,
  )) as StudentPage;

  const students = [...(firstPage.data ?? [])];
  const lastPage = Math.max(1, Number(firstPage.last_page ?? 1));

  if (lastPage > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, index) =>
        studentsApi.list(
          { page: index + 2, per_page: 100 },
          signal,
        ) as Promise<StudentPage>,
      ),
    );

    for (const page of remainingPages) {
      students.push(...(page.data ?? []));
    }
  }

  return students;
}

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 p-4 sm:p-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-xl border border-slate-100 p-4"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-36 max-w-full rounded bg-slate-200" />
            <div className="h-3 w-24 max-w-full rounded bg-slate-100" />
          </div>
          <div className="hidden h-6 w-20 rounded-full bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function SectionDetailsPage() {
  const { program, year, section } = useParams<{
    program: string;
    year: string;
    section: string;
  }>();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const decodedProgram = decodeURIComponent(program ?? "");
  const decodedYear = decodeURIComponent(year ?? "");
  const decodedSection = decodeURIComponent(section ?? "");

  const {
    data: allStudents = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["section-details-students"],
    queryFn: ({ signal }) => fetchAllStudents(signal),
  });

  const sectionStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const matchesProgram =
        normalize(getProgramName(student.program)) ===
        normalize(decodedProgram);

      const matchesYear =
        normalize(student.year_level) === normalize(decodedYear);

      const matchesSection =
        normalize(student.section) === normalize(decodedSection);

      return matchesProgram && matchesYear && matchesSection;
    });
  }, [allStudents, decodedProgram, decodedYear, decodedSection]);

  const filteredStudents = useMemo(() => {
    const query = normalize(search);

    return sectionStudents
      .filter((student) => {
        const matchesSearch =
          !query ||
          [
            getStudentName(student),
            getStudentNumber(student),
            student.email,
            getProgramName(student.program),
            student.year_level,
            student.section,
          ].some((value) => normalize(value).includes(query));

        const studentStatus = getStatus(student);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" &&
            ["active", "enrolled"].includes(studentStatus)) ||
          (statusFilter === "inactive" &&
            ["inactive", "dropped"].includes(studentStatus)) ||
          (statusFilter === "graduated" && studentStatus === "graduated");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const comparison = getStudentName(a).localeCompare(getStudentName(b));
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [sectionStudents, search, statusFilter, sortOrder]);

  const activeCount = sectionStudents.filter((student) =>
    ["active", "enrolled"].includes(getStatus(student)),
  ).length;

  const graduatedCount = sectionStudents.filter(
    (student) => getStatus(student) === "graduated",
  ).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const startNumber =
    filteredStudents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endNumber = Math.min(
    currentPage * PAGE_SIZE,
    filteredStudents.length,
  );

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatus(value: EnrollmentStatus) {
    setStatusFilter(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  }

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 text-slate-800">
      {/* Breadcrumb and back navigation */}
      <div>
        <Link
          to="/classes"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft size={17} />
          Back to Classes & Sections
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
              <BookOpen size={16} />
              Section roster
            </div>

            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {decodedProgram || "Program"} ·{" "}
              {getYearLabel(decodedYear)} · Section {decodedSection || "—"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View, search, and manage the student roster for this section.
            </p>
          </div>
<div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() =>
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"))
    }
    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    aria-label={`Sort students ${sortOrder === "asc" ? "descending" : "ascending"}`}
  >
    <ArrowUpDown size={16} />
    Name: {sortOrder === "asc" ? "A–Z" : "Z–A"}
  </button>

  <button
    type="button"
    onClick={() => void refetch()}
    disabled={isFetching}
    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <ArrowUpDown
      size={16}
      className={isFetching ? "animate-spin" : ""}
    />
    Refresh roster
  </button>
</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total students"
          value={isLoading ? "—" : sectionStudents.length}
          description="Students assigned to this section"
          icon={<Users size={20} />}
          iconClass="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          label="Active students"
          value={isLoading ? "—" : activeCount}
          description="Currently active or enrolled"
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Graduated students"
          value={isLoading ? "—" : graduatedCount}
          description="Recorded as graduated"
          icon={<GraduationCap size={20} />}
          iconClass="bg-violet-50 text-violet-700"
        />
      </div>

      {/* Roster panel */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student roster
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading students…"
                  : `${filteredStudents.length} ${
                      filteredStudents.length === 1 ? "student" : "students"
                    } matching your filters`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1 sm:min-w-[260px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Search name, ID, or email…"
                  aria-label="Search students in this section"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => updateSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  updateStatus(event.target.value as EnrollmentStatus)
                }
                aria-label="Filter by enrollment status"
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="all">All statuses</option>
                <option value="active">Active / Enrolled</option>
                <option value="inactive">Inactive / Dropped</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {search.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Search: {search.trim()}
                  <button
                    type="button"
                    onClick={() => updateSearch("")}
                    aria-label="Remove search filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {formatStatus(statusFilter)}
                  <button
                    type="button"
                    onClick={() => updateStatus("all")}
                    aria-label="Remove status filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <div className="px-5 py-14 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Users size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Unable to load the roster
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error instanceof Error
                ? error.message
                : "Something went wrong while retrieving the student list."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
            >
              Try again
            </button>
          </div>
        ) : sectionStudents.length === 0 ? (
          <div className="px-5 py-16 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Users size={28} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              No students in this section yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are currently no student records matching this program,
              year level, and section.
            </p>
            <Link
              to="/students"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
            >
              View all students
            </Link>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Search size={25} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-bold text-slate-900">
              No matching students
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term or enrollment status.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student ID
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Enrollment status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => {
                    const name = getStudentName(student);
                    const status = getStatus(student);

                    return (
                      <tr
                        key={student.id}
                        className="group transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
                              {getInitials(name) || (
                                <UserRound size={17} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {name}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {student.email || "No email recorded"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono text-sm text-slate-600">
                            {getStudentNumber(student)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(status)}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/students/${student.id}`}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            View profile
                            <ChevronRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile roster cards */}
            <div className="space-y-3 p-3 md:hidden sm:p-4">
              {paginatedStudents.map((student) => {
                const name = getStudentName(student);
                const status = getStatus(student);

                return (
                  <article
                    key={student.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
                        {getInitials(name) || <UserRound size={18} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-slate-900">
                          {name}
                        </h3>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {student.email || "No email recorded"}
                        </p>
                        <p className="mt-2 font-mono text-xs text-slate-600">
                          {getStudentNumber(student)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(status)}`}
                      >
                        {formatStatus(status)}
                      </span>

                      <Link
                        to={`/students/${student.id}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                      >
                        View profile
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500 sm:text-sm">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startNumber}–{endNumber}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredStudents.length}
                </span>{" "}
                students
              </p>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}