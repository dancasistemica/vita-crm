import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button, Input } from '@/components/ui/ds';
import { ArrowLeft, CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'sent' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      console.log('[ForgotPasswordForm] Enviando reset para:', email);

      // Using the supabase client from integrations
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('[ForgotPasswordForm] Erro:', error);
        setErrorMessage(error.message || 'Erro ao enviar email de reset');
        setStatus('error');
      } else {
        console.log('[ForgotPasswordForm] Email enviado com sucesso');
        setStatus('sent');
      }
    } catch (err) {
      console.error('[ForgotPasswordForm] Erro inesperado:', err);
      setErrorMessage('Erro inesperado. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToLogin}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <h2 className="text-2xl font-semibold text-neutral-900">Recuperar Senha</h2>
      </div>

      {/* STEP 1: Email Input */}
      {status === 'form' && (
        <form onSubmit={handleSendReset} className="space-y-4">
          <div>
            <Input
              label="Email *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
              icon={<Mail className="h-4 w-4" />}
            />
            <p className="text-xs text-neutral-500 mt-2">
              Enviaremos um link de reset para este email
            </p>
          </div>

          <Button
            className="w-full"
            type="submit"
            disabled={loading}
            loading={loading}
          >
            Enviar Link de Reset
          </Button>
        </form>
      )}

      {/* STEP 2: Success Message */}
      {status === 'sent' && (
        <div className="space-y-4 text-center py-6">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Email Enviado!
            </h3>
            <p className="text-sm text-neutral-600">
              Verifique sua caixa de entrada e clique no link para resetar sua senha.
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              O link expira em 24 horas.
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={onBackToLogin}
          >
            Voltar ao Login
          </Button>
        </div>
      )}

      {/* STEP 3: Error Message */}
      {status === 'error' && (
        <div className="space-y-4 text-center py-6">
          <div className="flex justify-center">
            <AlertCircle className="w-12 h-12 text-error-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Erro ao Enviar
            </h3>
            <p className="text-sm text-error-600">
              {errorMessage}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setStatus('form');
                setErrorMessage('');
              }}
            >
              Tentar Novamente
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={onBackToLogin}
            >
              Voltar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
