'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { 
  LayoutDashboard, 
  Megaphone, 
  Clapperboard, 
  FileOutput, 
  LogOut,
  Settings
} from 'lucide-react';
import clsx from 'clsx';
import { useActionState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campanhas', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Criativos', href: '/dashboard/creatives', icon: Clapperboard },
  { name: 'Exportações', href: '/dashboard/exports', icon: FileOutput },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, formAction, isPending] = useActionState(logoutAction as any, null);

  return (
    <div className="min-h-screen bg-[#09090b] flex text-[#fafafa] font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#27272a] bg-[#09090b] flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Clapperboard className="w-3.5 h-3.5 text-white" />
            </div>
            CF Manager
          </h1>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-[#27272a] text-white" 
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
                )}
              >
                <item.icon className={clsx("w-4 h-4", isActive ? "text-indigo-400" : "text-[#71717a]")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#27272a]">
          <form action={formAction}>
            <button 
              type="submit"
              disabled={isPending}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#71717a]" />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen bg-[#09090b]">
        {children}
      </main>
    </div>
  );
}
