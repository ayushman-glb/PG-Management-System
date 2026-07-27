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
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";

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

  return (
    <DashboardLayout navigate={navigate} activePage={page}>
      <div className="p-6 space-y-6 animate-page-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {content.title}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {content.description}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Save className="w-4 h-4" />
            Save changes
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {content.stats.map(([label, value]) => (
            <div
              key={label}
              className="bg-white border border-slate-100 rounded-2xl p-5"
            >
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <section className="bg-white border border-slate-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900">Recent activity</h2>
                <p className="text-xs text-slate-500 mt-1">
                  A live view of your workspace
                </p>
              </div>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              {activity.map(([property, text, time, ActivityIcon]) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {text}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {property} · {time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900">Quick actions</h2>
            <div className="space-y-2 mt-4">
              {[
                ["Add a resident", "residents"],
                ["Review payments", "billing"],
                ["Open complaints", "complaints"],
                ["View analytics", "analytics"],
              ].map(([label, destination]) => (
                <button
                  key={destination}
                  onClick={() => navigate(destination as Page)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
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
