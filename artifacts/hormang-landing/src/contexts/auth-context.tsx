import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logoutUser, refreshToken, type SafeUser, type ProviderProfile } from "@/lib/auth-client";

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

const ACTIVE_ROLE_KEY = "hormang_active_role";

function getSavedRole(fallback: Role): Role {
  const saved = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (saved === "buyer" || saved === "provider") return saved;
  return fallback;
}

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

  useEffect(() => {
    const token = localStorage.getItem("hormang_access_token");
    if (!token) { setLoading(false); return; }

    getMe()
      .then(({ user, providerProfile }) => {
        setUser(user);
        setProviderProfileState(providerProfile);
        setActiveRoleState(getSavedRole(user.role));
      })
      .catch(async () => {
        const newToken = await refreshToken();
        if (newToken) {
          getMe()
            .then(({ user, providerProfile }) => {
              setUser(user);
              setProviderProfileState(providerProfile);
              setActiveRoleState(getSavedRole(user.role));
            })
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const setAuth = useCallback((u: SafeUser, profile?: ProviderProfile | null) => {
    setUser(u);
    setProviderProfileState(profile ?? null);
    const saved = getSavedRole(u.role);
    setActiveRoleState(saved);
  }, []);

  const setProviderProfile = useCallback((profile: ProviderProfile | null) => {
    setProviderProfileState(profile);
  }, []);

  const switchRole = useCallback((role: Role) => {
    setActiveRoleState(role);
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProviderProfileState(null);
    setActiveRoleState("buyer");
    localStorage.removeItem(ACTIVE_ROLE_KEY);
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
