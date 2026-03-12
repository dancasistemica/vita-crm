import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loginUser, checkRateLimit } from '@/services/loginService';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, XCircle, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMEMBER_KEY = 'login_remember_email';
const REMEMBER_EXPIRY_KEY = 'login_remember_expiry';
const REMEMBER_DAYS = 30;

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const resetToken = searchParams.get('reset');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMinutes, setRateLimitMinutes] = useState(0);

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    const expiry = localStorage.getItem(REMEMBER_EXPIRY_KEY);
    if (saved && expiry) {
      if (Date.now() < Number(expiry)) {
        setEmail(saved);
        setRememberMe(true);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_EXPIRY_KEY);
      }
    }
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Redirect on token/reset params
  useEffect(() => {
    if (token) navigate(`/first-login?token=${token}`, { replace: true });
    if (resetToken) navigate(`/reset-password?reset=${resetToken}`, { replace: true });
  }, [token, resetToken, navigate]);

  // Rate limit countdown
  useEffect(() => {
    if (!rateLimited) return;
    const interval = setInterval(() => {
      if (email) {
        const check = checkRateLimit(email);
        if (check.allowed) {
          setRateLimited(false);
          setRateLimitMinutes(0);
        } else {
          setRateLimitMinutes(check.minutesRemaining ?? 0);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [rateLimited, email]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  // Validation
  const emailError = emailTouched && !email
    ? 'Email é obrigatório'
    : emailTouched && email && !EMAIL_REGEX.test(email)
      ? 'Email inválido'
      : undefined;

  const passwordError = passwordTouched && !password
    ? 'Senha é obrigatória'
    : passwordTouched && password && password.length < 8
      ? 'Mínimo 8 caracteres'
      : undefined;

  const emailValid = emailTouched && email && !emailError;
  const passwordValid = passwordTouched && password && !passwordError;
  const isFormValid = email && password && !emailError && !passwordError && !rateLimited;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isFormValid) return;

    setLoading(true);
    try {
      const result = await loginUser({ email, password });

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, email);
          localStorage.setItem(REMEMBER_EXPIRY_KEY, String(Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000));
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.removeItem(REMEMBER_EXPIRY_KEY);
        }
        toast.success('Login realizado com sucesso!');
        navigate(result.redirectUrl || '/', { replace: true });
      } else {
        if (result.error?.includes('Muitas tentativas')) {
          setRateLimited(true);
          const check = checkRateLimit(email);
          setRateLimitMinutes(check.minutesRemaining ?? 15);
        }
        toast.error(result.error || 'Erro ao fazer login');
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-2xl">
            💃
          </div>
          <h1 className="text-xl font-display text-foreground tracking-wide">
            Dança Sistêmica
          </h1>
          <p className="text-sm text-muted-foreground">Faça login para acessar sua conta</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Bem-vindo de volta</CardTitle>
            <CardDescription>Entre com suas credenciais para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rate limit banner */}
              {rateLimited && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Muitas tentativas. Tente novamente em {rateLimitMinutes} minuto{rateLimitMinutes !== 1 ? 's' : ''}.</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <div className="relative">
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="seu@email.com"
                    disabled={loading}
                    maxLength={255}
                    className={
                      emailError
                        ? 'border-destructive bg-destructive/5 pr-10'
                        : emailValid
                          ? 'border-success pr-10'
                          : ''
                    }
                  />
                  {emailError && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                  {emailValid && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                  )}
                </div>
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Senha
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    disabled={loading}
                    maxLength={128}
                    className={
                      passwordError
                        ? 'border-destructive bg-destructive/5 pr-20'
                        : passwordValid
                          ? 'border-success pr-20'
                          : 'pr-10'
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {passwordError && <XCircle className="h-4 w-4 text-destructive" />}
                    {passwordValid && <CheckCircle2 className="h-4 w-4 text-success" />}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                    Lembrar-me por 30 dias
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Secondary links */}
            <div className="mt-4 space-y-2 text-center">
              <Button
                variant="link"
                className="text-sm w-full"
                onClick={() => navigate('/auth')}
              >
                Esqueci minha senha
              </Button>
              <p className="text-xs text-muted-foreground">
                Não tem conta?{' '}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-primary hover:underline font-medium"
                >
                  Criar conta
                </button>
              </p>
            </div>

            {/* Security footer */}
            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Sua senha é armazenada de forma segura com criptografia
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
