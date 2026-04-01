import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[LoginPage] Fazendo login com:', email);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[LoginPage] Erro de login:', signInError);
        setError('Email ou senha incorretos');
      } else {
        console.log('[LoginPage] Login bem-sucedido');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('[LoginPage] Erro inesperado:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[LoginPage] Criando conta com:', email);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('[LoginPage] Erro de cadastro:', signUpError);
        setError(signUpError.message || 'Erro ao criar conta');
      } else {
        console.log('[LoginPage] Conta criada com sucesso');
        setError('');
        alert('Verifique seu email para confirmar a conta');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('[LoginPage] Erro inesperado:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        {/* Logo e Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Dança Sistêmica
          </h1>
          <p className="text-sm text-neutral-600">
            CRM para gestão de leads e clientes
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-4 mb-6 border-b border-neutral-200">
          <button
            onClick={() => setIsSignUp(false)}
            className={`pb-3 px-2 font-medium transition-colors ${
              !isSignUp
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`pb-3 px-2 font-medium transition-colors ${
              isSignUp
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
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

            {/* Link "Esqueci Minha Senha" - APENAS na aba de Login */}
            {!isSignUp && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-primary-600 hover:text-primary-700 transition-colors font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
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
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
