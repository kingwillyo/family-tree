import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Role = 'admin' | 'editor' | 'viewer';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  appLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | void>;
  signUp: (email: string, password: string) => Promise<{ error: any } | void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchRole(userId: string): Promise<Role> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.role) return 'viewer';
    if (data.role === 'admin') return 'admin';
    if (data.role === 'editor') return 'editor';
    return 'viewer';
  } catch {
    return 'viewer';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  const applySession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    if (newSession?.user) {
      const r = await fetchRole(newSession.user.id);
      setRole(r);
    } else {
      setRole('viewer');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await applySession(data.session);
      setAppLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { error };
      }
      await applySession(data.session);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setLoading(false);
        return { error };
      }
      await applySession(data.session);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole('viewer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, role, loading, appLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
