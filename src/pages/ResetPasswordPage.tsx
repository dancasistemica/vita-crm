import React from 'react';
import { Card } from '@/components/ui/ds';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-600/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-600/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-2xl">
            💃
          </div>
          <h1 className="text-4xl font-bold text-neutral-900">
            Dança Sistêmica
          </h1>
        </div>

        <Card padding="lg">
          <ResetPasswordForm />
        </Card>
      </div>
    </div>
  );
}
