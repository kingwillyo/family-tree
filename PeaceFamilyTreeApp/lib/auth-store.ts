import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any } | void>;
  signUp: (email: string, password: string) => Promise<{ error: any } | void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  initialized: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    if (get().initialized) return;

    set({ loading: true });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    set({
      session,
      user: session?.user ?? null,
      loading: false,
      initialized: true,
    });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({
        session: newSession,
        user: newSession?.user ?? null,
      });
    });
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    set({
      session: data.session ?? null,
      user: data.session?.user ?? null,
      loading: false,
    });

    if (error) return { error };
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    set({
      session: data.session ?? null,
      user: data.session?.user ?? null,
      loading: false,
    });

    if (error) return { error };
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      loading: false,
    });
  },
}));
