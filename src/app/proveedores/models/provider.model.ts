export enum ProviderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ProviderCategory {
  EXAMPLE = 'EXAMPLE',
  ANOTHER = 'ANOTHER'
}

export interface ProviderDocument {
  id: string;
  type: string;
  filename: string;
  uploadedAt: Date;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface Provider {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  contactEmail: string;
  status: ProviderStatus;
  createdAt: Date;
  updatedAt: Date;
  documents: ProviderDocument[];
  category?: ProviderCategory;
  contactPhone?: string;
  description?: string;
}