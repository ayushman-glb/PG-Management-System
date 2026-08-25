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
import type { Page } from "../../App";
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

  const sidebarBg = darkMode ? "glass-panel border-r border-[#4A443F]" : "glass-panel border-r border-[#E6D7CA]";
  const mainBg = darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]";
  const headerBg = darkMode ? "glass-nav border-b border-[#4A443F]" : "glass-nav border-b border-[#E6D7CA]";

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-md"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed lg:relative z-30 h-full flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarBg}
        `}
        style={{ boxShadow: darkMode ? "4px 0 30px rgba(0,0,0,0.35)" : "4px 0 30px rgba(93,55,28,0.06)" }}
      >
        <div
          className={`flex items-center gap-3 px-4 py-4 border-b ${darkMode ? "border-[#4A443F]" : "border-[#E6D7CA]"}`}
        >
          <Logo onClick={() => navigate("landing")} badge="SAAS" />
        </div>


        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;
            return (
              <motion.button
                key={item.page}
                type="button"
                whileHover={{
                  x: collapsed ? 0 : 4,
                  transition: { duration: 0.15, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  navigate(item.page);
                  setSidebarOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 relative group
                  ${
                    isActive
                      ? "text-white shadow-md focus-visible:ring-white"
                      : darkMode
                        ? "text-[#756A63] hover:text-[#F7F3EE] hover:bg-[#332D2B] focus-visible:ring-[#C89A4B]"
                        : "text-[#6E5A52] hover:text-[#3B2A24] hover:bg-[#F8EEE5] focus-visible:ring-[#D9A87C]"
                  }
                `}
                style={
                  isActive
                    ? {
                        background: darkMode
                          ? "linear-gradient(135deg, #C89A4B, #D8B36A)"
                          : "linear-gradient(135deg, #D9A87C, #C58B63)",
                        boxShadow: darkMode
                          ? "0 4px 14px rgba(200,154,75,0.35)"
                          : "0 4px 14px rgba(197,139,99,0.3)",
                      }
                    : {}
                }
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : darkMode
                        ? "text-[#756A63] group-hover:text-[#C89A4B]"
                        : "text-[#A8907F] group-hover:text-[#C58B63]"
                  }`}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        <div className={`p-4 border-t space-y-3 ${darkMode ? "border-[#4A443F]" : "border-[#E6D7CA]"}`}>
          {!collapsed && (
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
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
                <p className={`text-sm font-semibold truncate ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                  {user?.name || "User"}
                </p>
                <p className={`text-xs capitalize truncate ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`}>
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
          style={{ boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(93,55,28,0.06)" }}
        >
          <button
            type="button"
            className={`lg:hidden p-2 rounded-xl transition-colors flex-shrink-0 ${
              darkMode
                ? "text-[#756A63] hover:text-[#F7F3EE] hover:bg-[#332D2B]"
                : "text-[#A8907F] hover:text-[#3B2A24] hover:bg-[#F8EEE5]"
            }`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Global Search - Compact Icon on Mobile, Full Input on Tablet/Desktop */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className={`hidden sm:flex items-center gap-2 flex-1 min-w-0 max-w-[160px] md:max-w-xs lg:max-w-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl border transition-all cursor-pointer ${
              darkMode
                ? "bg-[#332D2B] border-[#4A443F]"
                : "bg-[#F8EEE5] border-[#E6D7CA]"
            }`}
            title="Global Search (Ctrl + K)"
          >
            <Search className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`} />
            <span className={`text-xs font-medium truncate ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`}>
              Search... (Ctrl+K)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Global Search"
            title="Global Search"
            className={`sm:hidden p-2 rounded-xl border transition-colors flex-shrink-0 ${
              darkMode
                ? "bg-[#332D2B] border-[#4A443F] text-[#C89A4B]"
                : "bg-[#F8EEE5] border-[#E6D7CA] text-[#C58B63]"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Action Controls & Badges */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
            <button
              onClick={() => setIsAdminQueueOpen(true)}
              title="Verification Queue"
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/20 text-amber-500 font-bold text-xs border border-amber-500/30 flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">Verification Queue</span>
            </button>

            <button
              onClick={() => setIsFineModalOpen(true)}
              title="Issue Fine"
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden md:inline">Issue Fine</span>
            </button>

            <div className="hidden sm:block flex-shrink-0">
              <BackButton />
            </div>

            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>

            <button
              type="button"
              className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                darkMode
                  ? "text-[#756A63] bg-[#332D2B] hover:bg-[#3D3632] hover:text-[#C89A4B]"
                  : "text-[#A8907F] bg-[#F8EEE5] hover:bg-[#EDE0D4] hover:text-[#C58B63]"
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
                  ? "text-[#756A63] bg-[#332D2B] hover:bg-[#3D3632] hover:text-[#C89A4B]"
                  : "text-[#A8907F] bg-[#F8EEE5] hover:bg-[#EDE0D4] hover:text-[#C58B63]"
              }`}
              aria-label="Notifications"
              title="Notifications"
              onClick={() => setIsNotificationDrawerOpen(true)}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: "#D96B5D", boxShadow: "0 0 0 1.5px #FFFDFB" }}
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
                    ? "text-[#756A63] bg-[#332D2B] hover:bg-[#3D3632] hover:text-rose-400"
                    : "text-[#A8907F] bg-[#F8EEE5] hover:bg-[#EDE0D4] hover:text-rose-600"
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
          className={`flex-1 overflow-y-auto overflow-x-hidden ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}
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
