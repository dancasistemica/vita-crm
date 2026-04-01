import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[SignUpPage] Criando conta com:', email);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('[SignUpPage] Erro de cadastro:', signUpError);
        setError(signUpError.message || 'Erro ao criar conta');
      } else {
        console.log('[SignUpPage] Conta criada com sucesso');
        setError('');
        alert('Verifique seu email para confirmar a conta');
        navigate('/login');
      }
    } catch (err) {
      console.error('[SignUpPage] Erro inesperado:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        {/* Voltar */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </button>

        {/* Logo e Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Criar Conta
          </h1>
          <p className="text-sm text-neutral-600">
            Comece a gerenciar seus leads com a Dança Sistêmica
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Email */}
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
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-neutral-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-600">{error}</p>
            </div>
          )}

          {/* Botão de Ação */}
          <Button
            variant="primary"
            className="w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Criar Conta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Fazer login
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
