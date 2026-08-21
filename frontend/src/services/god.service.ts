import { api } from './api';

export interface GodOverviewData {
  totalOwners: number;
  totalResidents: number;
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  monthlySaaSRevenue: number;
  annualRunRate: number;
  totalPlatformRevenue: number;
  activeSubscriptions: number;
  subscriptionsByTier: {
    tier: string;
    count: number;
    monthlyPrice: number;
    totalRevenue: number;
  }[];
  growthTrends: {
    month: string;
    owners: number;
    residents: number;
    revenue: number;
  }[];
  systemMetrics: {
    systemHealth: string;
    uptime: string;
    dbStatus: string;
    pendingKycCount: number;
    pendingPropertyApprovals: number;
  };
}

export interface GodOwnerItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  kycStatus: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionRenewal: string;
  propertiesCount: number;
  totalBeds: number;
  totalResidents: number;
  occupancyRate: number;
  accountStatus: string;
  joinedAt: string;
}

export interface GodOwnerDetail {
  owner: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    joinedAt: string;
    accountStatus: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  business: {
    legalName: string;
    tradeName: string;
    businessType: string;
    gstin: string;
    panNumber: string;
    registeredAddress: string;
    city: string;
    state: string;
    pincode: string;
  };
  kyc: {
    status: string;
    aadhaarNumber: string;
    panNumber: string;
    verifiedAt?: string;
    rejectionReason?: string;
  };
  subscription: {
    planType: string;
    status: string;
    monthlyCost: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    maxProperties: number;
    maxResidents: number;
  };
  properties: {
    id: string;
    name: string;
    address: string;
    city: string;
    pincode: string;
    capacity: number;
    currentOccupancy: number;
    availableBeds: number;
    status: string;
    roomCount: number;
    residentCount: number;
  }[];
  residents: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    residentCode: string;
    pgId: string;
    pgName: string;
    roomNumber: string;
    bedNumber: string;
    status: string;
    moveInDate: string;
    rentDueDate: string;
  }[];
}

export interface GodResidentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  residentCode: string;
  pgId: string;
  pgName: string;
  city: string;
  ownerName: string;
  roomNumber: string;
  bedNumber: string;
  status: string;
  moveInDate: string;
  rentDueDate: string;
  createdAt: string;
}

export const godService = {
  async getOverview(): Promise<GodOverviewData> {
    const res = await api.get<{ data: GodOverviewData }>('/god/overview');
    return (res as any)?.data || res;
  },

  async getOwners(params?: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    kycStatus?: string;
  }): Promise<{ owners: GodOwnerItem[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.city) query.set('city', params.city);
    if (params?.kycStatus) query.set('kycStatus', params.kycStatus);

    const qs = query.toString();
    const res = await api.get<any>(`/god/owners${qs ? `?${qs}` : ''}`);
    return {
      owners: (res as any)?.data || res?.owners || [],
      pagination: (res as any)?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async getOwnerById(ownerId: string): Promise<GodOwnerDetail> {
    const res = await api.get<{ data: GodOwnerDetail }>(`/god/owners/${ownerId}`);
    return (res as any)?.data || res;
  },

  async getResidents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    pgId?: string;
  }): Promise<{ residents: GodResidentItem[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.pgId) query.set('pgId', params.pgId);

    const qs = query.toString();
    const res = await api.get<any>(`/god/residents${qs ? `?${qs}` : ''}`);
    return {
      residents: (res as any)?.data || res?.residents || [],
      pagination: (res as any)?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async getRevenueAnalytics(timeframe: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<any> {
    const res = await api.get<any>(`/god/revenue?timeframe=${timeframe}`);
    return (res as any)?.data || res;
  },
};
