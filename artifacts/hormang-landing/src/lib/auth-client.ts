/* ─── Types ─────────────────────────────────────────────────────────────── */

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

/* ─── Storage Keys ──────────────────────────────────────────────────────── */

const TOKEN_KEY = "hormang_access_token";
const USERS_KEY = "hormang_auth_users";
const PROFILES_KEY = "hormang_auth_provider_profiles";
const OTP_KEY = "hormang_auth_otp_store";

/* ─── Token helpers (centralized, exported) ─────────────────────────────── */

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/* ─── Generic localStorage helpers ─────────────────────────────────────── */

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, val: T): void {
  localStorage.setItem(key, JSON.stringify(val));
}

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ─── Phone normalisation ───────────────────────────────────────────────── */

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

/* ─── User store ────────────────────────────────────────────────────────── */

function readUsers(): SafeUser[] {
  return readLS<SafeUser[]>(USERS_KEY, []);
}

function writeUsers(users: SafeUser[]): void {
  writeLS(USERS_KEY, users);
}

function findByPhone(phone: string): SafeUser | undefined {
  const n = normalizePhone(phone);
  return readUsers().find((u) => normalizePhone(u.phone ?? "") === n);
}

function findById(id: string): SafeUser | undefined {
  return readUsers().find((u) => u.id === id);
}

function upsertUser(user: SafeUser): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  writeUsers(users);
}

/* ─── Provider-profile store ────────────────────────────────────────────── */

function readProfiles(): ProviderProfile[] {
  return readLS<ProviderProfile[]>(PROFILES_KEY, []);
}

function writeProfiles(profiles: ProviderProfile[]): void {
  writeLS(PROFILES_KEY, profiles);
}

function findProfile(userId: string): ProviderProfile | null {
  return readProfiles().find((p) => p.userId === userId) ?? null;
}

/* ─── OTP store ─────────────────────────────────────────────────────────── */

interface OtpEntry {
  code: string;
  expiresAt: number;
  purpose: string;
}

function readOtpStore(): Record<string, OtpEntry> {
  return readLS<Record<string, OtpEntry>>(OTP_KEY, {});
}

function storeOtp(phone: string, purpose: string): string {
  const code = Math.floor(100_000 + Math.random() * 900_000).toString();
  const store = readOtpStore();
  store[normalizePhone(phone)] = {
    code,
    expiresAt: Date.now() + 5 * 60 * 1_000,
    purpose,
  };
  writeLS(OTP_KEY, store);
  return code;
}

function verifyOtp(phone: string, code: string, purpose: string): boolean {
  const store = readOtpStore();
  const key = normalizePhone(phone);
  const entry = store[key];
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    delete store[key];
    writeLS(OTP_KEY, store);
    return false;
  }
  if (entry.purpose !== purpose || entry.code !== code) return false;
  delete store[key];
  writeLS(OTP_KEY, store);
  return true;
}

/* ─── SMS Verification ──────────────────────────────────────────────────── */

export async function sendSmsCode(
  phone: string,
  purpose: "register" | "login" | "migrate" | "add-phone",
): Promise<{ ok: boolean; devCode?: string }> {
  const normalized = normalizePhone(phone);

  if (purpose === "login") {
    const user = findByPhone(normalized);
    if (!user) throw new Error("Bu raqam ro'yxatdan o'tmagan");
  }

  if (purpose === "register") {
    const user = findByPhone(normalized);
    if (user) throw new Error("Bu raqam allaqachon ro'yxatdan o'tgan");
  }

  const code = storeOtp(normalized, purpose);
  return { ok: true, devCode: code };
}

/* ─── Registration ──────────────────────────────────────────────────────── */

export async function registerUser(body: {
  firstName: string;
  lastName: string;
  phone: string;
  otp: string;
  role: "buyer" | "provider";
}): Promise<AuthResponse> {
  const normalized = normalizePhone(body.phone);

  if (!verifyOtp(normalized, body.otp, "register")) {
    throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");
  }

  if (findByPhone(normalized)) {
    throw new Error("Bu raqam allaqachon ro'yxatdan o'tgan");
  }

  const user: SafeUser = {
    id: genId(),
    firstName: body.firstName,
    lastName: body.lastName,
    phone: normalized,
    role: body.role,
    createdAt: new Date().toISOString(),
  };

  upsertUser(user);
  setToken(user.id);

  return { user, accessToken: user.id, providerProfile: null };
}

/* ─── Save Provider Profile ─────────────────────────────────────────────── */

