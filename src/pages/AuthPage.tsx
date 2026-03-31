import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/ds/Button';
import { Input } from '@/components/ui/ds/Input';
import { Card } from '@/components/ui/ds/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { hasSuperadmin } from '@/services/bootstrapService';

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  useEffect(() => {
    hasSuperadmin().then((exists) => {
      if (!exists) {
        navigate('/setup', { replace: true });
      } else {
        setCheckingBootstrap(false);
      }
    });
  }, [navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  if (loading || checkingBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      // Check if user has an org, if not create one
      await ensureOrganization();
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('[AuthPage] Login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Confirme seu email antes de fazer login');
      } else {
        toast.error(error.message || 'Erro ao fazer login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');
      signupForm.reset();
    } catch (error: any) {
      console.error('[AuthPage] Signup error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error('Informe seu email');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-2xl">
            💃
          </div>
          <h1 className="text-4xl font-bold text-neutral-900">
            Dança Sistêmica
          </h1>
          <p className="text-sm text-neutral-600">CRM para gestão de leads e clientes</p>
        </div>

        {showForgotPassword ? (
          <Card padding="lg">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-700">Recuperar Senha</h3>
                <p className="text-sm text-neutral-600 mt-1">Informe seu email para receber o link de recuperação</p>
              </div>
              <Input
                label="Email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
              <Button onClick={handleForgotPassword} disabled={isSubmitting} fullWidth>
                {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setShowForgotPassword(false)}>
                Voltar ao login
              </Button>
            </div>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Tabs defaultValue="login">
              <div className="p-6 pb-3 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                </TabsList>
              </div>
              <div className="p-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="seu@email.com"
                      error={loginForm.formState.errors.email?.message}
                      required
                      {...loginForm.register('email')}
                    />
                    <Input
                      label="Senha"
                      type="password"
                      placeholder="••••••"
                      error={loginForm.formState.errors.password?.message}
                      required
                      {...loginForm.register('password')}
                    />
                    <Button type="submit" disabled={isSubmitting} fullWidth>
                      {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      fullWidth
                      className="text-sm"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Esqueci minha senha
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <Input
                      label="Nome completo"
                      placeholder="Seu nome"
                      error={signupForm.formState.errors.fullName?.message}
                      required
                      {...signupForm.register('fullName')}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="seu@email.com"
                      error={signupForm.formState.errors.email?.message}
                      required
                      {...signupForm.register('email')}
                    />
                    <Input
                      label="Senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      error={signupForm.formState.errors.password?.message}
                      required
                      {...signupForm.register('password')}
                    />
                    <Input
                      label="Confirmar senha"
                      type="password"
                      placeholder="Repita a senha"
                      error={signupForm.formState.errors.confirmPassword?.message}
                      required
                      {...signupForm.register('confirmPassword')}
                    />
                    <Button type="submit" disabled={isSubmitting} fullWidth>
                      {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}

async function ensureOrganization() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membership) return; // Already has org

    const fullName = user.user_metadata?.full_name || 'Minha';
    const slug = `org-${user.id.slice(0, 8)}`;

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `Organização de ${fullName}`,
        slug,
        owner_id: user.id,
      })
      .select('id')
      .single();

    if (orgError) throw orgError;

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'owner',
      });

    if (memberError) throw memberError;
    console.log('[AuthPage] Organization created for new user');
  } catch (error) {
    console.error('[AuthPage] Error ensuring organization:', error);
  }
}
