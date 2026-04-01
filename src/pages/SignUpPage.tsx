import { Button, Card, Input } from "@/components/ui/ds";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

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
      navigate('/login');
    } catch (error: any) {
      console.error('[SignUpPage] Signup error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link to="/login" className="self-start flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </Link>
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-2xl">
            💃
          </div>
          <h1 className="text-4xl font-bold text-neutral-900">
            Criar Conta
          </h1>
          <p className="text-sm text-neutral-600">Junte-se ao Dança Sistêmica</p>
        </div>

        <Card padding="lg">
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
          
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
