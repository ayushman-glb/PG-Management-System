import { create } from "zustand";

export interface NewDeviceModalState {
  isOpen: boolean;
  deviceId?: string;
  visitorId?: string;
  deviceLabel: string;
  screenResolution?: string;
  ipAddress?: string;
  region?: string;
  status?: string;
  riskLevel?: string;
}

export type OpenNewDeviceModalParams =
  | {
      deviceLabel?: string;
      deviceId?: string;
      visitorId?: string;
      screenResolution?: string;
      ipAddress?: string;
      region?: string;
      status?: string;
      riskLevel?: string;
    }
  | string;

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;

  notificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;

  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;

  newDeviceModal: NewDeviceModalState;
  setNewDeviceModal: (modal: NewDeviceModalState) => void;
  openNewDeviceModal: (
    params: OpenNewDeviceModalParams,
    statusArg?: string,
    riskLevelArg?: string,
  ) => void;
  closeNewDeviceModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),

  notificationDrawerOpen: false,
  setNotificationDrawerOpen: (open) => set({ notificationDrawerOpen: open }),

  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),

  newDeviceModal: { isOpen: false, deviceLabel: "" },
  setNewDeviceModal: (modal) => set({ newDeviceModal: modal }),
  openNewDeviceModal: (params, statusArg, riskLevelArg) => {
    if (typeof params === "string") {
      set({
        newDeviceModal: {
          isOpen: true,
          deviceLabel: params || "New Device",
          status: statusArg,
          riskLevel: riskLevelArg,
        },
      });
    } else {
      set({
        newDeviceModal: {
          isOpen: true,
          deviceLabel: params.deviceLabel || "New Device",
          deviceId: params.deviceId,
          visitorId: params.visitorId,
          screenResolution: params.screenResolution,
          ipAddress: params.ipAddress,
          region: params.region,
          status: params.status || statusArg,
          riskLevel: params.riskLevel || riskLevelArg,
        },
      });
    }
  },
  closeNewDeviceModal: () =>
    set({
      newDeviceModal: {
        isOpen: false,
        deviceLabel: "",
        deviceId: undefined,
        visitorId: undefined,
        screenResolution: undefined,
        ipAddress: undefined,
        region: undefined,
      },
    }),
}));
