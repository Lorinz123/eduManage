
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  LoaderCircle,
  GraduationCap,
} from "lucide-react";
import {
  ApiError,
  studentsApi,
  type EnrollmentStatus,
  type StudentPayload,
} from "@/services/api";

type FormValues = {
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  program: string;
  department: string;
  year_level: string;
  section: string;
  enrollment_status: EnrollmentStatus;
};

const emptyForm: FormValues = {
  student_number: "",
  first_name: "",
  last_name: "",
  email: "",
  program: "",
  department: "",
  year_level: "1",
  section: "",
  enrollment_status: "active",
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100";

const labelClass = "block text-sm font-medium text-slate-700";

export default function StudentFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { studentRecordId } = useParams();

  const isEditing = Boolean(studentRecordId);
  const studentId = Number(studentRecordId);
  const invalidStudentId =
    isEditing && (!Number.isInteger(studentId) || studentId < 1);

  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initializedStudentId, setInitializedStudentId] = useState<number | null>(
    null,
  );

  const studentQuery = useQuery({
    queryKey: ["students", "detail", studentId],
    queryFn: ({ signal }) => studentsApi.get(studentId, signal),
    enabled: isEditing && !invalidStudentId,
    retry: false,
  });

  const loadedStudent = studentQuery.data?.data;

  // Adjust the form when a different record is loaded.
  // This conditional render-state adjustment avoids an effect-based setState.
  if (
    isEditing &&
    loadedStudent &&
    initializedStudentId !== studentId
  ) {
    setInitializedStudentId(studentId);
    setForm({
      student_number: loadedStudent.student_number ?? "",
      first_name: loadedStudent.first_name ?? "",
      last_name: loadedStudent.last_name ?? "",
      email: loadedStudent.email ?? "",
      program: loadedStudent.program ?? "",
      department: loadedStudent.department ?? "",
      year_level: String(loadedStudent.year_level ?? 1),
      section: loadedStudent.section ?? "",
      enrollment_status: loadedStudent.enrollment_status ?? "active",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: StudentPayload) => {
      if (isEditing) {
        return studentsApi.update(studentId, payload);
      }

      return studentsApi.create(payload);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      const savedStudentId = response.data.id;
      await queryClient.invalidateQueries({
        queryKey: ["students", "detail", savedStudentId],
      });

      navigate(`/students/${savedStudentId}`);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.details) {
        const details = err.details as {
          errors?: Record<string, string[]>;
        };

        if (details.errors) {
          const mapped: Record<string, string> = {};

          for (const [key, messages] of Object.entries(details.errors)) {
            if (messages.length > 0) {
              mapped[key] = messages[0];
            }
          }

          setFieldErrors(mapped);
        }
      }

      setSubmitError(err.message || "Unable to save this student. Please try again.");
    },
  });

  const loading = isEditing && studentQuery.isPending;
  const saving = saveMutation.isPending;

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));

    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

    setSubmitError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    if (invalidStudentId) {
      setSubmitError("The student ID in this URL is invalid.");
      return;
    }

    if (isEditing && !loadedStudent) {
      setSubmitError("The student record has not loaded yet.");
      return;
    }

    const payload: StudentPayload = {
      student_number: form.student_number.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      program: form.program.trim(),
      department: form.department.trim(),
      year_level: Number(form.year_level),
      section: form.section.trim() || null,
      enrollment_status: form.enrollment_status,
    };

    if (
      !payload.student_number ||
      !payload.first_name ||
      !payload.last_name ||
      !payload.program ||
      !payload.department
    ) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    if (
      !Number.isInteger(payload.year_level) ||
      payload.year_level < 1 ||
      payload.year_level > 6
    ) {
      setFieldErrors({
        year_level: "Choose a valid year level.",
      });
      return;
    }

    saveMutation.mutate(payload);
  }

  function fieldError(name: string) {
    return fieldErrors[name] ? (
      <p className="mt-1 text-xs text-rose-600">{fieldErrors[name]}</p>
    ) : null;
  }

  if (invalidStudentId) {
    return (
      <main className="min-h-[60vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle size={21} />
            <h1 className="text-xl font-bold">Invalid student ID</h1>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            The student ID in this URL is invalid. Return to the directory
            and select a student record.
          </p>

          <button
            type="button"
            onClick={() => navigate("/students")}
            className="mt-5 min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Back to directory
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <LoaderCircle className="animate-spin text-blue-700" size={22} />
          Loading student record…
        </div>
      </main>
    );
  }

  if (isEditing && studentQuery.isError) {
    return (
      <main className="min-h-[60vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle size={21} />
            <h1 className="text-xl font-bold">Unable to load student</h1>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {studentQuery.error instanceof Error
              ? studentQuery.error.message
              : "Unable to load this student record."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/students")}
            className="mt-5 min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Back to directory
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(isEditing ? `/students/${studentId}` : "/students")
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          {isEditing ? "Back to student profile" : "Back to directory"}
        </button>

        <header>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
            <GraduationCap size={18} />
            Academic administration
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isEditing ? "Edit student record" : "Register a student"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isEditing
              ? "Update the student's academic and enrollment information."
              : "Enter the student's information to create a new college record."}
          </p>
        </header>

        {submitError && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4 sm:px-7">
            <h2 className="font-semibold">Student information</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields marked with * are required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
            <label className={labelClass}>
              Student number *
              <input
                className={inputClass}
                value={form.student_number}
                onChange={(e) => updateField("student_number", e.target.value)}
                placeholder="e.g. 2026-0001"
                required
                disabled={saving}
                autoComplete="off"
              />
              {fieldError("student_number")}
            </label>

            <label className={labelClass}>
              Email address
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="student@example.com"
                disabled={saving}
                autoComplete="email"
              />
              {fieldError("email")}
            </label>

            <label className={labelClass}>
              First name *
              <input
                className={inputClass}
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="Enter first name"
                required
                disabled={saving}
                autoComplete="given-name"
              />
              {fieldError("first_name")}
            </label>

            <label className={labelClass}>
              Last name *
              <input
                className={inputClass}
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Enter last name"
                required
                disabled={saving}
                autoComplete="family-name"
              />
              {fieldError("last_name")}
            </label>

            <label className={labelClass}>
              Program *
              <input
                className={inputClass}
                value={form.program}
                onChange={(e) => updateField("program", e.target.value)}
                placeholder="e.g. BS Information Technology"
                required
                disabled={saving}
              />
              {fieldError("program")}
            </label>

            <label className={labelClass}>
              Department *
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="Enter department"
                required
                disabled={saving}
              />
              {fieldError("department")}
            </label>

            <label className={labelClass}>
              Year level *
              <select
                className={inputClass}
                value={form.year_level}
                onChange={(e) => updateField("year_level", e.target.value)}
                required
                disabled={saving}
              >
                <option value="1">1st year</option>
                <option value="2">2nd year</option>
                <option value="3">3rd year</option>
                <option value="4">4th year</option>
                <option value="5">5th year</option>
                <option value="6">6th year</option>
              </select>
              {fieldError("year_level")}
            </label>

            <label className={labelClass}>
              Section
              <input
                className={inputClass}
                value={form.section}
                onChange={(e) => updateField("section", e.target.value)}
                placeholder="e.g. A"
                disabled={saving}
              />
              {fieldError("section")}
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Enrollment status *
              <select
                className={inputClass}
                value={form.enrollment_status}
                onChange={(e) =>
                  updateField(
                    "enrollment_status",
                    e.target.value as EnrollmentStatus,
                  )
                }
                required
                disabled={saving}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
                <option value="archived">Archived</option>
              </select>
              {fieldError("enrollment_status")}
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={() =>
                navigate(isEditing ? `/students/${studentId}` : "/students")
              }
              disabled={saving}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || (isEditing && !loadedStudent)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {saving
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create student"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
