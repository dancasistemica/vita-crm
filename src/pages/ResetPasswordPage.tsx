import React from 'react';
import { Card } from '@/components/ui/ds';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-primary-600/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-primary-600/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg relative z-10">
        {/* Logo - Responsivo */}
        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8 lg:mb-10 text-center">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary-600 flex items-center justify-center text-xl sm:text-2xl">
            💃
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-1">
            Dança Sistêmica
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-neutral-600">
            Defina sua nova senha de acesso
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <ResetPasswordForm />
        </Card>
      </div>
    </div>
  );
}
