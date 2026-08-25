import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, CheckCircle2, Clock, RotateCcw, AlertTriangle } from "lucide-react";
import { useTheme } from "../../../theme";
import { useDocumentDownload } from "../../../hooks/useDocumentDownload";

export interface TransactionItem {
  id: string;
  invoiceId?: string;
  invoiceNumber: string;
  category: string;
  amount: number;
  date: string;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  razorpayPaymentId?: string;
}

interface TransactionTimelineProps {
  transactions?: TransactionItem[];
  isLoading?: boolean;
  onPayRetry?: (item: TransactionItem) => void;
}

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  transactions = [],
  isLoading = false,
  onPayRetry,
}) => {
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING" | "REFUNDED">("ALL");
  const { download, isDownloading, getError } = useDocumentDownload();

  const cardBg = darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]";
  const rowBg = darkMode ? "bg-[#332D2B] border-[#4A443F] hover:bg-[#3D3632]" : "bg-[#F8EEE5] border-[#E6D7CA] hover:bg-[#EDE0D4]";
  const textPrimary = darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]";

  const filtered = transactions.filter((t) => filter === "ALL" || t.status === filter);

  return (
    <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl space-y-5 ${cardBg}`}>
      {/* Header & Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`text-xl font-extrabold tracking-tight ${textPrimary}`}>
            Payment History &amp; Receipts
          </h3>
          <p className={`text-xs ${textMuted}`}>
            Verified electronic receipts and GST compliance invoices.
          </p>
        </div>

        {/* Filter Pills */}
        <div className={`flex items-center p-1 rounded-2xl border ${darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
          {(["ALL", "PAID", "PENDING", "REFUNDED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                filter === f
                  ? "bg-amber-500 text-black shadow-md"
                  : textMuted
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-sm font-semibold">No transactions found</p>
            <p className="text-xs text-slate-500 mt-1">Payment records and receipts will appear here once processed.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const invoiceTargetId = item.invoiceId || item.id;
            return (
              <motion.div
                key={item.id}
                whileHover={{ x: 3 }}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between flex-wrap gap-3 ${rowBg}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl border flex-shrink-0 ${
                      item.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : item.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {item.status === "PAID" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : item.status === "PENDING" ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <RotateCcw className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <p className={`font-bold text-sm ${textPrimary}`}>{item.category}</p>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      <span className={`font-mono ${textMuted}`}>{item.invoiceNumber}</span>
                      <span className={textMuted}>•</span>
                      <span className={textMuted}>{item.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                  <div className="text-right">
                    <p className={`font-extrabold text-base ${item.status === "REFUNDED" ? "text-purple-400" : textPrimary}`}>
                      {item.status === "REFUNDED" ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${
                        item.status === "PAID"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : item.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.status === "PAID" && (
                      <>
                        {/* Invoice download */}
                        <div className="relative">
                          <button
                            type="button"
                            disabled={isDownloading(invoiceTargetId, 'INVOICE')}
                            onClick={() => download({
                              entityId: invoiceTargetId,
                              documentType: 'INVOICE',
                              fileName: `RoomBae-Invoice-${item.invoiceNumber || invoiceTargetId}.pdf`,
                            })}
                            title="Download GST Invoice (PDF)"
                            className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                              darkMode ? "bg-[#332D2B] border-[#4A443F] text-[#C6B9AE] hover:text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#6E5A52] hover:text-black"
                            }`}
                          >
                            <FileText className={`w-4 h-4 ${isDownloading(invoiceTargetId, 'INVOICE') ? 'animate-spin' : ''}`} />
                          </button>
                          {getError(invoiceTargetId, 'INVOICE') && (
                            <div className="absolute -top-1 -right-1">
                              <span title={getError(invoiceTargetId, 'INVOICE')}>
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Receipt download */}
                        <div className="relative">
                          <button
                            type="button"
                            disabled={isDownloading(item.id, 'PAYMENT_RECEIPT')}
                            onClick={() => download({
                              entityId: item.id,
                              documentType: 'PAYMENT_RECEIPT',
                              fileName: `RoomBae-Receipt-${item.invoiceNumber || item.id}.pdf`,
                            })}
                            title="Download Payment Receipt"
                            className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                              darkMode ? "bg-[#332D2B] border-[#4A443F] text-[#C6B9AE] hover:text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#6E5A52] hover:text-black"
                            }`}
                          >
                            <Download className={`w-4 h-4 ${isDownloading(item.id, 'PAYMENT_RECEIPT') ? 'animate-spin' : ''}`} />
                          </button>
                          {getError(item.id, 'PAYMENT_RECEIPT') && (
                            <div className="absolute -top-1 -right-1">
                              <span title={getError(item.id, 'PAYMENT_RECEIPT')}>
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {item.status === "PENDING" && onPayRetry && (
                      <button
                        type="button"
                        onClick={() => onPayRetry(item)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
