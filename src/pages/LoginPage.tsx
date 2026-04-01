import { Button, Card, Checkbox, Input } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loginUser, checkRateLimit } from '@/services/loginService';
import { toast } from 'sonner';
import { Eye, EyeOff, XCircle, CheckCircle2, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-600/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-600/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-2xl">
            💃
          </div>
          <h1 className="text-4xl font-bold text-neutral-900">
            Dança Sistêmica
          </h1>
          <p className="text-sm text-neutral-600">Faça login para acessar sua conta</p>
        </div>

        <Card padding="lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900">Bem-vindo de volta</h2>
            <p className="text-sm text-neutral-600 mt-1">Entre com suas credenciais para continuar</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rate limit banner */}
            {rateLimited && (
              <div className="rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-600 flex items-center gap-3">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Muitas tentativas. Tente novamente em {rateLimitMinutes} minuto{rateLimitMinutes !== 1 ? 's' : ''}.</span>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="seu@email.com"
              disabled={loading}
              error={emailError}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <div className="space-y-3 relative">
               <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                placeholder="••••••••"
                disabled={loading}
                error={passwordError}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              <Button variant="secondary" size="sm"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-[38px] text-neutral-500 hover:text-neutral-700 disabled:opacity-50 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
              />
              <label htmlFor="remember-me" className="text-sm font-normal text-neutral-700 cursor-pointer">
                Lembrar-me por 30 dias
              </label>
            </div>

            <Button type="submit"
              disabled={!isFormValid || loading}
              fullWidth
              loading={loading}
            >
              Entrar
            </Button>
          </form>

          {/* Secondary links */}
          <div className="mt-4 space-y-3 text-center">
            <Button variant="ghost"
              fullWidth
              size="sm"
              onClick={() => setShowForgotPassword(true)}
            >
              Esqueci minha senha
            </Button>
            <p className="text-sm text-neutral-600">
              Não tem conta?{' '}
              <Button variant="secondary" size="sm"
                onClick={() => navigate('/auth')}
                className="text-primary-600 hover:underline font-medium"
              >
                Criar conta
              </Button>
            </p>
          </div>

          {/* Security footer */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Sua senha é armazenada de forma segura com criptografia
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
