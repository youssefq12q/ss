import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { authService, isSupabaseConfigured } from "../services/supabaseService";

interface AuthContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  handleLoginSuccess: (profile: UserProfile) => void;
  handleLogout: () => void;
  updateUserProfile: (updated: Partial<UserProfile>) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("vero_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("vero_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("vero_user");
    }
  }, [user]);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    if (profile.sessionToken) {
      localStorage.setItem("vero_session_token", profile.sessionToken);
    }
    localStorage.setItem("vero_user", JSON.stringify(profile));
  };

  const handleLogout = () => {
    const token = localStorage.getItem("vero_session_token");
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Session-Token": token,
        },
      }).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem("vero_user");
    localStorage.removeItem("vero_session_token");

    if (isSupabaseConfigured()) {
      authService.signOut().catch(console.error);
    }
  };

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
    localStorage.setItem("vero_user", JSON.stringify(nextUser));
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        handleLoginSuccess,
        handleLogout,
        updateUserProfile,
        isLoggedIn,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
