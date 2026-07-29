import { useState } from "react";
import {
  Home,
  User,
  CreditCard,
  Wrench,
  Users,
  Utensils,
  LogOut,
  Calendar,
  Download,
  Plus,
  CheckCircle,
  FileText,
  QrCode,
  Bell,
  X,
  Eye,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";
import { Avatar } from "../components/Avatar";

interface Props {
  navigate: (p: Page) => void;
}

type Tab =
  | "overview"
  | "profile"
  | "room"
  | "billing"
  | "maintenance"
  | "visitors"
  | "meals"
  | "gatepass";

export default function ResidentPortal({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { darkMode } = useTheme();

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<any>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<any>(null);
  const [skipMeal, setSkipMeal] = useState(false);

  // State Data
  const [complaints, setComplaints] = useState([
    {
      id: "TICK-402",
      title: "WiFi connectivity dropping in 2nd floor",
      category: "WiFi / Internet",
      date: "24 Jul 2025",
      status: "In Progress",
      desc: "Internet connection disconnects every few hours on 2nd floor router.",
    },
    {
      id: "TICK-389",
      title: "Hot water pressure low in bathroom",
      category: "Plumbing",
      date: "12 Jul 2025",
      status: "Resolved",
      desc: "Plumber serviced the solar heater unit. Working normal now.",
    },
  ]);

  const [visitors, setVisitors] = useState([
    {
      id: "VP-801",
      name: "Rohan Varma",
      mobile: "+91 98765 11223",
      relation: "Friend",
      date: "29 Jul 2025",
      time: "4:00 PM - 7:00 PM",
      status: "Approved",
    },
  ]);

  const [gatePasses, setGatePasses] = useState([
    {
      id: "GP-104",
      type: "Weekend Outing",
      destination: "Home (Civil Lines)",
      departure: "02 Aug 2025, 6:00 PM",
      return: "04 Aug 2025, 9:00 AM",
      status: "Approved",
    },
  ]);

  // New Complaint Form State
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    category: "Plumbing",
    desc: "",
  });

  // New Visitor Form State
  const [newVisitor, setNewVisitor] = useState({
    name: "",
    mobile: "",
    relation: "Friend",
    date: "2025-07-29",
    time: "16:00",
  });

  // New Gate Pass State
  const [newPass, setNewPass] = useState({
    destination: "",
    departure: "",
    returnDate: "",
    reason: "",
  });

  const handleAddComplaint = () => {
    if (!newComplaint.title) return;
    const ticket = {
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      title: newComplaint.title,
      category: newComplaint.category,
      date: "Today",
      status: "Pending",
      desc: newComplaint.desc || "Submitted via Resident Portal",
    };
    setComplaints([ticket, ...complaints]);
    setNewComplaint({ title: "", category: "Plumbing", desc: "" });
    setShowComplaintModal(false);
  };

  const handleAddVisitor = () => {
    if (!newVisitor.name || !newVisitor.mobile) return;
    const v = {
      id: `VP-${Math.floor(100 + Math.random() * 900)}`,
      name: newVisitor.name,
      mobile: newVisitor.mobile,
      relation: newVisitor.relation,
      date: newVisitor.date,
      time: `${newVisitor.time} onwards`,
      status: "Approved",
    };
    setVisitors([v, ...visitors]);
    setNewVisitor({ name: "", mobile: "", relation: "Friend", date: "2025-07-29", time: "16:00" });
    setShowVisitorModal(false);
  };

  const handleAddGatePass = () => {
    if (!newPass.destination) return;
    const gp = {
      id: `GP-${Math.floor(100 + Math.random() * 900)}`,
      type: "Outing Pass",
      destination: newPass.destination,
      departure: newPass.departure || "Today",
      return: newPass.returnDate || "Tomorrow",
      status: "Approved",
    };
    setGatePasses([gp, ...gatePasses]);
    setNewPass({ destination: "", departure: "", returnDate: "", reason: "" });
    setShowGatePassModal(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      {/* HEADER */}
      <header className={`sticky top-0 z-30 px-4 md:px-8 py-3.5 border-b backdrop-blur-md flex items-center justify-between ${darkMode ? "bg-[#2B2725]/90 border-[#4A433F]" : "bg-[#FFFDFB]/90 border-[#E6D7CA]"}`}>
        <button
          type="button"
          onClick={() => navigate("landing")}
          aria-label="Go to RoomBae homepage"
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity text-left"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
          >
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base md:text-lg leading-tight">RoomBae Resident Portal</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${darkMode ? "bg-[#332D2B] text-[#C89A4B] border border-[#4A433F]" : "bg-[#F8EEE5] text-[#C58B63] border border-[#E6D7CA]"}`}>
                RES1001
              </span>
            </div>
            <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
              Sunrise PG Homes — Room 202A (Bed 1)
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <BackButton />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => navigate("auth")}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${darkMode ? "border-[#4A433F] text-[#C6B9AE] hover:bg-[#332D2B]" : "border-[#E6D7CA] text-[#6E5A52] hover:bg-[#F8EEE5]"}`}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* SIDEBAR TABS */}
        <aside className={`w-full md:w-64 flex-shrink-0 luxury-card p-3 flex flex-row md:flex-col gap-1.5 overflow-x-auto mobile-scroll-x ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
          {[
            { id: "overview", label: "Dashboard", icon: Home },
            { id: "profile", label: "My Profile & KYC", icon: User },
            { id: "room", label: "Room & Roommates", icon: Users },
            { id: "billing", label: "Rent & Invoices", icon: CreditCard },
            { id: "maintenance", label: "Maintenance", icon: Wrench },
            { id: "visitors", label: "Visitor Passes", icon: QrCode },
            { id: "meals", label: "Meal Menu", icon: Utensils },
            { id: "gatepass", label: "Outing Gate Pass", icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as Tab)}
                aria-pressed={isActive}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all text-left ${
                  isActive
                    ? darkMode
                      ? "bg-[#C89A4B] text-[#1D1B1A] shadow-md font-bold"
                      : "bg-[#D9A87C] text-white shadow-md font-bold"
                    : darkMode
                      ? "text-[#C6B9AE] hover:bg-[#2B2725]"
                      : "text-[#6E5A52] hover:bg-[#F8EEE5]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* TAB CONTENTS */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Rent Due Banner */}
              <div className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${darkMode ? "bg-gradient-to-r from-[#332D2B] to-[#2B2725] border-[#4A433F]" : "bg-gradient-to-r from-[#FFFDFB] to-[#F8EEE5] border-[#E6D7CA]"}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      Rent Due Soon
                    </span>
                    <span className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>August 2025</span>
                  </div>
                  <h2 className="text-2xl font-black">₹12,000 / month</h2>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Due date: 05 Aug 2025 · Double Sharing Bed 1</p>
                </div>
                <button
                  onClick={() => setShowPayModal(true)}
                  className="luxury-btn-primary px-6 py-3 text-sm font-bold flex-shrink-0"
                >
                  Pay Rent Now
                </button>
              </div>

              {/* Quick Actions Grid */}
              <div>
                <h3 className="font-bold text-sm mb-3">Quick Resident Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Pay Rent", icon: CreditCard, action: () => setShowPayModal(true) },
                    { label: "Raise Ticket", icon: Wrench, action: () => setShowComplaintModal(true) },
                    { label: "Visitor Pass", icon: QrCode, action: () => setShowVisitorModal(true) },
                    { label: "Request Pass", icon: Calendar, action: () => setShowGatePassModal(true) },
                  ].map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.label}
                        onClick={act.action}
                        className={`luxury-card p-4 flex flex-col items-center justify-center text-center gap-2 hover:scale-[1.03] transition-all cursor-pointer ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                          style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Room Summary */}
                <div className={`luxury-card p-5 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                  <h3 className="font-bold text-sm mb-3 flex items-center justify-between">
                    <span>Room Details</span>
                    <span className="text-xs font-normal text-emerald-600 font-semibold">Active Stay</span>
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Property</span>
                      <span className="font-semibold">Sunrise PG Homes</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Room &amp; Bed</span>
                      <span className="font-semibold">Room 202A (Bed 1)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Sharing</span>
                      <span className="font-semibold">Double Sharing</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Roommate</span>
                      <span className="font-semibold">Rajesh Kumar (Bed 2)</span>
                    </div>
                  </div>
                </div>

                {/* Notice Board */}
                <div className={`luxury-card p-5 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>PG Announcements</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-[#2B2725]" : "bg-[#F8EEE5]"}`}>
                      <p className="font-bold">Water Tank Maintenance</p>
                      <p className={`mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Water supply will be paused from 10 AM - 12 PM tomorrow for tank cleaning.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Posted 2 hours ago</span>
                    </div>
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-[#2B2725]" : "bg-[#F8EEE5]"}`}>
                      <p className="font-bold">Sunday Special Lunch</p>
                      <p className={`mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Special Biryani &amp; Paneer Tikka served from 1:00 PM onwards.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Yesterday</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE & KYC */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                  >
                    AJ
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-2xl font-black">Ankit Joshi</h2>
                      <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> KYC Verified
                      </span>
                    </div>
                    <p className={`text-sm mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Software Engineer at TechCorp · Resident since Aug 2024
                    </p>
                    <p className="text-xs font-mono text-amber-600 dark:text-amber-400 mt-1">ID: RES1001</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm mb-3">Personal &amp; Contact Info</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Mobile</span>
                        <span className="font-semibold">+91 98765 43210</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Email</span>
                        <span className="font-semibold">ankit.joshi@example.com</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Gender &amp; DOB</span>
                        <span className="font-semibold">Male · 14 May 1998</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Blood Group</span>
                        <span className="font-semibold">O+</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm mb-3">Emergency &amp; Guardian Contact</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Guardian Name</span>
                        <span className="font-semibold">Ramesh Joshi (Father)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Emergency Phone</span>
                        <span className="font-semibold">+91 98765 00000</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Permanent Address</span>
                        <span className="font-semibold">Civil Lines, New Delhi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Vault */}
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <h3 className="font-bold text-base mb-4 flex items-center justify-between">
                  <span>KYC Document Vault</span>
                  <span className="text-xs text-slate-400">Verified by Owner</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: "Aadhaar Card", file: "aadhaar_verified.pdf" },
                    { title: "PAN Card", file: "pan_card.jpg" },
                    { title: "Digital Rental Agreement", file: "agreement_2024.pdf" },
                  ].map((doc) => (
                    <div key={doc.title} className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div>
                        <FileText className={`w-6 h-6 mb-2 ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`} />
                        <p className="font-bold text-xs">{doc.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{doc.file}</p>
                      </div>
                      <button
                        onClick={() => setShowDocModal(doc.title)}
                        className="mt-3 flex items-center gap-1 text-xs font-semibold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Document
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOM & ROOMMATES */}
          {activeTab === "room" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black">Room 202A — Sunrise PG Homes</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>2nd Floor · Double Sharing Room</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-3 py-1 rounded-full">
                    Bed 1 Assigned
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {/* Roommate 1 - Current User */}
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name="Ankit Joshi" initials="AJ" size="lg" />
                      <div>
                        <p className="font-bold text-sm">Ankit Joshi (You)</p>
                        <p className="text-xs text-slate-400">Bed 202A-1 · Software Engineer</p>
                      </div>
                    </div>
                  </div>

                  {/* Roommate 2 */}
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name="Rajesh Kumar" initials="RK" size="lg" />
                      <div>
                        <p className="font-bold text-sm">Rajesh Kumar</p>
                        <p className="text-xs text-slate-400">Bed 202A-2 · Product Manager</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Included Amenities */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-sm mb-3">Room Amenities Included</h3>
                  <div className="flex flex-wrap gap-2">
                    {["High Speed WiFi 100Mbps", "Air Conditioner (AC)", "Attached Bathroom", "Daily Housekeeping", "Private Cupboard with Lock", "Geyser 24/7"].map((am) => (
                      <span key={am} className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RENT & BILLING */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black">Rent &amp; Payment Invoices</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Review payment history and download digital tax receipts</p>
                  </div>
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="luxury-btn-primary px-5 py-2.5 text-xs font-bold"
                  >
                    Pay Pending Rent
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? "border-[#4A433F] text-[#C6B9AE]" : "border-[#E6D7CA] text-[#6E5A52]"}`}>
                        <th className="pb-3">Invoice ID</th>
                        <th className="pb-3">Billing Month</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Due Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { id: "INV-2025-08", month: "August 2025", amount: 12000, due: "05 Aug 2025", status: "Due" },
                        { id: "INV-2025-07", month: "July 2025", amount: 12000, due: "05 Jul 2025", status: "Paid" },
                        { id: "INV-2025-06", month: "June 2025", amount: 12000, due: "05 Jun 2025", status: "Paid" },
                      ].map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 font-mono font-bold">{inv.id}</td>
                          <td className="py-3.5 font-medium">{inv.month}</td>
                          <td className="py-3.5 font-bold">₹{inv.amount.toLocaleString()}</td>
                          <td className="py-3.5">{inv.due}</td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            {inv.status === "Paid" ? (
                              <button
                                onClick={() => setShowReceiptModal(inv)}
                                className="flex items-center gap-1 ml-auto text-xs font-semibold hover:underline"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowPayModal(true)}
                                className="luxury-btn-primary px-3 py-1 text-[11px]"
                              >
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MAINTENANCE & COMPLAINTS */}
          {activeTab === "maintenance" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black">Maintenance &amp; Support Tickets</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Raise tickets for room maintenance, WiFi, or housekeeping</p>
                  </div>
                  <button
                    onClick={() => setShowComplaintModal(true)}
                    className="luxury-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Raise Ticket
                  </button>
                </div>

                <div className="space-y-4">
                  {complaints.map((item) => (
                    <div key={item.id} className={`p-4 rounded-xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">{item.id} · {item.category}</span>
                          <h3 className="font-bold text-sm leading-tight mt-0.5">{item.title}</h3>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.status === "Resolved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className={`text-xs mb-2 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>{item.desc}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span>Submitted on {item.date}</span>
                        <span>Estimated resolution: Within 24 hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: VISITORS */}
          {activeTab === "visitors" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black">Pre-Approve Visitor Passes</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Generate QR entry passes for friends &amp; family</p>
                  </div>
                  <button
                    onClick={() => setShowVisitorModal(true)}
                    className="luxury-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Visitor Pass
                  </button>
                </div>

                <div className="space-y-3">
                  {visitors.map((v) => (
                    <div key={v.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">{v.name}</h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">{v.status}</span>
                        </div>
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>{v.relation} · {v.mobile}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Visit Date: {v.date} ({v.time})</p>
                      </div>
                      <button
                        onClick={() => setShowQrModal(v)}
                        className="luxury-btn-primary px-3 py-2 text-xs font-bold flex items-center gap-1"
                      >
                        <QrCode className="w-4 h-4" /> QR Pass
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MEALS */}
          {activeTab === "meals" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black">Weekly PG Meal Menu</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Check today's breakfast, lunch, and dinner timetable</p>
                  </div>

                  <button
                    onClick={() => setSkipMeal(!skipMeal)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      skipMeal
                        ? "bg-amber-600 text-white border-amber-600"
                        : darkMode
                          ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE]"
                          : "bg-[#F8EEE5] border-[#E6D7CA] text-[#3B2A24]"
                    }`}
                  >
                    {skipMeal ? "✓ Opted Out Today's Lunch" : "Opt-Out / Skip Today's Meal"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: "Breakfast (7:30 AM - 9:30 AM)", item: "Aloo Paratha, Curd, Tea / Coffee, Fruit" },
                    { title: "Lunch (12:30 PM - 2:30 PM)", item: "Shahi Paneer, Dal Tadka, Rice, Roti, Salad" },
                    { title: "Dinner (7:30 PM - 9:30 PM)", item: "Chicken Curry / Kadhai Veg, Rice, Gulab Jamun" },
                  ].map((m) => (
                    <div key={m.title} className={`p-4 rounded-xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <h3 className="font-bold text-xs mb-2 text-amber-600 dark:text-amber-400">{m.title}</h3>
                      <p className="text-sm font-semibold mb-1">{m.item}</p>
                      <span className="text-[10px] text-slate-400">Included in PG Rent</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: GATE PASS / LEAVE */}
          {activeTab === "gatepass" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black">Outing &amp; Night-Out Gate Passes</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Apply for night-out leave approval from warden</p>
                  </div>
                  <button
                    onClick={() => setShowGatePassModal(true)}
                    className="luxury-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Request Gate Pass
                  </button>
                </div>

                <div className="space-y-3">
                  {gatePasses.map((gp) => (
                    <div key={gp.id} className={`p-4 rounded-xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold">{gp.id} · {gp.type}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">{gp.status}</span>
                      </div>
                      <p className="font-bold text-sm">{gp.destination}</p>
                      <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Departure: {gp.departure} · Expected Return: {gp.return}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RENT PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-md p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg">Pay August Rent</h3>
              <button onClick={() => setShowPayModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div className={`p-4 rounded-xl ${darkMode ? "bg-[#2B2725]" : "bg-[#F8EEE5]"}`}>
                <p className="text-slate-400">Total Monthly Amount</p>
                <p className="text-2xl font-black mt-0.5">₹12,000</p>
                <p className="text-[10px] text-slate-400 mt-1">Sunrise PG Homes · Room 202A</p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Payment Mode</label>
                <select className="w-full luxury-input">
                  <option>Instant UPI (GooglePay / PhonePe / Paytm)</option>
                  <option>Credit / Debit Card</option>
                  <option>Net Banking</option>
                </select>
              </div>

              <button
                onClick={() => {
                  alert("Payment of ₹12,000 processed successfully! Invoice updated.");
                  setShowPayModal(false);
                }}
                className="w-full luxury-btn-primary py-3.5 font-bold text-sm mt-2"
              >
                Confirm &amp; Pay ₹12,000
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-md p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg">Raise Maintenance Ticket</h3>
              <button onClick={() => setShowComplaintModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                  className="w-full luxury-input"
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>WiFi / Internet</option>
                  <option>Housekeeping</option>
                  <option>Food / Dining</option>
                  <option>Appliance / AC</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  className="w-full luxury-input"
                  placeholder="e.g. Geyser not heating water"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={newComplaint.desc}
                  onChange={(e) => setNewComplaint({ ...newComplaint, desc: e.target.value })}
                  className="w-full luxury-input"
                  placeholder="Explain issue details..."
                />
              </div>
              <button
                onClick={handleAddComplaint}
                className="w-full luxury-btn-primary py-3 font-bold text-sm"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISITOR MODAL */}
      {showVisitorModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-md p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg">Pre-Approve Visitor</h3>
              <button onClick={() => setShowVisitorModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                  className="w-full luxury-input"
                  placeholder="Visitor name"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Visitor Mobile *</label>
                <input
                  type="tel"
                  value={newVisitor.mobile}
                  onChange={(e) => setNewVisitor({ ...newVisitor, mobile: e.target.value })}
                  className="w-full luxury-input"
                  placeholder="10-digit phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={newVisitor.date}
                    onChange={(e) => setNewVisitor({ ...newVisitor, date: e.target.value })}
                    className="w-full luxury-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Time</label>
                  <input
                    type="time"
                    value={newVisitor.time}
                    onChange={(e) => setNewVisitor({ ...newVisitor, time: e.target.value })}
                    className="w-full luxury-input"
                  />
                </div>
              </div>
              <button
                onClick={handleAddVisitor}
                className="w-full luxury-btn-primary py-3 font-bold text-sm"
              >
                Generate Visitor Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GATE PASS MODAL */}
      {showGatePassModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-md p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg">Request Night-Out Gate Pass</h3>
              <button onClick={() => setShowGatePassModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Destination Address *</label>
                <input
                  type="text"
                  value={newPass.destination}
                  onChange={(e) => setNewPass({ ...newPass, destination: e.target.value })}
                  className="w-full luxury-input"
                  placeholder="e.g. Home (Civil Lines)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={newPass.departure}
                    onChange={(e) => setNewPass({ ...newPass, departure: e.target.value })}
                    className="w-full luxury-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Return Date</label>
                  <input
                    type="date"
                    value={newPass.returnDate}
                    onChange={(e) => setNewPass({ ...newPass, returnDate: e.target.value })}
                    className="w-full luxury-input"
                  />
                </div>
              </div>
              <button
                onClick={handleAddGatePass}
                className="w-full luxury-btn-primary py-3 font-bold text-sm"
              >
                Submit Gate Pass Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR PASS MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-sm p-6 text-center ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <h3 className="font-black text-base mb-1">Digital Visitor Entry Pass</h3>
            <p className="text-xs text-slate-400 mb-4">{showQrModal.name} · {showQrModal.relation}</p>
            <div className="w-48 h-48 mx-auto bg-white p-4 rounded-2xl flex items-center justify-center border shadow-inner mb-4">
              <QrCode className="w-40 h-40 text-slate-900" />
            </div>
            <p className="text-[11px] font-mono text-slate-400 mb-4">Pass ID: {showQrModal.id}</p>
            <button
              onClick={() => setShowQrModal(null)}
              className="w-full luxury-btn-primary py-2.5 font-bold text-xs"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-lg p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{showDocModal}</h3>
              <button onClick={() => setShowDocModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center mb-4">
              <FileText className="w-12 h-12 mb-2 text-[#D9A87C]" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Verified KYC Copy ({showDocModal})</p>
              <p className="text-xs text-slate-400 mt-1">Encrypted and securely stored in Document Vault</p>
            </div>
            <button
              onClick={() => setShowDocModal(null)}
              className="w-full luxury-btn-primary py-2.5 font-bold text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-md p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base">Payment Receipt — {showReceiptModal.month}</h3>
              <button onClick={() => setShowReceiptModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Ref</span>
                <span className="font-mono font-bold">{showReceiptModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-bold text-emerald-600">₹{showReceiptModal.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-600">Paid via Instant UPI</span>
              </div>
            </div>
            <button
              onClick={() => {
                alert("Receipt PDF downloaded to device.");
                setShowReceiptModal(null);
              }}
              className="w-full luxury-btn-primary py-2.5 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Save Receipt PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
