'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function FeedUrlInput({ id, token }: { id: string; token?: string }) {
  const [fullUrl, setFullUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setFullUrl(token ? `${origin}/api/feed/${token}.xml` : `${origin}/api/feed/${id}.xml`);
  }, [id, token]);

  const copyToClipboard = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <input 
        type="text" 
        readOnly 
        value={fullUrl || 'Carregando link...'}
        className="flex-1 bg-zinc-950 text-[10px] text-primary/80 border border-zinc-800 rounded-lg px-3 py-2 focus:outline-none cursor-pointer font-mono"
        onClick={copyToClipboard}
      />
      <button 
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(); }}
        className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
          copied 
            ? 'bg-secondary/20 border-secondary/40 text-secondary scale-105 shadow-[0_0_15px_rgba(255,145,201,0.2)]' 
            : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
        }`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'COPIADO!' : 'COPIAR'}
      </button>
    </div>
  );
}
