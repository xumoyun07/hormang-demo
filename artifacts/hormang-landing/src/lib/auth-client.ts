/* ─── Types ─────────────────────────────────────────────────────────────── */

export type TwoFactorMethod = "sms" | "email";

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: TwoFactorMethod | null;
  twoFactorHint?: string | null;
  pendingEmail?: string | null;
  pendingPhone?: string | null;
  pendingDeleteRequest?: boolean;
  role: "buyer" | "provider";
  createdAt: string;
  deletedAt?: string | null;
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

export interface LoginChallenge {
  needs2FA: true;
  challengeId: string;
  hint?: string;
}

/* ─── Storage Keys ──────────────────────────────────────────────────────── */

const TOKEN_KEY = "hormang_access_token";
const USERS_KEY = "hormang_auth_users";
const PROFILES_KEY = "hormang_auth_provider_profiles";
const OTP_KEY = "hormang_auth_otp_store";
const PWD_KEY = "hormang_auth_password_hashes";
const CHALLENGE_KEY = "hormang_auth_2fa_challenges";
const TWOFA_CODE_KEY = "hormang_2fa_codes";

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

/* ─── Phone / email normalisation ──────────────────────────────────────── */

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ─── Password hashing (Web Crypto: PBKDF2-HMAC-SHA256) ────────────────── */

interface PasswordHash {
  algo: "pbkdf2-sha256";
  salt: string;
  iterations: number;
  hash: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

async function pbkdf2(password: string, saltBytes: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    256,
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<PasswordHash> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100_000;
  const hashBytes = await pbkdf2(password, saltBytes, iterations);
  return {
    algo: "pbkdf2-sha256",
    salt: bytesToBase64(saltBytes),
    iterations,
    hash: bytesToBase64(hashBytes),
  };
}

async function verifyPasswordHash(password: string, stored: PasswordHash): Promise<boolean> {
  const saltBytes = base64ToBytes(stored.salt);
  const candidate = await pbkdf2(password, saltBytes, stored.iterations);
  const expected = base64ToBytes(stored.hash);
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate[i] ^ expected[i];
  return diff === 0;
}

function readPasswordHashes(): Record<string, PasswordHash> {
  return readLS<Record<string, PasswordHash>>(PWD_KEY, {});
}
function writePasswordHash(userId: string, hash: PasswordHash): void {
  const all = readPasswordHashes();
  all[userId] = hash;
  writeLS(PWD_KEY, all);
}
function deletePasswordHash(userId: string): void {
  const all = readPasswordHashes();
  delete all[userId];
  writeLS(PWD_KEY, all);
}
function getPasswordHash(userId: string): PasswordHash | null {
  return readPasswordHashes()[userId] ?? null;
}

export function isStrongPassword(pw: string): boolean {
  return typeof pw === "string" && pw.length >= 8;
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
  return readUsers().find((u) => !u.deletedAt && normalizePhone(u.phone ?? "") === n);
}

function findByEmail(email: string): SafeUser | undefined {
  const n = normalizeEmail(email);
  return readUsers().find((u) => !u.deletedAt && normalizeEmail(u.email ?? "") === n);
}

function findById(id: string): SafeUser | undefined {
  return readUsers().find((u) => u.id === id && !u.deletedAt);
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

/** Public read-only accessor for the stored provider profile (no auth required). */
export function getStoredProviderProfile(userId: string): ProviderProfile | null {
  return findProfile(userId);
}

/* ─── OTP store (shared for SMS + email) ───────────────────────────────── */

interface OtpEntry {
  code: string;
  expiresAt: number;
  purpose: string;
  channel: "sms" | "email";
}

function readOtpStore(): Record<string, OtpEntry> {
  return readLS<Record<string, OtpEntry>>(OTP_KEY, {});
}

function makeOtpKey(channel: "sms" | "email", destination: string): string {
  return `${channel}:${channel === "sms" ? normalizePhone(destination) : normalizeEmail(destination)}`;
}

function storeOtp(channel: "sms" | "email", destination: string, purpose: string): string {
  const code = Math.floor(100_000 + Math.random() * 900_000).toString();
  const store = readOtpStore();
  store[makeOtpKey(channel, destination)] = {
    code,
    expiresAt: Date.now() + 5 * 60 * 1_000,
    purpose,
    channel,
  };
  writeLS(OTP_KEY, store);
  return code;
}

function verifyOtpEntry(channel: "sms" | "email", destination: string, code: string, purpose: string): boolean {
  const store = readOtpStore();
  const key = makeOtpKey(channel, destination);
  const entry = store[key];
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    delete store[key];
    writeLS(OTP_KEY, store);
    return false;
  }
  if (entry.purpose !== purpose || entry.channel !== channel || entry.code !== code) return false;
  delete store[key];
  writeLS(OTP_KEY, store);
  return true;
}

/* Backwards-compatible alias (legacy SMS-only verifyOtp signature). */
function verifyOtp(phone: string, code: string, purpose: string): boolean {
  return verifyOtpEntry("sms", phone, code, purpose);
}

/* ─── Reusable senders (swap with Twilio / SendGrid in production) ─────── */

export async function sendSmsCode(
  phone: string,
  purpose:
    | "register"
    | "login"
    | "migrate"
    | "add-phone"
    | "change-phone"
    | "delete-account"
    | "enable-2fa"
    | "login-2fa",
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

  if (purpose === "change-phone") {
    const user = findByPhone(normalized);
    if (user) throw new Error("Bu raqam allaqachon band");
  }

  const code = storeOtp("sms", normalized, purpose);
  return { ok: true, devCode: code };
}

export async function sendEmailCode(
  email: string,
  purpose:
    | "register-email"
    | "change-email"
    | "login-email-2fa",
): Promise<{ ok: boolean; devCode?: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) throw new Error("Noto'g'ri email manzil");

