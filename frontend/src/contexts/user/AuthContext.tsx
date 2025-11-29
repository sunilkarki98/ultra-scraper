"use client";

import { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserData } from "../../types/user";
import { authService } from "../../lib/api/services/auth.service";
import toast from "react-hot-toast";
import { storage, STORAGE_KEYS } from "../../lib/storage";

interface AuthContextType {
  token: string;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      // Temporarily set token for this request if needed, but client handles it via storage
      // However, if we just logged in, storage might not be updated yet in client if it reads once?
      // Client reads storage on every request, so it's fine.
      // But wait, we pass authToken to fetchUser, maybe we should ensure it's in storage first?
      // It is set in login/signup before calling fetchUser.

      const data = await authService.getProfile();
      if (data) {
        setUserData(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      if (data.success) {
        setToken(data.token);
        storage.set(STORAGE_KEYS.AUTH_TOKEN, data.token);
        await fetchUser(data.token);
        toast.success("Login successful!");
        router.push("/user/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  }, [fetchUser, router]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const data = await authService.signup(name, email, password);
      if (data.success) {
        setToken(data.token);
        storage.set(STORAGE_KEYS.AUTH_TOKEN, data.token);
        await fetchUser(data.token);
        toast.success("Account created successfully!");
        router.push("/user/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
      throw error;
    }
  }, [fetchUser, router]);

  const logout = useCallback(() => {
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    setToken("");
    setUserData(null);
    toast("Logged out successfully", { icon: 'ℹ️' });
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) await fetchUser(token);
  }, [token, fetchUser]);

  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");

      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        storage.set(STORAGE_KEYS.AUTH_TOKEN, tokenFromUrl);
        window.history.replaceState({}, document.title, "/dashboard");
        await fetchUser(tokenFromUrl);
      } else {
        const storedToken = storage.get(STORAGE_KEYS.AUTH_TOKEN);
        if (storedToken) {
          setToken(storedToken);
          const success = await fetchUser(storedToken);
          if (!success) {
            storage.remove(STORAGE_KEYS.AUTH_TOKEN);
            setToken("");
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <AuthContext.Provider value={{ token, userData, login, signup, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}