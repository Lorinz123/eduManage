<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CollegeStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CollegeStudentController extends Controller
{
    /**
     * List, search, filter, and paginate students.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'program' => ['sometimes', 'nullable', 'string', 'max:255'],
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
            'year_level' => ['sometimes', 'nullable', 'integer', 'between:1,6'],
            'enrollment_status' => [
                'sometimes',
                'nullable',
                Rule::in(['active', 'inactive', 'transferred', 'archived']),
            ],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $query = CollegeStudent::query();

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('student_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        foreach (['program', 'department', 'year_level', 'enrollment_status'] as $field) {
            if (isset($validated[$field]) && $validated[$field] !== '') {
                $query->where($field, $validated[$field]);
            }
        }

        $students = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return response()->json($students);
    }

    /**
     * Create a student.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_number' => ['required', 'string', 'max:50', 'unique:college_students,student_number'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255', 'unique:college_students,email'],
            'program' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'year_level' => ['required', 'integer', 'between:1,6'],
            'section' => ['nullable', 'string', 'max:100'],
            'enrollment_status' => [
                'sometimes',
                Rule::in(['active', 'inactive', 'transferred', 'archived']),
            ],
        ]);

        $student = CollegeStudent::create($validated);

        return response()->json([
            'message' => 'Student created successfully.',
            'data' => $student,
        ], 201);
    }

    /**
     * Display a student.
     */
    public function show(string $id): JsonResponse
    {
        $student = CollegeStudent::findOrFail($id);

        return response()->json([
            'data' => $student,
        ]);
    }

    /**
     * Update a student.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $student = CollegeStudent::findOrFail($id);

        $validated = $request->validate([
            'student_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('college_students', 'student_number')->ignore($student->id),
            ],
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('college_students', 'email')->ignore($student->id),
            ],
            'program' => ['sometimes', 'required', 'string', 'max:255'],
            'department' => ['sometimes', 'required', 'string', 'max:255'],
            'year_level' => ['sometimes', 'required', 'integer', 'between:1,6'],
            'section' => ['sometimes', 'nullable', 'string', 'max:100'],
            'enrollment_status' => [
                'sometimes',
                Rule::in(['active', 'inactive', 'transferred', 'archived']),
            ],
        ]);

        $student->update($validated);

        return response()->json([
            'message' => 'Student updated successfully.',
            'data' => $student->fresh(),
        ]);
    }

    /**
     * Archive a student without deleting the record.
     */
    public function archive(string $id): JsonResponse
    {
        $student = CollegeStudent::findOrFail($id);

        if ($student->enrollment_status !== 'archived') {
            $student->update(['enrollment_status' => 'archived']);
        }

        return response()->json([
            'message' => 'Student archived successfully.',
            'data' => $student->fresh(),
        ]);
    }

    /**
     * Permanently delete a student.
     * Keep this separate from archiving.
     */
    public function destroy(string $id): JsonResponse
    {
        $student = CollegeStudent::findOrFail($id);
        $student->delete();

        return response()->json([
            'message' => 'Student permanently deleted.',
        ]);
    }
}
