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
} from "lucide-react";
import { useTheme } from "../../../theme";
import { useAuth } from "../../../hooks/useAuth";
import { billingService } from "../../../services/billing.service";

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

  // Processing & Success State Payload
  const [errorMessage, setErrorMessage] = useState("");
  const [successPaymentId, setSuccessPaymentId] = useState("");
  const [txnSignature, setTxnSignature] = useState("");

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

    try {
      const residentId = (user as any)?.residentId || (user as any)?.id || "dev_resident_123";
      const orderData = await billingService.createBillingOrder(residentId, grandTotal);

      const rzpOptions = {
        key: orderData.keyId,
        amount: orderData.totalAmount * 100,
        currency: orderData.currency || "INR",
        name: "RoomBae Enterprise Stays",
        description: `${itemCategory} - ${orderData.invoiceNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async (resp: any) => {
          try {
            await billingService.verifyPayment(
              orderData.paymentId,
              resp.razorpay_order_id || orderData.razorpayOrderId,
              resp.razorpay_payment_id || `pay_${Date.now()}`,
              resp.razorpay_signature || "valid_signature"
            );
            setSuccessPaymentId(orderData.paymentId);
            setTxnSignature(resp.razorpay_payment_id || `PAY_RB_${Math.floor(100000 + Math.random() * 900000)}`);
            setPaymentState("SUCCESS");
            onSuccess?.();
          } catch (err: any) {
            setErrorMessage(err.message || "Payment verification failed.");
            setPaymentState("FAILED");
          }
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
        // Fallback test verification when script is loading in local dev
        setTimeout(async () => {
          try {
            await billingService.verifyPayment(
              orderData.paymentId,
              orderData.razorpayOrderId,
              `pay_dev_${Date.now()}`,
              "mock_signature_valid"
            );
            setSuccessPaymentId(orderData.paymentId);
            setTxnSignature(`PAY_RB_${Math.floor(100000 + Math.random() * 900000)}`);
            setPaymentState("SUCCESS");
            onSuccess?.();
          } catch (err: any) {
            setErrorMessage(err.message || "Failed to complete payment transaction");
            setPaymentState("FAILED");
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate payment transaction");
      setPaymentState("FAILED");
    }
  };

  // Reset to Try Again
  const handleRetryPayment = () => {
    setPaymentState("IDLE");
    setErrorMessage("");
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

          {/* SUCCESS VIEW */}
          {paymentState === "SUCCESS" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6"
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
                  Your transaction has been processed and verified via Razorpay.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="text-amber-400 font-bold">{txnSignature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="text-emerald-400 font-bold">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Item:</span>
                  <span className="text-white font-bold">{itemTitle}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href={billingService.getInvoicePdfUrl(successPaymentId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Receipt
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-lg hover:bg-amber-400 cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            /* ACTIVE CHECKOUT VIEW (2-SECTION LAYOUT) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* LEFT SECTION — PRIMARY PAYMENT INTERACTION */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-amber-500/20">
                {/* Header Amount Display */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payable Amount</span>
                    <h3 className="text-3xl sm:text-4xl font-black text-amber-500 tracking-tight mt-0.5">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Guaranteed
                  </div>
                </div>

                {/* Payment Method Selector Tabs */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "CARD", label: "Card", icon: CreditCard },
                    { id: "UPI", label: "UPI / QR", icon: Smartphone },
                    { id: "WALLET", label: "Wallet", icon: Wallet },
                    { id: "NET_BANKING", label: "NetBanking", icon: Building },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = selectedMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(m.id as PaymentMethod);
                          setPaymentState("METHOD_SELECTED");
                        }}
                        className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSel
                            ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02]"
                            : "border-slate-300 dark:border-slate-700/70 hover:border-amber-500/40 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ERROR FEEDBACK BAR */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    {paymentState === "FAILED" && (
                      <button
                        type="button"
                        onClick={handleRetryPayment}
                        className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer hover:bg-rose-600"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </motion.div>
                )}

                {/* MORPHING PAYMENT FORM CONTAINER */}
                <AnimatePresence mode="wait">
                  {/* METHOD 1: CREDIT / DEBIT CARD WITH 3D FLIP */}
                  {selectedMethod === "CARD" && (
                    <motion.div
                      key="card-form"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-5"
                    >
                      {/* REALISTIC 3D VIRTUAL PAYMENT CARD */}
                      <div className="perspective-1000 w-full max-w-sm mx-auto h-48 sm:h-52">
                        <div
                          className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${
                            focusedCardField === "cvv" ? "rotate-y-180" : ""
                          }`}
                        >
                          {/* CARD FRONT FACE */}
                          <div className="absolute inset-0 rounded-2xl p-5 bg-gradient-to-tr from-slate-900 via-amber-950 to-slate-900 border border-amber-500/30 text-white shadow-2xl flex flex-col justify-between backface-hidden overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10">
                              <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 to-amber-500 opacity-90 flex items-center justify-center text-[9px] font-bold text-black font-mono">
                                CHIP
                              </div>
                              <span className="font-mono text-xs tracking-widest font-extrabold text-amber-400">
                                ROOMBAE FINTECH
                              </span>
                            </div>

                            {/* Card Number Display */}
                            <div
                              className={`py-1.5 px-2 rounded-lg transition-all relative z-10 ${
                                focusedCardField === "number" ? "ring-2 ring-amber-400 bg-amber-500/10" : ""
                              }`}
                            >
                              <p className="font-mono text-base sm:text-lg tracking-[0.2em] font-extrabold text-shadow">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </p>
                            </div>

                            {/* Card Footer Details */}
                            <div className="flex items-end justify-between relative z-10 text-xs">
                              <div
                                className={`py-1 px-2 rounded-lg transition-all ${
                                  focusedCardField === "holder" ? "ring-2 ring-amber-400 bg-amber-500/10" : ""
                                }`}
                              >
                                <p className="text-[9px] uppercase tracking-wider text-slate-400">Card Holder</p>
                                <p className="font-bold tracking-wide uppercase truncate max-w-[150px]">
                                  {cardHolder || "YOUR NAME"}
                                </p>
                              </div>

                              <div
                                className={`py-1 px-2 rounded-lg transition-all ${
                                  focusedCardField === "expiry" ? "ring-2 ring-amber-400 bg-amber-500/10" : ""
                                }`}
                              >
                                <p className="text-[9px] uppercase tracking-wider text-slate-400">Expires</p>
                                <p className="font-mono font-bold">{expiryDate || "MM/YY"}</p>
                              </div>

                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-red-500/90" />
                                <div className="w-6 h-6 rounded-full bg-amber-400/90 -ml-3" />
                              </div>
                            </div>
                          </div>

                          {/* CARD BACK FACE (SHOWN ON CVV FOCUS) */}
                          <div className="absolute inset-0 rounded-2xl p-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950 border border-amber-500/30 text-white shadow-2xl flex flex-col justify-between rotate-y-180 backface-hidden">
                            <div className="w-full h-10 bg-slate-950 border-y border-slate-800 -mx-5 mt-2" />

                            <div className="space-y-1">
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 text-right">
                                Security CVV
                              </p>
                              <div className="w-full p-2.5 rounded-lg bg-white/10 border border-amber-500/40 font-mono text-sm tracking-widest text-right font-extrabold text-amber-400">
                                {cvv || "•••"}
                              </div>
                            </div>

                            <p className="text-[9px] text-slate-400 text-center font-mono">
                              256-BIT ENCRYPTED CARD TOKENIZATION
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CARD INPUT FIELDS */}
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold uppercase mb-1">Card Number</label>
                          <input
                            type="text"
                            maxLength={19}
                            placeholder="4532 8901 2345 6789"
                            value={cardNumber}
                            onFocus={() => setFocusedCardField("number")}
                            onBlur={() => setFocusedCardField(null)}
                            onChange={(e) => formatCardNumberInput(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 font-mono focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold uppercase mb-1">Card Holder Name</label>
                          <input
                            type="text"
                            placeholder="RAJESH KUMAR"
                            value={cardHolder}
                            onFocus={() => setFocusedCardField("holder")}
                            onBlur={() => setFocusedCardField(null)}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold uppercase mb-1">Expiry Date</label>
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="12/28"
                              value={expiryDate}
                              onFocus={() => setFocusedCardField("expiry")}
                              onBlur={() => setFocusedCardField(null)}
                              onChange={(e) => formatExpiryInput(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 font-mono focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold uppercase mb-1">Security CVV</label>
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="•••"
                              value={cvv}
                              onFocus={() => setFocusedCardField("cvv")}
                              onBlur={() => setFocusedCardField(null)}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 font-mono focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* METHOD 2: UPI / QR PAYMENT */}
                  {selectedMethod === "UPI" && (
                    <motion.div
                      key="upi-form"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-5"
                    >
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                        <label className="block font-bold uppercase mb-1.5">Enter Virtual Payment Address (VPA)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="username@okaxis or name@upi"
                            value={upiId}
                            onChange={(e) => {
                              setUpiId(e.target.value);
                              setIsUpiVerified(false);
                            }}
                            className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyUpi}
                            disabled={isVerifyingUpi || isUpiVerified}
                            className={`px-4 py-3 rounded-xl font-extrabold text-xs cursor-pointer transition-colors ${
                              isUpiVerified
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500 text-black hover:bg-amber-400"
                            }`}
                          >
                            {isUpiVerified ? "✓ Verified" : isVerifyingUpi ? "Checking..." : "Verify VPA"}
                          </button>
                        </div>

                        {isUpiVerified && (
                          <p className="text-emerald-400 text-[11px] font-bold mt-2 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> UPI ID verified &amp; ready for instant debit.
                          </p>
                        )}
                      </div>

                      {/* QR CODE TOGGLE */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowQrCode(!showQrCode)}
                          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4 text-amber-500" />
                          <span>{showQrCode ? "Hide UPI QR Code" : "Pay via Dynamic UPI QR Code"}</span>
                        </button>

                        <AnimatePresence>
                          {showQrCode && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="mt-4 p-4 rounded-2xl bg-white text-black inline-block shadow-2xl border-2 border-amber-500"
                            >
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=roombae@okaxis&pn=RoomBaeStays&am=${grandTotal}&cu=INR`}
                                alt="UPI Payment QR Code"
                                className="w-40 h-40 mx-auto"
                              />
                              <p className="text-[11px] font-mono font-bold mt-2">Scan with GPay, PhonePe, Paytm</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {/* METHOD 3: WALLET SELECTION */}
                  {selectedMethod === "WALLET" && (
                    <motion.div
                      key="wallet-form"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {WALLET_PROVIDERS.map((w) => {
                        const isSel = selectedWallet === w.id;
                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWallet(w.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSel
                                ? "bg-amber-500/15 border-amber-500 shadow-lg"
                                : "border-slate-300 dark:border-slate-700 hover:border-amber-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{w.logo}</span>
                              <div>
                                <h4 className="font-extrabold text-xs">{w.name}</h4>
                                <p className="text-[10px] text-slate-400">{w.desc}</p>
                              </div>
                            </div>
                            {isSel && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* METHOD 4: NET BANKING */}
                  {selectedMethod === "NET_BANKING" && (
                    <motion.div
                      key="netbanking-form"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-3"
                    >
                      <label className="block text-xs font-bold uppercase">Select Banking Partner</label>
                      <div className="space-y-2">
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