export async function saveProviderProfile(body: {
  categories: string[];
  bio?: string;
  preferredLocation?: string;
}): Promise<{ profile: ProviderProfile }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");

  const profiles = readProfiles();
  const existing = profiles.findIndex((p) => p.userId === token);

  if (existing >= 0) {
    profiles[existing] = {
      ...profiles[existing],
      categories: body.categories,
      bio: body.bio ?? profiles[existing].bio,
      preferredLocation: body.preferredLocation ?? profiles[existing].preferredLocation,
    };
    writeProfiles(profiles);
    return { profile: profiles[existing] };
  }

  const profile: ProviderProfile = {
    id: genId(),
    userId: token,
    categories: body.categories,
    bio: body.bio ?? null,
    preferredLocation: body.preferredLocation ?? null,
    isVerified: false,
  };
  profiles.push(profile);
  writeProfiles(profiles);
  return { profile };
}

/* ─── Login ─────────────────────────────────────────────────────────────── */

export async function loginUser(body: {
  phone: string;
  otp: string;
}): Promise<AuthResponse> {
  const normalized = normalizePhone(body.phone);

  if (!verifyOtp(normalized, body.otp, "login")) {
    throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");
  }

  const user = findByPhone(normalized);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  setToken(user.id);

  const providerProfile = user.role === "provider" ? findProfile(user.id) : null;
  return { user, accessToken: user.id, providerProfile };
}

/* ─── Account Migration ─────────────────────────────────────────────────── */

export async function migrateAccount(body: {
  email: string;
  password: string;
  phone: string;
  otp: string;
}): Promise<AuthResponse> {
  const normalized = normalizePhone(body.phone);

  if (!verifyOtp(normalized, body.otp, "migrate")) {
    throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");
  }

  const existing = findByPhone(normalized);
  if (existing) {
    setToken(existing.id);
    return { user: existing, accessToken: existing.id };
  }

  const user: SafeUser = {
    id: genId(),
    firstName: body.email.split("@")[0] ?? "Foydalanuvchi",
    lastName: "",
    phone: normalized,
    email: body.email,
    role: "buyer",
    createdAt: new Date().toISOString(),
  };
  upsertUser(user);
  setToken(user.id);
  return { user, accessToken: user.id };
}

/* ─── Add phone to existing account ────────────────────────────────────── */

export async function addPhone(body: {
  phone: string;
  otp: string;
}): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");

  const normalized = normalizePhone(body.phone);

  if (!verifyOtp(normalized, body.otp, "add-phone")) {
    throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");
  }

  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const conflict = findByPhone(normalized);
  if (conflict && conflict.id !== user.id) {
    throw new Error("Bu raqam boshqa hisob bilan bog'liq");
  }

  const updated: SafeUser = { ...user, phone: normalized };
  upsertUser(updated);
  return { user: updated };
}

/* ─── Session ───────────────────────────────────────────────────────────── */

export async function logoutUser(): Promise<void> {
  clearToken();
}

export async function getMe(): Promise<{
  user: SafeUser;
  providerProfile: ProviderProfile | null;
}> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");

  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const providerProfile = user.role === "provider" ? findProfile(user.id) : null;
  return { user, providerProfile };
}

export async function refreshToken(): Promise<string | null> {
  return getToken();
}

/* ─── Profile Updates ───────────────────────────────────────────────────── */

export async function updateProfile(body: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");

  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const updated: SafeUser = {
    ...user,
    ...(body.firstName !== undefined && { firstName: body.firstName }),
    ...(body.lastName !== undefined && { lastName: body.lastName }),
    ...(body.email !== undefined && { email: body.email || null }),
  };
  upsertUser(updated);
  return { user: updated };
}

export async function updateProviderProfile(body: {
  categories?: string[];
  bio?: string;
  preferredLocation?: string;
}): Promise<{ profile: ProviderProfile }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");

  const profiles = readProfiles();
  const existing = profiles.findIndex((p) => p.userId === token);

  if (existing >= 0) {
    if (body.categories !== undefined) profiles[existing].categories = body.categories;
    if (body.bio !== undefined) profiles[existing].bio = body.bio ?? null;
    if (body.preferredLocation !== undefined)
      profiles[existing].preferredLocation = body.preferredLocation ?? null;
    writeProfiles(profiles);
    return { profile: profiles[existing] };
  }

  const profile: ProviderProfile = {
    id: genId(),
    userId: token,
    categories: body.categories ?? [],
    bio: body.bio ?? null,
    preferredLocation: body.preferredLocation ?? null,
    isVerified: false,
  };
  profiles.push(profile);
  writeProfiles(profiles);
  return { profile };
}

export async function getProviderPublicProfile(id: string): Promise<{
  user: SafeUser;
  providerProfile: ProviderProfile | null;
}> {
  const user = findById(id);
  if (!user || user.role !== "provider") throw new Error("Ijrochi topilmadi");
  const providerProfile = findProfile(id);
  return { user, providerProfile };
}
