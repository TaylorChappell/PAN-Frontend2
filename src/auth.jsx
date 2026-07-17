import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, endpoints, setToken, unwrapToken, unwrapUser } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await endpoints.auth.me();
      setUser(unwrapUser(data));
      return unwrapUser(data);
    } catch (_error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (values) => {
    const data = await endpoints.auth.login(values);
    const token = unwrapToken(data);
    if (token) setToken(token, values.remember !== false);
    const nextUser = unwrapUser(data) || await refresh();
    setUser(nextUser);
    return { data, user: nextUser };
  }, [refresh]);

  const register = useCallback(async (values) => endpoints.auth.register(values), []);

  const logout = useCallback(async () => {
    try { await endpoints.auth.logout(); } catch (_error) { /* local logout still succeeds */ }
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
