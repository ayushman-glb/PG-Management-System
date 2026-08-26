import { useState, useEffect, useCallback } from "react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import type { Page } from "@app/App";
import { useTheme } from "@theme/index";
import { FintechCardCarousel } from "../components/FintechCardCarousel";
import { PayRentModal } from "../components/PayRentModal";
import { SpendBreakdownChart } from "../components/SpendBreakdownChart";
import { TransactionTimeline, TransactionItem } from "../components/TransactionTimeline";
import { useAdaptiveLoading } from "../../../hooks/useAdaptiveLoading";
import { BillingSkeleton } from "@components/Skeletons";
import { billingService } from "../../../services/billing.service";

interface Props {
  navigate: (p: Page) => void;
}

export default function Billing({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "transactions">("overview");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "PAID" | "PENDING" | "FAILED" | "REFUNDED">("all");
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayAmount, setSelectedPayAmount] = useState(8500);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();

  const loadBillingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [historyRes, analyticsRes] = await Promise.allSettled([
        billingService.getPaymentHistory({
          status: filter !== "all" ? filter : undefined,
          search: search.trim() || undefined,
          limit: 50,
        }),
        billingService.getPaymentAnalytics(),
      ]);

      if (historyRes.status === "fulfilled") {
        const list = historyRes.value?.payments || (Array.isArray(historyRes.value) ? historyRes.value : []);
        setPaymentsList(list);
      }
      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value);
      }
    } catch (e) {
      console.warn("Failed to load live billing data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filter, search]);

  const { showSkeleton } = useAdaptiveLoading(loadBillingData, [loadBillingData]);

  useEffect(() => {
    const handleDataChange = () => {
      loadBillingData();
    };
    window.addEventListener("roombae-data-changed", handleDataChange);
    return () => {
      window.removeEventListener("roombae-data-changed", handleDataChange);
    };
  }, [loadBillingData]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBillingData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadBillingData]);

  if (showSkeleton) {
    return <BillingSkeleton />;
  }

  const mappedTransactions: TransactionItem[] = paymentsList.map((p) => {
    const id = p.id;
    const invoiceId = p.invoiceId || p.invoice?.id || p.id;
    const invoiceNumber = p.invoice?.invoiceNumber || p.invoiceNumber || p.receiptNumber || `REC-${p.id.slice(-6).toUpperCase()}`;
    const category = p.purpose
      ? `Payment - ${p.purpose.replace(/_/g, " ")}`
      : p.items?.[0]?.description || (p.resident?.name ? `Rent - ${p.resident.name}` : (p.payer?.username ? `Payment - ${p.payer.username}` : "Rent Payment"));
    const amount = p.amount ?? p.totalAmount ?? 0;
    const date = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
      : "Recent";
    const rawStatus = String(p.status || "").toUpperCase();
    const status: "PAID" | "PENDING" | "FAILED" | "REFUNDED" =
      rawStatus === "VERIFIED" || rawStatus === "PAID"
        ? "PAID"
        : rawStatus === "FAILED"
        ? "FAILED"
        : rawStatus === "REFUNDED"
        ? "REFUNDED"
        : "PENDING";
    const paymentMethod = p.paymentMethod || "RAZORPAY";
    const razorpayPaymentId = p.razorpayPaymentId;

    return {
      id,
      invoiceId,
      invoiceNumber,
      category,
      amount,
      date,
      status,
      paymentMethod,
      razorpayPaymentId,
    };
  });

  const totalRevenue = analytics?.totalRevenue || paymentsList
    .filter((i) => i.status === "PAID" || i.status === "VERIFIED")
    .reduce((sum, i) => sum + (i.totalAmount || i.amount || 0), 0);

  const pending = analytics?.pendingAmount || paymentsList
    .filter((i) => i.status === "PENDING" || i.status === "PENDING_VERIFICATION" || i.status === "INITIATED")
    .reduce((sum, i) => sum + (i.totalAmount || i.amount || 0), 0);

  const collectionRate = analytics?.collectionRatePercent ?? 95.4;
  const successfulCount = analytics?.successfulPaymentsCount ?? paymentsList.filter(p => p.status === 'PAID' || p.status === 'VERIFIED').length;

  const handleExportCsv = () => {
    const url = billingService.getExportCsvUrl({
      status: filter !== "all" ? filter : "",
      search: search.trim(),
    });
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout navigate={navigate} activePage="billing">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)]">
              Banking &amp; Payments Hub
            </h1>
            <p className="text-sm mt-0.5 text-[var(--text-muted)]">
              Enterprise Razorpay payment portal, virtual cards &amp; automated rent collection
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs shadow-md shadow-[var(--brand-primary)]/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              1-Tap Pay Rent (Razorpay)
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 border border-[var(--border-main)] text-xs font-bold px-4 py-2.5 rounded-2xl hover:bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={loadBillingData}
              className="p-2.5 rounded-2xl border border-[var(--border-main)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--brand-primary)]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Collected Revenue",
              value: `₹${(totalRevenue / 1000).toFixed(1)}K`,
              icon: CheckCircle,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Pending Dues",
              value: `₹${(pending / 1000).toFixed(1)}K`,
              icon: Clock,
              color: "text-[var(--accent-ruby)]",
              bg: "bg-[var(--accent-ruby)]/10 border-[var(--accent-ruby)]/20",
            },
            {
              label: "Verified Transactions",
              value: `${successfulCount} txns`,
              icon: AlertCircle,
              color: "text-[var(--brand-primary)]",
              bg: "bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20",
            },
            {
              label: "Collection Efficiency",
              value: `${collectionRate}%`,
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${stat.bg} ${
                darkMode ? "bg-[var(--bg-card)]" : "bg-white"
              } shadow-sm space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)]">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-black text-[var(--text-main)]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-main)]">
          {(["overview", "invoices", "transactions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold capitalize border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <FintechCardCarousel onSelectCardAmount={(amt) => setSelectedPayAmount(amt)} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendBreakdownChart />
              <TransactionTimeline transactions={mappedTransactions} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div
            className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] overflow-hidden shadow-xs"
          >
            <div className="p-4 border-b border-[var(--border-main)] flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search resident, invoice, or txn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-main)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {(["all", "PAID", "PENDING", "FAILED", "REFUNDED"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      filter === f
                        ? "bg-[var(--brand-primary)] text-white shadow-xs"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="uppercase font-bold tracking-wider border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                >
                  <tr>
                    <th className="p-3.5">Invoice ID</th>
                    <th className="p-3.5">Resident</th>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5">Property</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">PDF Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]/50">
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                        No payments match the specified criteria.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((inv) => {
                      const resName = inv.resident?.name || (inv.payer?.profile ? `${inv.payer.profile.firstName} ${inv.payer.profile.lastName}`.trim() : inv.payer?.username) || "Resident";
                      const roomNo = inv.resident?.bed?.room?.roomNumber || inv.booking?.room?.roomNumber || "—";
                      const pgName = inv.pg?.name || "RoomBae PG";
                      const invNo = inv.invoice?.invoiceNumber || inv.invoiceNumber || inv.receiptNumber || inv.id?.slice(0, 10);
                      const invAmt = inv.totalAmount ?? inv.amount ?? 0;
                      const invTargetId = inv.invoiceId || inv.invoice?.id || inv.id;

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors"
                        >
                          <td className="p-3.5 font-mono font-bold text-[var(--brand-primary)]">{invNo}</td>
                          <td className="p-3.5 font-semibold">{resName}</td>
                          <td className="p-3.5">{roomNo}</td>
                          <td className="p-3.5">{pgName}</td>
                          <td className="p-3.5 font-bold">₹{invAmt.toLocaleString("en-IN")}</td>
                          <td className="p-3.5 text-[var(--text-muted)]">{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                inv.status === "PAID" || inv.status === "VERIFIED"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : inv.status === "PENDING" || inv.status === "PENDING_VERIFICATION" || inv.status === "INITIATED"
                                  ? "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <a
                              href={billingService.getInvoicePdfUrl(invTargetId)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--brand-primary)]/30 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && <TransactionTimeline transactions={mappedTransactions} isLoading={isLoading} />}
      </div>

      <PayRentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        defaultAmount={selectedPayAmount}
        onSuccess={() => {
          setIsPayModalOpen(false);
          loadBillingData();
        }}
      />
    </DashboardLayout>
  );
}
