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
  const checkingRoleRef = useRef<boolean>(false);
  const verifiedUserIdRef = useRef<string | null>(null);

  // Set up auth state listener and initial session (mount once)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            // Se já verificamos este usuário recentemente, não bloqueia a UI novamente
            if (verifiedUserIdRef.current === session.user.id) {
              console.log('✅ Usuário já verificado, mantendo sessão ativa sem loading');
              setLoading(false);
              return;
            }

            // Só verifica role se não estiver já verificando
            if (!checkingRoleRef.current) {
              console.log('🔐 Evento de auth:', event, 'userId:', session.user.id);
              setLoading(true);
              checkAdminRole(session.user.id).catch((err) => {
                console.error('Erro ao verificar role:', err);
                setLoading(false);
                setCheckingRole(false);
                checkingRoleRef.current = false;
              });
            } else {
              console.log('⏭️ Role já sendo verificado, ignorando evento:', event);
            }
          } else if (event === 'SIGNED_OUT') {
            setIsAdmin(false);
            setLoading(false);
            checkingRoleRef.current = false;
            verifiedUserIdRef.current = null;
          } else {
            // TOKEN_REFRESHED or other background events: não bloqueia UI
            console.log('🔄 Evento de auth:', event, '- ignorando (background)');
          }
        } else {
          setIsAdmin(false);
          setLoading(false);
          checkingRoleRef.current = false;
          verifiedUserIdRef.current = null;
        }
      }
    );

    // Timeout de segurança para garantir que loading não fique preso (5s = RPC timeout 2s + query timeout 3s)
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de loading - forçando finalização após 5s');
      setLoading(false);
      setCheckingRole(false);
      checkingRoleRef.current = false;
    }, 5000); // 5 segundos máximo

    supabase.auth.getSession()
      .then(({ data: { session }, error: sessionError }) => {
        clearTimeout(loadingTimeout);

        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          setLoading(false);
          setCheckingRole(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Se já verificamos este usuário, não precisa verificar de novo
          if (verifiedUserIdRef.current === session.user.id) {
            setLoading(false);
            return;
          }

          // Aguarda checkAdminRole completar antes de desligar loading
          checkAdminRole(session.user.id).catch((err) => {
            console.error('Erro no checkAdminRole:', err);
            setLoading(false);
            setCheckingRole(false);
          });
        } else {
          setLoading(false);
          setCheckingRole(false);
        }
      })
      .catch((error) => {
        clearTimeout(loadingTimeout);
        console.error('Erro ao verificar sessão:', error);
        setLoading(false);
        setCheckingRole(false);
      });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
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

  const checkAdminRole = async (userId: string): Promise<void> => {
    // Evita múltiplas chamadas simultâneas
    if (checkingRoleRef.current) {
      console.log('⚠️ checkAdminRole já em execução, ignorando chamada duplicada');
      return;
    }

    checkingRoleRef.current = true;
    setCheckingRole(true);

    try {
      console.log('🔍 Verificando role para userId:', userId);
      const startTime = Date.now();

      // Método 1: Usa função has_role existente (mais rápido e confiável) com timeout de 2s
      let isAdminResult = false;
      try {
        const rpcPromise = supabase
          .rpc('has_role', {
            _user_id: userId,
            _role: 'admin'
          });

        const rpcTimeout = new Promise<{ data: false; error: { message: string } }>((resolve) => {
          setTimeout(() => {
            resolve({ data: false, error: { message: 'RPC timeout após 2 segundos' } });
          }, 2000);
        });

        const { data: hasRoleData, error: hasRoleError } = await Promise.race([rpcPromise, rpcTimeout]);

        if (!hasRoleError && hasRoleData === true) {
          isAdminResult = true;
          console.log('✅ has_role RPC retornou true');
        } else if (hasRoleError?.message?.includes('timeout')) {
          console.warn('⏰ RPC has_role deu timeout (2s), tentando query direta...');
        } else {
          console.log('📞 has_role RPC:', hasRoleData, 'erro:', hasRoleError?.message);
        }
      } catch (rpcErr: any) {
        console.warn('⚠️ RPC has_role falhou, tentando query direta:', rpcErr?.message);
      }

      // Método 2: Query direta rápida com timeout de 3s
      if (!isAdminResult) {
        const queryPromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
          setTimeout(() => {
            resolve({ data: null, error: { message: 'Query timeout após 3 segundos' } });
          }, 3000);
        });

        try {
          const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
          if (!error && data) {
            isAdminResult = true;
            console.log('✅ Query direta encontrou role admin');
          } else if (error?.message?.includes('timeout')) {
            console.warn('⏰ Query direta deu timeout (3s)');
          } else {
            console.log('❌ Query direta não encontrou role:', error?.message);
          }
        } catch (queryErr: any) {
          console.warn('⚠️ Query direta falhou:', queryErr?.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`⏱️ Verificação concluída em ${duration}ms`);

      // Define resultado
      if (isAdminResult) {
        console.log('✅ Usuário é ADMIN');
        setIsAdmin(true);
        verifiedUserIdRef.current = userId;
      } else {
        console.log('❌ Usuário NÃO é admin');
        setIsAdmin(false);
        verifiedUserIdRef.current = userId; // Também marca como verificado para não checar de novo inutilmente
      }
    } catch (error) {
      console.error('❌ Erro ao verificar admin:', error);
      setIsAdmin(false);
    } finally {
      console.log('✅ Finalizando checkAdminRole');
      setCheckingRole(false);
      setLoading(false);
      checkingRoleRef.current = false;
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
      // Limpa timers primeiro
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = undefined;
      }
      checkingRoleRef.current = false;

      // Reset state imediatamente
      setIsAdmin(false);
      setUser(null);
      setSession(null);
      setCheckingRole(false);
      setLoading(false);
      verifiedUserIdRef.current = null;

      // Depois faz signOut no Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpa o estado local
      setIsAdmin(false);
      setUser(null);
      setSession(null);
      setCheckingRole(false);
      setLoading(false);
      toast.error(error.message || 'Erro ao fazer logout');
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
