import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type Role = 'admin' | 'editor' | 'viewer';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role;
  hasProfile: boolean;
  familyId: string | null;
  loading: boolean;
  appLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | void>;
  signUp: (email: string, password: string) => Promise<{ error: any } | void>;
  signInWithOtp: (email: string) => Promise<{ error: any } | void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any } | void>;
  signInWithGoogle: () => Promise<{ error?: Error; cancelled?: boolean } | void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getOAuthCallbackParams(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  hashParams.forEach((value, key) => params.set(key, value));
  return params;
}

async function fetchRoleAndProfileInfo(userId: string): Promise<{ role: Role; hasProfile: boolean; familyId: string | null }> {
  let role: Role = 'viewer';
  let hasProfile = false;
  let familyId: string | null = null;
  
  try {
    const { data: familyMembers, error: fmError } = await supabase
      .from('family_members')
      .select('role, family_id')
      .eq('user_id', userId)
      .limit(1);

    if (!fmError && familyMembers && familyMembers.length > 0) {
      const familyMember = familyMembers[0];
      if (familyMember.role === 'admin') role = 'admin';
      else if (familyMember.role === 'editor') role = 'editor';
      familyId = familyMember.family_id;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
      
    if (!profileError && profileData && profileData.length > 0) {
      hasProfile = true;
    }

    console.log('fetchRoleAndProfileInfo result:', { role, hasProfile, familyId });
    return { role, hasProfile, familyId };
  } catch (err) {
    console.error('Error in fetchRoleAndProfileInfo:', err);
    return { role: 'viewer', hasProfile: false, familyId: null };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  const applySession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    if (newSession?.user) {
      const { role: r, hasProfile: hp, familyId: fid } = await fetchRoleAndProfileInfo(newSession.user.id);
      setRole(r);
      setHasProfile(hp);
      setFamilyId(fid);
    } else {
      setRole('viewer');
      setHasProfile(false);
      setFamilyId(null);
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

  const signInWithOtp = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setLoading(false);
        return { error };
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (error) {
        setLoading(false);
        return { error };
      }
      await applySession(data.session);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri({
        scheme: 'lineagex',
        path: 'auth/callback',
      });
      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) return { error: oauthError };
      if (!oauthData.url) return { error: new Error('Google sign-in could not be started.') };

      const browserResult = await WebBrowser.openAuthSessionAsync(oauthData.url, redirectTo);
      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        return { cancelled: true };
      }
      if (browserResult.type !== 'success') {
        return { error: new Error('Google sign-in did not complete. Please try again.') };
      }

      const params = getOAuthCallbackParams(browserResult.url);
      const callbackError = params.get('error_description') || params.get('error');
      if (callbackError) return { error: new Error(callbackError) };

      const authorizationCode = params.get('code');
      if (authorizationCode) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(authorizationCode);
        if (error) return { error };
        await applySession(data.session);
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        return { error: new Error('Google did not return a valid session. Please try again.') };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return { error };
      await applySession(data.session);
    } catch (error: any) {
      return { error: error instanceof Error ? error : new Error('Google sign-in failed.') };
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
      setHasProfile(false);
      setFamilyId(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { role: r, hasProfile: hp, familyId: fid } = await fetchRoleAndProfileInfo(user.id);
      setRole(r);
      setHasProfile(hp);
      setFamilyId(fid);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, role, hasProfile, familyId, loading, appLoading, signIn, signUp, signInWithOtp, verifyOtp, signInWithGoogle, signOut, refreshProfile }}>
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
