"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { LOGIN_MUTATION, REGISTER_MUTATION } from "@/lib/graphql/mutations";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const apolloClient = useApolloClient();

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

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
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      await apolloClient.resetStore();

      router.push("/dashboard");
    },
    [loginMutation, apolloClient, router]
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
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      await apolloClient.resetStore();

      router.push("/dashboard");
    },
    [registerMutation, apolloClient, router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    apolloClient.clearStore();
    router.push("/login");
  }, [apolloClient, router]);

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
