import {
  BedDouble,
  Bell,
  Check,
  DoorOpen,
  Save,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import { AvatarThemeSelector } from "@components/ui/Avatar";
import { DeviceManagementSection } from "../../settings/components/DeviceManagementSection";
import type { Page } from "@app/App";
import { useTheme } from "@theme/index";

interface Props {
  navigate: (p: Page) => void;
  page: "rooms" | "beds" | "visitors" | "notifications" | "settings";
}

const pageContent = {
  rooms: {
    title: "Rooms",
    description: "Track room availability, occupancy, and maintenance status.",
    icon: DoorOpen,
    stats: [
      ["Total rooms", "48"],
      ["Occupied", "39"],
      ["Available", "7"],
      ["Maintenance", "2"],
    ],
  },
  beds: {
    title: "Beds",
    description: "Manage every bed assignment across your properties.",
    icon: BedDouble,
    stats: [
      ["Total beds", "150"],
      ["Occupied", "141"],
      ["Available", "7"],
      ["Blocked", "2"],
    ],
  },
  visitors: {
    title: "Visitors",
    description: "Review today's visitor log and pre-approved entries.",
    icon: UserCheck,
    stats: [
      ["Today's visits", "18"],
      ["Pre-approved", "11"],
      ["Checked in", "5"],
      ["Checked out", "13"],
    ],
  },
  notifications: {
    title: "Notifications",
    description: "Keep up with payment, resident, and property alerts.",
    icon: Bell,
    stats: [
      ["All alerts", "24"],
      ["Unread", "8"],
      ["High priority", "3"],
      ["Resolved", "16"],
    ],
  },
  settings: {
    title: "Settings",
    description: "Configure your workspace and notification preferences.",
    icon: Settings,
    stats: [
      ["Workspace", "Active"],
      ["Team members", "6"],
      ["Automations", "12"],
      ["Integrations", "4"],
    ],
  },
} as const;

const activity = [
  ["Sunrise PG Homes", "Room 202 was marked ready", "2 min ago", Check],
  [
    "Green Valley PG",
    "Visitor pass approved for Ananya Rao",
    "18 min ago",
    UserCheck,
  ],
  ["Urban Nest PG", "Bed C3 needs a maintenance check", "42 min ago", Wrench],
  [
    "City Heights PG",
    "Monthly settings sync completed",
    "1 hour ago",
    ShieldCheck,
  ],
] as const;

export default function Operations({ navigate, page }: Props) {
  const content = pageContent[page];
  const Icon = content.icon;
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={navigate} activePage={page}>
      <div className="p-4 md:p-6 space-y-5 animate-page-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-[#2B2725] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1
                className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {content.title}
              </h1>
              <p
                className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                {content.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 luxury-btn-primary flex-shrink-0"
          >
            <Save className="w-4 h-4" />
            Save changes
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {content.stats.map(([label, value]) => (
            <div
              key={label}
              className={`rounded-2xl p-5 border glass-card ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  {label}
                </p>
                {label === "Available" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 badge-pulse">
                    ● Available
                  </span>
                )}
              </div>
              <p
                className={`text-2xl font-black mt-2 ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {page === "settings" && (
          <div className="my-4 space-y-4">
            <AvatarThemeSelector />

            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Security &amp; Two-Factor Authentication (2FA)</h3>
                  <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Protect your RoomBae account with Google Authenticator or TOTP app
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                <div className="space-y-3 text-xs">
                  <p className="font-semibold">How to enable Two-Factor Authentication:</p>
                  <ol className={`list-decimal list-inside space-y-1.5 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    <li>Install Google Authenticator, Authy, or Microsoft Authenticator app on your phone.</li>
                    <li>Scan the QR code on the right with your authenticator app.</li>
                    <li>Enter the 6-digit TOTP verification code below to activate.</li>
                  </ol>

                  <div className="pt-2 flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit TOTP code"
                      className={`px-4 py-2.5 rounded-xl border text-xs font-mono tracking-widest ${darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                    />
                    <button
                      onClick={() => alert("✓ Two-Factor Authentication (2FA) activated successfully!")}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      Enable 2FA 🔒
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-slate-700 text-center space-y-2">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/RoomBae:User?secret=ROOMBAESECRET123&issuer=RoomBae"
                    alt="2FA QR Code"
                    className="w-32 h-32 rounded-xl p-1 bg-white"
                  />
                  <p className="text-[10px] font-mono text-amber-400">Secret: ROOMBAESECRET123</p>
                </div>
              </div>
            </div>

            <DeviceManagementSection />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <section
            className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Recent activity
                </h2>
                <p
                  className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  A live view of your workspace
                </p>
              </div>
              <Users
                className={`w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}
              />
            </div>
            <div className="space-y-4">
              {activity.map(([property, text, time, ActivityIcon]) => (
                <div key={text} className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-[#332D2B] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"}`}
                  >
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                    >
                      {text}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${darkMode ? "text-slate-500" : "text-slate-500"}`}
                    >
                      {property} · {time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className={`rounded-2xl p-6 border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
          >
            <h2
              className={`font-bold mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Quick actions
            </h2>
            <p
              className={`text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Navigate to key sections
            </p>
            <div className="space-y-2">
              {[
                ["Add a resident", "residents"],
                ["Review payments", "billing"],
                ["Open complaints", "complaints"],
                ["View analytics", "analytics"],
              ].map(([label, destination]) => (
                <button
                  key={destination}
                  onClick={() => navigate(destination as Page)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${darkMode ? "bg-slate-700/50 hover:bg-[#332D2B] text-slate-300 hover:text-[#C89A4B]" : "bg-slate-50 hover:bg-[#F8EEE5] text-slate-700 hover:text-[#C58B63]"}`}
                >
                  {label}
                  <span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
