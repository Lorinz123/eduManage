import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownUp,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Layers3,
  ListFilter,
  RefreshCw,
  Search,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { studentsApi } from "@/services/api";
import Button from "@/components/common/Button";

const PAGE_SIZE = 5;

const YEARS = [
  { label: "All years", value: "" },
  { label: "1st Year", value: "1" },
  { label: "2nd Year", value: "2" },
  { label: "3rd Year", value: "3" },
  { label: "4th Year", value: "4" },
];

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/10",
  transferred: "bg-amber-50 text-amber-700 ring-amber-600/10",
  archived: "bg-blue-50 text-blue-700 ring-blue-600/10",
};

function getYearLabel(year: number) {
  if (!year) return "Year not assigned";

  const suffix =
    year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";

  return `${year}${suffix} Year`;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.trim().charAt(0) ?? ""}${
    lastName?.trim().charAt(0) ?? ""
  }`.toUpperCase();
}

function formatStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export default function ClassesPage() {
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const query = useQuery({
    queryKey: ["students", "classes"],
    queryFn: async ({ signal }) => {
      const firstPage = await studentsApi.list(
        { per_page: 100, page: 1 },
        signal,
      );

      const pageNumbers = Array.from(
        { length: Math.max(0, firstPage.last_page - 1) },
        (_, index) => index + 2,
      );

      const remainingPages = await Promise.all(
        pageNumbers.map((page) =>
          studentsApi.list({ per_page: 100, page }, signal),
        ),
      );

      return [
        ...firstPage.data,
        ...remainingPages.flatMap((page) => page.data),
      ];
    },
  });

  const allStudents = useMemo(() => query.data ?? [], [query.data]);

  const programs = useMemo(
    () =>
      Array.from(
        new Set(
          allStudents
            .map((student) => student.program?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [allStudents],
  );

  const sections = useMemo(
    () =>
      Array.from(
        new Set(
          allStudents
            .map((student) => student.section?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [allStudents],
  );

  const filteredStudents = useMemo(() => {
    const term = normalize(search);

    return allStudents.filter((student) => {
      const matchesSearch =
        !term ||
        [
          student.first_name,
          student.last_name,
          `${student.first_name} ${student.last_name}`,
          `${student.last_name} ${student.first_name}`,
          student.student_number,
          student.email,
          student.program,
          student.department,
          student.section,
          student.year_level,
        ]
          .map(normalize)
          .some((value) => value.includes(term));

      const matchesProgram =
        !program || normalize(student.program) === normalize(program);

      const matchesYear =
        !year || Number(student.year_level) === Number(year);

      const matchesSection =
        !section ||
        (section === "__unassigned__"
          ? !student.section?.trim()
          : normalize(student.section) === normalize(section));

      const matchesStatus =
        !status || normalize(student.enrollment_status) === status;

      return (
        matchesSearch &&
        matchesProgram &&
        matchesYear &&
        matchesSection &&
        matchesStatus
      );
    });
  }, [allStudents, search, program, year, section, status]);

  const groups = useMemo(() => {
    type Group = {
      key: string;
      program: string;
      year: number;
      section: string;
      students: typeof filteredStudents;
    };

    const grouped = new Map<string, Group>();

    for (const student of filteredStudents) {
      const programName = student.program?.trim() || "Unassigned program";
      const yearLevel = Number(student.year_level) || 0;
      const sectionName = student.section?.trim() || "Unassigned";

      const key = JSON.stringify([programName, yearLevel, sectionName]);
      const existing = grouped.get(key);

      if (existing) {
        existing.students.push(student);
      } else {
        grouped.set(key, {
          key,
          program: programName,
          year: yearLevel,
          section: sectionName,
          students: [student],
        });
      }
    }

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        students: [...group.students].sort(
          (a, b) =>
            a.last_name.localeCompare(b.last_name) ||
            a.first_name.localeCompare(b.first_name),
        ),
      }))
      .sort(
        (a, b) =>
          a.program.localeCompare(b.program) ||
          a.year - b.year ||
          a.section.localeCompare(b.section),
      );
  }, [filteredStudents]);

  const activeCount = filteredStudents.filter(
    (student) => normalize(student.enrollment_status) === "active",
  ).length;

  const unassignedCount = filteredStudents.filter(
    (student) => !student.section?.trim(),
  ).length;

  const activeFilters = [
    search.trim() !== "",
    program !== "",
    year !== "",
    section !== "",
    status !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setProgram("");
    setYear("");
    setSection("");
    setStatus("");
  };

  const toggleSection = (key: string) => {
    setExpandedSections((previous) => {
      const next = new Set(previous);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(groups.map((group) => group.key)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <main className="min-w-0 space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <GraduationCap size={25} strokeWidth={1.8} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Classes &amp; Sections
              </h1>
              {!query.isPending && !query.isError && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {groups.length} {groups.length === 1 ? "section" : "sections"}
                </span>
              )}
            </div>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Find a class, check its roster, and view individual student
              profiles.
            </p>
          </div>
        </div>

       <Link
  to="/students"
  className="inline-flex min-h-11 self-start sm:self-center"
>
  <Button
    type="button"
    variant="primary"
    size="lg"
    leftIcon={<Users size={16} />}
    rightIcon={<ArrowUpRight size={15} />}
    className="min-h-11 rounded-xl px-4 py-2.5 text-sm"
  >
    Student directory
  </Button>
</Link>
      </header>

      <section
        aria-label="Student and section summary"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total students"
          value={query.isPending || query.isError ? "—" : allStudents.length}
          detail="All loaded student records"
          icon={<Users size={19} />}
          color="blue"
        />
        <SummaryCard
          label="Class sections"
          value={query.isPending || query.isError ? "—" : groups.length}
          detail="Sections matching your filters"
          icon={<Layers3 size={19} />}
          color="violet"
        />
        <SummaryCard
          label="Active students"
          value={query.isPending || query.isError ? "—" : activeCount}
          detail="Within the current results"
          icon={<CheckCircle2 size={19} />}
          color="emerald"
        />
        <SummaryCard
          label="Unassigned section"
          value={query.isPending || query.isError ? "—" : unassignedCount}
          detail="Students needing a section"
          icon={<UserRound size={19} />}
          color="amber"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ListFilter size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Find a class or student
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Narrow the roster by student or class details.
              </p>
            </div>
          </div>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X size={15} />}
              onClick={clearFilters}
              className="self-start sm:self-center"
            >
              Clear filters ({activeFilters})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-5">
          <label className="block sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Search
            </span>
            <span className="relative block">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${inputClass} pl-9 pr-9`}
                placeholder="Name, student ID, email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search students and class details"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Program
            </span>
            <select
              className={inputClass}
              value={program}
              onChange={(event) => setProgram(event.target.value)}
            >
              <option value="">All programs</option>
              {programs.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Year level
            </span>
            <select
              className={inputClass}
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              {YEARS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Section
            </span>
            <select
              className={inputClass}
              value={section}
              onChange={(event) => setSection(event.target.value)}
            >
              <option value="">All sections</option>
              {sections.map((item) => (
                <option key={item} value={item}>
                  Section {item}
                </option>
              ))}
              <option value="__unassigned__">Unassigned</option>
            </select>
          </label>

          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Enrollment status
            </span>
            <select
              className={inputClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500" aria-live="polite">
            {query.isPending
              ? "Loading student rosters…"
              : query.isError
                ? "Student rosters could not be loaded."
                : `Showing ${filteredStudents.length} ${
                    filteredStudents.length === 1 ? "student" : "students"
                  } across ${groups.length} ${
                    groups.length === 1 ? "section" : "sections"
                  }`}
          </p>

          {activeFilters > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <ListFilter size={13} />
              Filtered results
            </span>
          )}
        </div>
      </section>

      {query.isPending && (
        <section
          aria-label="Loading student sections"
          aria-busy="true"
          className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 2xl:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 rounded bg-slate-100" />
                    <div className="h-4 w-32 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {Array.from({ length: 3 }, (_, row) => (
                    <div key={row} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-slate-100" />
                        <div className="h-3 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {query.isError && (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white px-5 py-12 text-center shadow-sm"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <RefreshCw size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">
            Unable to load student sections
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {query.error instanceof Error
              ? query.error.message
              : "Please check your connection and try again."}
          </p>
          <Button
            onClick={() => void query.refetch()}
            leftIcon={<RefreshCw size={15} />}
            className="mt-5"
          >
            Try again
          </Button>
        </section>
      )}

      {!query.isPending && !query.isError && groups.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            {allStudents.length === 0 ? (
              <GraduationCap size={27} />
            ) : (
              <Search size={25} />
            )}
          </div>

          <h2 className="mt-4 text-base font-bold text-slate-900">
            {allStudents.length === 0
              ? "No student records yet"
              : "No matching students or sections"}
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {allStudents.length === 0
              ? "Student sections will appear here when student records are available."
              : "Try another search term or adjust your filters to find the class you need."}
          </p>

          {activeFilters > 0 && (
            <Button
              onClick={clearFilters}
              leftIcon={<X size={15} />}
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </section>
      )}

      {!query.isPending && !query.isError && groups.length > 0 && (
        <section aria-label="Class section rosters" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student rosters
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Expand a roster for a quick preview or open a section for the
                complete student list.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                leftIcon={<ChevronDown size={14} />}
              >
                Expand all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                leftIcon={<ArrowDownUp size={14} />}
              >
                Collapse all
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {groups.map((group) => {
              const isExpanded = expandedSections.has(group.key);
              const visibleStudents = isExpanded
                ? group.students
                : group.students.slice(0, PAGE_SIZE);
              const activeInGroup = group.students.filter(
                (student) =>
                  normalize(student.enrollment_status) === "active",
              ).length;
              const hiddenCount =
                group.students.length - visibleStudents.length;

              const hasAssignedSection =
                Boolean(group.program) &&
                group.program !== "Unassigned program" &&
                Boolean(group.section) &&
                group.section !== "Unassigned" &&
                group.year > 0;

              const sectionDetailsPath = hasAssignedSection
                ? `/classes/${encodeURIComponent(group.program)}/${encodeURIComponent(
                    String(group.year),
                  )}/${encodeURIComponent(group.section)}`
                : null;

              return (
                <article
                  key={group.key}
                  className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-md"
                >
                  <header className="border-b border-slate-100 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <BookOpen size={22} strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                            {group.program}
                          </p>
                          <h3 className="mt-1 break-words text-lg font-bold tracking-tight text-slate-900">
                            Section {group.section}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {getYearLabel(group.year)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                        <p className="text-xl font-bold leading-none text-slate-900">
                          {group.students.length}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Students
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={13} />
                        {activeInGroup} active
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <Users size={13} />
                        {group.students.length - activeInGroup} other
                      </span>
                    </div>
                  </header>

                  <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-4 py-3 sm:px-5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">
                        Student list
                      </h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Alphabetical order
                      </p>
                    </div>
                    <span className="text-xs font-medium tabular-nums text-slate-500">
                      {visibleStudents.length} of {group.students.length}
                    </span>
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {visibleStudents.map((student) => {
                      const enrollmentStatus = normalize(
                        student.enrollment_status,
                      );
                      const badgeClass =
                        statusStyles[enrollmentStatus] ??
                        statusStyles.inactive;
                      const fullName =
                        `${student.first_name} ${student.last_name}`.trim();

                      return (
                        <li
                          key={student.id}
                          className="flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-blue-50/40 sm:px-5"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-800">
                            {getInitials(
                              student.first_name,
                              student.last_name,
                            ) || <UserRound size={16} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-semibold text-slate-800"
                              title={fullName}
                            >
                              {fullName || "Unnamed student"}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {student.student_number || "No student number"}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${badgeClass}`}
                            >
                              {formatStatus(student.enrollment_status)}
                            </span>

                            <Link
                              to={`/students/${student.id}`}
                              aria-label={`View ${fullName}'s profile`}
                              title="View student profile"
                              className="inline-flex min-h-6 items-center gap-1 text-xs font-semibold text-blue-700 transition hover:text-blue-900 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            >
                              View profile
                              <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <footer className="mt-auto border-t border-slate-100 px-4 py-3.5 sm:px-5">
                    {group.students.length > PAGE_SIZE && (
                      <div className="mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(group.key)}
                          aria-expanded={isExpanded}
                          leftIcon={
                            <ChevronDown
                              size={14}
                              className={isExpanded ? "rotate-180" : ""}
                            />
                          }
                        >
                          {isExpanded
                            ? "Show less"
                            : `View ${hiddenCount} more`}
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {sectionDetailsPath ? (
                      <Link
  to={sectionDetailsPath}
  className="flex min-h-10 flex-1"
>
  <Button
    type="button"
    variant="primary"
    size="md"
    fullWidth
    rightIcon={<ArrowUpRight size={16} />}
    className="min-h-10 rounded-xl px-3 py-2 text-sm"
  >
    View Section
  </Button>
</Link>
                      ) : (
                        <span
                          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500"
                          title="Assign a program, year level, and section before opening a section roster."
                        >
                          Section details unavailable
                        </span>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  color: "blue" | "violet" | "emerald" | "amber";
};

function SummaryCard({
  label,
  value,
  detail,
  icon,
  color,
}: SummaryCardProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
          {label}
        </p>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
        {detail}
      </p>
    </article>
  );
}