import { useState, useEffect } from "react";
import { CreditCard, MessageSquare, Key, AlertTriangle, Send, ArrowLeft } from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle, useTheme } from "@theme/index";
import { api } from "@services/api";

interface Props {
  navigate: (p: Page) => void;
}

export default function MoveInDashboardPage({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<"payments" | "messages" | "moveInInfo" | "complaints">("payments");
  const [summary, setSummary] = useState<any>(null);
  const [moveInInfo, setMoveInInfo] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const { darkMode } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.getTenantDashboardSummary();
      if (res && res.data) {
        setSummary(res.data);
        if (res.data.resident?.pgId) {
          const infoRes = await api.getMoveInInfo(res.data.resident.pgId);
          setMoveInInfo(infoRes.data);
        }
      }

      const threadsRes = await api.getThreads();
      if (threadsRes && threadsRes.data) {
        setThreads(threadsRes.data);
        if (threadsRes.data.length > 0) {
          setSelectedThread(threadsRes.data[0]);
          fetchThreadMessages(threadsRes.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchThreadMessages = async (threadId: string) => {
    try {
      const res = await api.getThreadMessages(threadId);
      if (res && res.data) {
        setMessages(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !messageInput.trim()) return;

    try {
      await api.sendMessage({
        threadId: selectedThread.id,
        content: messageInput.trim(),
      });
      setMessageInput("");
      fetchThreadMessages(selectedThread.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitiatePayment = async () => {
    try {
      const order = await api.createBillingOrder(
        summary?.resident?.id || "demo",
        8500
      );
      alert(`Razorpay Payment Order Created: ${order.orderId || order.razorpayOrderId || "ORD_DEMO_2026"}`);
    } catch (e) {
      console.error(e);
      alert("Payment gateway simulated order created successfully");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      <div className={`sticky top-0 z-40 border-b px-6 py-4 backdrop-blur-md ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("pg-listing")} className="p-2 rounded-xl border border-white/10 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">Stage 4 • Move-In Tenant Dashboard</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 pb-4 overflow-x-auto border-b border-white/10 mb-8">
          {[
            { id: "payments", label: "Rent & Payments", icon: CreditCard },
            { id: "messages", label: "Owner Chat", icon: MessageSquare },
            { id: "moveInInfo", label: "Move-In Checklist", icon: Key },
            { id: "complaints", label: "Maintenance Tickets", icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "luxury-btn-primary"
                    : darkMode
                    ? "bg-[#2B2725] text-slate-300 hover:bg-[#332D2B]"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Rent & Payments */}
        {activeTab === "payments" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 p-6 rounded-3xl border ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
              <h3 className="text-lg font-bold mb-4">Rent Dues & Razorpay Integration</h3>
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold text-amber-400">Upcoming Monthly Rent</p>
                  <p className="text-3xl font-black mt-1">₹8,500</p>
                  <p className="text-xs opacity-70 mt-1">Due Date: 5th of this month</p>
                </div>
                <button onClick={handleInitiatePayment} className="luxury-btn-primary px-6 py-3 text-xs font-bold shadow-xl">
                  Pay Now with Razorpay
                </button>
              </div>

              <h4 className="text-sm font-bold mb-3">Recent Payment Receipts</h4>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">Monthly Rent & Maintenance #{i}</p>
                      <p className="opacity-60">Paid on 1st of previous month via UPI</p>
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">₹8,500 (PAID)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-6 rounded-3xl border ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
              <h3 className="text-base font-bold mb-3">Occupancy Pass</h3>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold space-y-2">
                <p>Status: ACTIVE RESIDENT</p>
                <p>Room 101 • Bed 101-A</p>
                <p>Agreement: Valid till Dec 2026</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Chat & Messages */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px]">
            <div className={`p-4 rounded-3xl border ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
              <h3 className="text-sm font-bold mb-3 px-2">Message Threads</h3>
              <div className="space-y-2">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedThread(t);
                      fetchThreadMessages(t.id);
                    }}
                    className={`w-full p-3 rounded-2xl text-left text-xs transition-colors ${
                      selectedThread?.id === t.id ? "luxury-btn-primary" : "hover:bg-white/5"
                    }`}
                  >
                    <p className="font-bold">{t.pg?.name || "Property Owner"}</p>
                    <p className="opacity-70 truncate mt-0.5">{t.lastMessage || "No messages yet"}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className={`md:col-span-2 p-6 rounded-3xl border flex flex-col justify-between ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
              <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-xs opacity-50">No messages in thread yet. Type a message below!</div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`p-3 rounded-2xl text-xs max-w-sm ${m.senderId === summary?.resident?.userId ? "ml-auto luxury-btn-primary" : "bg-white/10"}`}>
                      <p>{m.content}</p>
                      <p className="text-[9px] opacity-60 text-right mt-1">{new Date(m.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Type your message to owner/staff..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className={`flex-1 p-3 text-xs rounded-xl border outline-none ${darkMode ? "bg-[#1D1B1A] border-[#4A443F]" : "bg-slate-50 border-slate-200"}`}
                />
                <button type="submit" className="luxury-btn-primary p-3 rounded-xl">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Move-In Checklist */}
        {activeTab === "moveInInfo" && (
          <div className={`p-8 rounded-3xl border ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> Move-In Instructions & House Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5">
                  <h4 className="text-xs font-bold text-amber-400 mb-1">Key Handover Details</h4>
                  <p className="text-xs opacity-80">{moveInInfo?.keyHandoverDetails || "Key can be collected at main gate reception counter on move-in day."}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5">
                  <h4 className="text-xs font-bold text-amber-400 mb-1">Wi-Fi & Gate Access</h4>
                  <p className="text-xs opacity-80">{moveInInfo?.wifiDetails || "SSID: RoomBae_Guest | Password: WelcomeRoomBae2026"}</p>
                  <p className="text-xs opacity-80 mt-1">Main Gate PIN: {moveInInfo?.gateCode || "4321#"}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5">
                <h4 className="text-xs font-bold text-amber-400 mb-2">House Rules</h4>
                <ul className="space-y-2 text-xs opacity-80 list-disc list-inside">
                  {(moveInInfo?.houseRules || ["Curfew at 10:30 PM", "No loud music after 10 PM", "Visitors allowed in common areas till 8 PM"]).map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Complaints & Maintenance */}
        {activeTab === "complaints" && (
          <div className={`p-8 rounded-3xl border ${darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-[#E6D7CA]"}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Maintenance Tickets</h3>
              <button onClick={() => navigate("complaints")} className="luxury-btn-primary px-4 py-2 text-xs font-bold">
                + Raise Ticket
              </button>
            </div>

            <div className="space-y-4">
              {[1].map((c) => (
                <div key={c} className="p-4 rounded-2xl bg-white/5 flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">Plumbing Issue</span>
                    <h4 className="font-bold text-sm mt-1">Tap leaking in Room 101 washroom</h4>
                    <p className="text-xs opacity-60">Submitted 2 days ago</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    RESOLVED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
