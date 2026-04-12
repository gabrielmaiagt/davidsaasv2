'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/register';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const initialState = {
  error: '',
};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction as any, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-[#fafafa] p-4">
      <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold tracking-tight mb-2">CF Manager</h1>
            <p className="text-sm text-[#a1a1aa]">Crie sua conta para começar</p>
          </div>

          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-center">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="name">Nome Completo</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                placeholder="João da Silva"
                required 
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="email">Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="seuemail@exemplo.com"
                required 
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="password">Senha</label>
              <input 
                id="password" 
                name="password" 
                type="password"
                placeholder="••••••••" 
                required 
                minLength={6}
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Conta
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#71717a]">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-indigo-400 hover:underline">
               Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
