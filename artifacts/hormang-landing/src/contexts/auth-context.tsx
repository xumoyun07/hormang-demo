import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logoutUser, refreshToken, type SafeUser, type ProviderProfile } from "@/lib/auth-client";
import { saveCustomerToRegistry, savePhoneToRegistry } from "@/lib/requests-store";

type Role = "buyer" | "provider";

interface AuthState {
  user: SafeUser | null;
  providerProfile: ProviderProfile | null;
  activeRole: Role;
  loading: boolean;
  setAuth: (user: SafeUser, profile?: ProviderProfile | null) => void;
  setProviderProfile: (profile: ProviderProfile | null) => void;
  switchRole: (role: Role) => void;
  logout: () => Promise<void>;
}

/* ─── Per-user role key ──────────────────────────────────────────── */

/** Stores the last-chosen role per user so it survives logout/login. */
function activeRoleKey(userId: string) {
  return `user_${userId}_activeRole`;
}

/** Key that tracks the last successfully-logged-in userId. */
const LAST_USER_KEY = "hormang_last_user_id";

/**
 * Determine which role to activate.
 *
 * Priority:
 *   1. Per-user saved key  `hormang_active_role_{userId}`
 *   2. Legacy global key   `hormang_active_role`  (migrate on first read)
 *   3. "provider" if the user has a providerProfile (first-ever login default)
 *   4. `fallback`  (user.role from the DB)
 *
 * The result is also WRITTEN to the per-user key so that all subsequent
 * calls (including mid-session setAuth) read a consistent value and never
 * accidentally re-evaluate and flip the role.
 */
export function resolveAndPersistRole(
  userId: string,
  providerProfile: ProviderProfile | null,
  fallback: Role,
): Role {
  // 1. Per-user key
  const saved = localStorage.getItem(activeRoleKey(userId));
  if (saved === "buyer" || saved === "provider") return saved;

  // 2. Legacy global key — only safe to use if this was the last logged-in user
  const lastUserId = localStorage.getItem(LAST_USER_KEY);
  const legacy = localStorage.getItem("hormang_active_role");
  if (
    (legacy === "buyer" || legacy === "provider") &&
    (!lastUserId || lastUserId === userId)
  ) {
    // Migrate: write to per-user key, keep legacy key for backward compat reads
    localStorage.setItem(activeRoleKey(userId), legacy);
    return legacy;
  }

  // 3. First-ever login — default to "provider" if user has a provider profile
  const role: Role = providerProfile ? "provider" : fallback;

  // 4. Write so future calls always find the key (prevents mid-session flip)
  localStorage.setItem(activeRoleKey(userId), role);
  return role;
}

/* ─── Cross-user cleanup ─────────────────────────────────────────── */

/**
 * When a DIFFERENT user logs in, clear stale global session data that
 * could bleed across accounts (seen IDs, etc.).
 * User-specific keys (local-profile, tanga-balance, etc.) are keyed by
 * userId so they are naturally isolated.
 */
function handleUserSwitch(newUserId: string): void {
  const lastId = localStorage.getItem(LAST_USER_KEY);
  if (lastId && lastId !== newUserId) {
    localStorage.removeItem("hormang_provider_seen");
  }
  localStorage.setItem(LAST_USER_KEY, newUserId);
}

/* ─── Registry helpers ───────────────────────────────────────────── */

function registryName(u: SafeUser): string {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
}

function registryInitials(u: SafeUser): string {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

function persistUserToRegistry(u: SafeUser) {
  const name = registryName(u);
  if (name) saveCustomerToRegistry(u.id, name, registryInitials(u));
  savePhoneToRegistry(u.id, u.phone);
}

/* ─── Context ────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthState>({
  user: null,
  providerProfile: null,
  activeRole: "buyer",
  loading: true,
  setAuth: () => {},
  setProviderProfile: () => {},
  switchRole: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [providerProfile, setProviderProfileState] = useState<ProviderProfile | null>(null);
  const [activeRole, setActiveRoleState] = useState<Role>("buyer");
  const [loading, setLoading] = useState(true);

  /* On mount: restore session from existing token */
  useEffect(() => {
    const token = localStorage.getItem("hormang_access_token");
    if (!token) { setLoading(false); return; }

    function applyUser(u: SafeUser, pp: ProviderProfile | null) {
      persistUserToRegistry(u);
      handleUserSwitch(u.id);
      setUser(u);
      setProviderProfileState(pp);
      // resolveAndPersistRole writes the per-user key on first load,
      // ensuring that mid-session setAuth calls always read the saved key.
      const role = resolveAndPersistRole(u.id, pp, u.role as Role);
      setActiveRoleState(role);
    }

    getMe()
      .then(({ user: u, providerProfile: pp }) => applyUser(u, pp))
      .catch(async () => {
        const newToken = await refreshToken();
        if (newToken) {
          getMe()
            .then(({ user: u, providerProfile: pp }) => applyUser(u, pp))
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Called right after login/register (and also for mid-session auth updates
   * such as after saving profile settings).
   *
   * Because `resolveAndPersistRole` writes the per-user key on the very first
   * call (initial load / login), subsequent mid-session calls always find the
   * key and return the saved value — so the role is NEVER flipped unexpectedly.
   */
  const setAuth = useCallback((u: SafeUser, profile?: ProviderProfile | null) => {
    // CRITICAL: Clear any previous user's data first
    clearPreviousUserData();

    const pp = profile ?? null;

    persistUserToRegistry(u);
    handleUserSwitch(u.id);

    setUser(u);
    setProviderProfileState(pp);

    const role = resolveAndPersistRole(u.id, pp, u.role as Role);
    setActiveRoleState(role);
  }, []);

  // Helper to prevent data leakage
  function clearPreviousUserData() {
    // Clear any temporary or old keys that might leak
    const keysToClear = ["hormang_access_token", "activeRole", "currentUser"];
    keysToClear.forEach(key => localStorage.removeItem(key));
  }

  const setProviderProfile = useCallback((profile: ProviderProfile | null) => {
    setProviderProfileState(profile);
  }, []);

  /** Save role per-user so it survives logout/login cycles. */
  const switchRole = useCallback((role: Role) => {
    setActiveRoleState(role);
    if (user) localStorage.setItem(activeRoleKey(user.id), role);
    console.log(`[Hormang] 🔄 Rol almashtirildi → ${role === "provider" ? "Ijrochi" : "Xaridor"}`);
  }, [user]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProviderProfileState(null);
    setActiveRoleState("buyer");
    // The per-user active role key is intentionally preserved so the role
    // is correctly restored when the same user logs back in.
  }, []);

  return (
    <AuthContext.Provider value={{
      user, providerProfile, activeRole, loading,
      setAuth, setProviderProfile, switchRole, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
