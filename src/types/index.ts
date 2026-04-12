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

export interface Offer {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  defaultFinalUrl: string;
  defaultCategory: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Creative {
  id: string;
  organizationId: string;
  offerId: string;
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
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ExportRecord {
  id: string;
  organizationId: string;
  offerId?: string;
  type: 'xml' | 'csv' | 'xlsx';
  filtersApplied: any;
  fileUrl: string;
  createdAt: string;
  createdBy: string;
}