  if (purpose === "register-email" || purpose === "change-email") {
    const owner = findByEmail(normalized);
    const myId = getToken();
    if (owner && owner.id !== myId) throw new Error("Bu email allaqachon ro'yxatdan o'tgan");
  }

  const code = storeOtp("email", normalized, purpose);
  return { ok: true, devCode: code };
}

/* ─── Registration (phone + OTP) ───────────────────────────────────────── */

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
    emailVerified: false,
    twoFactorEnabled: false,
    twoFactorMethod: null,
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

/* ─── 2FA code store (user-defined static code + hint) ────────────────── */

interface TwoFAEntry { hash: PasswordHash; hint: string; }

function readTwoFACodes(): Record<string, TwoFAEntry> {
  return readLS<Record<string, TwoFAEntry>>(TWOFA_CODE_KEY, {});
}
function getTwoFAEntry(userId: string): TwoFAEntry | null {
  return readTwoFACodes()[userId] ?? null;
}
function setTwoFAEntry(userId: string, entry: TwoFAEntry): void {
  const all = readTwoFACodes();
  all[userId] = entry;
  writeLS(TWOFA_CODE_KEY, all);
}
function deleteTwoFAEntry(userId: string): void {
  const all = readTwoFACodes();
  delete all[userId];
  writeLS(TWOFA_CODE_KEY, all);
}

/* ─── 2FA challenge store ──────────────────────────────────────────────── */

interface ChallengeEntry {
  userId: string;
  method: TwoFactorMethod;
  destination: string;
  expiresAt: number;
}

