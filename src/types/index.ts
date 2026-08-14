export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  isDefault: boolean;
  creativeCount?: number;
  
  // Configurações Padrão de Catálogo (Uso para Feed)
  defaultLink: string;
  defaultDescription: string;
  defaultPrice: number;
  currency: string; // Ex: BRL, USD
  brand: string;
  category: string;
  productName?: string; // Nome comercial do produto — base dos títulos no catálogo

  // Experimento: quando true, o feed publica a URL do vídeo SEM o parâmetro
  // único (?v=SKU), permitindo que o TikTok deduplique e baixe cada arquivo
  // uma vez só em vez de uma vez por duplicata. Não aparece na interface —
  // é ligado/desligado por script, para não alterar o fluxo de quem opera.
  dedupeVideos?: boolean;

  feedToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Creative {
  id: string;
  organizationId: string;
  campaignId: string;
  title: string;
  description: string;
  finalUrl: string;
  videoUrl: string;
  imageUrl: string;
  sku: string;
  externalId: string;
  brand: string;
  category: string;
  tags: string[];
  price?: number;
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'used' | 'refurbished';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ExportRecord {
  id: string;
  organizationId: string;
  campaignId?: string;
  type: 'xml' | 'csv' | 'xlsx';
  filtersApplied: any;
  fileUrl: string;
  createdAt: string;
  createdBy: string;
}
