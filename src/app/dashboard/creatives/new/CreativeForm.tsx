'use client';

import { useState, useRef, useEffect } from 'react';
import { createCreativeAction } from '@/app/actions/creatives';
import { Loader2, Upload, Video as VideoIcon, CheckCircle2, XCircle, Trash2, FileVideo } from 'lucide-react';
import { Campaign } from '@/types';
import { useRouter } from 'next/navigation';

interface PendingFile {
  id: string;
  file: File;
  title: string;
  thumbnail: Blob | null;
  status: 'pending' | 'capturing' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function CreativeForm({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Lógica de captura de Thumbnail para novos arquivos
  const captureThumbnail = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5;

      video.onloadeddata = () => {
        video.play().then(() => {
          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              video.pause();
              URL.revokeObjectURL(url);
              resolve(blob);
            }, 'image/jpeg', 0.8);
          }, 400);
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limite de 15 arquivos conforme combinado
    const currentCount = pendingFiles.length;
    const remaining = 15 - currentCount;
    const toAdd = files.slice(0, remaining);

    const newPending: PendingFile[] = toAdd.map((f: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      title: f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "), // Nome limpo
      thumbnail: null,
      status: 'capturing'
    }));

    setPendingFiles(prev => [...prev, ...newPending]);

    // Processa thumbnails em background
    for (const item of newPending) {
      const thumb = await captureThumbnail(item.file);
      setPendingFiles((prev: PendingFile[]) => prev.map((p: PendingFile) => 
        p.id === item.id ? { ...p, thumbnail: thumb, status: 'pending' } : p
      ));
    }
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev: PendingFile[]) => prev.filter((f: PendingFile) => f.id !== id));
  };

  const handleUploadAll = async () => {
    if (!selectedCampaignId) {
      setGlobalError('Selecione uma campanha antes de subir.');
      return;
    }
    if (pendingFiles.length === 0) return;

    setGlobalError('');
    setIsUploadingGlobal(true);

    // Loop de upload sequencial (Esteira)
    for (const item of pendingFiles) {
      if (item.status === 'success') continue; // Pula os que já subiram

      setPendingFiles((prev: PendingFile[]) => prev.map((p: PendingFile) => p.id === item.id ? { ...p, status: 'uploading' } : p));

      try {
        const formData = new FormData();
        formData.append('campaignId', selectedCampaignId);
        formData.append('title', item.title);
        formData.append('video', item.file);
        
        if (item.thumbnail) {
          formData.append('image', item.thumbnail, 'thumb.jpg');
        }

        // Chama a ação sem redirecionar
        const result = await createCreativeAction(null, formData, false);
        
        if (result.success) {
          setPendingFiles((prev: PendingFile[]) => prev.map((p: PendingFile) => p.id === item.id ? { ...p, status: 'success' } : p));
        } else {
          throw new Error('Falha no upload');
        }
      } catch (err) {
        setPendingFiles((prev: PendingFile[]) => prev.map((p: PendingFile) => p.id === item.id ? { ...p, status: 'error', error: 'Falha ao subir' } : p));
      }
    }

    setIsUploadingGlobal(false);
    
    // Se todos deram certo, redireciona após um pequeno delay
    const allSuccess = pendingFiles.every((f: PendingFile) => f.status === 'success' || f.status === 'error'); // Finalizou
    if (allSuccess && pendingFiles.some((f: PendingFile) => f.status === 'success')) {
       setTimeout(() => router.push('/dashboard/creatives'), 1500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-500" />
          Fila da Esteira de Produção
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo: Configuração da Campanha */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Campanha de Destino</label>
              <select 
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              >
                <option value="">Selecione a Campanha...</option>
                {campaigns.map((c: Campaign) => (
                  <option key={c.id} value={c.id}>{c.name} {c.isDefault ? '⭐' : ''}</option>
                ))}
              </select>
            </div>

            <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 space-y-3">
               <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-2 uppercase tracking-widest">Padrões Automáticos:</p>
               <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Preço & Moeda automáticos
               </div>
               <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Link de destino herdado
               </div>
               <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Capa (Thumbnail) extraída do vídeo
               </div>
            </div>

            {globalError && <p className="text-xs text-red-500 font-medium">{globalError}</p>}

            <button
               onClick={handleUploadAll}
               disabled={isUploadingGlobal || pendingFiles.length === 0 || !selectedCampaignId}
               className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
            >
              {isUploadingGlobal ? <Loader2 className="w-5 h-5 animate-spin" /> : <RocketIcon className="w-5 h-5" />}
              {isUploadingGlobal ? 'Subindo Esteira...' : 'Processar Tudo Agora'}
            </button>
          </div>

          {/* Lado Direito: A Fila de Vídeos */}
          <div className="lg:col-span-2 space-y-4">
             <div 
               onClick={() => inputRef.current?.click()}
               className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
             >
                <input 
                  type="file" 
                  ref={inputRef} 
                  multiple 
                  accept="video/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <VideoIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-zinc-200">Arraste seus anúncios aqui</p>
                <p className="text-xs text-zinc-500 mt-1">Limite de 15 vídeos por vez</p>
             </div>

             <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {pendingFiles.map((item) => (
                  <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center gap-4 group">
                     {/* Thumbnail Preview */}
                     <div className="w-16 h-20 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 relative border border-zinc-800">
                        {item.thumbnail ? (
                          <img src={URL.createObjectURL(item.thumbnail)} alt="thumb" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                             <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
                          </div>
                        )}
                        {item.status === 'success' && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 fill-zinc-950" /></div>}
                     </div>

                     {/* Info */}
                     <div className="flex-1 min-w-0">
                        <input 
                          value={item.title} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPendingFiles((prev: PendingFile[]) => prev.map((p: PendingFile) => p.id === item.id ? { ...p, title: e.target.value } : p))}
                          className="bg-transparent border-none text-sm font-medium text-white p-0 focus:ring-0 w-full truncate"
                          placeholder="Título do Criativo"
                        />
                        <div className="flex items-center gap-2 mt-1">
                           <FileVideo className="w-3 h-3 text-zinc-600" />
                           <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                           <span className={`text-[10px] font-bold uppercase ml-2 ${
                             item.status === 'success' ? 'text-emerald-500' : 
                             item.status === 'error' ? 'text-red-500' : 'text-indigo-400'
                           }`}>
                             {item.status}
                           </span>
                        </div>
                     </div>

                     {/* Action */}
                     {!isUploadingGlobal && item.status !== 'success' && (
                       <button onClick={() => removeFile(item.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-2">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 003.2 3.27 14.98 14.98 0 009.32 15.4m6.27-1.03a13.01 13.01 0 01-4.74 1.06" />
    </svg>
  );
}
