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
function activeRoleKey(userId: string): string {
  return `hormang_active_role_${userId}`;
}

/**
 * Decide which role to activate for this user.
 * Priority:
 *   1. Their saved role (last time they explicitly switched)
 *   2. "provider" if they have a providerProfile (auto-restore)
 *   3. The fallback from user.role
 */
function getSavedRole(
  userId: string,
  providerProfile: ProviderProfile | null,
  fallback: Role,
): Role {
  const saved = localStorage.getItem(activeRoleKey(userId));
  if (saved === "buyer" || saved === "provider") return saved;
  if (providerProfile) return "provider";
  return fallback;
}

/** Key that tracks the last successfully-logged-in userId. */
const LAST_USER_KEY = "hormang_last_user_id";

/**
 * When a DIFFERENT user logs in, clear stale global session data that
 * could bleed across accounts (seen IDs, upcoming services snapshot, etc.).
 * User-specific keys (local-profile, tanga-balance, etc.) are keyed by
 * userId so they are naturally isolated.
 */
function handleUserSwitch(newUserId: string): void {
  const lastId = localStorage.getItem(LAST_USER_KEY);
  if (lastId && lastId !== newUserId) {
    // Clear global non-user-specific transient session keys
    localStorage.removeItem("hormang_provider_seen");
    // Note: hormang_provider_services is global; services have masterId
    // so they're filtered at read time — no need to wipe.
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
      setActiveRoleState(getSavedRole(u.id, pp, u.role as Role));
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
   * Called right after login/register to apply the new session.
   * The role is restored from the per-user key (or defaults to provider if
   * the user has a providerProfile).
   */
  const setAuth = useCallback((u: SafeUser, profile?: ProviderProfile | null) => {
    const pp = profile ?? null;
    persistUserToRegistry(u);
    handleUserSwitch(u.id);
    setUser(u);
    setProviderProfileState(pp);
    setActiveRoleState(getSavedRole(u.id, pp, u.role as Role));
  }, []);

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
    // Do NOT remove the per-user active role key — it should be
    // restored correctly on next login for the same user.
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