function readChallenges(): Record<string, ChallengeEntry> {
  return readLS<Record<string, ChallengeEntry>>(CHALLENGE_KEY, {});
}
function storeChallenge(entry: ChallengeEntry): string {
  const id = genId();
  const all = readChallenges();
  all[id] = entry;
  writeLS(CHALLENGE_KEY, all);
  return id;
}
function consumeChallenge(id: string): ChallengeEntry | null {
  const all = readChallenges();
  const entry = all[id];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete all[id];
    writeLS(CHALLENGE_KEY, all);
    return null;
  }
  return entry;
}
function dropChallenge(id: string): void {
  const all = readChallenges();
  delete all[id];
  writeLS(CHALLENGE_KEY, all);
}

/* ─── Phone login (returns 2FA challenge if enabled) ───────────────────── */

export async function loginUser(body: {
  phone: string;
  otp: string;
}): Promise<AuthResponse | LoginChallenge> {
  const normalized = normalizePhone(body.phone);

  if (!verifyOtp(normalized, body.otp, "login")) {
    throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");
  }

  const user = findByPhone(normalized);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  if (user.twoFactorEnabled) {
    const challenge = await issue2FAChallenge(user);
    return challenge;
  }

  setToken(user.id);
  const providerProfile = user.role === "provider" ? findProfile(user.id) : null;
  return { user, accessToken: user.id, providerProfile };
}

/* ─── Email + password login ───────────────────────────────────────────── */

export async function loginWithEmail(body: {
  email: string;
  password: string;
}): Promise<AuthResponse | LoginChallenge> {
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) throw new Error("Noto'g'ri email manzil");

  const user = findByEmail(email);
  if (!user || !user.emailVerified) throw new Error("Email yoki parol noto'g'ri");

  const stored = getPasswordHash(user.id);
  if (!stored) throw new Error("Email yoki parol noto'g'ri");

  const ok = await verifyPasswordHash(body.password, stored);
  if (!ok) throw new Error("Email yoki parol noto'g'ri");

  if (user.twoFactorEnabled) {
    const challenge = await issue2FAChallenge(user);
    return challenge;
  }

  setToken(user.id);
  const providerProfile = user.role === "provider" ? findProfile(user.id) : null;
  return { user, accessToken: user.id, providerProfile };
}

async function issue2FAChallenge(user: SafeUser): Promise<LoginChallenge> {
  const challengeId = storeChallenge({
    userId: user.id,
    method: "sms",
    destination: "",
    expiresAt: Date.now() + 30 * 60 * 1_000,
  });
  return { needs2FA: true, challengeId, hint: user.twoFactorHint ?? undefined };
}

export async function verifyLogin2FA(body: {
  challengeId: string;
  otp: string;
}): Promise<AuthResponse> {
  const ch = consumeChallenge(body.challengeId);
  if (!ch) throw new Error("Sessiya muddati tugadi. Qayta kiring.");

  const user = findById(ch.userId);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const entry = getTwoFAEntry(user.id);
  if (!entry) throw new Error("2FA kodi topilmadi. Qayta sozlang.");

  const ok = await verifyPasswordHash(body.otp, entry.hash);
  if (!ok) throw new Error("2FA kodi noto'g'ri");

  dropChallenge(body.challengeId);
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
    email: normalizeEmail(body.email),
    emailVerified: false,
    twoFactorEnabled: false,
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

/* ─── Verify password (sensitive-action gate) ──────────────────────────── */

export async function verifyMyPassword(password: string): Promise<boolean> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const stored = getPasswordHash(token);
  if (!stored) throw new Error("Avval parol o'rnating");
  return verifyPasswordHash(password, stored);
}

/* ─── Email registration (logged-in user adds email + password) ────────── */

