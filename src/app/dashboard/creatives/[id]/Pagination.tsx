'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-4 py-10">
      {hasPrev ? (
        <Link 
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-surface-container-high hover:bg-surface-container-highest text-white px-5 py-3 rounded-xl transition-all border border-outline-variant/10 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Anterior
        </Link>
      ) : (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-surface-container-low text-on-surface-variant/30 px-5 py-3 rounded-xl border border-outline-variant/5">
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </div>
      )}

      <div className="text-[10px] font-black text-on-surface-variant bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/10 uppercase tracking-[0.2em]">
        Página <span className="text-primary">{currentPage}</span> de {totalPages}
      </div>

      {hasNext ? (
        <Link 
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-surface-container-high hover:bg-surface-container-highest text-white px-5 py-3 rounded-xl transition-all border border-outline-variant/10 group"
        >
          Próximo
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-surface-container-low text-on-surface-variant/30 px-5 py-3 rounded-xl border border-outline-variant/5">
          Próximo
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
