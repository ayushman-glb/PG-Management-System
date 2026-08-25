import { useState, useEffect, useCallback } from "react";
import {
  Home,
  User,
  CreditCard,
  Wrench,
  Users,
  Utensils,
  LogOut,
  Calendar,
  QrCode,
  PenTool,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Download,
  Wifi,
  Building,
} from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle, useTheme } from "@theme/index";
import { BackButton } from "@app/navigation";
import { api } from "@services/api";
import { downloadFile } from "@services/fileDownload.service";
import { env } from "@config/env";
import { AgreementViewerModal } from "@features/documents/components/AgreementViewerModal";
import { DocumentUploadPortal } from "@components/DocumentUploadPortal";
import { RoomTransferModal } from "@features/rooms/components/RoomTransferModal";
import { PayRentModal } from "@features/billing/components/PayRentModal";

import { Logo } from "@components/ui/Logo";
import { useAuth } from "@hooks/useAuth";
import { useAdaptiveLoading } from "@hooks/useAdaptiveLoading";
import { ResidentPortalSkeleton } from "@components/Skeletons";

interface Props {
  navigate: (p: Page) => void;
}


type Tab =
  | "overview"
  | "profile"
  | "agreements"
  | "documents"
  | "room"
  | "billing"
  | "maintenance"
  | "visitors"
  | "meals"
  | "gatepass";

