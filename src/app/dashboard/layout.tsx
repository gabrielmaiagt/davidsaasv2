'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { 
  LayoutDashboard, 
  Megaphone, 
  Video, 
  FileOutput, 
  LogOut,
  Settings,
  Search,
  HelpCircle,
  Bell,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useActionState, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campanhas', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Criativos', href: '/dashboard/creatives', icon: Video },
  { name: 'Exportações', href: '/dashboard/exports', icon: FileOutput },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, logoutFormAction, isLogoutPending] = useActionState(logoutAction as any, null);

  return (
    <div className="min-h-screen bg-background flex text-on-surface font-sans">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-8 px-4 z-50 border-r border-outline-variant/10">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-black tracking-tighter text-primary font-headline italic">CF Manager</h1>
          <p className="font-headline uppercase tracking-wider text-[0.625rem] font-bold text-on-surface-variant mt-1 opacity-70">Ad-Ops Command</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navigation.map((item: any) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 group",
                  isActive 
                    ? "text-primary border-r-2 border-primary bg-gradient-to-r from-primary/10 to-transparent" 
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                )}
              >
                <item.icon className={clsx("w-4 h-4", isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary transition-colors")} />
                <span className="font-headline uppercase tracking-wider text-[0.6875rem] font-bold">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-outline-variant/10 pt-4">
          <Link 
            href="/dashboard/campaigns/new"
            className="w-full bg-primary text-on-primary font-headline font-black text-[0.6875rem] py-3 rounded-xl mb-4 uppercase tracking-widest flex items-center justify-center active:scale-95 duration-150 shadow-lg shadow-primary/10"
          >
            Nova Campanha
          </Link>
          
          {/* Configurações Removidas conforme solicitação */}
          

          <form action={logoutFormAction}>
            <button 
              type="submit"
              disabled={isLogoutPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded text-on-surface-variant hover:text-secondary transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-headline uppercase tracking-wider text-[0.6875rem] font-bold">Encerrar Sessão</span>
            </button>
          </form>
        </div>
      </aside>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-8 border-b border-outline-variant/10 shadow-[0_4px_32px_rgba(95,255,247,0.04)]">
        <div className="flex items-center gap-6">
          {/* Busca Removida */}
          <nav className="hidden h:flex gap-6 items-center">
             <Link href="#" className="text-on-surface-variant font-headline font-medium text-xs hover:text-primary transition-colors uppercase tracking-widest">Performance</Link>
             <Link href="#" className="text-on-surface-variant font-headline font-medium text-xs hover:text-primary transition-colors uppercase tracking-widest">Logs</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Sincronização Removida */}
          
          <div className="flex items-center gap-3 border-l border-outline-variant/20 pl-4 ml-2">
            <button className="h-8 w-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/30 hover:border-primary/50 transition-all active:scale-90 group ring-offset-background focus:ring-2 focus:ring-primary">
               <div className="bg-gradient-to-br from-primary to-tertiary w-full h-full flex items-center justify-center text-[10px] font-black text-on-primary group-hover:brightness-110 transition-all">
                 M
               </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 pt-24 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating Status UI */}
      <div className="fixed bottom-8 right-8 bg-surface-container-highest/80 border border-primary/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-xl z-50">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </div>
        <span className="text-[0.625rem] font-bold font-headline uppercase tracking-widest text-on-surface-variant">Live Feed Status: OK</span>
      </div>
    </div>
  );
}
