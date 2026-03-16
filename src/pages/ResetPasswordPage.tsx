import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check for recovery session - user arrives here via PASSWORD_RECOVERY event redirect
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User has a session (from recovery link), allow password reset
        setIsRecovery(true);
      }

      // Also check URL hash for type=recovery (fallback)
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setIsRecovery(true);
      }

      setChecking(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Senha redefinida com sucesso! Redirecionando para login...');
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => navigate('/auth'), 2000);
    } catch (error: any) {
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        toast.error('Link expirado. Solicite um novo reset.');
      } else {
        toast.error(error.message || 'Erro ao redefinir senha. Tente novamente.');
      }
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

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Este link de recuperação é inválido ou expirou.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nova Senha</CardTitle>
          <CardDescription>Defina sua nova senha abaixo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="min-h-[44px]"
            />
          </div>
          <Button onClick={handleResetPassword} disabled={isSubmitting} className="w-full min-h-[44px]">
            {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