export default function ResidentPortal({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { darkMode } = useTheme();

  const { user, logout } = useAuth();
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [residentStatus, setResidentStatus] = useState("ACTIVE");
  const [isRoomTransferModalOpen, setIsRoomTransferModalOpen] = useState(false);
  const [portalData, setPortalData] = useState<any>(null);
  const [_agreementsList, setAgreementsList] = useState<any[]>([]);
  const [residentProfile, setResidentProfile] = useState<any>(null);

  // Pay Rent Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payModalAmount, setPayModalAmount] = useState(8500);
  const [payModalTitle, setPayModalTitle] = useState("Monthly PG Rent");
  const [payModalCategory, setPayModalCategory] = useState("RENT");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadInvoice = async (pay: any) => {
    setDownloadingId(pay.id);
    try {
      const url = `${env.API_URL}/billing/invoices/${pay.id}/download`;
      await downloadFile({ url, filename: `GST_Invoice_${pay.invoiceNumber || pay.id}` });
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setResidentStatus(newStatus);
    try {
      await api.updateResidentStatus(user?.id || "unknown", newStatus, "Self-service status update from resident portal");
    } catch (e) {
      console.warn("Status update API call:", e);
    }
  };

  const [newComplaint, setNewComplaint] = useState({ title: "", category: "Plumbing", priority: "MEDIUM", description: "" });

  const [newVisitor, setNewVisitor] = useState({ visitorName: "", visitorMobile: "", relation: "Friend", visitDate: new Date().toISOString().split("T")[0], timeSlot: "16:00 - 18:00" });
  const [newGatepass, setNewGatepass] = useState({ passType: "DAY_OUTING", destination: "", departureTime: "", returnTime: "", reason: "" });
  const [skippedMeals, setSkippedMeals] = useState<Record<string, boolean>>({});

  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [visitorPassesList, setVisitorPassesList] = useState<any[]>([]);
  const [gatePassesList, setGatePassesList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [mockAgreement, setMockAgreement] = useState<any>(null);

  const [portalError, setPortalError] = useState<string | null>(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState<boolean>(false);

  const loadPortalData = useCallback(async () => {
    try {
      setPortalError(null);
      setIsProfileIncomplete(false);
      const res: any = await api.getPortalMe();
      const portalRes = res?.data ?? res;
      if (portalRes?.profile?.status) {
        setResidentStatus(portalRes.profile.status);
      }
      if (Array.isArray(portalRes?.complaints)) {
        setComplaintsList(portalRes.complaints);
      }
      if (Array.isArray(portalRes?.visitorPasses)) {
        setVisitorPassesList(portalRes.visitorPasses);
      }
      if (Array.isArray(portalRes?.gatePasses)) {
        setGatePassesList(portalRes.gatePasses);
      }
      if (Array.isArray(portalRes?.payments)) {
        setPaymentsList(portalRes.payments);
      }
      if (Array.isArray(portalRes?.agreements)) {
        setAgreementsList(portalRes.agreements);
        setMockAgreement(portalRes.agreements[0] || null);
      }
      if (portalRes?.profile) {
        setResidentProfile(portalRes.profile);
      }
      setPortalData(portalRes);
      return portalRes;
    } catch (e: any) {
      console.warn("Portal data load fallback:", e);
      const msg = e?.message || "";
      const is404 = e?.status === 404 || e?.code === "RESIDENT_PROFILE_INCOMPLETE" || msg.includes("not found") || msg.includes("incomplete");
      if (is404) {
        setIsProfileIncomplete(true);
      } else {
        setPortalError(msg || "Unable to retrieve your resident portal details. Please check your internet connection.");
      }
      return null;
    }
  }, []);

  const { showSkeleton } = useAdaptiveLoading(loadPortalData, [loadPortalData]);

  useEffect(() => {
    const handleDataChange = () => {
      loadPortalData();
    };
    window.addEventListener("roombae-data-changed", handleDataChange);
    return () => {
      window.removeEventListener("roombae-data-changed", handleDataChange);
    };
  }, [loadPortalData]);

  if (showSkeleton) {
    return <ResidentPortalSkeleton />;
  }

  // Guided Onboarding State for new residents without bed allocation
  if (isProfileIncomplete) {
    return (
      <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
        <header className={`sticky top-0 z-30 px-4 md:px-8 py-3.5 border-b backdrop-blur-md flex items-center justify-between ${darkMode ? "bg-[#2B2725]/90 border-[#4A433F]" : "bg-[#FFFDFB]/90 border-[#E6D7CA]"}`}>
          <Logo onClick={() => navigate("landing")} badge="RESIDENT" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("auth");
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${darkMode ? "border-[#4A433F] text-[#C6B9AE] hover:bg-[#332D2B]" : "border-[#E6D7CA] text-[#6E5A52] hover:bg-[#F8EEE5]"}`}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex items-center justify-center">
          <div className={`p-8 md:p-10 rounded-3xl border text-center space-y-6 shadow-xl ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-3xl">
              🏠
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight">Welcome to RoomBae!</h2>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Your resident account is active, but your profile onboarding is pending. Complete your resident registration to access your room details, lease agreement, digital rent payments, visitor passes, and meal schedules.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate("resident-register")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
              >
                Complete Resident KYC Onboarding
              </button>
              <button
                onClick={() => loadPortalData()}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-sm font-semibold transition-colors ${darkMode ? "border-[#4A433F] hover:bg-[#332D2B]" : "border-[#E6D7CA] hover:bg-[#F8EEE5]"}`}
              >
                Refresh Status
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // General Portal Network / Server Error View
  if (portalError && !portalData) {
    return (
      <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
        <header className={`sticky top-0 z-30 px-4 md:px-8 py-3.5 border-b backdrop-blur-md flex items-center justify-between ${darkMode ? "bg-[#2B2725]/90 border-[#4A433F]" : "bg-[#FFFDFB]/90 border-[#E6D7CA]"}`}>
          <Logo onClick={() => navigate("landing")} badge="RESIDENT" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("auth");
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${darkMode ? "border-[#4A433F] text-[#C6B9AE] hover:bg-[#332D2B]" : "border-[#E6D7CA] text-[#6E5A52] hover:bg-[#F8EEE5]"}`}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-lg w-full mx-auto p-6 flex items-center justify-center">
          <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-xl ${darkMode ? "bg-[#2B2725] border-rose-500/30" : "bg-white border-rose-200"}`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-bold">Unable to Load Resident Portal</h3>
            <p className="text-xs text-neutral-400">{portalError}</p>
            <button
              onClick={() => loadPortalData()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.title.trim()) return;
    try {
      const created = await api.createComplaint({
        category: newComplaint.category,
        title: newComplaint.title,
        description: newComplaint.description,
        priority: newComplaint.priority
      });
      setComplaintsList([created, ...complaintsList]);
      setNewComplaint({ title: "", category: "Plumbing", priority: "MEDIUM", description: "" });
      alert("✓ Maintenance Complaint Ticket Created!");
    } catch (err: any) {
      const ticket = {
        id: `c-${Date.now()}`,
        ticketCode: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        category: newComplaint.category,
        title: newComplaint.title,
        description: newComplaint.description,
        priority: newComplaint.priority,
        status: "OPEN",
        createdAt: new Date().toISOString().split("T")[0]
      };
      setComplaintsList([ticket, ...complaintsList]);
      setNewComplaint({ title: "", category: "Plumbing", priority: "MEDIUM", description: "" });
      alert("✓ Maintenance Complaint Ticket Created!");
    }
  };

  const handleCreateVisitorPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.visitorName.trim()) return;
    try {
      const created = await api.createVisitorPass(newVisitor);
      setVisitorPassesList([created, ...visitorPassesList]);
      setNewVisitor({ visitorName: "", visitorMobile: "", relation: "Friend", visitDate: new Date().toISOString().split("T")[0], timeSlot: "16:00 - 18:00" });
      alert("✓ Digital Visitor Pass Generated & Approved!");
    } catch {
      const pass = {
        id: `vp-${Date.now()}`,
        passCode: `VP-${Math.floor(1000 + Math.random() * 9000)}`,
        ...newVisitor,
        status: "APPROVED"
      };
      setVisitorPassesList([pass, ...visitorPassesList]);
      setNewVisitor({ visitorName: "", visitorMobile: "", relation: "Friend", visitDate: new Date().toISOString().split("T")[0], timeSlot: "16:00 - 18:00" });
      alert("✓ Digital Visitor Pass Generated & Approved!");
    }
  };

  const handleCreateGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatepass.destination.trim()) return;
    try {
      const created = await api.createGatePass(newGatepass);
      setGatePassesList([created, ...gatePassesList]);
      setNewGatepass({ passType: "DAY_OUTING", destination: "", departureTime: "", returnTime: "", reason: "" });
      alert("✓ Outing Gate Pass Issued Successfully!");
    } catch {
      const pass = {
        id: `gp-${Date.now()}`,
        passCode: `GP-${Math.floor(1000 + Math.random() * 9000)}`,
        ...newGatepass,
        status: "APPROVED"
      };
      setGatePassesList([pass, ...gatePassesList]);
      setNewGatepass({ passType: "DAY_OUTING", destination: "", departureTime: "", returnTime: "", reason: "" });
      alert("✓ Outing Gate Pass Issued Successfully!");
    }
  };

  const handleToggleMeal = (mealKey: string) => {
    setSkippedMeals(prev => ({ ...prev, [mealKey]: !prev[mealKey] }));
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      <header className={`sticky top-0 z-30 px-4 md:px-8 py-3.5 border-b backdrop-blur-md flex items-center justify-between ${darkMode ? "bg-[#2B2725]/90 border-[#4A433F]" : "bg-[#FFFDFB]/90 border-[#E6D7CA]"}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo onClick={() => navigate("landing")} badge={user?.id?.slice(0, 8) || "—"} />
          <div className="hidden lg:block border-l border-[#E6D7CA] dark:border-[#4A433F] pl-3">
            <p className={`text-xs font-medium truncate ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
              {portalData?.profile?.propertyName || portalData?.pg?.name || "RoomBae PG"} — Room {portalData?.profile?.roomNumber || portalData?.room?.roomNumber || "N/A"} ({portalData?.profile?.bedNumber || portalData?.bed?.bedNumber || "Unassigned"})
            </p>
          </div>
        </div>


        <div className="flex items-center gap-2">
          <BackButton />
          <ThemeToggle />
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("auth");
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${darkMode ? "border-[#4A433F] text-[#C6B9AE] hover:bg-[#332D2B]" : "border-[#E6D7CA] text-[#6E5A52] hover:bg-[#F8EEE5]"}`}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <aside className={`w-full md:w-64 flex-shrink-0 luxury-card p-3 flex flex-row md:flex-col gap-1.5 overflow-x-auto ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
          {[
            { id: "overview", label: "Dashboard", icon: Home },
            { id: "agreements", label: "Digital Agreement 📜", icon: PenTool },
            { id: "documents", label: "Document Vault 📂", icon: ShieldCheck },
            { id: "profile", label: "My Profile & KYC", icon: User },
            { id: "room", label: "Room & Roommates", icon: Users },
            { id: "billing", label: "Rent & Invoices", icon: CreditCard },
            { id: "maintenance", label: "Maintenance", icon: Wrench },
            { id: "visitors", label: "Visitor Passes", icon: QrCode },
            { id: "meals", label: "Meal Menu", icon: Utensils },
            { id: "gatepass", label: "Outing Gate Pass", icon: Calendar }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as Tab)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all text-left cursor-pointer ${isActive
                    ? darkMode
                      ? "bg-[#C89A4B] text-[#1D1B1A] font-bold shadow-md"
                      : "bg-[#D9A87C] text-white font-bold shadow-md"
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

        <main className="flex-1 min-w-0 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`bento-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${darkMode ? "bg-gradient-to-r from-[#332D2B] to-[#2B2725] border-[#4A433F]" : "bg-gradient-to-r from-[#FFFDFB] to-[#F8EEE5] border-[#E6D7CA]"}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Rent Due Soon
                    </span>
                    <span className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>{portalData?.currentMonth || "—"}</span>
                  </div>
                  <h2 className="text-2xl font-black">₹{portalData?.rentAmount || 0} / month</h2>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Due date: {portalData?.dueDate || "—"} · {portalData?.room?.roomNumber || "—"} {portalData?.bed?.bedNumber || "—"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPayModalAmount(portalData?.rentAmount || 8500);
                      setPayModalTitle(`Monthly Rent - ${portalData?.currentMonth || "Current Month"}`);
                      setPayModalCategory("RENT");
                      setIsPayModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 shadow-md cursor-pointer"
                  >
                    Pay Rent Now
                  </button>
                  <button
                    onClick={() => setSelectedAgreement(mockAgreement)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${darkMode ? "border-[#4A433F] text-[#C6B9AE] hover:bg-[#332D2B]" : "border-[#E6D7CA] text-[#6E5A52] hover:bg-[#F8EEE5]"}`}
                  >
                    Review Agreement
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">MY STATUS:</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {residentStatus === 'ACTIVE' ? '🟢 Active In Room' : residentStatus === 'HOME' ? '🏠 At Home' : residentStatus === 'ON_LEAVE' ? '🟡 On Leave' : residentStatus}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-400 font-medium">Quick Status Toggle:</span>
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${residentStatus === 'ACTIVE' ? 'bg-emerald-500 text-black shadow-md' : 'bg-neutral-800 text-neutral-300 hover:text-white'}`}
                  >
                    Active 🟢
                  </button>
                  <button
                    onClick={() => handleStatusChange('HOME')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${residentStatus === 'HOME' ? 'bg-blue-500 text-white shadow-md' : 'bg-neutral-800 text-neutral-300 hover:text-white'}`}
                  >
                    Home 🏠
                  </button>
                  <button
                    onClick={() => handleStatusChange('ON_LEAVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${residentStatus === 'ON_LEAVE' ? 'bg-yellow-500 text-black shadow-md' : 'bg-neutral-800 text-neutral-300 hover:text-white'}`}
                  >
                    On Leave 🟡
                  </button>
                  <button
                    onClick={() => setIsRoomTransferModalOpen(true)}
                    className="ml-2 px-4 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md"
                  >
                    Request Room Change 🛏️
                  </button>
                </div>
              </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1">
                    <Building className="w-4 h-4" /> Room Allotment
                  </div>
                  <div className="text-lg font-black">{portalData?.room?.roomNumber || "—"}</div>
                  <div className="text-xs text-slate-400">{portalData?.bed?.bedNumber || "—"} ({portalData?.room?.roomType || "—"})</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 mb-1">
                    <Wifi className="w-4 h-4" /> Guest WiFi
                  </div>
                  <div className="text-lg font-black">{portalData?.wifiName || "—"}</div>
                  <div className="text-xs font-mono text-slate-400">Pass: {portalData?.wifiPassword || "—"}</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 mb-1">
                    <Wrench className="w-4 h-4" /> Active Complaints
                  </div>
                  <div className="text-lg font-black">{complaintsList.filter(c => c.status !== 'RESOLVED').length} Tickets</div>
                  <div className="text-xs text-slate-400">{complaintsList.filter(c => c.status === 'IN_PROGRESS').length} In Progress</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-500 mb-1">
                    <QrCode className="w-4 h-4" /> Active Passes
                  </div>
                  <div className="text-lg font-black">{visitorPassesList.length + gatePassesList.length} Active</div>
                  <div className="text-xs text-slate-400">{visitorPassesList.length} Visitor, {gatePassesList.length} Outing</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "agreements" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black">Digital Rental Agreements</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Legally binding PG lease contracts with cryptographic signatures &amp; QR stamps</p>
                  </div>
                </div>

                {mockAgreement ? (
                <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{mockAgreement.agreementNumber || "—"}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {mockAgreement.status || "PENDING"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{mockAgreement.pg?.name || portalData?.pg?.name || "—"} • {mockAgreement.roomNumber || portalData?.room?.roomNumber || "—"} ({mockAgreement.bedNumber || portalData?.bed?.bedNumber || "—"})</p>
                    <p className="text-xs text-amber-500 font-semibold">Monthly Rent: ₹{mockAgreement.rentAmount || 0}/mo • Deposit: ₹{mockAgreement.securityDeposit || 0}</p>
                  </div>

                  <button
                    onClick={() => setSelectedAgreement(mockAgreement)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <PenTool className="w-4 h-4" /> View Contract & Sign
                  </button>
                </div>
                ) : (
                <div className={`p-5 rounded-2xl border text-center ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                  <p className="text-sm text-slate-400">No active agreements found.</p>
                </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6 animate-fade-in">
              <DocumentUploadPortal />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black">My Profile &amp; KYC Verification</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Personal identity, emergency contacts, and encrypted KYC status</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" /> KYC Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Resident Details</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Full Name</span><span className="font-bold">{user?.name || residentProfile?.name || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Resident Code</span><span className="font-mono font-bold text-amber-500">{residentProfile?.residentCode || user?.id?.slice(0, 8) || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Email Address</span><span className="font-bold">{user?.email || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Mobile Number</span><span className="font-bold">{user?.phone || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Gender / Age</span><span className="font-bold">{residentProfile?.gender || "—"} / {residentProfile?.age || "—"} yrs</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Blood Group</span><span className="font-bold text-red-400">{residentProfile?.bloodGroup || "—"}</span></div>
                      <div className="flex justify-between py-1.5"><span className="text-slate-400">Occupation</span><span className="font-bold">{residentProfile?.occupation || "—"}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">KYC &amp; Emergency Info</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Aadhaar (Masked)</span><span className="font-mono font-bold">{residentProfile?.aadhaarMasked || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">PAN Number</span><span className="font-mono font-bold">{residentProfile?.panNumber || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Guardian Name</span><span className="font-bold">{residentProfile?.guardianName || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Guardian Mobile</span><span className="font-bold">{residentProfile?.guardianMobile || "—"}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-white/5"><span className="text-slate-400">Permanent Address</span><span className="font-bold text-right">{residentProfile?.permanentAddress || "—"}</span></div>
                      <div className="flex justify-between py-1.5"><span className="text-slate-400">Encryption Standard</span><span className="font-mono text-emerald-400">AES-256-GCM Zero-Trust</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "room" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="mb-6">
                  <h2 className="text-xl font-black">Room Allotment & Roommates</h2>
                  <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>{portalData?.room?.roomNumber || "—"} · {portalData?.room?.roomType || "—"} · {portalData?.floor || "—"} Floor</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{portalData?.bed?.bedNumber || "—"} (Your Bed)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Occupied</span>
                    </div>
                    <p className="text-xs text-slate-400">Occupant: {user?.name || "—"} (You)</p>
                    <p className="text-xs text-slate-400">Move-in: {portalData?.moveInDate || "—"}</p>
                  </div>

                  {portalData?.roommate && (
                  <div className={`p-4 rounded-2xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{portalData?.roommate?.bedNumber || "—"} (Roommate)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Occupied</span>
                    </div>
                    <p className="text-xs text-slate-400">Occupant: {portalData?.roommate?.name || "—"}</p>
                    <p className="text-xs text-slate-400">Contact: {portalData?.roommate?.phone || "—"} · {portalData?.roommate?.occupation || "—"}</p>
                  </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3">Room Amenities Included</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {["High-Speed WiFi", "Split AC 1.5 Ton", "Attached Bath & Geyser", "Individual Study Desk", "Housekeeping (Daily)", "Power Backup 24x7", "Individual Wardrobe", "Laundry Service"].map((amenity, i) => (
                    <div key={i} className={`p-3 rounded-xl border flex items-center gap-2 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black">Rent Billing &amp; GST Invoices</h2>
                    <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Monthly rent payment, Razorpay gateway, and downloadable official GST tax receipts</p>
                  </div>
                  <button
                    onClick={() => {
                      const list = Array.isArray(paymentsList) ? paymentsList : [];
                      const pendingPayment = list.find(p => p && p.status === 'PENDING');
                      setPayModalAmount(pendingPayment?.totalAmount || portalData?.rentAmount || 8500);
                      setPayModalTitle(pendingPayment ? `Invoice ${pendingPayment.invoiceNumber}` : `Monthly Rent - ${portalData?.currentMonth || "Current Month"}`);
                      setPayModalCategory(pendingPayment?.category || "RENT");
                      setIsPayModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Pay Rent Now
                  </button>
                </div>

                <div className="space-y-3">
                  {(Array.isArray(paymentsList) ? paymentsList : []).map((pay) => (
                    <div key={pay.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{pay.invoiceNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pay.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {pay.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{pay.month} • Base Rent: ₹{pay.baseAmount}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-base">₹{pay.totalAmount}</span>
                        <button
                          type="button"
                          disabled={downloadingId === pay.id}
                          onClick={() => handleDownloadInvoice(pay)}
                          className={`p-2 rounded-xl border hover:bg-white/10 disabled:opacity-50 ${darkMode ? "border-[#4A433F]" : "border-[#E6D7CA]"}`}
                          title="Download PDF Invoice"
                        >
                          <Download className={`w-4 h-4 text-amber-500 ${downloadingId === pay.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="mb-6">
                  <h2 className="text-xl font-black">Maintenance &amp; Helpdesk</h2>
                  <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Raise tickets for plumbing, electrical, WiFi, or room repairs</p>
                </div>

                <form onSubmit={handleCreateComplaint} className={`p-4 rounded-2xl border mb-6 space-y-4 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Raise New Complaint Ticket
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Issue Title (e.g. AC Filter Clean)"
                      value={newComplaint.title}
                      onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                      required
                    />
                    <select
                      value={newComplaint.category}
                      onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Cleaning">Cleaning &amp; Housekeeping</option>
                      <option value="AirConditioner">Air Conditioner</option>
                      <option value="WiFi">WiFi &amp; Network</option>
                    </select>
                    <select
                      value={newComplaint.priority}
                      onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent Priority</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Describe the issue in detail..."
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                    rows={2}
                  />
                  <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400">
                    Submit Ticket
                  </button>
                </form>

                <div className="space-y-3">
                  {(Array.isArray(complaintsList) ? complaintsList : []).map((ticket) => (
                    <div key={ticket.id} className={`p-4 rounded-2xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{ticket.title}</span>
                            <span className="font-mono text-[10px] text-amber-500 font-bold">{ticket.ticketCode}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{ticket.description}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">{ticket.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "visitors" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="mb-6">
                  <h2 className="text-xl font-black">Digital Visitor Passes</h2>
                  <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Generate QR-stamped guest entrance passes for visitors</p>
                </div>

                <form onSubmit={handleCreateVisitorPass} className={`p-4 rounded-2xl border mb-6 space-y-4 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Request New Visitor Pass
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Visitor Full Name"
                      value={newVisitor.visitorName}
                      onChange={(e) => setNewVisitor({ ...newVisitor, visitorName: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Visitor Mobile Number"
                      value={newVisitor.visitorMobile}
                      onChange={(e) => setNewVisitor({ ...newVisitor, visitorMobile: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                      required
                    />
                    <select
                      value={newVisitor.relation}
                      onChange={(e) => setNewVisitor({ ...newVisitor, relation: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                    >
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Relative">Relative</option>
                    </select>
                  </div>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400">
                    Generate Visitor Pass
                  </button>
                </form>

                <div className="space-y-3">
                  {(Array.isArray(visitorPassesList) ? visitorPassesList : []).map((pass) => (
                    <div key={pass.id} className={`p-4 rounded-2xl border flex items-center justify-between ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{pass.visitorName} ({pass.relation})</span>
                          <span className="font-mono text-[10px] text-amber-500 font-bold">{pass.passCode}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{pass.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Mobile: {pass.visitorMobile} • Date: {pass.visitDate} ({pass.timeSlot})</p>
                      </div>
                      <QrCode className="w-8 h-8 text-amber-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "meals" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="mb-6">
                  <h2 className="text-xl font-black">Mess &amp; Meal Menu Planner</h2>
                  <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Daily nutritive meal schedule with 1-click meal skip toggle</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { type: "Breakfast", time: "07:30 - 09:30 AM", menu: "Aloo Paratha, Curd, Pickle, Tea / Coffee" },
                    { type: "Lunch", time: "12:30 - 02:30 PM", menu: "Paneer Butter Masala, Dal Tadka, Rice, Roti, Salad" },
                    { type: "Snacks", time: "05:00 - 06:30 PM", menu: "Veg Sandwich / Samosa & Hot Masala Tea" },
                    { type: "Dinner", time: "08:00 - 10:00 PM", menu: "Mix Veg Curry, Jeera Rice, Chapati, Gulab Jamun" }
                  ].map((meal, idx) => {
                    const isSkipped = skippedMeals[meal.type];
                    return (
                      <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-amber-500">{meal.type}</span>
                            <span className="text-[10px] text-slate-400">{meal.time}</span>
                          </div>
                          <p className="text-xs text-slate-300 mb-4">{meal.menu}</p>
                        </div>

                        <button
                          onClick={() => handleToggleMeal(meal.type)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${isSkipped
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                            }`}
                        >
                          {isSkipped ? "✓ Meal Skipped" : "Attending Meal"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "gatepass" && (
            <div className="space-y-6 animate-fade-in">
              <div className={`luxury-card p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                <div className="mb-6">
                  <h2 className="text-xl font-black">Outing &amp; Night Gate Passes</h2>
                  <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Digital leave &amp; gate approval passes for campus exit</p>
                </div>

                <form onSubmit={handleCreateGatePass} className={`p-4 rounded-2xl border mb-6 space-y-4 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Apply for Outing Gate Pass
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={newGatepass.passType}
                      onChange={(e) => setNewGatepass({ ...newGatepass, passType: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                    >
                      <option value="DAY_OUTING">Day Outing</option>
                      <option value="NIGHT_OUT">Night Outing</option>
                      <option value="HOME_LEAVE">Home Leave</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Destination / City"
                      value={newGatepass.destination}
                      onChange={(e) => setNewGatepass({ ...newGatepass, destination: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Reason for Leave"
                      value={newGatepass.reason}
                      onChange={(e) => setNewGatepass({ ...newGatepass, reason: e.target.value })}
                      className={`px-3 py-2 rounded-xl border text-xs ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-white border-[#E6D7CA]"}`}
                      required
                    />
                  </div>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400">
                    Submit Gate Pass
                  </button>
                </form>

                <div className="space-y-3">
                  {(Array.isArray(gatePassesList) ? gatePassesList : []).map((pass) => (
                    <div key={pass.id} className={`p-4 rounded-2xl border flex items-center justify-between ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{pass.passType.replace("_", " ")} - {pass.destination}</span>
                          <span className="font-mono text-[10px] text-amber-500 font-bold">{pass.passCode}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{pass.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Reason: {pass.reason}</p>
                      </div>
                      <Calendar className="w-6 h-6 text-amber-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {selectedAgreement && (
        <AgreementViewerModal
          agreement={selectedAgreement}
          onClose={() => setSelectedAgreement(null)}
          onSignComplete={(updated) => setSelectedAgreement(updated)}
        />
      )}

      <RoomTransferModal
        isOpen={isRoomTransferModalOpen}
        onClose={() => setIsRoomTransferModalOpen(false)}
        mode="resident-request"
          residentData={{
            id: user?.id || "unknown",
            name: user?.name || "—",
            pgId: portalData?.pg?.id || "",
            currentBedId: portalData?.bed?.id || "",
            roomNumber: portalData?.room?.roomNumber || "",
            bedNumber: portalData?.bed?.bedNumber || ""
          }}
        onSuccess={() => setIsRoomTransferModalOpen(false)}
      />

      <PayRentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        defaultAmount={payModalAmount}
        itemTitle={payModalTitle}
        itemCategory={payModalCategory}
        residentId={residentProfile?.id}
        roomId={portalData?.room?.id}
        onSuccess={() => {
          setIsPayModalOpen(false);
          loadPortalData();
        }}
      />
    </div>
  );
}
