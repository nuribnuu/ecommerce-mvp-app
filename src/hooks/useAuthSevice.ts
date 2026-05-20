// src/hooks/useAuthService.ts
"use client";

import { Database } from "@/types/database.types";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export function useAuthService() {
  const supabase = useSupabaseClient<Database>();

  // ...existing code...
  async function register(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/verify`,
      },
    });

    if (error) return { user: null, error };

    const user = data.user;

    if (user) {
      const { error: insertError } = await supabase.from("users").insert({
        name,
        email: user.email,
      } as any);

      if (insertError) {
        // Return insertError ke AuthModal
        return { user, error: insertError };
      }
    }

    return { user, error: null };
  }
  // ...existing code...

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    return data.user!;
  };

  return { register, login };
}
