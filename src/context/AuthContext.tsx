// src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  useSupabaseClient,
  useSession,
  useUser,
} from "@supabase/auth-helpers-react";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profileName: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useSupabaseClient<any, "public">();
  const session = useSession(); // Session | null
  const user = useUser(); // User | null
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to fetch profile name:", error.message);
            setProfileName(null);
          } else {
            setProfileName((data as { name?: string })?.name ?? null);
          }
        });
    } else {
      setProfileName(null);
    }
  }, [supabase, user?.id]);

  return (
    <AuthContext.Provider value={{ session, user, profileName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
