import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Plus,
  RefreshCw,
  Users,
  UserCheck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Button from "@/components/common/Button";
import { ApiError, studentsApi, type CollegeStudent } from "@/services/api";

const PAGE_SIZE = 100;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Your session may have expired. Please log in again.";
    }

    return error.message;
  }

  return error instanceof Error
    ? error.message
    : "Unable to load dashboard data.";
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStudentName(student: CollegeStudent): string {
  return (
    `${student.first_name} ${student.last_name}`.trim() ||
    "Unnamed student"
  );
}

function getInitials(student: CollegeStudent): string {
  const first = student.first_name?.trim().charAt(0) ?? "";
  const last = student.last_name?.trim().charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "ST";
}

function getClassLabel(student: CollegeStudent): string {
  const program = student.program || "Program unavailable";
  const year = student.year_level
    ? `Year ${student.year_level}`
    : "Year unavailable";
  const section = student.section
    ? `Section ${student.section}`
    : "No section";

  return `${program} · ${year} · ${section}`;
}

async function fetchAllStudents(
  signal: AbortSignal,
): Promise<CollegeStudent[]> {
  const firstPage = await studentsApi.list(
    { page: 1, per_page: PAGE_SIZE },
    signal,
  );

  const students = [...firstPage.data];

  for (let page = 2; page <= firstPage.last_page; page += 1) {
    const result = await studentsApi.list(
      { page, per_page: PAGE_SIZE },
      signal,
    );

    students.push(...result.data);
  }

  return students;
}

function buildEnrollmentData(students: CollegeStudent[]) {
  const now = new Date();

  const months = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (6 - index),
      1,
    );

    return {
      key: `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`,
      month: formatMonth(date),
      students: 0,
    };
  });

  const counts = new Map(months.map((month) => [month.key, 0]));

  for (const student of students) {
    if (!student.created_at) continue;

    const createdAt = new Date(student.created_at);

    if (Number.isNaN(createdAt.getTime())) continue;

    const key = `${createdAt.getFullYear()}-${String(
      createdAt.getMonth() + 1,
    ).padStart(2, "0")}`;

    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return months.map((month) => ({
    month: month.month,
    students: counts.get(month.key) ?? 0,
  }));
}

function formatCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyle(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    case "inactive":
      return "bg-slate-100 text-slate-600 ring-slate-500/10";
    case "transferred":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";
    default:
      return "bg-rose-50 text-rose-700 ring-rose-600/10";
  }
}

