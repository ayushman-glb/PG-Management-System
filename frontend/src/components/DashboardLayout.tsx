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
  LogOut,
  Search,
  Menu,
  X,
  ChevronRight,
  DoorOpen,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";
import { Avatar } from "./Avatar";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  page: Page;
}

const sidebarItems: SidebarItem[] = [
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { darkMode } = useTheme();

  const sidebarBg = darkMode ? "glass-panel border-r border-[#4A443F]" : "glass-panel border-r border-[#E6D7CA]";
  const mainBg = darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]";
  const headerBg = darkMode ? "glass-nav border-b border-[#4A443F]" : "glass-nav border-b border-[#E6D7CA]";

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      {/* Mobile overlay — animated */}
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

      {/* Sidebar */}
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
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b ${darkMode ? "border-[#4A443F]" : "border-[#E6D7CA]"}`}
        >
          <button
            type="button"
            onClick={() => navigate("landing")}
            aria-label="Go to home"
            className="flex min-w-0 items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)", boxShadow: "0 4px 12px rgba(197,139,99,0.4)" }}
            >
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            {!collapsed && (
              <span
                className={`font-bold text-base truncate tracking-wide ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}
              >
                RoomBae
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`ml-auto hidden lg:flex flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              darkMode
                ? "text-[#756A63] hover:text-[#C89A4B] hover:bg-[#332D2B]"
                : "text-[#A8907F] hover:text-[#C58B63] hover:bg-[#F8EEE5]"
            }`}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Main navigation">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                whileHover={{
                  x: collapsed ? 0 : 5,
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
                <motion.span
                  className="flex-shrink-0"
                  whileHover={{ rotate: isActive ? 0 : -5, scale: 1.1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
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
                </motion.span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom user area */}
        <div className={`p-4 border-t ${darkMode ? "border-[#4A443F]" : "border-[#E6D7CA]"}`}>
          <div className="flex items-center gap-3">
            <Avatar name="Rajesh Kumar" initials="RK" size="md" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                  Rajesh Kumar
                </p>
                <p className={`text-xs truncate ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`}>
                  Owner
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={() => navigate("landing")}
                title="Sign out"
                aria-label="Sign out"
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  darkMode
                    ? "text-[#756A63] hover:text-[#D96B5D] hover:bg-[#332D2B]"
                    : "text-[#A8907F] hover:text-[#D96B5D] hover:bg-[#F8EEE5]"
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          className={`flex items-center gap-2 px-3 md:px-6 py-3 border-b flex-shrink-0 ${headerBg}`}
          style={{ boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(93,55,28,0.06)" }}
        >
          {/* Mobile menu */}
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

          {/* Search */}
          <div
            className={`flex items-center gap-2.5 flex-1 min-w-0 max-w-sm px-4 py-2 rounded-xl border transition-all ${
              darkMode
                ? "bg-[#332D2B] border-[#4A443F] focus-within:border-[#C89A4B]"
                : "bg-[#F8EEE5] border-[#E6D7CA] focus-within:border-[#D9A87C]"
            }`}
            style={{ transition: "border-color 0.2s, box-shadow 0.2s" }}
          >
            <Search className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`} />
            <input
              type="text"
              aria-label="Search residents and rooms"
              placeholder="Search residents, rooms…"
              className={`flex-1 min-w-0 bg-transparent text-sm outline-none font-medium ${
                darkMode
                  ? "text-[#F7F3EE] placeholder:text-[#756A63]"
                  : "text-[#3B2A24] placeholder:text-[#A8907F]"
              }`}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
            <BackButton />
            <ThemeToggle />
            <button
              type="button"
              className={`relative p-2 rounded-xl transition-colors ${
                darkMode
                  ? "text-[#756A63] bg-[#332D2B] hover:bg-[#3D3632] hover:text-[#C89A4B]"
                  : "text-[#A8907F] bg-[#F8EEE5] hover:bg-[#EDE0D4] hover:text-[#C58B63]"
              }`}
              aria-label="Notifications"
              onClick={() => navigate("notifications")}
            >
              <Bell className="w-4 h-4" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#D96B5D", boxShadow: "0 0 0 1.5px #FFFDFB" }}
              />
            </button>
            <Avatar name="Rajesh Kumar" initials="RK" size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
