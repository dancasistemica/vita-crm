import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button, Card } from '@/components/ui/ds';
import { X, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState<'email' | 'sent' | 'error'>('email');

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      console.log('[ForgotPasswordModal] Enviando reset para:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('[ForgotPasswordModal] Erro:', error);
        setErrorMessage(error.message || 'Erro ao enviar email de reset');
        setStep('error');
      } else {
        console.log('[ForgotPasswordModal] Email enviado com sucesso');
        setStep('sent');
      }
    } catch (err) {
      console.error('[ForgotPasswordModal] Erro inesperado:', err);
      setErrorMessage('Erro inesperado. Tente novamente.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">Recuperar Senha</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STEP 1: Email Input */}
        {step === 'email' && (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-neutral-100"
              />
              <p className="text-xs text-neutral-500 mt-2">
                Enviaremos um link de reset para este email
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onBackToLogin}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                type="submit"
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Success Message */}
        {step === 'sent' && (
          <div className="space-y-4 text-center">
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

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="primary"
                className="flex-1"
                onClick={onBackToLogin}
              >
                Voltar ao Login
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Error Message */}
        {step === 'error' && (
          <div className="space-y-4 text-center">
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

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setStep('email');
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
      </Card>
    </div>
  );
}
