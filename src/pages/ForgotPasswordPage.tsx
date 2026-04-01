import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'sent' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      console.log('[ForgotPasswordPage] Enviando reset para:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('[ForgotPasswordPage] Erro:', error);
        setErrorMessage(error.message || 'Erro ao enviar email de reset');
        setStatus('error');
      } else {
        console.log('[ForgotPasswordPage] Email enviado com sucesso');
        setStatus('sent');
      }
    } catch (err) {
      console.error('[ForgotPasswordPage] Erro inesperado:', err);
      setErrorMessage('Erro inesperado. Tente novamente.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Recuperar Senha
          </h1>
          <p className="text-sm text-neutral-600">
            Enviaremos um link de recuperação para o seu email
          </p>
        </div>

        {status === 'sent' ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-success-600" />
            </div>
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-sm text-success-800">
                Email enviado com sucesso! Verifique sua caixa de entrada e siga as instruções.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email cadastrado *
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
            </div>

            {status === 'error' && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-error-600 shrink-0" />
                <p className="text-sm text-error-600">{errorMessage}</p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              type="submit"
              disabled={loading || !email}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
