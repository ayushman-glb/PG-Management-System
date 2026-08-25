import { api } from './api';

export interface DashboardOverview {
  totalPGs: number;
  totalOwners: number;
  totalResidents: number;
  totalBuildings: number;
  totalFloors: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRatePercent: number;
  totalRevenue: number;
  pendingRent: number;
  totalMaintenanceCost: number;
  totalVisitors: number;
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
  unreadNotifications: number;
  foodRatingAverage: number;
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get('/dashboard/overview');
    return (response as any)?.data ?? response;
  },

  getRevenueAnalytics: async () => {
    const response = await api.get('/dashboard/revenue');
    return (response as any)?.data ?? response;
  },

  getOccupancyAnalytics: async () => {
    const response = await api.get('/dashboard/occupancy');
    return (response as any)?.data ?? response;
  },
};