export async function startEmailRegistration(body: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{ devCode?: string }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  if (user.emailVerified) {
    throw new Error("Email allaqachon biriktirilgan. Email yoki parolni o'zgartirish uchun tegishli bo'limdan foydalaning.");
  }
  if (readPasswordHashes()[user.id]) {
    throw new Error("Parol allaqachon o'rnatilgan. Email biriktirish uchun parolingizni qayta kiriting.");
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) throw new Error("Noto'g'ri email manzil");
  if (!isStrongPassword(body.password)) throw new Error("Parol kamida 8 ta belgidan iborat bo'lsin");
  if (body.password !== body.confirmPassword) throw new Error("Parollar mos kelmadi");

  const owner = findByEmail(email);
  if (owner && owner.id !== user.id) throw new Error("Bu email allaqachon ro'yxatdan o'tgan");

  const pwHash = await hashPassword(body.password);
  const updated: SafeUser = {
    ...user,
    pendingEmail: email,
  };
  upsertUser(updated);
  writePasswordHash(`${user.id}__pending_email`, pwHash);

  return sendEmailCode(email, "register-email");
}

export async function cancelPendingEmail(): Promise<void> {
  const token = getToken();
  if (!token) return;
  const user = findById(token);
  if (!user) return;
  if (user.pendingEmail) {
    upsertUser({ ...user, pendingEmail: null });
    deletePasswordHash(`${user.id}__pending_email`);
  }
}

export async function cancelPendingPhone(): Promise<void> {
  const token = getToken();
  if (!token) return;
  const user = findById(token);
  if (!user) return;
  if (user.pendingPhone) {
    upsertUser({ ...user, pendingPhone: null });
  }
}

export async function verifyEmailRegistration(otp: string): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user || !user.pendingEmail) throw new Error("Email tasdiqlash so'rovi topilmadi");

  const ok = verifyOtpEntry("email", user.pendingEmail, otp, "register-email");
  if (!ok) throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");

  const pendingPwd = readPasswordHashes()[`${user.id}__pending_email`];
  if (!pendingPwd) throw new Error("Parol topilmadi. Qayta urinib ko'ring.");
  writePasswordHash(user.id, pendingPwd);
  deletePasswordHash(`${user.id}__pending_email`);

  const updated: SafeUser = {
    ...user,
    email: user.pendingEmail,
    emailVerified: true,
    pendingEmail: null,
  };
  upsertUser(updated);
  return { user: updated };
}

/* ─── Change email (password-gated, OTP confirmed) ─────────────────────── */

export async function startChangeEmail(body: {
  currentPassword: string;
  newEmail: string;
}): Promise<{ devCode?: string }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  if (!user.emailVerified) throw new Error("Avval email manzilingizni tasdiqlang");

  const ok = await verifyMyPassword(body.currentPassword);
  if (!ok) throw new Error("Parol noto'g'ri");

  const newEmail = normalizeEmail(body.newEmail);
  if (!isValidEmail(newEmail)) throw new Error("Noto'g'ri email manzil");
  if (newEmail === normalizeEmail(user.email ?? "")) throw new Error("Yangi email avvalgisi bilan bir xil");
  const owner = findByEmail(newEmail);
  if (owner && owner.id !== user.id) throw new Error("Bu email allaqachon ro'yxatdan o'tgan");

  upsertUser({ ...user, pendingEmail: newEmail });
  return sendEmailCode(newEmail, "change-email");
}

export async function verifyChangeEmail(otp: string): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user || !user.pendingEmail) throw new Error("Email o'zgartirish so'rovi topilmadi");

  const ok = verifyOtpEntry("email", user.pendingEmail, otp, "change-email");
  if (!ok) throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");

  const updated: SafeUser = {
    ...user,
    email: user.pendingEmail,
    emailVerified: true,
    pendingEmail: null,
  };
  upsertUser(updated);
  return { user: updated };
}

/* ─── Change phone (password-gated, SMS OTP) ───────────────────────────── */

