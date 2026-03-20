import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logoutUser, refreshToken, type SafeUser, type ProviderProfile } from "@/lib/auth-client";

interface AuthState {
  user: SafeUser | null;
  providerProfile: ProviderProfile | null;
  loading: boolean;
  setAuth: (user: SafeUser, profile?: ProviderProfile | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  providerProfile: null,
  loading: true,
  setAuth: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hormang_access_token");
    if (!token) { setLoading(false); return; }

    getMe()
      .then(({ user, providerProfile }) => {
        setUser(user);
        setProviderProfile(providerProfile);
      })
      .catch(async () => {
        const newToken = await refreshToken();
        if (newToken) {
          getMe()
            .then(({ user, providerProfile }) => { setUser(user); setProviderProfile(providerProfile); })
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const setAuth = useCallback((u: SafeUser, profile?: ProviderProfile | null) => {
    setUser(u);
    setProviderProfile(profile ?? null);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProviderProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, providerProfile, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
