import React from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  QueryFunction,
  QueryKey,
} from "@tanstack/react-query";
import type { SelectUser, InsertUser } from "@db/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = React.createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          return null;
        }
        throw new Error(`${res.status}: ${await res.text()}`);
      }

      return res.json();
    },
  });

  const loginMutation = useMutation<SelectUser, Error, LoginData>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<SelectUser, Error, InsertUser>({
    mutationFn: async (newUser) => {
      const res = await apiRequest("POST", "/api/register", newUser);
      return res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}