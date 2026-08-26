import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  CreditCard,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  DoorOpen,
  ShieldCheck,
  Plus,
  Sparkles,
  AlertCircle,
  Trash2,
  LogOut,
} from "lucide-react";
import type { Page } from "@/app/App";
import { ThemeToggle, useTheme } from "../../theme";
import { BackButton } from "../../navigation";
import { Avatar } from "../ui/Avatar";
import { AuditLogDrawer } from "../AuditLogDrawer";
import { NotificationCenterDrawer } from "../NotificationCenterDrawer";
import { OwnerOnboardingWizard } from "@features/owners/components/OwnerOnboardingWizard";
import { AdminVerificationQueue } from "../AdminVerificationQueue";
import { GlobalSearchModal } from "../GlobalSearchModal";
import { FineManagementModal } from "@features/billing/components/FineManagementModal";
import { AccountDeletionModal } from "@features/auth/components/AccountDeletionModal";
import { Logo } from "../ui/Logo";



import { useAuth } from "@hooks/useAuth";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  page: Page;
}

const baseSidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", page: "dashboard" },
  { icon: Building2, label: "Properties", page: "properties" },
  { icon: DoorOpen, label: "Rooms", page: "rooms" },
  { icon: BedDouble, label: "Beds", page: "beds" },
  { icon: Users, label: "Residents", page: "residents" },
  { icon: CreditCard, label: "Payments", page: "billing" },
  { icon: MessageSquare, label: "Complaints", page: "complaints" },
  { icon: UserCheck, label: "Visitors", page: "visitors" },
  { icon: TrendingUp, label: "Analytics", page: "analytics" },
  { icon: Bell, label: "Notifications", page: "notifications" },
  { icon: Settings, label: "Settings", page: "settings" },
];

interface Props {
  children: React.ReactNode;
  navigate: (p: Page) => void;
  activePage: Page;
}

