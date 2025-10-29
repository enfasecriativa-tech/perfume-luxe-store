import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Auth = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      navigate('/minha-conta');
    } catch (error) {
      // Error handled in useAuth
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    try {
      await signUp(signupEmail, signupPassword);
      setSignupEmail('');
      setSignupPassword('');
    } catch (error) {
      // Error handled in useAuth
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        {/* Login Panel */}
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Faça seu login</h2>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signin">Digite seu e-mail</Label>
              <Input
                id="email-signin"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signin">Senha</Label>
              <Input
                id="password-signin"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Esqueci minha senha
            </button>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={loginLoading}
            >
              {loginLoading ? 'ENTRANDO...' : 'ENTRAR'}
            </Button>
          </form>
        </div>

        {/* Signup Panel */}
        <div className="bg-card rounded-lg shadow-lg p-8 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Ainda não se cadastrou?
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Crie sua conta e aproveite nossas ofertas exclusivas
            </p>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Digite seu e-mail</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="seu@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Senha (mínimo 6 caracteres)</Label>
                <Input
                  id="password-signup"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" 
                disabled={signupLoading}
              >
                {signupLoading ? 'CADASTRANDO...' : 'CADASTRE-SE'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
