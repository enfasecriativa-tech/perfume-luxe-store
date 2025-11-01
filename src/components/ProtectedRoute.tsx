import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isAdmin, loading, checkingRole } = useAuth();
  const [timeoutElapsed, setTimeoutElapsed] = useState(false);

  // Timeout de segurança (5 segundos - mesmo do useAuth)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || checkingRole) {
        setTimeoutElapsed(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading, checkingRole]);

  // Se passou do timeout, mostra conteúdo mesmo que ainda esteja loading
  if ((loading || checkingRole) && !timeoutElapsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