export default function DashboardLayout({ children, navigate, activePage }: Props) {
  const { user, logout } = useAuth();
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  const sidebarItems = isAdmin
    ? [{ icon: ShieldCheck, label: "Admin Console", page: "admin-console" as Page }, ...baseSidebarItems]
    : baseSidebarItems;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAdminQueueOpen, setIsAdminQueueOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(2);
  const { darkMode } = useTheme();

  const sidebarBg = darkMode ? "bg-[#181818] border-r border-[#242424]" : "bg-white border-r border-[#ebebeb]";
  const mainBg = darkMode ? "bg-[#121212] text-[#f7f7f7]" : "bg-[#f7f7f7] text-[#222222]";
  const headerBg = darkMode ? "bg-[#181818] border-b border-[#242424]" : "bg-white border-b border-[#ebebeb]";

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        aria-label="Main navigation"
        className={`
          fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300
          ${sidebarBg}
          ${collapsed ? "w-20" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-[#242424]" : "border-[#ebebeb]"}`}>
          <Logo onClick={() => navigate("dashboard")} variant={collapsed ? "icon-only" : "full"} />
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Sidebar navigation" className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;

            return (
              <motion.button
                key={item.page}
                type="button"
                whileHover={{
                  x: collapsed ? 0 : 2,
                  transition: { duration: 0.15, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigate(item.page);
                  setSidebarOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff385c] relative group
                  ${
                    isActive
                      ? "bg-[#ff385c] text-white shadow-sm font-semibold"
                      : darkMode
                        ? "text-[#a1a1aa] hover:text-white hover:bg-[#252525]"
                        : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : darkMode
                        ? "text-[#a1a1aa] group-hover:text-white"
                        : "text-[#6a6a6a] group-hover:text-[#222222]"
                  }`}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        <div className={`p-4 border-t space-y-3 ${darkMode ? "border-[#242424]" : "border-[#ebebeb]"}`}>
          {!collapsed && (
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full py-2.5 px-3 rounded-lg bg-[#ff385c] hover:bg-[#e00b41] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add New PG Property
            </button>
          )}

          <div className="flex items-center gap-3">
            <Avatar
              name={user?.name || "User"}
              initials={
                (user?.name || "User")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              }
              size="md"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? "text-[#f7f7f7]" : "text-[#222222]"}`}>
                  {user?.name || "User"}
                </p>
                <p className={`text-xs capitalize truncate ${darkMode ? "text-[#a1a1aa]" : "text-[#6a6a6a]"}`}>
                  {user?.role ? user.role.toLowerCase() : "User"}
                </p>
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("auth");
                  }}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountOpen(true)}
                  title="Account Settings & Delete"
                  aria-label="Account Settings & Delete"
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className={`flex items-center gap-2 px-3 md:px-6 py-3 border-b flex-shrink-0 ${headerBg}`}
        >
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Global Search - Airbnb Pill Search */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className={`hidden sm:flex items-center gap-2 flex-1 min-w-0 max-w-[180px] md:max-w-xs lg:max-w-sm px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
              darkMode
                ? "bg-[#1e1e1e] border-[#2e2e2e] hover:border-neutral-500"
                : "bg-white border-[#dddddd] hover:border-neutral-400 shadow-sm"
            }`}
            title="Global Search (Ctrl + K)"
          >
            <Search className="w-4 h-4 flex-shrink-0 text-[#ff385c]" />
            <span className="text-xs font-medium text-[#6a6a6a] dark:text-[#a1a1aa] truncate">
              Search... (Ctrl+K)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Global Search"
            title="Global Search"
            className={`sm:hidden p-2 rounded-full border transition-colors flex-shrink-0 ${
              darkMode
                ? "bg-[#1e1e1e] border-[#2e2e2e] text-white"
                : "bg-white border-[#dddddd] text-[#ff385c]"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Action Controls & Badges */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
            <button
              onClick={() => setIsAdminQueueOpen(true)}
              title="Verification Queue"
              className="px-3 py-1.5 rounded-full bg-[#ff385c]/10 text-[#ff385c] font-semibold text-xs border border-[#ff385c]/20 hover:bg-[#ff385c]/20 flex items-center gap-1 cursor-pointer flex-shrink-0 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">Verification</span>
            </button>

            <button
              onClick={() => setIsFineModalOpen(true)}
              title="Issue Fine"
              className="px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 font-semibold text-xs border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer flex-shrink-0 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">Fine</span>
            </button>

            <div className="hidden sm:block flex-shrink-0">
              <BackButton />
            </div>

            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>

            <button
              type="button"
              className={`p-2 rounded-full transition-colors flex-shrink-0 border ${
                darkMode
                  ? "text-[#a1a1aa] bg-[#1e1e1e] border-[#2e2e2e] hover:text-white"
                  : "text-[#6a6a6a] bg-white border-[#dddddd] hover:text-black"
              }`}
              aria-label="Audit Logs"
              title="System Audit Logs"
              onClick={() => setIsAuditDrawerOpen(true)}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              type="button"
              className={`relative p-2 rounded-xl transition-colors flex-shrink-0 ${
                darkMode
                  ? "text-[#a1a1aa] bg-[#1e1e1e] hover:bg-[#252525] hover:text-[#f7f7f7]"
                  : "text-[#6a6a6a] bg-[#f7f7f7] hover:bg-[#f2f2f2] hover:text-[#222222]"
              }`}
              aria-label="Notifications"
              title="Notifications"
              onClick={() => setIsNotificationDrawerOpen(true)}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: "#ff385c", boxShadow: "0 0 0 1.5px #fff" }}
                />
              )}
            </button>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Avatar
                name={user?.name || "User"}
                initials={
                  (user?.name || "User")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                }
                size="sm"
              />
              <button
                type="button"
                className={`p-2 rounded-xl transition-colors flex-shrink-0 cursor-pointer ${
                  darkMode
                    ? "text-[#a1a1aa] bg-[#1e1e1e] hover:bg-[#252525] hover:text-rose-400"
                    : "text-[#6a6a6a] bg-[#f7f7f7] hover:bg-[#f2f2f2] hover:text-rose-600"
                }`}
                aria-label="Sign Out"
                title="Sign Out"
                onClick={async () => {
                  await logout();
                  navigate("auth");
                }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </header>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${darkMode ? "bg-[#121212]" : "bg-[#f7f7f7]"}`}
        >
          {children}
        </main>
      </div>

      <AuditLogDrawer isOpen={isAuditDrawerOpen} onClose={() => setIsAuditDrawerOpen(false)} />
      <NotificationCenterDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onUnreadCountChange={(cnt: number) => setUnreadNotifCount(cnt)}
      />
      <OwnerOnboardingWizard isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      <AdminVerificationQueue isOpen={isAdminQueueOpen} onClose={() => setIsAdminQueueOpen(false)} />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <FineManagementModal isOpen={isFineModalOpen} onClose={() => setIsFineModalOpen(false)} />
      <AccountDeletionModal isOpen={isDeleteAccountOpen} onClose={() => setIsDeleteAccountOpen(false)} userType="OWNER" />
    </div>
  );
}
