import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card 
        variant="elevated" 
        padding="lg" 
        className="w-full max-w-sm sm:max-w-md lg:max-w-lg"
      >
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-1 sm:mb-2">
            Recuperar Senha
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-neutral-600">
            Enviaremos um link de recuperação para o seu email
          </p>
        </div>

        {status === 'sent' ? (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-success-600" />
            </div>
            <div className="p-3 sm:p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-xs sm:text-sm text-success-800">
                Email enviado com sucesso! Verifique sua caixa de entrada e siga as instruções.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full min-h-[48px] text-sm sm:text-base"
              onClick={() => navigate('/login')}
            >
              Ir para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendReset} className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                Email cadastrado *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-neutral-100 min-h-[44px]"
              />
            </div>

            {status === 'error' && (
              <div className="p-3 sm:p-4 bg-error-50 border border-error-200 rounded-lg flex gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-error-600 shrink-0" />
                <p className="text-xs sm:text-sm text-error-600">{errorMessage}</p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full min-h-[48px] text-sm sm:text-base"
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
