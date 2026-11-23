
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  LoaderCircle,
  GraduationCap,
  UserRound,
  BookOpen,
  IdCard,
  CircleCheck,
  Info,
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

  function fieldInputClass(name: string) {
    return `${inputClass} ${fieldErrors[name] ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : ""}`;
  }

  if (invalidStudentId) {
    return (
      <section className="min-h-[60vh] rounded-2xl bg-slate-50 p-6">
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
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center rounded-2xl bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <LoaderCircle className="animate-spin text-blue-700" size={22} />
          Loading student record…
        </div>
      </section>
    );
  }

  if (isEditing && studentQuery.isError) {
    return (
      <section className="min-h-[60vh] rounded-2xl bg-slate-50 p-6">
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
      </section>
    );
  }

  return (
    <section className="min-w-0 px-0 py-1 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(isEditing ? `/students/${studentId}` : "/students")
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          {isEditing ? "Back to student profile" : "Back to directory"}
        </button>

        <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
              <GraduationCap size={15} /> Student records
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {isEditing ? "Edit student record" : "Register a student"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isEditing
                ? "Update the student's personal details and academic placement."
                : "Add a student to your academic records. You can update these details later."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="size-2 rounded-full bg-rose-400" /> Required fields
          </div>
        </header>

        {submitError && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,34,59,0.06)]"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-700/20">
              <IdCard size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Student record</h2>
              <p className="mt-0.5 text-xs text-slate-500">Personal details and academic placement</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-7 p-5 sm:p-7">
            <section aria-labelledby="personal-details-heading">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><UserRound size={17} /></div>
                <div><h3 id="personal-details-heading" className="text-sm font-semibold text-slate-900">Personal details</h3><p className="mt-0.5 text-xs text-slate-500">Use the student's official information.</p></div>
              </div>
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <label className={labelClass}>First name <span className="text-rose-500">*</span>
                  <input className={fieldInputClass("first_name")} aria-invalid={Boolean(fieldErrors.first_name)} value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="Enter first name" required disabled={saving} autoComplete="given-name" />
                  {fieldError("first_name")}
                </label>
                <label className={labelClass}>Last name <span className="text-rose-500">*</span>
                  <input className={fieldInputClass("last_name")} aria-invalid={Boolean(fieldErrors.last_name)} value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Enter last name" required disabled={saving} autoComplete="family-name" />
                  {fieldError("last_name")}
                </label>
                <label className={labelClass}>Student number <span className="text-rose-500">*</span>
                  <input className={fieldInputClass("student_number")} aria-invalid={Boolean(fieldErrors.student_number)} value={form.student_number} onChange={(e) => updateField("student_number", e.target.value)} placeholder="e.g. 2026-0001" required disabled={saving} autoComplete="off" />
                  {fieldError("student_number")}
                </label>
                <label className={labelClass}>Email address <span className="ml-1 text-xs font-normal text-slate-400">Optional</span>
                  <input className={fieldInputClass("email")} aria-invalid={Boolean(fieldErrors.email)} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="student@example.com" disabled={saving} autoComplete="email" />
                  {fieldError("email")}
                </label>
              </div>
            </section>

            <section aria-labelledby="academic-details-heading" className="border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><BookOpen size={17} /></div>
                <div><h3 id="academic-details-heading" className="text-sm font-semibold text-slate-900">Academic placement</h3><p className="mt-0.5 text-xs text-slate-500">Set the student's program, year, and section.</p></div>
              </div>
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <label className={labelClass}>Program <span className="text-rose-500">*</span>
                  <input className={fieldInputClass("program")} aria-invalid={Boolean(fieldErrors.program)} value={form.program} onChange={(e) => updateField("program", e.target.value)} placeholder="e.g. BS Information Technology" required disabled={saving} />
                  {fieldError("program")}
                </label>
                <label className={labelClass}>Department <span className="text-rose-500">*</span>
                  <input className={fieldInputClass("department")} aria-invalid={Boolean(fieldErrors.department)} value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Enter department" required disabled={saving} />
                  {fieldError("department")}
                </label>
                <label className={labelClass}>Year level <span className="text-rose-500">*</span>
                  <select className={fieldInputClass("year_level")} aria-invalid={Boolean(fieldErrors.year_level)} value={form.year_level} onChange={(e) => updateField("year_level", e.target.value)} required disabled={saving}>
                    <option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option><option value="5">5th year</option><option value="6">6th year</option>
                  </select>
                  {fieldError("year_level")}
                </label>
                <label className={labelClass}>Section <span className="ml-1 text-xs font-normal text-slate-400">Optional</span>
                  <input className={fieldInputClass("section")} aria-invalid={Boolean(fieldErrors.section)} value={form.section} onChange={(e) => updateField("section", e.target.value)} placeholder="e.g. A" disabled={saving} />
                  {fieldError("section")}
                </label>
                <label className={`${labelClass} sm:col-span-2`}>Enrollment status <span className="text-rose-500">*</span>
                  <select className={fieldInputClass("enrollment_status")} aria-invalid={Boolean(fieldErrors.enrollment_status)} value={form.enrollment_status} onChange={(e) => updateField("enrollment_status", e.target.value as EnrollmentStatus)} required disabled={saving}>
                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option><option value="archived">Archived</option>
                  </select>
                  {fieldError("enrollment_status")}
                </label>
              </div>
            </section>
          </div>

          <aside className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CircleCheck size={17} className="text-blue-700" /> Record preview</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Your entry updates as you fill out the form.</p>
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                {(form.first_name.trim()[0] ?? "S") + (form.last_name.trim()[0] ?? "")}
              </div>
              <p className="mt-3 break-words text-sm font-semibold text-slate-900">{[form.first_name.trim(), form.last_name.trim()].filter(Boolean).join(" ") || "Student name"}</p>
              <p className="mt-1 break-all text-xs text-slate-500">{form.student_number || "Student number"}</p>
              <div className="my-4 border-t border-slate-100" />
              <p className="text-xs font-medium text-slate-500">Program</p>
              <p className="mt-1 break-words text-sm font-medium text-slate-800">{form.program || "Not selected"}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">Placement</p>
              <p className="mt-1 text-sm font-medium text-slate-800">Year {form.year_level}{form.section.trim() ? ` · Section ${form.section.trim()}` : " · No section"}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500" /> {form.enrollment_status}
              </span>
            </div>
            <div className="mt-4 flex gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-900">
              <Info size={15} className="mt-0.5 shrink-0" /> Check the student number and spelling before saving.
            </div>
          </aside>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-slate-400">Your changes are saved when you select {isEditing ? "Save changes" : "Create student"}.</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
          </div>
        </form>
      </div>
    </section>
  );
}
