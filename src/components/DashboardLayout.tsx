import { useState } from "react";
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
  Package,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";

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
  { icon: Package, label: "Expenses", page: "billing" },
  { icon: TrendingUp, label: "Analytics", page: "analytics" },
  { icon: Bell, label: "Notifications", page: "notifications" },
  { icon: Settings, label: "Settings", page: "settings" },
];

interface Props {
  children: React.ReactNode;
  navigate: (p: Page) => void;
  activePage: Page;
  darkMode?: boolean;
  toggleDark?: () => void;
}

export default function DashboardLayout({
  children,
  navigate,
  activePage,
  darkMode = false,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();
  darkMode = theme.darkMode;

  return (
    <div
      className={`flex h-screen overflow-hidden ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-30 h-full flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}
          border-r
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}
        >
          <button
            type="button"
            onClick={() => navigate("landing")}
            aria-label="Go to PG Manager home"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span
                className={`font-bold text-base ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                PG Manager
              </span>
            )}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`ml-auto hidden lg:flex flex-shrink-0 p-1 rounded-md transition-colors ${darkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.page);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : darkMode
                        ? "text-slate-400 hover:text-white hover:bg-slate-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div
          className={`p-4 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">RK</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Rajesh Kumar
                </p>
                <p
                  className={`text-xs truncate ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                >
                  Owner
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => navigate("landing")}
                className={`p-1.5 rounded-lg transition-colors ${darkMode ? "text-slate-400 hover:text-red-400 hover:bg-slate-800" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header
          className={`flex items-center gap-2 px-4 md:px-6 py-4 border-b ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${darkMode ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div
            className={`flex items-center gap-2.5 flex-1 max-w-md px-3 py-2 rounded-xl ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}
          >
            <Search
              className={`w-4 h-4 flex-shrink-0 ${darkMode ? "text-slate-400" : "text-slate-400"}`}
            />
            <input
              type="text"
              placeholder="Search residents, rooms, payments..."
              className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <BackButton />
            <ThemeToggle />
            <button
              className={`relative p-2 rounded-xl transition-colors ${darkMode ? "text-slate-400 bg-slate-800 hover:bg-slate-700" : "text-slate-500 bg-slate-100 hover:bg-slate-200"}`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">RK</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 overflow-y-auto ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
