import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  Lock,
  Building,
  Wallet,
  Smartphone,
  Check,
  Mail,
} from "lucide-react";
import { useTheme } from "../../../theme";
import { useAuth } from "../../../hooks/useAuth";
import { billingService, VerifiedPaymentResult } from "../../../services/billing.service";

export type PaymentMethod = "CARD" | "UPI" | "WALLET" | "NET_BANKING";

export type PaymentState =
  | "IDLE"
  | "METHOD_SELECTED"
  | "VALIDATING"
  | "READY"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED";

interface PayRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultAmount?: number;
  itemTitle?: string;
  itemCategory?: string;
  residentId?: string;
  roomId?: string;
}

const POPULAR_BANKS = [
  { id: "hdfc", name: "HDFC Bank", code: "HDFC0001234", logo: "🏦" },
  { id: "icici", name: "ICICI Bank", code: "ICIC0000001", logo: "🏛️" },
  { id: "sbi", name: "State Bank of India", code: "SBIN0000001", logo: "🏢" },
  { id: "axis", name: "Axis Bank", code: "UTIB0000001", logo: "🏬" },
  { id: "kotak", name: "Kotak Mahindra Bank", code: "KKBK0000001", logo: "🏛️" },
];

const WALLET_PROVIDERS = [
  { id: "amazonpay", name: "Amazon Pay", desc: "Fast 1-click checkout", logo: "📦" },
  { id: "paytm", name: "Paytm Wallet", desc: "Instant wallet balance", logo: "📱" },
  { id: "phonepe", name: "PhonePe Wallet", desc: "Unified balance payment", logo: "💜" },
  { id: "mobikwik", name: "MobiKwik Zip", desc: "Buy now pay later", logo: "⚡" },
];

