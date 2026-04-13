const API_BASE = "/api";

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role: "buyer" | "provider";
  createdAt: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  categories: string[];
  bio?: string | null;
  preferredLocation?: string | null;
  isVerified: boolean;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  providerProfile?: ProviderProfile | null;
}

function getToken() {
  return localStorage.getItem("hormang_access_token");
}
function setToken(t: string) {
  localStorage.setItem("hormang_access_token", t);
}
function clearToken() {
  localStorage.removeItem("hormang_access_token");
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi");
  return data as T;
}

// ─── SMS Verification ──────────────────────────────────────────────────────

export async function sendSmsCode(
  phone: string,
  purpose: "register" | "login" | "migrate" | "add-phone",
): Promise<{ ok: boolean; devCode?: string }> {
  return request("/auth/sms/send", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  });
}

// ─── Registration (phone + OTP) ────────────────────────────────────────────

export async function registerUser(body: {
  firstName: string;
  lastName: string;
  phone: string;
  otp: string;
  role: "buyer" | "provider";
}): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(data.accessToken);
  return data;
}

export async function saveProviderProfile(body: {
  categories: string[];
  bio?: string;
  preferredLocation?: string;
}): Promise<{ profile: ProviderProfile }> {
  return request("/auth/register/provider-profile", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── Login (phone + OTP) ───────────────────────────────────────────────────

export async function loginUser(body: {
  phone: string;
  otp: string;
}): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(data.accessToken);
  return data;
}

// ─── Account Migration (email+password → add phone) ───────────────────────

export async function migrateAccount(body: {
  email: string;
  password: string;
  phone: string;
  otp: string;
}): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/auth/migrate-account", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(data.accessToken);
  return data;
}

// ─── Add phone to existing logged-in account ──────────────────────────────

export async function addPhone(body: {
  phone: string;
  otp: string;
}): Promise<{ user: SafeUser }> {
  return request("/auth/add-phone", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ─── Session ───────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
  clearToken();
}

export async function getMe(): Promise<{ user: SafeUser; providerProfile: ProviderProfile | null }> {
  return request("/auth/me");
}

export async function refreshToken(): Promise<string | null> {
  try {
    const data = await request<{ accessToken: string }>("/auth/refresh", { method: "POST" });
    setToken(data.accessToken);
    return data.accessToken;
  } catch {
    clearToken();
    return null;
  }
}

// ─── Profile Updates ───────────────────────────────────────────────────────

export async function updateProfile(body: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<{ user: SafeUser }> {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function updateProviderProfile(body: {
  categories?: string[];
  bio?: string;
  preferredLocation?: string;
}): Promise<{ profile: ProviderProfile }> {
  return request("/auth/provider-profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getProviderPublicProfile(id: string): Promise<{
  user: SafeUser;
  providerProfile: ProviderProfile | null;
}> {
  return request(`/auth/providers/${id}`);
}
