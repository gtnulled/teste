import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('ℹ️ No active session');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        console.log('✅ Session found, fetching user data...');
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('❌ User fetch error:', userError);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        console.log('✅ User data fetched:', userData);
        
        if (mounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('⏰ Auth initialization timeout, stopping loading...');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('❌ User fetch error on auth change:', error);
            setUser(null);
          } else {
            console.log('✅ User data updated:', userData);
            setUser(userData);
          }
        } catch (error) {
          console.error('❌ Error fetching user on auth change:', error);
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        return { error: 'Email ou senha incorretos.' };
      }

      if (!data.user) {
        return { error: 'Erro ao fazer login.' };
      }

      console.log('✅ Sign in successful, fetching user data...');
      
      // Fetch user data to check approval status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('❌ User fetch error after sign in:', userError);
        await supabase.auth.signOut();
        return { error: 'Erro ao carregar dados do usuário.' };
      }

      if (!userData.is_approved) {
        console.log('⚠️ User not approved');
        await supabase.auth.signOut();
        return { error: 'Sua conta ainda não foi aprovada pelo administrador.' };
      }

      console.log('✅ User approved, login successful');
      return {};
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🔄 Attempting sign up for:', email);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        return { error: 'Erro ao criar conta. Verifique os dados e tente novamente.' };
      }

      if (data.user) {
        console.log('✅ Auth user created, creating profile...');
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            is_super_admin: false,
            is_approved: false,
          });

        if (insertError) {
          console.error('❌ User profile creation error:', insertError);
          return { error: 'Erro ao criar perfil do usuário.' };
        }

        console.log('✅ User profile created successfully');
      }

      return {};
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('❌ Refresh user error:', error);
        setUser(null);
      } else {
        console.log('✅ User data refreshed:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}