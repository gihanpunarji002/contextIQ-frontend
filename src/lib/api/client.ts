import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 20000,
  withCredentials: true,
});
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error))
    return typeof error.response?.data?.detail === "string"
      ? error.response.data.detail
      : "Could not reach Zipzipy AI. Check that the backend and database are running.";
  return "Something went wrong. Please try again.";
}

// Fetch a fresh session-backed CSRF token before each mutation, including login/logout.
// This avoids stale tokens after Spring rotates them at authentication boundaries.
api.interceptors.request.use(async (config) => {
  if (
    ["post", "put", "patch", "delete"].includes(
      config.method?.toLowerCase() || "",
    )
  ) {
    const { data } = await api.get<{ token: string; headerName: string }>(
      "/auth/csrf",
    );
    config.headers.set(data.headerName, data.token);
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/")
    )
      window.dispatchEvent(new Event("Zipzipy AI:session-expired"));
    return Promise.reject(error);
  },
);
