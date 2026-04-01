import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button, Card, Input, Label } from '@/components/ui/ds';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getRecoveryContextFromUrl } from '@/utils/authRecovery';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { code, hasTokenHash, type } = getRecoveryContextFromUrl(window.location);

      console.log('[ResetPasswordPage] Checking context...', { code, hasTokenHash, type });

      // Supabase sets a session automatically when coming from a recovery link
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session || type === 'recovery' || Boolean(code) || hasTokenHash) {
        console.log('[ResetPasswordPage] Recovery context detected');
        setStatus('form');
      } else {
        console.error('[ResetPasswordPage] No recovery context found');
        setStatus('error');
        setErrorMessage('Link de recuperação inválido ou expirado. Por favor, solicite um novo.');
      }
      setChecking(false);
    };

    checkSession();

    // Listener to catch the event if it happens after component mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('form');
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      console.log('[ResetPasswordPage] Updating password...');
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('[ResetPasswordPage] Error updating password:', error);
        setErrorMessage(error.message || 'Erro ao redefinir senha');
        setStatus('error');
      } else {
        console.log('[ResetPasswordPage] Password updated successfully');
        setStatus('success');
        toast.success('Senha redefinida com sucesso!');
        // Sign out to force a clean login
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('[ResetPasswordPage] Unexpected error:', err);
      setErrorMessage('Erro inesperado. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        {status === 'form' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-neutral-900">Nova Senha</h2>
              <p className="text-sm text-neutral-600 mt-1">Crie uma nova senha segura para sua conta</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2 relative">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </form>
          </>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-success-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Senha Alterada!</h3>
              <p className="text-sm text-neutral-600 mt-2">
                Sua senha foi redefinida com sucesso. Você já pode fazer login com as novas credenciais.
              </p>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-error-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Erro no Link</h3>
              <p className="text-sm text-error-600 mt-2">
                {errorMessage}
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={() => navigate('/login')}
            >
              Voltar ao Login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
