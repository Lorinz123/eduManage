
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "sms_auth_token";

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  message?: string;
};

type LaravelMessageResponse = {
  message: string;
};

type LaravelResource<T> = {
  data: T;
};

export type EnrollmentStatus =
  | "active"
  | "inactive"
  | "transferred"
  | "archived";

export type CollegeStudent = {
  id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  program: string;
  department: string;
  year_level: number;
  section: string | null;
  enrollment_status: EnrollmentStatus;
  created_at?: string;
  updated_at?: string;
};

export type StudentPayload = Omit<
  CollegeStudent,
  "id" | "created_at" | "updated_at"
>;

export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/**
 * Authentication token helpers.
 */

function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveAuthToken(token: string): void {
  if (typeof window === "undefined") {
    throw new Error("Authentication requires a browser environment.");
  }

  window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Continue the local sign-out process.
  }
}

export const authToken = {
  get: getAuthToken,
  set: saveAuthToken,
  clear: clearAuthToken,
};

/**
 * Shared request handler.
 * Adds the Bearer token automatically when available.
 */

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = getAuthToken();

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      credentials: "include",
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      `Unable to connect to Laravel at ${API_BASE_URL}. Check that the server is running, the URL is correct, and CORS allows the frontend origin.`,
      0,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data: unknown;

  try {
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/**
 * Generic API methods.
 */

export const api = {
  get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return request<T>(endpoint, {
      method: "GET",
      signal,
    });
  },

  post<T>(endpoint: string, body: unknown = {}): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body,
    });
  },

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body,
    });
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, {
      method: "DELETE",
    });
  },
};

/**
 * Authentication endpoints.
 */

export const authApi = {
  register(payload: {
    first_name: string;
    last_name: string;
    name?: string;
    email: string;
    password: string;
    password_confirmation: string;
    invitation_code: string;
  }): Promise<AuthResponse> {
    return api.post<AuthResponse>("/register", payload);
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/login", payload);

    if (!response.token) {
      throw new ApiError(
        "The server did not return an authentication token.",
        500,
        response,
      );
    }

    authToken.set(response.token);

    return response;
  },

  async logout(): Promise<LaravelMessageResponse> {
    try {
      return await api.post<LaravelMessageResponse>("/logout", {});
    } finally {
      authToken.clear();
    }
  },

  logoutLocal(): void {
    authToken.clear();
  },

  me(): Promise<AuthUser> {
    return api.get<AuthUser>("/user");
  },

  changePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<LaravelMessageResponse> {
    return api.put<LaravelMessageResponse>("/profile/password", payload);
  },

  forgotPassword(payload: {
    email: string;
  }): Promise<LaravelMessageResponse> {
    return api.post<LaravelMessageResponse>(
      "/forgot-password",
      payload,
    );
  },
};

/**
 * Student endpoints.
 */

export const studentsApi = {
  list(
    params: {
      search?: string;
      status?: EnrollmentStatus;
      year_level?: number;
      program?: string;
      department?: string;
      page?: number;
      per_page?: number;
    } = {},
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<CollegeStudent>> {
    const query = new URLSearchParams();

    if (params.search?.trim()) {
      query.set("search", params.search.trim());
    }

    if (params.status) {
      query.set("enrollment_status", params.status);
    }

    if (params.year_level !== undefined) {
      query.set("year_level", String(params.year_level));
    }

    if (params.program) {
      query.set("program", params.program);
    }

    if (params.department) {
      query.set("department", params.department);
    }

    if (params.page !== undefined) {
      query.set("page", String(params.page));
    }

    if (params.per_page !== undefined) {
      query.set("per_page", String(params.per_page));
    }

    const suffix = query.size ? `?${query.toString()}` : "";

    return api.get<PaginatedResponse<CollegeStudent>>(
      `/students${suffix}`,
      signal,
    );
  },

  get(
    id: number,
    signal?: AbortSignal,
  ): Promise<LaravelResource<CollegeStudent>> {
    return api.get<LaravelResource<CollegeStudent>>(
      `/students/${id}`,
      signal,
    );
  },

  create(
    payload: StudentPayload,
  ): Promise<LaravelResource<CollegeStudent>> {
    return api.post<LaravelResource<CollegeStudent>>(
      "/students",
      payload,
    );
  },

  update(
    id: number,
    payload: Partial<StudentPayload>,
  ): Promise<LaravelResource<CollegeStudent>> {
    return api.put<LaravelResource<CollegeStudent>>(
      `/students/${id}`,
      payload,
    );
  },

  archive(id: number): Promise<LaravelMessageResponse> {
    return api.patch<LaravelMessageResponse>(
      `/students/${id}/archive`,
    );
  },

  // Permanently deletes a student record.
  delete(id: number): Promise<LaravelMessageResponse> {
    return api.delete<LaravelMessageResponse>(
      `/students/${id}`,
    );
  },
};

