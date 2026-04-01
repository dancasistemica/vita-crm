import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getRecoveryContextFromUrl } from '@/utils/authRecovery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui/ds";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { code, hasTokenHash, rawHash, type } = getRecoveryContextFromUrl(window.location);

      console.log('[ResetPasswordPage] Carregando...');
      console.log('[ResetPasswordPage] Search:', window.location.search);
      console.log('[ResetPasswordPage] Hash:', rawHash);
      console.log('[ResetPasswordPage] Token:', code);
      console.log('[ResetPasswordPage] Type:', type);

      const { data: { session } } = await supabase.auth.getSession();
      console.log('[ResetPasswordPage] Sessão ativa:', session);

      if (session || type === 'recovery' || Boolean(code) || hasTokenHash) {
        console.log('[ResetPasswordPage] Contexto de recovery detectado.');
        setIsRecovery(true);
      } else {
        console.log('[ResetPasswordPage] Nenhum contexto de recovery detectado.');
      }

      setChecking(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const { code, hasTokenHash, type } = getRecoveryContextFromUrl(window.location);

      console.log('[ResetPasswordPage] Auth Event:', event);
      console.log('[ResetPasswordPage] Auth Session:', session);

      if (event === 'PASSWORD_RECOVERY' || ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && (type === 'recovery' || Boolean(code) || hasTokenHash))) {
        console.log('[ResetPasswordPage] Recovery confirmado pelo auth state.');
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
      console.log('[ResetPasswordPage] Enviando updateUser para redefinir senha...');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      console.log('[ResetPasswordPage] Senha redefinida com sucesso.');
      toast.success('Senha redefinida com sucesso! Redirecionando para login...');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/auth'), 2000);
    } catch (error: any) {
      console.error('[ResetPasswordPage] Erro ao redefinir senha:', error);
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
            < onClick={() => navigate('/auth')} className="w-full min-h-[44px]">
              Voltar ao login
            </>
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
          <div className="space-y-3">
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
          <div className="space-y-3">
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
          < onClick={handleResetPassword} disabled={isSubmitting} className="w-full min-h-[44px]">
            {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
          </>
        </CardContent>
      </Card>
    </div>
  );
}
