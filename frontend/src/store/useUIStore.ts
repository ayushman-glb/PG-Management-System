import { create } from "zustand";

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
}));
