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
        navigate('/');
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
        setIsSignUp(false);
      }
    } catch (err) {
      console.error('[LoginPage] Erro inesperado:', err);
      setError('Erro ao criar conta. Tente novamente.');
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
        {/* Logo e Branding - Responsivo */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-1 sm:mb-2">
            Dança Sistêmica
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-neutral-600">
            CRM para gestão de leads e clientes
          </p>
        </div>

        {/* Abas de Navegação - Touch-Friendly */}
        <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-neutral-200">
          <button
            onClick={() => setIsSignUp(false)}
            className={`pb-3 sm:pb-4 px-3 sm:px-4 font-medium text-sm sm:text-base transition-colors min-h-[44px] flex items-center justify-center ${
              !isSignUp
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`pb-3 sm:pb-4 px-3 sm:px-4 font-medium text-sm sm:text-base transition-colors min-h-[44px] flex items-center justify-center ${
              isSignUp
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Formulário - Responsivo */}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
              Email *
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

          {/* Senha */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-neutral-100 pr-10 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>

            {/* Link "Esqueci Minha Senha" - APENAS na aba de Login */}
            {!isSignUp && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3 sm:p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-xs sm:text-sm text-error-600">{error}</p>
            </div>
          )}

          {/* Botão de Ação - Visível e Touch-Friendly */}
          <Button
            variant="primary"
            className="w-full min-h-[48px] text-sm sm:text-base font-medium"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>
        </form>

        {/* Footer - Responsivo */}
        <p className="text-center text-xs sm:text-sm text-neutral-500 mt-6 sm:mt-8">
          {isSignUp
            ? 'Já tem uma conta? '
            : 'Não tem uma conta? '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {isSignUp ? 'Entrar' : 'Criar Conta'}
          </button>
        </p>
      </Card>
    </div>
  );
}
