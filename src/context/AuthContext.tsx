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
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    if (error) return { error };

    if (data.user) {
      if (inviteCode) {
        // Claim the invite to join existing family
        const { data: result, error: rpcError } = await supabase.rpc('claim_invite', {
          _invite_code: inviteCode,
          _user_id: data.user.id,
          _display_name: displayName,
        });
        if (rpcError) return { error: rpcError };
        const parsed = result as any;
        if (!parsed.success) return { error: { message: parsed.error } };
      } else {
        // Create new family — generate ID client-side to avoid SELECT-after-INSERT RLS issue
        const familyId = crypto.randomUUID();
        const { error: familyError } = await supabase.from('families').insert({ id: familyId });

        if (!familyError) {
          await supabase.from('caregivers').insert({
            family_id: familyId,
            user_id: data.user.id,
            display_name: displayName,
            role: 'owner' as const,
          });

          await supabase.from('baby_profiles').insert({
            family_id: familyId,
            name: 'Baby',
            default_start_side: 'left' as const,
          });
        }
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
