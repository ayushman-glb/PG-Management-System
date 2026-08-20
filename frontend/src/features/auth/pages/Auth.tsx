import React, { useState, useEffect } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Check,
  Home,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Page } from "../../../App";
import { ThemeToggle, useTheme } from "../../../theme";
import { BackButton } from "../../../navigation";
import { AnimatedTabs } from "../../../components/MotionPrimitives";
import { authService } from "../../../services/auth.service";
import { UploadCard } from "../../../components/UploadCard";
import { env } from "../../../config/env";
import { EmailOtpVerificationModal } from "../../../components/auth/EmailOtpVerificationModal";
import { PhoneOtpModal } from "../components/PhoneOtpModal";

interface Props {
  navigate: (p: Page) => void;
}

type AuthMode = "login" | "register" | "forgot" | "otp";

export default function Auth({ navigate }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loginRole, setLoginRole] = useState<"owner" | "resident" | "admin">("owner");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const { darkMode } = useTheme();

  // Unified Registration Wizard State
  const [regStep, setRegStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<"RESIDENT" | "OWNER">("RESIDENT");

  // Recovery Alert State
  const [incompleteDraft, setIncompleteDraft] = useState<any | null>(null);

  // Step 2: Personal Details Form Fields
  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [dob, setDob] = useState("2000-01-15");
  const [gender, setGender] = useState("MALE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("560038");

  const [phoneOtp, setPhoneOtp] = useState("");
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneTrialNotice, setPhoneTrialNotice] = useState<string | null>(null);
  const [phoneAuthError, setPhoneAuthError] = useState<string | null>(null);

  // Email Verification State
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const isSubmittingRef = React.useRef(false);

  const handlePhoneInputChange = (newVal: string) => {
    const clean = newVal.replace(/\D/g, "").slice(0, 10);
    setPhone(clean);
    if (isPhoneVerified || isPhoneOtpSent) {
      setIsPhoneVerified(false);
      setIsPhoneOtpSent(false);
      setPhoneOtp("");
      setPhoneAuthError(null);
    }
  };

  const handleEmailInputChange = (newVal: string) => {
    setEmail(newVal);
    if (isEmailVerified || isEmailOtpSent) {
      setIsEmailVerified(false);
      setIsEmailOtpSent(false);
      setEmailOtp("");
    }
  };

  // Security & Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3 Resident Details
  const [aadhaarDoc, setAadhaarDoc] = useState("");
  const [signatureDoc, setSignatureDoc] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  // Step 3 PG Owner Details
  const [ownerAadhaarPdf, setOwnerAadhaarPdf] = useState("");
  const [ownerPanPdf, setOwnerPanPdf] = useState("");
  const [addressProofPdf, setAddressProofPdf] = useState("");

  // Bank & Settlement Details (Encrypted Server-Side)
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [ifscCode, setIfscCode] = useState("HDFC0001234");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  // Role-Specific Code / Terms / Submitting
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showSignupCta, setShowSignupCta] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Sign-In Handler
  const handleGoogleSignUp = async () => {
    setAuthError("");
    setAuthSuccessMsg("");
    try {
      const backendOAuthUrl = `${env.API_URL}/auth/google?role=${encodeURIComponent(selectedRole)}`;
      window.location.href = backendOAuthUrl;
    } catch (err: any) {
      console.error("❌ Google Sign-In Error:", err);
      setAuthError(err.message || "Failed to initiate Google OAuth.");
    }
  };

  // Check for saved incomplete signup on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("roombae_incomplete_signup");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fullName) {
          setIncompleteDraft(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // Autosave progress to localStorage whenever step 2/3 fields update
  // SECURITY FIX (Zero-Trust PII Protection): DOB, permanentAddress, emergency contact,
  // and financial identifiers (accountNumber, IFSC, UPI, etc.) are strictly EXCLUDED from localStorage.
  useEffect(() => {
    if (mode === "register" && (fullName || email || phone)) {
      const draft = {
        selectedRole,
        regStep,
        fullName,
        photoUrl,
        phone,
        email,
        city,
        state,
        pincode,
        isPhoneVerified,
        isEmailVerified,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("roombae_incomplete_signup", JSON.stringify(draft));
    }
  }, [
    mode,
    selectedRole,
    regStep,
    fullName,
    photoUrl,
    dob,
    gender,
    phone,
    email,
    city,
    state,
    pincode,
    isPhoneVerified,
    isEmailVerified,
    permanentAddress,
    landmark,
  ]);

  const resumeIncompleteSignup = () => {
    if (!incompleteDraft) return;
    setSelectedRole(incompleteDraft.selectedRole || "RESIDENT");
    setRegStep(incompleteDraft.regStep || 2);
    setFullName(incompleteDraft.fullName || "");
    setPhotoUrl(incompleteDraft.photoUrl || "");
    setDob(incompleteDraft.dob || "2000-01-15");
    setGender(incompleteDraft.gender || "MALE");
    setPhone(incompleteDraft.phone || "");
    setEmail(incompleteDraft.email || "");
    setCity(incompleteDraft.city || "Bengaluru");
    setState(incompleteDraft.state || "Karnataka");
    setPincode(incompleteDraft.pincode || "560038");
    setIsPhoneVerified(!!incompleteDraft.isPhoneVerified);
    setIsEmailVerified(!!incompleteDraft.isEmailVerified);
    setPermanentAddress(incompleteDraft.permanentAddress || "");
    setLandmark(incompleteDraft.landmark || "");
    // Bank & financial fields are never stored in localStorage and must be freshly entered
    setAccountHolderName("");
    setBankName("HDFC Bank");
    setIfscCode("");
    setAccountNumber("");
    setConfirmAccountNumber("");
    setUpiId("");
    setMode("register");
    setIncompleteDraft(null);

    if (incompleteDraft.selectedRole === "OWNER" && incompleteDraft.regStep >= 3) {
      setAuthSuccessMsg("Draft restored! For your security, bank and settlement details must be re-entered.");
    }
  };

  const clearIncompleteDraft = () => {
    localStorage.removeItem("roombae_incomplete_signup");
    setIncompleteDraft(null);
  };

  const calculateAge = (dobStr: string) => {
    if (!dobStr) return 0;
    const birthDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 0;
  };

  const calculatedAge = calculateAge(dob);

  // Field Level Validation Rules
  const isValidFullName = fullName.trim().length >= 2 && /^[a-zA-Z\s'.]+$/.test(fullName);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = /^\d{10}$/.test(phone.replace(/\D/g, ""));
  const isValidPincode = /^\d{6}$/.test(pincode);
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNumber = /[0-9]/.test(password);
  const passSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordStrong = passLength && passUpper && passLower && passNumber && passSpecial;
  const isPasswordMatch = password === confirmPassword && confirmPassword.length > 0;

  // Next Button Enable Status for Step 2
  const isStep2Valid =
    isValidFullName &&
    calculatedAge > 0 &&
    isValidEmail &&
    isValidPhone &&
    isValidPincode &&
    isPasswordStrong &&
    isPasswordMatch &&
    city.trim().length > 0 &&
    state.trim().length > 0;

  // Next Button Enable Status for Step 3
  const isStep3ResidentValid =
    aadhaarDoc.length > 0 &&
    signatureDoc.length > 0 &&
    permanentAddress.trim().length > 5 &&
    landmark.trim().length > 2;

  const isStep3OwnerValid =
    ownerAadhaarPdf.length > 0 &&
    ownerPanPdf.length > 0 &&
    addressProofPdf.length > 0 &&
    accountHolderName.trim().length > 2 &&
    accountNumber.length >= 8 &&
    accountNumber === confirmAccountNumber &&
    /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode) &&
    /^[\w.-]+@[\w.-]+$/.test(upiId);

  const isStep3Valid = selectedRole === "RESIDENT" ? isStep3ResidentValid : isStep3OwnerValid;

  const switchAuthMode = (newMode: AuthMode) => {
    setAuthError("");
    setShowSignupCta(false);
    setAuthSuccessMsg("");
    setMode(newMode);
  };

  // Handle Phone OTP Send
  const handleSendPhoneOtp = async () => {
    if (!isValidPhone) {
      setPhoneAuthError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneAuthError(null);
    setIsPhoneLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      const result = await authService.sendPhoneOtp(fullPhone, "PHONE_VERIFICATION");
      setIsPhoneOtpSent(true);
      if (result?.isTrialNotice || result?.notice) {
        setPhoneTrialNotice(result.notice || result.error || null);
      } else {
        setPhoneTrialNotice(null);
      }
      setIsPhoneModalOpen(true);
    } catch (err: any) {
      setPhoneAuthError(err?.message || "Failed to send SMS verification code. Please try again.");
      setIsPhoneModalOpen(true);
    } finally {
      setIsPhoneLoading(false);
    }
  };

  // Handle Phone OTP Verify - calls backend to validate OTP
  const handleVerifyPhoneOtp = async (otpCodeToVerify?: string) => {
    const code = otpCodeToVerify || phoneOtp;
    if (!code || code.length !== 6) {
      setPhoneAuthError("Please enter the 6-digit OTP code.");
      return;
    }

    if (!phone || phone.length < 10) {
      setPhoneAuthError("Please enter a valid phone number first.");
      return;
    }

    setPhoneAuthError(null);
    setIsPhoneLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      await authService.verifyPhoneOtp(fullPhone, code, "PHONE_VERIFICATION");
      setIsPhoneVerified(true);
      setIsPhoneModalOpen(false);
      setPhoneAuthError(null);
    } catch (err: any) {
      setIsPhoneVerified(false);
      setPhoneAuthError(err?.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  // Handle Email Verification Send
  const handleSendEmailVerification = async () => {
    if (!isValidEmail) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setIsEmailLoading(true);
    try {
      await authService.sendEmailOtp(email, fullName);
      setIsEmailOtpSent(true);
      setIsEmailModalOpen(true);
    } catch (err: any) {
      setEmailError(err?.message || "Failed to send email verification code.");
      setIsEmailModalOpen(true);
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Handle Email OTP Verification
  const handleVerifyEmail = async (codeToVerify?: string) => {
    const code = codeToVerify || emailOtp;
    if (!code || code.length !== 6) {
      setEmailError("Please enter the 6-digit email code.");
      return;
    }
    setIsEmailLoading(true);
    try {
      await authService.verifyEmail(email, code);
      setIsEmailVerified(true);
      setEmailError("");
    } catch (err: any) {
      setEmailError(err?.message || "Invalid or expired email verification code.");
      setIsEmailVerified(false);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    if (!loginIdentifier.trim() || !loginPassword) {
      setAuthError("Please enter your email/phone and password.");
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setAuthError("");
    setShowSignupCta(false);
    try {
      const identifier = loginIdentifier.trim();
      const passwordVal = loginPassword;
      const loginRes = await authService.login({ identifier, password: passwordVal, rememberMe });
      if (loginRes?.requiresTwoFactor) {
        setPreAuthToken(loginRes.preAuthToken || null);
        setAuthSuccessMsg("Two-factor authentication code required. Please enter your 6-digit TOTP code.");
        setMode("otp");
        return;
      }
      const userRole = loginRes?.user?.role;

      if (userRole === "RESIDENT") {
        navigate("resident-portal");
      } else if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        navigate("admin-console");
      } else if (userRole === "OWNER" || userRole === "MANAGER" || userRole === "STAFF") {
        navigate("dashboard");
      } else {
        setAuthError("Your account role could not be determined. Please contact support.");
      }
    } catch (err: any) {
      const isSignupNudge = err?.code === "ACCOUNT_NOT_FOUND_OR_INVALID" || err?.message?.includes("couldn't find an account");
      setAuthError(err?.message || "We couldn't find an account with these details. Would you like to sign up instead?");
      setShowSignupCta(isSignupNudge);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleVerifyTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    if (!totpCode || totpCode.length !== 6) {
      setAuthError("Please enter your 6-digit TOTP code.");
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setAuthError("");
    try {
      const tokenOrUserId = preAuthToken || "USER_CURRENT";
      const res = await authService.verifyTwoFactor(tokenOrUserId, totpCode, rememberMe);
      const userRole = res?.user?.role;
      setAuthSuccessMsg("✓ Two-factor authentication verified successfully!");
      setTimeout(() => {
        if (userRole === "RESIDENT") {
          navigate("resident-portal");
        } else if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
          navigate("admin-console");
        } else {
          navigate("dashboard");
        }
      }, 600);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid two-factor code. Please try again.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    if (!agreeTerms) {
      setAuthError("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setAuthError("");

    try {
      if (!fullName.trim() || !email.trim() || !password) {
        setAuthError("Please complete all required personal details.");
        return;
      }
      await authService.register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        role: selectedRole === "OWNER" ? "OWNER" : "RESIDENT",
        phone: phone ? `+91${phone}` : undefined,
      });

      clearIncompleteDraft();
      setAuthSuccessMsg("✓ Account created successfully! Access granted to RoomBae Enterprise.");
      setTimeout(() => {
        if (selectedRole === "OWNER") {
          navigate("dashboard");
        } else {
          navigate("resident-portal");
        }
      }, 1200);
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed. Please try again.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const isSignUp = mode === "register";

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      {/* Top Header Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-30 border-b border-white/10">
        <button
          type="button"
          onClick={() => navigate("landing")}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg shadow-amber-500/20 text-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-xl font-extrabold tracking-tight block">RoomBae</span>
            <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider uppercase">Enterprise SaaS</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <BackButton />
        </div>
      </header>

      {/* Main Split Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative overflow-hidden">
        {/* Background Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-6xl relative z-10">
          {/* Incomplete Signup Resume Alert Banner */}
          {incompleteDraft && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center justify-between gap-3 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-extrabold block">Incomplete Signup Draft Detected</span>
                  <span className="text-[11px] text-amber-300/80">Resume from where you left off as {incompleteDraft.fullName || "User"}.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resumeIncompleteSignup}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={clearIncompleteDraft}
                  className="p-1.5 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
                  title="Discard draft"
                >
                  &times;
                </button>
              </div>
            </motion.div>
          )}

          {/* Dynamic Sliding Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[640px]">
            
            {/* BRANDING PANEL (SLIDING SECTION B) */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className={`lg:col-span-5 rounded-3xl p-8 lg:p-12 relative overflow-hidden flex flex-col justify-between min-h-[560px] shadow-2xl ${
                isSignUp ? "order-1 lg:order-2" : "order-1 lg:order-1"
              }`}
              style={{
                background: "linear-gradient(135deg, #2D201A 0%, #1D1B1A 40%, #0F0E0D 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-extrabold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>256-BIT ENCRYPTED PLATFORM</span>
                </div>

                <div>
                  <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4">
                    {isSignUp ? "Join 10,000+ PG Residents & Owners" : "Next-Gen Coliving Automation"}
                  </h2>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {isSignUp
                      ? "Seamless digital onboarding, verified tenant profiles, automated rental invoices, and instant ticket resolution."
                      : "Access real-time room occupancy, digital agreements, automated GST billing, and priority helpdesk tickets."}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    "Multi-Factor Authentication & Verification",
                    "Automated Notification Dispatch",
                    "Cloudinary Virus-Scanned Media Storage",
                    "AES-256-GCM Financial Data Encryption",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center shrink-0 border border-amber-500/30">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-white/90 text-xs font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-3">
                {[
                  { value: "500+", label: "Active PGs" },
                  { value: "10K+", label: "Tenants" },
                  { value: "99.9%", label: "Uptime" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                    <p className="text-xl font-black text-amber-400">{s.value}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AUTHENTICATION FORM CARD (SECTION A) */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className={`lg:col-span-7 ${isSignUp ? "order-2 lg:order-1" : "order-2 lg:order-2"}`}
            >
              <div className={`glass-card rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border ${darkMode ? "bg-[#2B2725]/90 border-[#4A433F]" : "bg-[#FFFDFB]/90 border-[#E6D7CA]"}`}>
                
                {/* Global Status Messages */}
                {authSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2.5"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{authSuccessMsg}</span>
                  </motion.div>
                )}

                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                    {showSignupCta && (
                      <button
                        type="button"
                        onClick={() => switchAuthMode("register")}
                        className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <span>Create a RoomBae Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {/* SIGN IN FORM */}
                  {mode === "login" && (
                    <motion.div
                      key="login-form"
                      initial={{ opacity: 0, x: 25, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -25, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mb-6">
                        <h2 className="text-2xl lg:text-3xl font-black">Welcome Back</h2>
                        <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                          Enter your credentials to access your portal or dashboard
                        </p>
                      </div>

                      {/* Role Tabs */}
                      <div className="mb-6">
                        <AnimatedTabs
                          tabs={[
                            { id: "owner", label: "🏢 PG Owner" },
                            { id: "resident", label: "🏠 Resident" },
                            { id: "admin", label: "🛡️ Admin Sign In" },
                          ]}
                          activeTab={loginRole}
                          onChange={(id: string) => setLoginRole(id as any)}
                          layoutId="auth-role-tab"
                        />
                      </div>

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase mb-1.5">
                            {loginRole === "resident" ? "Resident ID or Email" : loginRole === "admin" ? "Admin Email" : "Email or Phone Number"}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={loginIdentifier}
                              onChange={(e) => setLoginIdentifier(e.target.value)}
                              placeholder={loginRole === "resident" ? "RES1001 or resident@example.com" : loginRole === "admin" ? "admin@roombae.com" : "you@example.com"}
                              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 ${
                                darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-[#F7F3EE]" : "bg-[#FFF8F2] border-[#E6D7CA] text-[#3B2A24]"
                              }`}
                            />
                            <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold uppercase">Password</label>
                            <button
                              type="button"
                              onClick={() => switchAuthMode("forgot")}
                              className="text-xs font-semibold text-amber-500 hover:underline cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPass ? "text" : "password"}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full px-4 py-3 rounded-xl border text-sm pr-12 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 ${
                                darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-[#F7F3EE]" : "bg-[#FFF8F2] border-[#E6D7CA] text-[#3B2A24]"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass(!showPass)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                            />
                            <span>Remember Me</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.99] cursor-pointer ${
                            isSubmitting ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {isSubmitting ? "Authenticating..." : "Sign In to RoomBae"} <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>

                      <div className="flex items-center gap-3 my-6">
                        <div className={`flex-1 h-px ${darkMode ? "bg-[#4A443F]" : "bg-[#E6D7CA]"}`} />
                        <span className="text-xs font-semibold text-slate-400">OR</span>
                        <div className={`flex-1 h-px ${darkMode ? "bg-[#4A443F]" : "bg-[#E6D7CA]"}`} />
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                        </svg>
                        Continue with Google
                      </button>

                      <p className="text-center text-xs mt-6 text-slate-500 dark:text-slate-400">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => switchAuthMode("register")}
                          className="font-bold text-amber-500 hover:underline cursor-pointer"
                        >
                          Sign Up
                        </button>
                      </p>
                    </motion.div>
                  )}

                  {/* SIGN UP WIZARD FORM */}
                  {mode === "register" && (
                    <motion.div
                      key="register-form"
                      initial={{ opacity: 0, x: -25, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 25, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mb-6 flex justify-between items-center border-b pb-4 border-amber-500/20">
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-black">Create Your Account</h2>
                          <p className="text-xs text-amber-500 font-semibold mt-0.5">
                            Step {regStep} of 3 — {regStep === 1 ? "Choose Role" : regStep === 2 ? "Personal & Security Details" : selectedRole === "RESIDENT" ? "KYC & Documents" : "Owner Verification & Bank Details"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          {selectedRole === "RESIDENT" ? "🏠 Resident" : "🏢 PG Owner"}
                        </span>
                      </div>

                      {/* STEP 1: ROLE SELECTION */}
                      {regStep === 1 && (
                        <div className="space-y-5">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                            Select your platform account type:
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                              onClick={() => setSelectedRole("RESIDENT")}
                              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                                selectedRole === "RESIDENT"
                                  ? "bg-amber-500/15 border-amber-500 shadow-xl"
                                  : "border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 hover:border-amber-500/50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500">
                                  <Home className="w-6 h-6" />
                                </div>
                                <input
                                  type="radio"
                                  name="role-select"
                                  checked={selectedRole === "RESIDENT"}
                                  onChange={() => setSelectedRole("RESIDENT")}
                                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                                />
                              </div>
                              <div>
                                <h3 className="text-base font-black">🏠 Resident</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                                  Live in a PG. Pay rent, log complaints &amp; view digital agreements.
                                </p>
                              </div>
                            </div>

                            <div
                              onClick={() => setSelectedRole("OWNER")}
                              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                                selectedRole === "OWNER"
                                  ? "bg-amber-500/15 border-amber-500 shadow-xl"
                                  : "border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 hover:border-amber-500/50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500">
                                  <Building2 className="w-6 h-6" />
                                </div>
                                <input
                                  type="radio"
                                  name="role-select"
                                  checked={selectedRole === "OWNER"}
                                  onChange={() => setSelectedRole("OWNER")}
                                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                                />
                              </div>
                              <div>
                                <h3 className="text-base font-black">🏢 PG Owner</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                                  Manage PG properties, track occupancy &amp; collect rent seamlessly.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 my-4">
                            <div className={`flex-1 h-px ${darkMode ? "bg-[#4A443F]" : "bg-[#E6D7CA]"}`} />
                            <span className="text-xs font-semibold text-slate-400">OR</span>
                            <div className={`flex-1 h-px ${darkMode ? "bg-[#4A443F]" : "bg-[#E6D7CA]"}`} />
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleSignUp}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 48 48">
                              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                            </svg>
                            Continue with Google
                          </button>

                          <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                            <button
                              type="button"
                              onClick={() => switchAuthMode("login")}
                              className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                            >
                              Already have an account? Sign In
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegStep(2)}
                              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
                            >
                              Continue to Details <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 2: PERSONAL & SECURITY DETAILS */}
                      {regStep === 2 && (
                        <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
                          <UploadCard
                            label="Profile Photo"
                            sublabel="Take photo or choose file (JPG, PNG, WEBP max 5MB)"
                            folder="RoomBae/ProfileImages"
                            acceptTypes="image/*"
                            value={photoUrl}
                            onChange={setPhotoUrl}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold uppercase mb-1">
                                Full Name <span className="text-amber-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Rajesh Kumar"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all ${
                                  fullName && !isValidFullName
                                    ? "border-rose-500 text-rose-500 bg-rose-500/5"
                                    : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:border-amber-500"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block font-bold uppercase mb-1">
                                Gender <span className="text-amber-500">*</span>
                              </label>
                              <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:border-amber-500"
                              >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold uppercase mb-1">
                                Email Address <span className="text-amber-500">*</span>
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  placeholder="you@example.com"
                                  value={email}
                                  onChange={(e) => handleEmailInputChange(e.target.value)}
                                  className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={handleSendEmailVerification}
                                  disabled={!isValidEmail || isEmailLoading || isEmailVerified}
                                  className={`px-3 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                                    isEmailVerified
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-amber-500 text-black hover:bg-amber-400"
                                  }`}
                                >
                                  {isEmailVerified ? "✓ Verified" : isEmailLoading ? "Sending..." : "Verify"}
                                </button>
                              </div>
                              {isEmailOtpSent && !isEmailVerified && (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value)}
                                    className="w-32 p-2 rounded-lg border text-xs font-mono tracking-widest bg-slate-900 text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyEmail()}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs cursor-pointer"
                                  >
                                    Confirm Code
                                  </button>
                                </div>
                              )}
                              {emailError && <p className="text-rose-500 text-[10px] mt-1">{emailError}</p>}
                            </div>

                            <div>
                              <label className="block font-bold uppercase mb-1">
                                Mobile Number <span className="text-amber-500">*</span>
                              </label>
                              <div className="flex gap-2">
                                <span className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-xs font-mono font-bold flex items-center">
                                  +91
                                </span>
                                <input
                                  type="tel"
                                  placeholder="9876543210"
                                  value={phone}
                                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                                  className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={handleSendPhoneOtp}
                                  disabled={!isValidPhone || isPhoneLoading || isPhoneVerified}
                                  className={`px-3 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                                    isPhoneVerified
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-amber-500 text-black hover:bg-amber-400"
                                  }`}
                                >
                                  {isPhoneVerified ? "✓ Verified" : isPhoneLoading ? "Sending..." : "Verify SMS"}
                                </button>
                              </div>
                              {isPhoneOtpSent && !isPhoneVerified && (
                                <div className="mt-2 flex gap-2 items-center">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="6-digit OTP"
                                    value={phoneOtp}
                                    onChange={(e) => setPhoneOtp(e.target.value)}
                                    className="w-32 p-2 rounded-lg border text-xs font-mono tracking-widest bg-slate-900 text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPhoneOtp()}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold text-xs cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsPhoneModalOpen(true)}
                                    className="text-[11px] text-amber-500 hover:underline cursor-pointer"
                                  >
                                    Open Modal
                                  </button>
                                </div>
                              )}
                              {phoneAuthError && <p className="text-rose-500 text-[10px] mt-1">{phoneAuthError}</p>}
                            </div>
                          </div>

                          {/* Password & Strength Meter */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold uppercase mb-1">
                                Create Password <span className="text-amber-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showPass ? "text" : "password"}
                                  placeholder="Min 8 chars, 1 Upper, 1 Special"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPass(!showPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold uppercase mb-1">
                                Confirm Password <span className="text-amber-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPass ? "text" : "password"}
                                  placeholder="Re-enter password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="w-full p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Password Strength Rules */}
                          {password.length > 0 && (
                            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/60 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                              <span className={passLength ? "text-emerald-400 font-bold" : "text-slate-400"}>✓ 8+ Chars</span>
                              <span className={passUpper ? "text-emerald-400 font-bold" : "text-slate-400"}>✓ 1 Uppercase</span>
                              <span className={passLower ? "text-emerald-400 font-bold" : "text-slate-400"}>✓ 1 Lowercase</span>
                              <span className={passNumber ? "text-emerald-400 font-bold" : "text-slate-400"}>✓ 1 Number</span>
                              <span className={passSpecial ? "text-emerald-400 font-bold" : "text-slate-400"}>✓ 1 Special</span>
                            </div>
                          )}

                          <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                            <button
                              type="button"
                              onClick={() => setRegStep(1)}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to Role
                            </button>
                            <button
                              type="button"
                              disabled={!isStep2Valid}
                              onClick={() => isStep2Valid && setRegStep(3)}
                              className={`px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all ${
                                !isStep2Valid ? "opacity-50 pointer-events-none" : ""
                              }`}
                            >
                              Continue to KYC <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: KYC, DOCUMENTS & SUBMIT */}
                      {regStep === 3 && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
                          {selectedRole === "RESIDENT" ? (
                            <>
                              <UploadCard
                                label="Aadhaar Card Photo / PDF"
                                sublabel="Upload front/back Aadhaar card (Max 5MB)"
                                folder="RoomBae/ResidentDocs"
                                value={aadhaarDoc}
                                onChange={setAadhaarDoc}
                              />
                              <UploadCard
                                label="Signature Image"
                                sublabel="Digital signature on white paper"
                                folder="RoomBae/ResidentSignatures"
                                value={signatureDoc}
                                onChange={setSignatureDoc}
                              />
                              <div>
                                <label className="block font-bold uppercase mb-1">Permanent Residential Address</label>
                                <textarea
                                  rows={2}
                                  placeholder="House No, Street, Village/Locality"
                                  value={permanentAddress}
                                  onChange={(e) => setPermanentAddress(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block font-bold uppercase mb-1">Landmark</label>
                                <input
                                  type="text"
                                  placeholder="Near City Water Tank"
                                  value={landmark}
                                  onChange={(e) => setLandmark(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <UploadCard
                                label="Owner Aadhaar PDF"
                                sublabel="Aadhaar document for KYC verification"
                                folder="RoomBae/OwnerKYC"
                                value={ownerAadhaarPdf}
                                onChange={setOwnerAadhaarPdf}
                              />
                              <UploadCard
                                label="Owner PAN Card PDF"
                                sublabel="PAN card for tax GST compliance"
                                folder="RoomBae/OwnerKYC"
                                value={ownerPanPdf}
                                onChange={setOwnerPanPdf}
                              />
                              <UploadCard
                                label="Electricity Bill / Address Proof"
                                sublabel="Utility bill for property address proof"
                                folder="RoomBae/OwnerKYC"
                                value={addressProofPdf}
                                onChange={setAddressProofPdf}
                              />
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-400 flex items-center gap-2">
                                <Lock className="w-4 h-4 shrink-0" />
                                <span>Financial &amp; Settlement Details (AES-256-GCM Encrypted Server-Side)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-bold uppercase mb-1">Account Holder Name</label>
                                  <input
                                    type="text"
                                    placeholder="Rajesh Kumar"
                                    value={accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold uppercase mb-1">Bank Name</label>
                                  <input
                                    type="text"
                                    placeholder="HDFC Bank"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-bold uppercase mb-1">Bank Account Number</label>
                                  <input
                                    type="password"
                                    placeholder="5010023456789"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold uppercase mb-1">Confirm Account Number</label>
                                  <input
                                    type="text"
                                    placeholder="Re-enter account number"
                                    value={confirmAccountNumber}
                                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-bold uppercase mb-1">IFSC Code</label>
                                  <input
                                    type="text"
                                    placeholder="HDFC0001234"
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold uppercase mb-1">Settlement UPI ID</label>
                                  <input
                                    type="text"
                                    placeholder="owner@okaxis"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="pt-2">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="w-4 h-4 mt-0.5 rounded accent-amber-500 cursor-pointer shrink-0"
                              />
                              <span className="text-[11px] leading-tight text-slate-400">
                                I agree to the <span className="text-amber-500 font-bold hover:underline">Terms &amp; Conditions</span> and <span className="text-amber-500 font-bold hover:underline">Privacy Policy</span>. I verify that all uploaded documents and financial details are authentic.
                              </span>
                            </label>
                          </div>

                          <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                            <button
                              type="button"
                              onClick={() => setRegStep(2)}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to Details
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting || !agreeTerms || !isStep3Valid}
                              className={`px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all ${
                                isSubmitting || !agreeTerms || !isStep3Valid ? "opacity-50 pointer-events-none" : ""
                              }`}
                            >
                              {isSubmitting ? "Creating Account..." : "Complete Registration"} <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </form>
                      )}

                      <p className="text-center text-xs mt-6 text-slate-500 dark:text-slate-400">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => switchAuthMode("login")}
                          className="font-bold text-amber-500 hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </p>
                    </motion.div>
                  )}

                  {/* FORGOT PASSWORD MODE */}
                  {mode === "forgot" && (
                    <motion.div
                      key="forgot-form"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <h2 className="text-2xl font-black">Reset Password</h2>
                        <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                          Enter your registered email address to receive password recovery instructions.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase mb-1.5">Registered Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 ${
                            darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-[#F7F3EE]" : "bg-[#FFF8F2] border-[#E6D7CA] text-[#3B2A24]"
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthSuccessMsg("Password reset email sent! Check your inbox.");
                          setTimeout(() => switchAuthMode("login"), 1500);
                        }}
                        className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-extrabold text-sm cursor-pointer hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                      >
                        Send Reset Link
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => switchAuthMode("login")}
                          className="text-xs font-bold text-slate-400 hover:underline cursor-pointer"
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* 2FA TOTP OTP MODE */}
                  {mode === "otp" && (
                    <motion.div
                      key="otp-form"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-left space-y-1">
                        <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-2 border border-amber-500/30">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black">Two-Factor Verification</h2>
                        <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                          Enter the 6-digit verification code from your Authenticator app (Google Authenticator, Authy, etc.).
                        </p>
                      </div>

                      <form onSubmit={handleVerifyTwoFactorSubmit} className="space-y-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold uppercase mb-1.5">6-Digit Authenticator Code</label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="123456"
                            className={`w-full px-4 py-3 rounded-xl border text-center text-xl tracking-[0.5em] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 ${
                              darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-[#F7F3EE]" : "bg-[#FFF8F2] border-[#E6D7CA] text-[#3B2A24]"
                            }`}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting || totpCode.length !== 6}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer ${
                            isSubmitting || totpCode.length !== 6 ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {isSubmitting ? "Verifying Code..." : "Verify & Complete Sign In"} <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => switchAuthMode("login")}
                            className="text-xs font-bold text-slate-400 hover:underline cursor-pointer"
                          >
                            Back to Sign In
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <EmailOtpVerificationModal
        isOpen={isEmailModalOpen}
        email={email}
        name={fullName}
        onClose={() => setIsEmailModalOpen(false)}
        onSuccess={() => {
          setIsEmailVerified(true);
          setIsEmailModalOpen(false);
        }}
      />

      <PhoneOtpModal
        isOpen={isPhoneModalOpen}
        phone={phone ? (phone.startsWith("+91") ? phone : `+91${phone}`) : ""}
        initialNotice={phoneTrialNotice}
        onClose={() => setIsPhoneModalOpen(false)}
        onVerified={() => {
          setIsPhoneVerified(true);
          setIsPhoneModalOpen(false);
        }}
      />
    </div>
  );
}
