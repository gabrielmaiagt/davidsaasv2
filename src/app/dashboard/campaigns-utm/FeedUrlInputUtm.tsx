'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Mostra a URL do feed COM UTM (rota /api/feed-utm).
 * Componente próprio — o FeedUrlInput de produção não foi alterado.
 */
export default function FeedUrlInputUtm({ id, token }: { id: string; token?: string }) {
  const [fullUrl, setFullUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setFullUrl(token ? `${origin}/api/feed-utm/${token}.xml` : `${origin}/api/feed-utm/${id}.xml`);
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
        className="flex-1 bg-zinc-950 text-[10px] text-secondary/90 border border-secondary/20 rounded-lg px-3 py-2 focus:outline-none cursor-pointer font-mono"
        onClick={copyToClipboard}
      />
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(); }}
        className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
          copied
            ? 'bg-secondary/20 border-secondary/40 text-secondary scale-105'
            : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10'
        }`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'COPIADO!' : 'COPIAR'}
      </button>
    </div>
  );
}