export default function DashboardPage() {
  const {
    data: students = [],
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["students", "dashboard"],
    queryFn: ({ signal }) => fetchAllStudents(signal),
  });

  const statistics = useMemo(() => {
    const activeStudents = students.filter(
      (student) => student.enrollment_status === "active",
    ).length;

    const classSections = new Set(
      students
        .filter((student) => student.program && student.year_level)
        .map(
          (student) =>
            `${student.program}|${student.year_level}|${student.section ?? ""}`,
        ),
    ).size;

    const now = new Date();

    const newRecordsThisMonth = students.filter((student) => {
      if (!student.created_at) return false;

      const createdAt = new Date(student.created_at);

      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    }).length;

    return [
      {
        label: "Total students",
        value: students.length,
        detail: "All registered records",
        icon: Users,
        tone: "blue",
      },
      {
        label: "Active students",
        value: activeStudents,
        detail:
          students.length > 0
            ? `${((activeStudents / students.length) * 100).toFixed(1)}% of all students`
            : "No records available",
        icon: UserCheck,
        tone: "emerald",
      },
      {
        label: "Classes & sections",
        value: classSections,
        detail: "Program and year combinations",
        icon: BookOpen,
        tone: "indigo",
      },
      {
        label: "New records",
        value: newRecordsThisMonth,
        detail: "Added this month",
        icon: GraduationCap,
        tone: "slate",
      },
    ];
  }, [students]);

  const enrollmentData = useMemo(
    () => buildEnrollmentData(students),
    [students],
  );

  const recentStudents = useMemo(
    () =>
      [...students]
        .sort((a, b) => {
          const dateA = a.created_at
            ? new Date(a.created_at).getTime()
            : 0;
          const dateB = b.created_at
            ? new Date(b.created_at).getTime()
            : 0;

          return dateB - dateA || b.id - a.id;
        })
        .slice(0, 5),
    [students],
  );

  if (isPending) {
    return (
      <div
        className="flex min-h-72 items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <RefreshCw
              size={19}
              className="animate-spin text-blue-600"
            />
          </span>

          <p className="text-sm font-medium text-slate-600">
            Loading dashboard...
          </p>

          <p className="text-xs text-slate-400">
            Preparing your overview
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Activity size={21} />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-[#172B45]">
          Dashboard unavailable
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {getErrorMessage(error)}
        </p>

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<RefreshCw size={15} />}
          onClick={() => void refetch()}
          className="mt-5"
        >
          Try again
        </Button>
      </section>
    );
  }

  return (
    <div className="min-w-0 space-y-6 pb-6 sm:space-y-7">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-blue-600">Workspace</span>
            <span aria-hidden="true">/</span>
            <span>Dashboard</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#172B45] sm:text-[28px]">
            Dashboard
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            A clear overview of student records and enrollment activity.
          </p>

          {isFetching && (
            <p
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500"
              role="status"
            >
              <RefreshCw size={12} className="animate-spin" />
              Updating records...
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 lg:flex">
            <CalendarDays size={15} className="text-slate-400" />
            {formatCurrentDate()}
          </div>

         <Button
  type="button"
  variant="primary"
  size="md"
  leftIcon={<Plus size={17} strokeWidth={2} />}
  onClick={() => {
    window.location.assign("/students/new");
  }}
>
  Add student
</Button>
        </div>
      </section>

      {/* Statistics */}
      <section aria-label="Student statistics">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#172B45]">
            At a glance
          </h2>

          <span className="text-xs text-slate-400">
            Student overview
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((stat) => {
            const Icon = stat.icon;

            const iconTone: Record<string, string> = {
              blue: "bg-blue-50 text-blue-700",
              emerald: "bg-emerald-50 text-emerald-700",
              indigo: "bg-indigo-50 text-indigo-700",
              slate: "bg-slate-100 text-slate-700",
            };

            return (
              <article
                key={stat.label}
                className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[stat.tone]}`}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                </div>

                <p className="mt-4 break-words text-3xl font-semibold tracking-tight tabular-nums text-[#172B45]">
                  {stat.value.toLocaleString()}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {stat.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Chart and quick actions */}
      <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#172B45]">
                Student record activity
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                New student records created over the past seven months
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Monthly records
            </span>
          </div>

          <div className="mt-5 h-56 min-w-0 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={enrollmentData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="enrollmentFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3B82F6"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor="#3B82F6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#E8EDF3"
                  strokeDasharray="3 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8490A3", fontSize: 11 }}
                  tickMargin={10}
                  minTickGap={12}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8490A3", fontSize: 11 }}
                  allowDecimals={false}
                  width={35}
                />

                <Tooltip
                  formatter={(value) => [
                    Number(value ?? 0).toLocaleString(),
                    "Records created",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)",
                    fontSize: 12,
                  }}
                  labelStyle={{
                    color: "#172B45",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="students"
                  name="Records created"
                  stroke="#3B82F6"
                  strokeWidth={2.2}
                  fill="url(#enrollmentFill)"
                  activeDot={{
                    r: 4,
                    fill: "#3B82F6",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Quick actions */}
        <article className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-[#172B45]">
              Quick actions
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Common student management tasks
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <QuickAction
              to="/students/new"
              icon={<Plus size={18} />}
              title="Register a student"
              description="Create a student record"
            />

            <QuickAction
              to="/students"
              icon={<Users size={18} />}
              title="Student directory"
              description="Find and manage students"
            />

            <QuickAction
              to="/classes"
              icon={<BookOpen size={18} />}
              title="Classes & sections"
              description="Browse academic groupings"
            />
          </div>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-inset ring-blue-100">
                <GraduationCap size={18} />
              </span>

              <div>
                <p className="text-xs font-semibold text-[#172B45]">
                  Data quality matters
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Keep student details accurate and up to date.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Recent student records */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-[#172B45]">
              Recent student records
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              The five most recently created student records
            </p>
          </div>

          <Link
            to="/students"
            className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            View all students
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <div className="px-5 py-12 text-center sm:py-14">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
              <UserRound size={22} />
            </span>

            <h3 className="mt-4 text-sm font-semibold text-[#172B45]">
              No student records yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
              Start by registering a student. Their information will appear
              here once saved.
            </p>

            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                window.location.assign("/students/new");
              }}
              className="mt-4"
            >
              Register first student
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th
                      scope="col"
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500"
                    >
                      Student
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500"
                    >
                      Student ID
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500"
                    >
                      Program & section
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500"
                    >
                      Status
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500"
                    >
                      Date added
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">
                            {getInitials(student)}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate text-[13px] font-medium text-[#172B45]">
                              {getStudentName(student)}
                            </p>

                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500">
                              {student.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-600">
                        {student.student_number || "—"}
                      </td>

                      <td className="max-w-[240px] px-4 py-3.5 text-xs leading-5 text-slate-600">
                        {getClassLabel(student)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${getStatusStyle(student.enrollment_status)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {student.enrollment_status
                            ? student.enrollment_status.charAt(0).toUpperCase() +
                              student.enrollment_status.slice(1)
                            : "Unknown"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                        {formatDate(student.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-xs text-slate-500">
                Showing {recentStudents.length} of{" "}
                {students.length.toLocaleString()} student records
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

type QuickActionProps = {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
};

function QuickAction({
  to,
  icon,
  title,
  description,
}: QuickActionProps) {
  return (
    <Link
      to={to}
      className={[
        "group flex min-h-[68px] items-center gap-3 rounded-lg",
        "border border-slate-200/90 p-3 transition-colors",
        "hover:border-blue-200 hover:bg-blue-50/40",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-[#172B45]">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-4 text-slate-500">
          {description}
        </span>
      </span>

      <ArrowRight
        size={15}
        className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700"
      />
    </Link>
  );
}