export async function startChangePhone(body: {
  currentPassword: string;
  newPhone: string;
}): Promise<{ devCode?: string }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  if (!user.emailVerified) throw new Error("Telefon raqamni o'zgartirish uchun avval email tasdiqlang");

  const ok = await verifyMyPassword(body.currentPassword);
  if (!ok) throw new Error("Parol noto'g'ri");

  const newPhone = normalizePhone(body.newPhone);
  if (newPhone.replace(/\D/g, "").length < 9) throw new Error("Noto'g'ri telefon raqami");
  if (newPhone === normalizePhone(user.phone ?? "")) throw new Error("Yangi raqam avvalgisi bilan bir xil");
  const owner = findByPhone(newPhone);
  if (owner && owner.id !== user.id) throw new Error("Bu raqam allaqachon band");

  upsertUser({ ...user, pendingPhone: newPhone });
  return sendSmsCode(newPhone, "change-phone");
}

export async function verifyChangePhone(otp: string): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user || !user.pendingPhone) throw new Error("Telefon o'zgartirish so'rovi topilmadi");

  const ok = verifyOtpEntry("sms", user.pendingPhone, otp, "change-phone");
  if (!ok) throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");

  const updated: SafeUser = {
    ...user,
    phone: user.pendingPhone,
    pendingPhone: null,
  };
  upsertUser(updated);
  return { user: updated };
}

/* ─── 2FA setup / disable (user-defined code + hint) ───────────────────── */

export async function setup2FA(body: {
  currentPassword?: string;
  code: string;
  hint: string;
}): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  if (user.emailVerified) {
    if (!body.currentPassword) throw new Error("Identifikatsiya uchun parol talab qilinadi");
    const ok = await verifyMyPassword(body.currentPassword);
    if (!ok) throw new Error("Parol noto'g'ri");
  }

  const hash = await hashPassword(body.code);
  setTwoFAEntry(user.id, { hash, hint: body.hint });

  const updated: SafeUser = {
    ...user,
    twoFactorEnabled: true,
    twoFactorHint: body.hint || null,
  };
  upsertUser(updated);
  return { user: updated };
}

export async function disable2FA(currentPassword: string): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  if (user.emailVerified) {
    const ok = await verifyMyPassword(currentPassword);
    if (!ok) throw new Error("Parol noto'g'ri");
  }

  deleteTwoFAEntry(user.id);
  const updated: SafeUser = {
    ...user,
    twoFactorEnabled: false,
    twoFactorMethod: null,
    twoFactorHint: null,
  };
  upsertUser(updated);
  return { user: updated };
}

/* ─── Delete account (password + SMS OTP, soft-delete) ─────────────────── */

export async function startDeleteAccount(currentPassword: string): Promise<{ devCode?: string; destination: string }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const ok = await verifyMyPassword(currentPassword);
  if (!ok) throw new Error("Parol noto'g'ri");
  if (!user.phone) throw new Error("Tasdiqlash uchun telefon raqami kerak");

  upsertUser({ ...user, pendingDeleteRequest: true });
  const res = await sendSmsCode(user.phone, "delete-account");
  return { devCode: res.devCode, destination: user.phone };
}

export async function confirmDeleteAccount(otp: string): Promise<{ ok: true }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user || !user.pendingDeleteRequest || !user.phone) {
    throw new Error("O'chirish so'rovi topilmadi");
  }

  const ok = verifyOtpEntry("sms", user.phone, otp, "delete-account");
  if (!ok) throw new Error("Tasdiqlash kodi noto'g'ri yoki muddati o'tgan");

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = {
      ...users[idx],
      deletedAt: new Date().toISOString(),
      email: null,
      phone: null,
      pendingEmail: null,
      pendingPhone: null,
      pendingDeleteRequest: false,
      emailVerified: false,
      twoFactorEnabled: false,
      twoFactorMethod: null,
    };
    writeUsers(users);
  }
  deletePasswordHash(user.id);
  clearToken();
  return { ok: true };
}

export async function cancelDeleteAccount(): Promise<{ user: SafeUser }> {
  const token = getToken();
  if (!token) throw new Error("Avtorizatsiya talab qilinadi. Iltimos, qayta kiriting.");
  const user = findById(token);
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  const updated: SafeUser = { ...user, pendingDeleteRequest: false };
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
