"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { LOGIN_MUTATION, REGISTER_MUTATION, REFRESH_TOKEN_MUTATION } from "@/lib/graphql/mutations";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "graphQLErrors" in err) {
    const gqlErr = err as { graphQLErrors?: Array<{ message: string }> };
    if (gqlErr.graphQLErrors && gqlErr.graphQLErrors.length > 0) {
      return gqlErr.graphQLErrors[0].message;
    }
  }
  if (err instanceof Error) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      return "Unable to connect to server. Please check your connection.";
    }
    return err.message;
  }
  return fallback;
}

// Auto-refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const apolloClient = useApolloClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loginMutation] = useMutation<Record<string, any>>(LOGIN_MUTATION);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [registerMutation] = useMutation<Record<string, any>>(REGISTER_MUTATION);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [refreshTokenMutation] = useMutation<Record<string, any>>(REFRESH_TOKEN_MUTATION);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback(
    (accessToken: string) => {
      clearRefreshTimer();
      const expiry = getTokenExpiry(accessToken);
      if (!expiry) return;

      const delay = expiry - Date.now() - REFRESH_BUFFER_MS;
      if (delay <= 0) return;

      refreshTimerRef.current = setTimeout(async () => {
        const storedRefresh = localStorage.getItem("refreshToken");
        if (!storedRefresh) return;

        try {
          const { data } = await refreshTokenMutation({
            variables: { refreshToken: storedRefresh },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resp = (data as Record<string, any>)?.refreshToken;
          if (resp?.token) {
            localStorage.setItem("token", resp.token);
            localStorage.setItem("refreshToken", resp.refreshToken);
            setToken(resp.token);
            scheduleTokenRefresh(resp.token);
          }
        } catch {
          // Refresh failed — user will be logged out on next API call
        }
      }, delay);
    },
    [clearRefreshTimer, refreshTokenMutation]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        scheduleTokenRefresh(storedToken);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    return () => clearRefreshTimer();
  }, [clearRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      let data;
      try {
        const result = await loginMutation({
          variables: {
            input: { email, password },
          },
        });
        data = result.data;
      } catch (err: unknown) {
        throw new Error(extractErrorMessage(err, "Invalid email or password"));
      }

      if (!data?.login?.token) {
        throw new Error("Login failed. Please try again.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authResponse = (data as Record<string, any>).login;
      const newToken = authResponse.token;
      const newUser: User = {
        id: authResponse.userId,
        email: authResponse.email,
        fullName: authResponse.fullName,
      };

      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", authResponse.refreshToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      scheduleTokenRefresh(newToken);

      await apolloClient.resetStore();

      router.push("/dashboard");
    },
    [loginMutation, apolloClient, router, scheduleTokenRefresh]
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string, phone: string) => {
      let data;
      try {
        const result = await registerMutation({
          variables: {
            input: { email, password, fullName, phone },
          },
        });
        data = result.data;
      } catch (err: unknown) {
        throw new Error(extractErrorMessage(err, "Registration failed. Please try again."));
      }

      if (!data?.register?.token) {
        throw new Error("Registration failed. Please try again.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authResponse = (data as Record<string, any>).register;
      const newToken = authResponse.token;
      const newUser: User = {
        id: authResponse.userId,
        email: authResponse.email,
        fullName: authResponse.fullName,
      };

      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", authResponse.refreshToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      scheduleTokenRefresh(newToken);

      await apolloClient.resetStore();

      router.push("/dashboard");
    },
    [registerMutation, apolloClient, router, scheduleTokenRefresh]
  );

  const logout = useCallback(() => {
    clearRefreshTimer();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    apolloClient.clearStore();
    router.push("/login");
  }, [apolloClient, router, clearRefreshTimer]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
