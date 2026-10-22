
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Mail,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import Button from "@/components/common/Button";
import {
  ApiError,
  studentsApi,
  type CollegeStudent,
  type EnrollmentStatus,
} from "@/services/api";

const STATUS_STYLES: Record<
  EnrollmentStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700 ring-green-200",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
  },
  transferred: {
    label: "Transferred",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  archived: {
    label: "Archived",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
};

function getFullName(student: CollegeStudent) {
  return `${student.first_name} ${student.last_name}`.trim();
}

function getInitials(student: CollegeStudent) {
  const first = student.first_name?.trim().charAt(0) ?? "";
  const last = student.last_name?.trim().charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "ST";
}

function formatDate(date?: string) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-blue-100 hover:bg-blue-50/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-800">
          {value !== undefined && value !== null && String(value).trim()
            ? value
            : "Not provided"}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof UserRound;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-2 truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-gray-500">{description}</p>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-gray-50/80">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <RefreshCw className="animate-spin" size={22} />
        </div>

        <p className="text-sm font-medium text-gray-600">
          Loading student profile...
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center bg-gray-50/80 px-4">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <XCircle size={27} />
        </div>

        <h2 className="mt-5 text-lg font-bold text-gray-900">
          Unable to load student
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onRetry}
            leftIcon={<RefreshCw size={16} />}
          >
            Try again
          </Button>

          <Link
            to="/students"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Student directory
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { studentId: studentIdParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const studentId =
    studentIdParam && /^\d+$/.test(studentIdParam)
      ? Number(studentIdParam)
      : null;

  const studentQuery = useQuery({
    queryKey: ["students", "detail", studentId],
    queryFn: async ({ signal }) => {
      if (studentId === null) {
        throw new Error("The student ID in the URL is invalid.");
      }

      return studentsApi.get(studentId, signal);
    },
    enabled: studentId !== null,
    retry: false,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => studentsApi.archive(id),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["students"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["students", "detail", studentId],
        }),
      ]);
    },
  });

  // Permanently delete a student through the Laravel API.
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentsApi.delete(id),

    onSuccess: async () => {
      // Remove the deleted profile from the detail cache.
      queryClient.removeQueries({
        queryKey: ["students", "detail", studentId],
        exact: true,
      });

      // Refresh student lists, counts, and dashboard queries.
      await queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      // Navigate only after the server confirms successful deletion.
      navigate("/students");
    },
  });

  const student = studentQuery.data?.data;

  const isDeleting = deleteMutation.isPending;
  const isArchiving = archiveMutation.isPending;
  const isBusy = isDeleting || isArchiving;



  const handleDelete = () => {
    if (!student || isBusy) return;

    const confirmed = window.confirm(
      `PERMANENTLY DELETE STUDENT?\n\n` +
        `Name: ${getFullName(student)}\n` +
        `Student Number: ${student.student_number}\n\n` +
        `This action will permanently delete this student record from the database. ` +
        `It cannot be undone.\n\n` +
        `Are you absolutely sure you want to continue?`,
    );

    if (confirmed) {
      deleteMutation.mutate(student.id);
    }
  };

  if (studentId === null) {
    return (
      <ErrorState
        message="The student ID in the URL is invalid. Return to the student directory and select a valid record."
        onRetry={() => navigate("/students")}
      />
    );
  }

  if (studentQuery.isPending) {
    return <PageLoading />;
  }

  if (studentQuery.isError || !student) {
    const error = studentQuery.error;

    const message =
      error instanceof ApiError
        ? error.status === 401
          ? "Your session may have expired. Please sign in again."
          : error.status === 404
            ? "This student record could not be found. It may have been removed or the ID may be incorrect."
            : error.message
        : error instanceof Error
          ? error.message
          : "Something went wrong while retrieving the student record.";

    return (
      <ErrorState
        message={message}
        onRetry={() => {
          void studentQuery.refetch();
        }}
      />
    );
  }

  const status = STATUS_STYLES[student.enrollment_status] ?? {
    label: student.enrollment_status,
    className: "bg-gray-100 text-gray-600 ring-gray-200",
  };

 

  return (
    <div className="min-h-screen bg-gray-50/80 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500"
        >
          <Link
            to="/students"
            className="transition-colors hover:text-blue-600"
          >
            Students
          </Link>

          <ChevronRight size={15} className="text-gray-400" />

          <span className="font-medium text-gray-800">
            Student profile
          </span>
        </nav>

        {/* Page heading */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Student Profile
            </h1>

            <p className="mt-1.5 text-sm leading-6 text-gray-500">
              View personal information, academic details, and enrollment
              status.
            </p>
          </div>

          <Link
            to="/students"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Students
          </Link>
        </div>

        {/* Student identity card */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-1.5 bg-blue-600" />

          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 sm:h-24 sm:w-24 sm:text-3xl">
                  {getInitials(student)}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {status.label}
                    </span>

                    <span className="text-xs font-medium text-gray-400">
                      Student ID: {student.id}
                    </span>
                  </div>

                  <h2 className="break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    {getFullName(student)}
                  </h2>

                  <p className="mt-1.5 break-all text-sm text-gray-500">
                    {student.email || "No email address provided"}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-blue-700">
                    {student.student_number}
                  </p>
                </div>
              </div>

              {/* Profile actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:shrink-0">
                <Link to={`/students/${student.id}/edit`} className="inline-flex">
  <Button
    type="button"
    variant="primary"
    size="lg"
    leftIcon={<Pencil size={16} />}
  >
    Edit Student
  </Button>
</Link>


                <Button
                  type="button"
                  variant="danger"
                  size="lg"
                  onClick={handleDelete}
                  disabled={isBusy}
                  loading={isDeleting}
                  leftIcon={!isDeleting ? <Trash2 size={16} /> : undefined}
                  
                >
                  {isDeleting ? "Deleting..." : "Delete Student"}
                </Button>
              </div>
            </div>

            {/* Archive error */}
            {archiveMutation.isError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <p className="font-semibold">
                  Unable to archive this student.
                </p>

                <p className="mt-1">
                  {archiveMutation.error instanceof Error
                    ? archiveMutation.error.message
                    : "An unexpected error occurred. Please try again."}
                </p>
              </div>
            )}

            {/* Archive success */}
            {archiveMutation.isSuccess && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    Student archived successfully.
                  </p>

                  <p className="mt-1">
                    The record has been retained in the database with
                    Archived status.
                  </p>
                </div>
              </div>
            )}

            {/* Delete error */}
            {deleteMutation.isError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <div className="flex items-start gap-3">
                  <XCircle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-semibold">
                      Unable to delete this student.
                    </p>

                    <p className="mt-1 break-words">
                      {deleteMutation.error instanceof Error
                        ? deleteMutation.error.message
                        : "An unexpected error occurred. The record may still exist. Please try again."}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.reset()}
                      className="mt-3 text-red-700 underline underline-offset-2 hover:bg-red-100 hover:text-red-900"
                    >
                      Dismiss message
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Academic summary cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={GraduationCap}
            label="Program"
            value={student.program || "Not set"}
            description="Student's academic program"
          />

          <SummaryCard
            icon={BookOpen}
            label="Year Level"
            value={
              student.year_level
                ? `Year ${student.year_level}`
                : "Not set"
            }
            description="Current academic year level"
          />

          <SummaryCard
            icon={Users}
            label="Section"
            value={student.section || "Not assigned"}
            description="Assigned class section"
          />

          <SummaryCard
            icon={ShieldCheck}
            label="Enrollment"
            value={status.label}
            description="Current enrollment status"
          />
        </div>

        {/* Personal and academic details */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={20} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Personal Information
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Student identification and contact details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem
                icon={UserRound}
                label="First Name"
                value={student.first_name}
              />

              <DetailItem
                icon={UserRound}
                label="Last Name"
                value={student.last_name}
              />

              <DetailItem
                icon={ShieldCheck}
                label="Student Number"
                value={student.student_number}
              />

              <DetailItem
                icon={Mail}
                label="Email Address"
                value={student.email}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <GraduationCap size={21} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Academic Information
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Program placement and enrollment details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem
                icon={BookOpen}
                label="Program"
                value={student.program}
              />

              <DetailItem
                icon={GraduationCap}
                label="Department"
                value={student.department}
              />

              <DetailItem
                icon={Users}
                label="Year Level"
                value={student.year_level}
              />

              <DetailItem
                icon={Users}
                label="Section"
                value={student.section}
              />

              <DetailItem
                icon={ShieldCheck}
                label="Enrollment Status"
                value={status.label}
              />
            </div>
          </section>
        </div>

        {/* Record information */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={20} />
            </div>

            <div>
              <h3 className="font-bold text-gray-900">
                Record Information
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Record creation and latest update
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="flex items-start gap-3">
              <CalendarDays
                size={19}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Date Created
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatDate(student.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCw
                size={19}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatDate(student.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col gap-2 py-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Student Management System</p>
          <p>Student record #{student.id}</p>
        </div>
      </div>
    </div>
  );
}
