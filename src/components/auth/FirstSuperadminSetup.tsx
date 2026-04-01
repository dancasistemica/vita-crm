import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { hasSuperadmin, createFirstSuperadmin } from '@/services/bootstrapService';
import { Button } from '@/components/ui/ds/';
import { Input } from '@/components/ui/ds/Input';
import { Card } from '@/components/ui/ds/Card';
import { Alert } from '@/components/ui/ds/Alert';
import { Shield, Info } from 'lucide-react';
import { Button } from "@/components/ui/ds";

const setupSchema = z.object({
  fullName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type SetupForm = z.infer<typeof setupSchema>;

export default function FirstSuperadminSetup() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  const form = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    hasSuperadmin().then((exists) => {
      if (exists) {
        navigate('/auth', { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (data: SetupForm) => {
    setIsSubmitting(true);
    try {
      const result = await createFirstSuperadmin(data.email, data.password, data.fullName);
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => navigate('/auth', { replace: true }), 2000);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao criar superadmin');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900">
            Inicializar Sistema
          </h1>
          <p className="text-sm text-neutral-600">Crie a conta do primeiro superadmin</p>
        </div>

        <Alert variant="info" className="mb-6">
          Esta é a primeira vez que o sistema está sendo acessado. Crie uma conta superadmin para gerenciar o sistema.
        </Alert>

        <Card padding="lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900">Criar Superadmin</h2>
            <p className="text-sm text-neutral-600 mt-1">Esta conta terá acesso total ao sistema</p>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input 
              label="Nome completo" 
              placeholder="Seu nome" 
              error={form.formState.errors.fullName?.message}
              required
              {...form.register('fullName')} 
            />
            <Input 
              label="Email" 
              type="email" 
              placeholder="seu@email.com" 
              error={form.formState.errors.email?.message}
              required
              {...form.register('email')} 
            />
            <Input 
              label="Senha (mín 8 caracteres)" 
              type="password" 
              placeholder="••••••••" 
              error={form.formState.errors.password?.message}
              required
              {...form.register('password')} 
            />
            <Input 
              label="Confirmar senha" 
              type="password" 
              placeholder="••••••••" 
              error={form.formState.errors.confirmPassword?.message}
              required
              {...form.register('confirmPassword')} 
            />
            <Button type="submit" disabled={isSubmitting} fullWidth loading={isSubmitting}>
              Criar Superadmin
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-neutral-500 mt-4">
          🔒 Esta conta terá acesso total ao sistema
        </p>
      </div>
    </div>
  );
}
