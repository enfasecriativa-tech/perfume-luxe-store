import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  checkingRole: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(false);
  const idleTimeoutMs = 5 * 60 * 1000; // 5 minutos
  const idleTimerRef = useRef<number | undefined>(undefined);

  // Set up auth state listener and initial session (mount once)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setLoading(true);
            await checkAdminRole(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setIsAdmin(false);
            setLoading(false);
          } else {
            // TOKEN_REFRESHED or other background events: do not block UI
          }
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Inactivity auto-logout handlers (depend on user)
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      if (user) {
        idleTimerRef.current = window.setTimeout(() => {
          signOut();
        }, idleTimeoutMs);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'visibilitychange'];
    activityEvents.forEach((evt) => document.addEventListener(evt, resetIdleTimer, { passive: true }));

    resetIdleTimer();

    return () => {
      activityEvents.forEach((evt) => document.removeEventListener(evt, resetIdleTimer as EventListener));
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [user]);

  const checkAdminRole = async (userId: string) => {
    setCheckingRole(true);
    try {
      console.log('🔍 Verificando role para userId:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      console.log('📊 Resultado da query:', { data, error });

      if (!error && data) {
        console.log('✅ Usuário é ADMIN');
        setIsAdmin(true);
      } else {
        console.log('❌ Usuário NÃO é admin ou erro:', error?.message);
        setIsAdmin(false);
      }
    } catch (error) {
      console.log('❌ Erro ao verificar admin:', error);
      setIsAdmin(false);
    } finally {
      setCheckingRole(false);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Role check will be handled by onAuthStateChange
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      toast.success('Cadastro realizado! Verifique seu email.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Hard reset auth-related state
      setIsAdmin(false);
      setUser(null);
      setSession(null);
      setCheckingRole(false);
      setLoading(false);
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, checkingRole, signIn, signUp, signOut }}>
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