export const PayRentModal: React.FC<PayRentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAmount = 8500,
  itemTitle = "Monthly PG Rent",
  itemCategory = "RENT",
  residentId,
  roomId,
}) => {
  const { darkMode } = useTheme();
  const { user } = useAuth();

  // Payment State Machine
  const [paymentState, setPaymentState] = useState<PaymentState>("IDLE");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CARD");

  // Amounts & Taxes
  const [baseAmount, setBaseAmount] = useState<number>(defaultAmount);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const cgstAmount = Math.round(baseAmount * 0.09);
  const sgstAmount = Math.round(baseAmount * 0.09);
  const grandTotal = baseAmount + cgstAmount + sgstAmount - discountAmount;

  // Card Inputs & 3D Flip State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [focusedCardField, setFocusedCardField] = useState<"number" | "holder" | "expiry" | "cvv" | null>(null);

  // UPI State
  const [upiId, setUpiId] = useState("");
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Wallet & Bank State
  const [selectedWallet, setSelectedWallet] = useState("amazonpay");
  const [selectedBank, setSelectedBank] = useState("hdfc");

  // Processing, Success & Error State Payload
  const [errorMessage, setErrorMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [successPaymentId, setSuccessPaymentId] = useState("");
  const [verifiedResult, setVerifiedResult] = useState<VerifiedPaymentResult | null>(null);

  // Sync default amount
  useEffect(() => {
    setBaseAmount(defaultAmount);
  }, [defaultAmount]);

  if (!isOpen) return null;

  // Format Card Number (adds space every 4 digits)
  const formatCardNumberInput = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 16);
    const formatted = digitsOnly.match(/.{1,4}/g)?.join(" ") || digitsOnly;
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const formatExpiryInput = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 4);
    if (digitsOnly.length >= 3) {
      setExpiryDate(`${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}`);
    } else {
      setExpiryDate(digitsOnly);
    }
  };

  // Verify UPI VPA Simulation
  const handleVerifyUpi = () => {
    if (!upiId.includes("@")) {
      setErrorMessage("Please enter a valid UPI VPA (e.g. user@upi)");
      return;
    }
    setIsVerifyingUpi(true);
    setErrorMessage("");
    setTimeout(() => {
      setIsVerifyingUpi(false);
      setIsUpiVerified(true);
      setPaymentState("READY");
    }, 600);
  };

  // Apply Coupon Code
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "ROOMBAE1000") {
      setDiscountAmount(1000);
      setErrorMessage("");
    } else if (couponCode.trim().length > 0) {
      setErrorMessage("Invalid promo code. Use 'ROOMBAE1000' for ₹1,000 off.");
    }
  };

  // Execute Payment via Billing API & Razorpay
  const handleExecutePayment = async () => {
    setPaymentState("PROCESSING");
    setErrorMessage("");
    setEmailStatus(null);

    try {
      const targetResidentId = residentId || (user as any)?.residentId || (user as any)?.id || "dev_resident_123";
      const orderData = await billingService.createBillingOrder(targetResidentId, grandTotal, {
        roomId,
        itemCategory,
        description: `${itemCategory} - ${itemTitle}`,
      });

      const finalizeVerification = async (
        paymentId: string,
        orderId: string,
        paymentTxnId: string,
        signature: string
      ) => {
        try {
          const verified = await billingService.verifyPayment(
            paymentId,
            orderId,
            paymentTxnId,
            signature
          );
          setSuccessPaymentId(paymentId);
          setVerifiedResult(verified);
          setPaymentState("SUCCESS");

          // Dispatch global custom event so all realtime dashboards refresh
          window.dispatchEvent(
            new CustomEvent("roombae-data-changed", {
              detail: { type: "payment", paymentId },
            })
          );

          onSuccess?.();
        } catch (err: any) {
          setErrorMessage(err.message || "Payment verification failed.");
          setPaymentState("FAILED");
        }
      };

      const rzpOptions = {
        key: orderData.keyId,
        amount: Math.round(orderData.totalAmount * 100),
        currency: orderData.currency || "INR",
        name: "RoomBae Enterprise Stays",
        description: `${itemCategory} - ${orderData.invoiceNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async (resp: any) => {
          await finalizeVerification(
            orderData.paymentId,
            resp.razorpay_order_id || orderData.razorpayOrderId,
            resp.razorpay_payment_id || `pay_${Date.now()}`,
            resp.razorpay_signature || "valid_signature"
          );
        },
        modal: {
          ondismiss: () => {
            if (paymentState === "PROCESSING") {
              setPaymentState("IDLE");
            }
          },
        },
        prefill: {
          name: (user as any)?.name || cardHolder || "Resident",
          email: (user as any)?.email || "resident@roombae.com",
          contact: (user as any)?.phone || "+919876543210",
        },
        theme: {
          color: "#D9A87C",
        },
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
      } else {
        // Safe fallback in dev if script is blocked or offline
        setTimeout(async () => {
          await finalizeVerification(
            orderData.paymentId,
            orderData.razorpayOrderId,
            `pay_dev_${Date.now()}`,
            "mock_signature_valid"
          );
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate payment transaction");
      setPaymentState("FAILED");
    }
  };

  // Resend Email Receipt Action
  const handleEmailReceipt = async () => {
    if (!successPaymentId) return;
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      await billingService.sendReceiptEmail(successPaymentId, (user as any)?.email);
      setEmailStatus("Receipt sent to your registered Gmail address!");
    } catch (err: any) {
      setEmailStatus("Could not send email receipt. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Reset to Try Again
  const handleRetryPayment = () => {
    setPaymentState("IDLE");
    setErrorMessage("");
    setEmailStatus(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden relative ${
            darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-[#F7F3EE]" : "bg-[#FFF8F2] border-[#E6D7CA] text-[#3B2A24]"
          }`}
        >
          {/* Modal Header & Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl text-black shadow-md shadow-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Secure Checkout</h2>
                <p className="text-[11px] text-amber-500 font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256-BIT ENCRYPTED RAZORPAY GATEWAY
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* PHASE 7: COMPLETE PAYMENT SUCCESS SCREEN                                  */}
          {/* ========================================================================= */}
          {paymentState === "SUCCESS" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-emerald-400">Payment Successful!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your rent payment has been verified and recorded to your RoomBae account.
                </p>
              </div>

              {/* Complete Payment Metadata Breakdown */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs font-mono text-left">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400 font-sans">Amount Paid:</span>
                  <span className="text-emerald-400 font-black text-base">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Resident Name:</span>
                  <span className="text-slate-200 font-bold">{verifiedResult?.residentName || (user as any)?.name || "Resident"}</span>
                </div>
                {verifiedResult?.propertyName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">PG Property:</span>
                    <span className="text-slate-200">{verifiedResult.propertyName}</span>
                  </div>
                )}
                {verifiedResult?.roomNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Room / Bed:</span>
                    <span className="text-slate-200">{verifiedResult.roomNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Invoice Number:</span>
                  <span className="text-amber-400 font-bold">{verifiedResult?.invoiceNumber || "INV-2026-RECENT"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Receipt Number:</span>
                  <span className="text-amber-400 font-bold">{verifiedResult?.receiptNumber || "REC-2026-RECENT"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Transaction ID:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{verifiedResult?.transactionId || "TXN_RZP_VERIFIED"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Date & Time:</span>
                  <span className="text-slate-300">{new Date().toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Status banner for email */}
              {emailStatus && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans">
                  {emailStatus}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <a
                  href={billingService.getInvoicePdfUrl(successPaymentId)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleEmailReceipt}
                  className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  {isSendingEmail ? "Sending..." : "Email Receipt"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-lg hover:bg-amber-400 cursor-pointer transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </motion.div>
          ) : paymentState === "FAILED" ? (
            /* ========================================================================= */
            /* PHASE 8: COMPLETE PAYMENT FAILED SCREEN                                   */
            /* ========================================================================= */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
                <AlertCircle className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-red-400">Payment Failed</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {errorMessage || "The transaction could not be completed. No money was deducted."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Attempted Amount:</span>
                  <span className="text-red-400 font-bold">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-red-400 font-bold">FAILED</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-lg hover:from-amber-400 hover:to-amber-500 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* CHECKOUT FORM VIEW                                                        */
            /* ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* LEFT SECTION — PAYMENT METHOD SELECTOR & INPUTS */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-amber-500/20">
                {/* Method Navigation Tabs */}
                <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("CARD")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === "CARD"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("UPI")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === "UPI"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("WALLET")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === "WALLET"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Wallets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("NET_BANKING")}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === "NET_BANKING"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>NetBanking</span>
                  </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* TAB 1: CREDIT / DEBIT CARD WITH 3D PREVIEW */}
                <AnimatePresence mode="wait">
                  {selectedMethod === "CARD" && (
                    <motion.div
                      key="card-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Interactive 3D Card Preview */}
                      <div className="perspective-1000">
                        <div
                          className={`w-full max-w-sm mx-auto h-44 sm:h-48 rounded-2xl p-5 sm:p-6 bg-gradient-to-tr from-[#1E1B18] via-[#2E2823] to-[#453B34] border border-amber-500/30 text-white shadow-2xl relative flex flex-col justify-between transition-transform duration-500 ${
                            focusedCardField === "cvv" ? "rotate-y-180" : ""
                          }`}
                        >
                          {focusedCardField !== "cvv" ? (
                            <>
                              <div className="flex justify-between items-start">
                                <div className="w-10 h-8 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500/80 shadow-sm flex items-center justify-center font-bold text-black text-[9px]">
                                  CHIP
                                </div>
                                <span className="font-mono text-xs text-amber-400/80 tracking-widest font-black">
                                  ROOMBAE BLACK
                                </span>
                              </div>

                              <div className="font-mono text-base sm:text-lg tracking-widest text-slate-200">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </div>

                              <div className="flex justify-between items-end">
                                <div>
                                  <div className="text-[8px] uppercase tracking-wider text-slate-400">Card Holder</div>
                                  <div className="text-xs font-bold uppercase tracking-wide truncate max-w-[150px]">
                                    {cardHolder || (user as any)?.name || "RESIDENT NAME"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] uppercase tracking-wider text-slate-400">Expires</div>
                                  <div className="text-xs font-mono font-bold">{expiryDate || "MM/YY"}</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col justify-between h-full pt-2">
                              <div className="h-9 bg-black/60 -mx-6 mb-2"></div>
                              <div className="text-right pr-4">
                                <div className="text-[9px] uppercase tracking-wider text-slate-400">CVV Security Code</div>
                                <div className="font-mono font-bold text-base text-amber-400 tracking-widest">
                                  {cvv || "•••"}
                                </div>
                              </div>
                              <div className="text-[9px] text-slate-400">
                                Protected by Razorpay 256-bit encryption.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Input Fields */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold mb-1.5 text-slate-400">Card Number</label>
                          <input
                            type="text"
                            placeholder="4532 8901 2345 6789"
                            maxLength={19}
                            value={cardNumber}
                            onFocus={() => setFocusedCardField("number")}
                            onChange={(e) => formatCardNumberInput(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs font-mono tracking-wider focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1.5 text-slate-400">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="AYUSHMAN MISHRA"
                            value={cardHolder}
                            onFocus={() => setFocusedCardField("holder")}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs uppercase tracking-wide focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-slate-400">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              placeholder="08/28"
                              maxLength={5}
                              value={expiryDate}
                              onFocus={() => setFocusedCardField("expiry")}
                              onChange={(e) => formatExpiryInput(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs font-mono tracking-wider focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-slate-400">CVV Code</label>
                            <input
                              type="password"
                              placeholder="123"
                              maxLength={4}
                              value={cvv}
                              onFocus={() => setFocusedCardField("cvv")}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs font-mono tracking-wider focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: UPI / QR CODE */}
                  {selectedMethod === "UPI" && (
                    <motion.div
                      key="upi-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                        <button
                          type="button"
                          onClick={() => setShowQrCode(false)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            !showQrCode ? "bg-amber-500 text-black font-black" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          UPI VPA ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQrCode(true)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            showQrCode ? "bg-amber-500 text-black font-black" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Dynamic UPI QR
                        </button>
                      </div>

                      {!showQrCode ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-slate-400">
                              Enter UPI ID / VPA
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="resident@okhdfcbank"
                                value={upiId}
                                onChange={(e) => {
                                  setUpiId(e.target.value);
                                  setIsUpiVerified(false);
                                }}
                                className="flex-1 p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs font-mono focus:border-amber-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyUpi}
                                disabled={isVerifyingUpi || !upiId}
                                className="px-4 py-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isVerifyingUpi ? "Verifying..." : isUpiVerified ? "Verified ✓" : "Verify VPA"}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                            <span>Supported: GPay, PhonePe, Paytm, BHIM, Amazon Pay</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                          <div className="w-40 h-40 bg-white rounded-xl p-2 mx-auto flex items-center justify-center shadow-lg">
                            {/* Visual QR Simulator */}
                            <div className="w-full h-full border-2 border-dashed border-black flex flex-col items-center justify-center">
                              <QrCode className="w-24 h-24 text-black" />
                              <span className="text-[9px] font-mono text-black font-bold">UPI 2.0 QR</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">
                            Scan with any UPI app to pay <strong className="text-amber-400">₹{grandTotal.toLocaleString("en-IN")}</strong>
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: WALLETS */}
                  {selectedMethod === "WALLET" && (
                    <motion.div
                      key="wallet-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {WALLET_PROVIDERS.map((w) => {
                        const isSel = selectedWallet === w.id;
                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWallet(w.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                              isSel
                                ? "bg-amber-500/15 border-amber-500 font-bold"
                                : "border-slate-300 dark:border-slate-700 hover:border-amber-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{w.logo}</span>
                              <div>
                                <div>{w.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{w.desc}</div>
                              </div>
                            </div>
                            {isSel && <Check className="w-4 h-4 text-amber-500" />}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* TAB 4: NET BANKING */}
                  {selectedMethod === "NET_BANKING" && (
                    <motion.div
                      key="bank-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <label className="block text-xs font-bold text-slate-400 mb-2">Select Your Bank</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {POPULAR_BANKS.map((b) => {
                          const isSel = selectedBank === b.id;
                          return (
                            <div
                              key={b.id}
                              onClick={() => setSelectedBank(b.id)}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                                isSel
                                  ? "bg-amber-500/15 border-amber-500 font-bold"
                                  : "border-slate-300 dark:border-slate-700 hover:border-amber-500/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span>{b.logo}</span>
                                <span>{b.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{b.code}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PRIMARY PAY BUTTON & STATE LIFECYCLE */}
                <button
                  type="button"
                  disabled={paymentState === "PROCESSING"}
                  onClick={handleExecutePayment}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentState === "PROCESSING" ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {paymentState === "PROCESSING" ? (
                    <span>Processing Razorpay Transaction...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Pay ₹{grandTotal.toLocaleString("en-IN")} Securely</span>
                    </>
                  )}
                </button>
              </div>

              {/* RIGHT SECTION — ORDER SUMMARY & INVOICE BREAKDOWN */}
              <div className="lg:col-span-5 p-6 sm:p-8 bg-white/5 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-4">
                    <h3 className="font-black text-sm uppercase tracking-wider">Order Summary</h3>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
                      {itemCategory}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-400">{itemTitle}</span>
                      <span>₹{baseAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>CGST (9%)</span>
                      <span>+₹{cgstAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>SGST (9%)</span>
                      <span>+₹{sgstAmount.toLocaleString("en-IN")}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Promo Discount (ROOMBAE1000)</span>
                        <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  </div>

                  {/* PROMO COUPON CODE INPUT */}
                  <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Have a Promo Code? (Try: ROOMBAE1000)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ROOMBAE1000"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-mono tracking-widest text-amber-400 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* TOTAL AMOUNT & SECURITY BADGE */}
                <div className="space-y-4 pt-4 border-t border-amber-500/20">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-extrabold">Final Grand Total</span>
                    <span className="text-2xl font-black text-amber-400">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Includes instant digital GST invoice download &amp; SMS confirmation.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PayRentModal;
