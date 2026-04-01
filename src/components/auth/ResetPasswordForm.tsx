import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button, Input, Label } from '@/components/ui/ds';
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock, Loader2 } from 'lucide-react';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Verificar se há token de reset na URL ou se já estamos autenticados (Supabase faz isso automaticamente após o clique no link)
    const checkRecovery = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const hash = window.location.hash;
      const isRecovery = hash.includes('type=recovery') || session;

      if (!isRecovery) {
        console.error('[ResetPasswordForm] Token de reset não encontrado');
        setStatus('error');
        setErrorMessage('Link de reset inválido ou expirado. Por favor, solicite um novo.');
      }
    };

    checkRecovery();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Validações
    if (password.length < 8) {
      setErrorMessage('Senha deve ter no mínimo 8 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Senhas não conferem');
      setLoading(false);
      return;
    }

    try {
      console.log('[ResetPasswordForm] Resetando senha...');

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('[ResetPasswordForm] Erro:', error);
        setErrorMessage(error.message || 'Erro ao resetar senha');
        setStatus('error');
      } else {
        console.log('[ResetPasswordForm] Senha resetada com sucesso');
        setStatus('success');
        // Sign out to force a clean login with new credentials
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('[ResetPasswordForm] Erro inesperado:', err);
      setErrorMessage('Erro inesperado. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">Resetar Senha</h2>
        <p className="text-sm text-neutral-600 mt-1">Defina sua nova senha de acesso</p>
      </div>

      {status === 'form' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Nova Senha *"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-neutral-500 hover:text-neutral-700"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Input
              label="Confirmar Senha *"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
              disabled={loading}
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          {errorMessage && (
            <div className="text-sm text-error-600 font-medium">
              {errorMessage}
            </div>
          )}

          <Button
            className="w-full"
            type="submit"
            disabled={loading}
            loading={loading}
          >
            Redefinir Senha
          </Button>
        </form>
      )}

      {status === 'success' && (
        <div className="space-y-4 text-center py-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-success-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Sucesso!</h3>
            <p className="text-sm text-neutral-600 mt-2">
              Sua senha foi redefinida com sucesso.
            </p>
            <p className="text-xs text-neutral-500 mt-4">
              Redirecionando para login...
            </p>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Ir para Login
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 text-center py-6">
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
    </div>
  );
}
