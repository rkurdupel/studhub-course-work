export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const ACCESS_TOKEN_KEY = "studhub.accessToken";
const REFRESH_TOKEN_KEY = "studhub.refreshToken";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export interface ApiProfile {
  email: string;
  full_name: string;
  course: string;
  specialization: string;
  funding_type: "budget" | "paid";
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface FinanceResponseBudget {
  funding_type: "budget";
  scholarship_amount: string;
  scholarship_status: string;
  next_funding_date: string;
}

export interface FinanceResponsePaid {
  funding_type: "paid";
  tuition_amount: string;
  current_debt: string;
  payment_deadline: string;
  payment_requisites: {
    receiver_name: string;
    iban: string;
    edrpou: string;
  };
}

export type FinanceResponse = FinanceResponseBudget | FinanceResponsePaid;

export interface SubjectMaterial {
  id: number;
  subject: string;
  title: string;
  file_url: string;
  file_size: number;
  original_filename: string;
  uploaded_at: string;
}

export interface Subject {
  slug: string;
  name: string;
  sort_order: number;
}

export interface ChatGroup {
  id: number;
  code: string;
  display_name: string;
  group_type: string;
  is_read_only: boolean;
  participant_id: number | null;
  participant_email: string | null;
  participant_name: string | null;
  participant_course: string | null;
  participant_specialization: string | null;
}

export interface ChatUser {
  id: number;
  email: string;
  name: string;
  full_name: string;
  course: string;
  specialization: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender_email: string | null;
  sender_name: string | null;
  image_url: string | null;
  is_system: boolean;
  created_at: string;
}

function getUrl(path: string) {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  hasRetried = false
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(getUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (
    response.status === 401 &&
    !hasRetried &&
    path !== "/api/auth/token/" &&
    path !== "/api/auth/token/refresh/"
  ) {
    const storedRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      try {
        const refreshed = await refreshTokenRequest(storedRefreshToken);
        window.localStorage.setItem(ACCESS_TOKEN_KEY, refreshed.access);
        return request<T>(
          path,
          {
            ...options,
            token: refreshed.access,
          },
          true
        );
      } catch {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export async function downloadFile(token: string, path: string, filename: string) {
  const response = await fetch(getUrl(path), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export function fetchProfile(token: string) {
  return request<ApiProfile>("/api/auth/me/", { method: "GET", token });
}

export function loginRequest(email: string, password: string) {
  return request<AuthTokens>("/api/auth/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshTokenRequest(refresh: string) {
  return request<{ access: string }>("/api/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export function registerRequest(payload: Record<string, unknown>) {
  return request("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchFinance(token: string) {
  return request<FinanceResponse>("/api/finance/", { method: "GET", token });
}

export function fetchSubjectMaterials(token: string, slug: string) {
  return request<SubjectMaterial[]>(`/api/subjects/${slug}/materials/`, { method: "GET", token });
}

export function fetchSubjects(token: string) {
  return request<Subject[]>(`/api/subjects/`, { method: "GET", token });
}

export function getSubjectMaterialDownloadUrl(materialId: number) {
  return getUrl(`/api/subjects/materials/${materialId}/download/`);
}

export function askAssistant(token: string, message: string) {
  return request<{ response: string }>("/api/assistant/chat/", {
    method: "POST",
    token,
    body: JSON.stringify({ message }),
  });
}

export function fetchChatGroups(token: string) {
  return request<ChatGroup[]>("/api/chat/groups/", { method: "GET", token });
}

export function fetchChatUsers(token: string) {
  return request<ChatUser[]>("/api/chat/users/", { method: "GET", token });
}

export function createDirectChat(token: string, participantId: number) {
  return request<ChatGroup>("/api/chat/direct/", {
    method: "POST",
    token,
    body: JSON.stringify({ participant_id: participantId }),
  });
}

export function fetchChatMessages(token: string, groupId: string) {
  return request<ChatMessage[]>(`/api/chat/groups/${groupId}/messages/`, { method: "GET", token });
}

export function postChatMessage(token: string, groupId: string, text: string) {
  return request<ChatMessage>(`/api/chat/groups/${groupId}/messages/`, {
    method: "POST",
    token,
    body: JSON.stringify({ text }),
  });
}

export function postChatMessageWithImage(token: string, groupId: string, text: string, image: File) {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("image", image);
  return request<ChatMessage>(`/api/chat/groups/${groupId}/messages/`, {
    method: "POST",
    token,
    body: formData,
  });
}

export function buildMediaUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}
