import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, inviteCode?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  claimInvite: (inviteCode: string) => Promise<{ error: any }>;
}

// Where a pending caregiver invite code is stashed between signup and the moment
// the user is authenticated (email confirmation happens in between).
export const PENDING_INVITE_KEY = 'onesie_pending_invite';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
        window.location.replace('/reset-password');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const claimInvite = async (inviteCode: string) => {
    if (!user) return { error: { message: 'Not logged in' } };
    const displayName = user.user_metadata?.display_name || 'Caregiver';
    const { data, error } = await supabase.rpc('claim_invite', {
      _invite_code: inviteCode,
      _user_id: user.id,
      _display_name: displayName,
    });
    if (error) return { error };
    const result = data as any;
    if (!result.success) return { error: { message: result.error } };
    return { error: null };
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode?: string) => {
    // Carry the invite code through email confirmation so the claim can happen
    // once the user actually has a session (see AppContext bootstrap).
    const emailRedirectTo = inviteCode
      ? `${window.location.origin}/?invite=${encodeURIComponent(inviteCode)}`
      : window.location.origin;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { display_name: displayName },
      },
    });
    if (error) return { error };

    // Stash the invite so we can claim it after the user is authenticated,
    // even if they confirm their email in a different tab/session.
    if (inviteCode) {
      try { localStorage.setItem(PENDING_INVITE_KEY, inviteCode); } catch { /* ignore */ }
    }

    // When email confirmation is disabled, signUp returns a live session and we
    // can claim/create right away. When it's enabled there is no session yet, so
    // the family/invite bootstrap runs later in AppContext once the user logs in.
    if (data.session && data.user) {
      if (inviteCode) {
        const { data: result, error: rpcError } = await supabase.rpc('claim_invite', {
          _invite_code: inviteCode,
          _user_id: data.user.id,
          _display_name: displayName,
        });
        if (rpcError) return { error: rpcError };
        const parsed = result as any;
        if (!parsed.success) return { error: { message: parsed.error } };
        try { localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* ignore */ }
      } else {
        const { error: rpcError } = await supabase.rpc('create_user_family', {
          p_display_name: displayName,
          p_baby_name: 'Baby',
        });
        if (rpcError) return { error: rpcError };
      }
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, claimInvite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
