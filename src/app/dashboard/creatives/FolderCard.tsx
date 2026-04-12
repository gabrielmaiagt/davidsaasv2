'use client';

import Link from 'next/link';
import { Folder, Video, ChevronRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function FolderCard({ folder }: { folder: any }) {
  const [copied, setCopied] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    // e.preventDefault(); // Comentado para permitir navegação se for o Link principal
    const feedUrl = `${window.location.origin}/api/feed/${folder.id}`;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <Link 
        href={`/dashboard/creatives/${folder.id}`}
        onClick={copyLink}
        className="block bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 hover:bg-surface-container hover:border-primary/40 transition-all shadow-sm flex flex-col h-full"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
            <Folder className="w-6 h-6" />
          </div>
          <div className="flex -space-x-2">
            {[...Array(Math.min(folder.count, 3))].map((_: any, i: number) => (
              <div key={i} className="w-7 h-7 border-2 border-surface-container-low group-hover:border-surface-container bg-surface-container-highest rounded-full flex items-center justify-center transition-colors">
                <Video className="w-3.5 h-3.5 text-on-surface-variant/60" />
              </div>
            ))}
          </div>
        </div>
        
        <h3 className="text-white font-black font-headline truncate group-hover:text-primary transition-colors tracking-tight text-base mb-1">
          {folder.name}
        </h3>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">ID: {folder.id.slice(0, 6)}</p>
        
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-outline-variant/10 gap-2">
          <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] whitespace-nowrap">
            {folder.count} CRIATIVOS
          </span>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyLink(e as any); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border ${
                copied 
                  ? 'bg-secondary/20 text-secondary border-secondary/40 scale-105 shadow-[0_0_15px_rgba(255,145,201,0.2)]' 
                  : 'bg-white/5 text-on-surface-variant border-white/5 hover:border-primary/30 hover:text-white hover:bg-white/10'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="hidden xs:inline">{copied ? 'COPIADO!' : 'COPIAR FEED'}</span>
              <span className="xs:hidden">{copied ? 'OK' : 'LINK'}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
}
