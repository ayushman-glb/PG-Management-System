import { create } from "zustand";

export interface NewDeviceModalState {
  isOpen: boolean;
  deviceLabel: string;
  status?: string;
  riskLevel?: string;
}

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
  openNewDeviceModal: (deviceLabel: string, status?: string, riskLevel?: string) => void;
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
  openNewDeviceModal: (deviceLabel, status, riskLevel) =>
    set({
      newDeviceModal: {
        isOpen: true,
        deviceLabel: deviceLabel || "New Browser",
        status,
        riskLevel,
      },
    }),
  closeNewDeviceModal: () =>
    set({ newDeviceModal: { isOpen: false, deviceLabel: "" } }),
}));

