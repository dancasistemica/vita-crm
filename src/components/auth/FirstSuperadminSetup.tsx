import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { hasSuperadmin, createFirstSuperadmin } from '@/services/bootstrapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display text-foreground tracking-wide">
            Inicializar Sistema
          </h1>
          <p className="text-sm text-muted-foreground">Crie a conta do primeiro superadmin</p>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Esta é a primeira vez que o sistema está sendo acessado. Crie uma conta superadmin para gerenciar o sistema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Criar Superadmin</CardTitle>
            <CardDescription>Esta conta terá acesso total ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-name">Nome completo</Label>
                <Input id="setup-name" placeholder="Seu nome" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-email">Email</Label>
                <Input id="setup-email" type="email" placeholder="seu@email.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-password">Senha (mín 8 caracteres)</Label>
                <Input id="setup-password" type="password" placeholder="••••••••" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-confirm">Confirmar senha</Label>
                <Input id="setup-confirm" type="password" placeholder="••••••••" {...form.register('confirmPassword')} />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Criando...' : 'Criar Superadmin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          🔒 Esta conta terá acesso total ao sistema
        </p>
      </div>
    </div>
  );
}
