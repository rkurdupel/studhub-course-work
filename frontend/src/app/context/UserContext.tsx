import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import { fetchProfile, refreshTokenRequest, type ApiProfile } from "../lib/api";

export interface User {
  name: string;
  fullName: string;
  email: string;
  course: string;
  specialization: string;
  financialStatus: "Контракт" | "Бюджет";
  fundingType: "budget" | "paid";
}

interface UserContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (session: { user: User; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const ACCESS_TOKEN_KEY = "studhub.accessToken";
const REFRESH_TOKEN_KEY = "studhub.refreshToken";

function mapProfileToUser(profile: ApiProfile): User {
  return {
    name: profile.full_name || profile.email.split("@")[0],
    fullName: profile.full_name,
    email: profile.email,
    course: profile.course,
    specialization: profile.specialization,
    financialStatus: profile.funding_type === "budget" ? "Бюджет" : "Контракт",
    fundingType: profile.funding_type,
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    const savedRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!savedAccessToken || !savedRefreshToken) {
      setIsLoading(false);
      return;
    }

    const hydrate = async () => {
      try {
        const profile = await fetchProfile(savedAccessToken);
        setAccessToken(savedAccessToken);
        setRefreshToken(savedRefreshToken);
        setUser(mapProfileToUser(profile));
      } catch {
        try {
          const refreshed = await refreshTokenRequest(savedRefreshToken);
          const profile = await fetchProfile(refreshed.access);
          window.localStorage.setItem(ACCESS_TOKEN_KEY, refreshed.access);
          setAccessToken(refreshed.access);
          setRefreshToken(savedRefreshToken);
          setUser(mapProfileToUser(profile));
        } catch {
          window.localStorage.removeItem(ACCESS_TOKEN_KEY);
          window.localStorage.removeItem(REFRESH_TOKEN_KEY);
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, []);

  const login = (session: { user: User; accessToken: string; refreshToken: string }) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  return (
    <UserContext.Provider value={{ user, accessToken, refreshToken, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
