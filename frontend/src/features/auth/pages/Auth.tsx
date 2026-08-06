import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Shield,
  Smartphone,
  Check,
  Home,
  AlertCircle,
  Sparkles,
  Mail,
  Lock,
  CreditCard,
} from "lucide-react";
import gsap from "gsap";
import type { Page } from "../../../App";
import { ThemeToggle, useTheme } from "../../../theme";
import { BackButton } from "../../../navigation";
import { AnimatedTabs } from "../../../components/MotionPrimitives";
import { authService } from "@services/auth.service";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import { usePhoneAuth } from "../../../hooks/usePhoneAuth";
import { useRecaptcha } from "../../../hooks/useRecaptcha";
import { OTPInput } from "../../../components/OTPInput";
import { UploadCard } from "../../../components/UploadCard";
import { PhoneAuthModal } from "../../../components/PhoneAuthModal";
import { ReCaptchaWidget } from "../../../components/ReCaptchaWidget";


interface Props {
  navigate: (p: Page) => void;
}

type AuthMode = "login" | "register" | "forgot" | "otp";

export default function Auth({ navigate }: Props) {
  const recaptcha = useRecaptcha();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loginRole, setLoginRole] = useState<"owner" | "resident">("owner");
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
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("560038");

  // Phone Verification via Firebase Hook
  const {
    sendOTP: sendFirebaseOTP,
    verifyOTP: verifyFirebaseOTP,
    loading: isPhoneLoading,
    error: phoneAuthError,
    countdown: phoneCountdown,
    setError: setPhoneAuthError,
    resetFlow: resetPhoneAuth,
  } = usePhoneAuth();

  const [phoneOtp, setPhoneOtp] = useState("");
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Email Verification State
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handlePhoneInputChange = (newVal: string) => {
    const clean = newVal.replace(/\D/g, "").slice(0, 10);
    setPhone(clean);
    if (isPhoneVerified || isPhoneOtpSent) {
      setIsPhoneVerified(false);
      setIsPhoneOtpSent(false);
      setPhoneOtp("");
      resetPhoneAuth();
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
  const [district, setDistrict] = useState("Bengaluru Urban");

  // Step 3 PG Owner Details
  const [ownerAadhaarPdf, setOwnerAadhaarPdf] = useState("");
  const [ownerPanPdf, setOwnerPanPdf] = useState("");
  const [addressProofPdf, setAddressProofPdf] = useState("");
  const [businessProofPdf, setBusinessProofPdf] = useState("");

  // Bank & Settlement Details (Encrypted Server-Side)
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [ifscCode, setIfscCode] = useState("HDFC0001234");
  const [branch, setBranch] = useState("Indiranagar Branch");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  // Role-Specific Code / Terms / Submitting
  const [pgReferenceCode, setPgReferenceCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showSignupCta, setShowSignupCta] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");

  const handleGoogleSignUp = async () => {
    setAuthError("");
    setAuthSuccessMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        if (user.displayName) setFullName(user.displayName);
        if (user.email) {
          setEmail(user.email);
          setIsEmailVerified(true);
        }
        if (user.photoURL) setPhotoUrl(user.photoURL);

        setAuthSuccessMsg(`Successfully authenticated with Google as ${user.displayName || user.email}!`);
        setRegStep(2);
        setMode("register");
      }
    } catch (err: any) {
      console.error("❌ Google Sign-In Error:", err);
      setAuthError(err.message || "Failed to sign in with Google.");
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    if (mode === "register" && (fullName || email || phone)) {
      const draft = {
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
        accountHolderName,
        bankName,
        ifscCode,
        accountNumber,
        upiId,
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
    accountHolderName,
    accountNumber,
    upiId,
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
    setAccountHolderName(incompleteDraft.accountHolderName || "");
    setBankName(incompleteDraft.bankName || "HDFC Bank");
    setIfscCode(incompleteDraft.ifscCode || "HDFC0001234");
    setAccountNumber(incompleteDraft.accountNumber || "");
    setUpiId(incompleteDraft.upiId || "");
    setMode("register");
    setIncompleteDraft(null);
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
    isPhoneVerified &&
    isEmailVerified &&
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

  const animateSwitch = (newMode: AuthMode) => {
    setAuthError("");
    setShowSignupCta(false);
    setAuthSuccessMsg("");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cardRef.current) {
      setMode(newMode);
      return;
    }

    const isSlideRight = newMode === "register";

    gsap.timeline().to(cardRef.current, {
      x: isSlideRight ? -35 : 35,
      opacity: 0,
      scale: 0.98,
      duration: 0.3,
      ease: "power3.in",
      onComplete: () => {
        setMode(newMode);
        gsap.fromTo(
          cardRef.current,
          { x: isSlideRight ? 35 : -35, opacity: 0, scale: 0.98 },
          { x: 0, opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" },
        );
      },
    });
  };

  useEffect(() => {
    if (formRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        formRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" },
      );
    }
  }, [mode, regStep, loginRole]);

  // Handle Firebase Phone OTP Send
  const handleSendPhoneOtp = async () => {
    if (!isValidPhone) {
      setPhoneAuthError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneAuthError(null);
    setPhoneOtp("");
    setIsPhoneVerified(false);
    setIsPhoneOtpSent(true);
    await sendFirebaseOTP(phone);
  };

  // Handle Firebase Phone OTP Verify
  const handleVerifyPhoneOtp = async (otpCodeToVerify?: string) => {
    const code = otpCodeToVerify || phoneOtp;
    if (!code || code.length !== 6) {
      setPhoneAuthError("Please enter the 6-digit OTP code.");
      return;
    }

    const idToken = await verifyFirebaseOTP(code);
    if (idToken) {
      try {
        await authService.firebaseLogin(idToken);
      } catch (err) {}
      setIsPhoneVerified(true);
      setPhoneAuthError(null);
    } else {
      setIsPhoneVerified(false);
    }
  };

  // Handle Brevo Email Verification Send
  const handleSendEmailVerification = async () => {
    if (!isValidEmail) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setIsEmailLoading(true);
    try {
      await authService.sendEmailVerification(email);
      setIsEmailOtpSent(true);
      setIsEmailVerified(false);
    } catch (err: any) {
      setIsEmailOtpSent(true);
      setIsEmailVerified(false);
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

  const handleLoginSubmit = async () => {
    setAuthError("");
    setShowSignupCta(false);
    setIsSubmitting(true);
    try {
      const recaptchaToken = await recaptcha.execute('login');
      const emailEl = document.querySelector(
        'input[placeholder*="you@example.com"], input[placeholder*="RES1001"]',
      ) as HTMLInputElement | null;
      const passEl = document.querySelector('input[placeholder="••••••••"]') as HTMLInputElement | null;

      const identifier = emailEl?.value || (loginRole === "resident" ? "RES1001" : "owner1@roombae.com");
      const passwordVal = passEl?.value || "Password123!";

      await authService.login({ identifier, password: passwordVal }, undefined, recaptchaToken);

      if (loginRole === "resident") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    } catch (err: any) {
      const isSignupNudge = err?.code === 'ACCOUNT_NOT_FOUND_OR_INVALID' || err?.message?.includes("couldn't find an account");
      setAuthError(err?.message || "We couldn't find an account with these details. Would you like to sign up instead?");
      setShowSignupCta(isSignupNudge);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setAuthError("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    try {
      const recaptchaToken = await recaptcha.execute('signup');
      await authService.register({
        name: fullName || "RoomBae User",
        email: email || `user_${Date.now()}@roombae.com`,
        password: password || "Password123!",
        role: selectedRole === "OWNER" ? "OWNER" : "RESIDENT",
        phone: phone || "+91 98765 43210",
        recaptchaToken,
      });

      // Clear draft on successful signup
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full font-sans overflow-x-hidden">
      <div id="recaptcha-container" className="hidden" />

      {/* Left Hero & Branding Section */}
      <div
        className="w-full lg:w-[48%] relative flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2D201A 0%, #1D1B1A 40%, #0F0E0D 100%)",
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-12">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("landing")}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg shadow-amber-500/20 text-black">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-white font-extrabold text-2xl tracking-tight block">
                  RoomBae
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  ENTERPRISE SAAS
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <BackButton />
            </div>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              Next-Gen Coliving &amp; PG Automation Platform
            </h1>
            <p className="text-white/80 text-base mb-8 leading-relaxed max-w-lg">
              Unified Security Pipeline, Firebase Phone Authentication, Brevo Email Relay, and Encrypted Financial Onboarding.
            </p>

            <div className="space-y-4">
              {[
                "Firebase Phone Auth & Server-Side Verification",
                "Brevo SMTP Automated Transactional Email",
                "Cloudinary Media Storage & Virus Scanner Pipeline",
                "AES-256-GCM Financial Encrypted Onboarding",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              { value: "500+", label: "Active PGs" },
              { value: "10K+", label: "Verified Tenants" },
              { value: "99.9%", label: "Bank Security" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                <p className="text-2xl font-black text-amber-400">{s.value}</p>
                <p className="text-white/70 text-xs mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Card Section */}
      <div className={`w-full lg:w-[52%] flex items-center justify-center px-6 pt-12 pb-12 relative overflow-hidden ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}>
        <div className="w-full max-w-xl relative z-10">

          {/* Incomplete Signup Resume Alert Banner */}
          {incompleteDraft && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-extrabold block">Incomplete Signup Progress Found!</span>
                  <span className="text-[11px] text-amber-300/80">Resume from where you left off as {incompleteDraft.fullName || 'User'}.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resumeIncompleteSignup}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md hover:bg-amber-400 transition-colors"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={clearIncompleteDraft}
                  className="p-1.5 text-amber-400 hover:text-amber-200 transition-colors"
                  title="Discard draft"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          <div ref={cardRef} className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl border border-[#E6D7CA]/80 dark:border-[#4A443F]/80">
            <div ref={formRef}>
              {authSuccessMsg && (
                <div className="mb-4 p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}
              {authError && (
                <div className="mb-4 p-4 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                  {showSignupCta && (
                    <button
                      type="button"
                      onClick={() => animateSwitch("register")}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <span>Create a RoomBae Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* LOGIN MODE */}
              {mode === "login" && (
                <>
                  <div className="mb-6">
                    <h2 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Sign in to RoomBae
                    </h2>
                    <p className={`text-sm mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Enter your credentials to access your portal or dashboard
                    </p>
                  </div>

                  <div className="mb-6">
                    <AnimatedTabs
                      tabs={[
                        { id: "owner", label: "🏢 PG Owner" },
                        { id: "resident", label: "🏠 Resident" },
                      ]}
                      activeTab={loginRole}
                      onChange={(id: string) => setLoginRole(id as "owner" | "resident")}
                      layoutId="auth-role-tab"
                    />
                  </div>

                  <div className="space-y-4 mb-5">
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1.5 ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                        {loginRole === "resident" ? "Resident ID or Email" : "Email or Phone Number"}
                      </label>
                      <input
                        type="text"
                        placeholder={loginRole === "resident" ? "RES1001 or resident@example.com" : "you@example.com"}
                        defaultValue={loginRole === "resident" ? "RES1001" : "owner1@roombae.com"}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                          darkMode
                            ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] focus:ring-amber-500"
                            : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] focus:ring-amber-500"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`text-xs font-bold uppercase ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => animateSwitch("forgot")}
                          className="text-xs font-semibold text-amber-500 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          defaultValue="Password123!"
                          className={`w-full px-4 py-3 rounded-xl border text-sm pr-12 transition-all ${
                            darkMode
                              ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] focus:ring-amber-500"
                              : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] focus:ring-amber-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <ReCaptchaWidget action="LOGIN" className="mb-4 flex justify-center" />

                  <button
                    type="button"
                    onClick={handleLoginSubmit}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                  >
                    Sign In to RoomBae <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 my-5">
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
                    New to RoomBae?{" "}
                    <button
                      type="button"
                      onClick={() => animateSwitch("register")}
                      className="font-bold text-amber-500 hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                </>
              )}

              {/* REGISTER WIZARD MODE */}
              {mode === "register" && (
                <div>
                  <div className="mb-6 flex justify-between items-center border-b pb-4 border-amber-500/20">
                    <div>
                      <h2 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                        Create Account
                      </h2>
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
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              🏠 Resident
                            </h3>
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
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              🏢 PG Owner
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                              Manage PG properties, track occupancy &amp; collect rent seamlessly.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => animateSwitch("login")}
                          className="text-xs font-bold text-slate-400 hover:underline"
                        >
                          Already have an account? Sign in
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

                  {/* STEP 2: PERSONAL DETAILS & REAL-TIME VALIDATION */}
                  {regStep === 2 && (
                    <div className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">

                      {/* Profile Photo Upload Card */}
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
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">
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
                          {fullName && !isValidFullName && (
                            <p className="text-rose-500 text-[10px] mt-1">Letters only, min 2 characters, no emojis/numbers.</p>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">
                            Gender <span className="text-amber-500">*</span>
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">
                            Date of Birth <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">
                            Auto-Calculated Age
                          </label>
                          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 font-extrabold border border-amber-500/20 text-center text-xs">
                            {calculatedAge > 0 ? `${calculatedAge} Years Old` : "Select Date of Birth"}
                          </div>
                        </div>
                      </div>

                      {/* Phone Verification Box */}
                      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold uppercase text-amber-500 flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4" /> Phone Number (Indian Mobile)
                          </label>
                          {isPhoneVerified && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3" /> Phone Verified
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="9876543210 (10 Digits)"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => handlePhoneInputChange(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={!isValidPhone || phoneCountdown > 0 || isPhoneLoading}
                            className="px-4 py-3 rounded-xl bg-amber-500 text-black font-extrabold text-xs whitespace-nowrap disabled:opacity-40 cursor-pointer shadow-md hover:bg-amber-400 transition-colors"
                          >
                            {phoneCountdown > 0 ? `Resend (${phoneCountdown}s)` : isPhoneOtpSent ? "Resend OTP" : "Send OTP 📲"}
                          </button>
                        </div>

                        {isPhoneOtpSent && !isPhoneVerified && (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-amber-400 font-semibold">Enter 6-Digit OTP sent to +91 {phone}:</p>
                              {phoneCountdown === 0 && (
                                <button
                                  type="button"
                                  onClick={handleSendPhoneOtp}
                                  className="text-[11px] text-amber-400 underline font-bold hover:text-amber-300 cursor-pointer"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                            <OTPInput
                              length={6}
                              value={phoneOtp}
                              onChange={setPhoneOtp}
                              onComplete={handleVerifyPhoneOtp}
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyPhoneOtp()}
                              className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs cursor-pointer hover:bg-emerald-400 transition-colors shadow-md"
                            >
                              Verify Phone OTP
                            </button>
                          </div>
                        )}
                        {phoneAuthError && <p className="text-rose-500 font-bold text-[11px]">{phoneAuthError}</p>}
                      </div>

                      {/* Email Verification Box */}
                      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold uppercase text-amber-500 flex items-center gap-1.5">
                            <Mail className="w-4 h-4" /> Email Address
                          </label>
                          {isEmailVerified && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] flex items-center gap-1 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3" /> Email Verified
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => handleEmailInputChange(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleSendEmailVerification}
                            disabled={!isValidEmail || isEmailLoading}
                            className="px-4 py-3 rounded-xl bg-amber-500 text-black font-extrabold text-xs whitespace-nowrap disabled:opacity-40 cursor-pointer shadow-md hover:bg-amber-400 transition-colors"
                          >
                            {isEmailOtpSent ? "Resend Email Code" : "Verify Email ✉️"}
                          </button>
                        </div>

                        {isEmailOtpSent && !isEmailVerified && (
                          <div className="space-y-2 pt-2">
                            <p className="text-[11px] text-amber-400 font-semibold">Enter 6-Digit code sent to {email}:</p>
                            <OTPInput
                              length={6}
                              value={emailOtp}
                              onChange={setEmailOtp}
                              onComplete={handleVerifyEmail}
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyEmail()}
                              className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs cursor-pointer hover:bg-emerald-400 transition-colors shadow-md"
                            >
                              Verify Email Code
                            </button>
                          </div>
                        )}
                        {emailError && <p className="text-rose-500 font-bold text-[11px]">{emailError}</p>}
                      </div>

                      {/* City, State, District, PIN */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">City *</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">District</label>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">State *</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">PIN Code *</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="my-2">
                        <label className="block font-bold uppercase mb-1 text-slate-700 dark:text-slate-300">Alternate Phone (Optional)</label>
                        <input
                          type="text"
                          placeholder="9876500000"
                          value={altPhone}
                          onChange={(e) => setAltPhone(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs font-mono"
                        />
                      </div>

                      {/* Password Security Rules */}
                      <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                        <label className="block font-bold uppercase text-amber-500 flex items-center gap-1.5">
                          <Lock className="w-4 h-4" /> Strong Password Protection
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type={showPass ? "text" : "password"}
                              placeholder="Create Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass(!showPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500"
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPass ? "text" : "password"}
                              placeholder="Confirm Password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass(!showPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500"
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
                          <div className={`p-1.5 rounded-lg border text-center font-bold ${passLength ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "opacity-40"}`}>
                            {passLength ? "✓" : "○"} 8+ Chars
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center font-bold ${passUpper ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "opacity-40"}`}>
                            {passUpper ? "✓" : "○"} Uppercase
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center font-bold ${passLower ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "opacity-40"}`}>
                            {passLower ? "✓" : "○"} Lowercase
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center font-bold ${passNumber ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "opacity-40"}`}>
                            {passNumber ? "✓" : "○"} Number
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center font-bold ${passSpecial ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "opacity-40"}`}>
                            {passSpecial ? "✓" : "○"} Special
                          </div>
                        </div>
                      </div>

                      {/* Next Step Button (Glowing state when isStep2Valid is true) */}
                      <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Role
                        </button>

                        <button
                          type="button"
                          onClick={() => setRegStep(3)}
                          disabled={!isStep2Valid}
                          className={`px-8 py-3.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all duration-300 ${
                            isStep2Valid
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] hover:scale-105 active:scale-95 cursor-pointer"
                              : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60"
                          }`}
                        >
                          Next: {selectedRole === "RESIDENT" ? "Resident KYC" : "Owner Verification"} <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ROLE-SPECIFIC VERIFICATION & DOCUMENTS */}
                  {regStep === 3 && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">
                      {selectedRole === "RESIDENT" ? (
                        <div className="space-y-4">
                          <h4 className="font-extrabold text-amber-500 uppercase text-xs">
                            Resident Document &amp; Address Collection
                          </h4>

                          <UploadCard
                            label="Aadhaar Card (PDF Only)"
                            sublabel="Upload original Aadhaar document in PDF format"
                            folder="RoomBae/Residents"
                            acceptTypes="application/pdf"
                            isDocument
                            value={aadhaarDoc}
                            onChange={setAadhaarDoc}
                            required
                          />

                          <UploadCard
                            label="Digital Signature (Image)"
                            sublabel="Upload photo or scan of signature (JPG, PNG)"
                            folder="RoomBae/Residents"
                            acceptTypes="image/*"
                            value={signatureDoc}
                            onChange={setSignatureDoc}
                            required
                          />

                          <div>
                            <label className="block font-bold uppercase mb-1">Permanent Address *</label>
                            <input
                              type="text"
                              placeholder="House No, Street Name, Sector/Locality"
                              value={permanentAddress}
                              onChange={(e) => setPermanentAddress(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold uppercase mb-1">Landmark *</label>
                              <input
                                type="text"
                                placeholder="Near Metro Station / Park"
                                value={landmark}
                                onChange={(e) => setLandmark(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-bold uppercase mb-1">PG Reference Code (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. PG-INDIRANAGAR-101"
                                value={pgReferenceCode}
                                onChange={(e) => setPgReferenceCode(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xs font-mono uppercase"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-extrabold text-amber-500 uppercase text-xs">
                            PG Owner Verification &amp; Bank Settlement Details
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <UploadCard
                              label="Aadhaar Card (PDF)"
                              isDocument
                              folder="RoomBae/Owners"
                              acceptTypes="application/pdf"
                              value={ownerAadhaarPdf}
                              onChange={setOwnerAadhaarPdf}
                              required
                            />
                            <UploadCard
                              label="PAN Card (PDF)"
                              isDocument
                              folder="RoomBae/Owners"
                              acceptTypes="application/pdf"
                              value={ownerPanPdf}
                              onChange={setOwnerPanPdf}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <UploadCard
                              label="Address Proof (PDF)"
                              isDocument
                              folder="RoomBae/Owners"
                              acceptTypes="application/pdf"
                              value={addressProofPdf}
                              onChange={setAddressProofPdf}
                              required
                            />
                            <UploadCard
                              label="Business Proof (Optional PDF)"
                              isDocument
                              folder="RoomBae/Owners"
                              acceptTypes="application/pdf"
                              value={businessProofPdf}
                              onChange={setBusinessProofPdf}
                            />
                          </div>

                          {/* Encrypted Bank Details */}
                          <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                            <div className="flex items-center gap-2 font-bold uppercase text-amber-500 text-xs">
                              <CreditCard className="w-4 h-4" /> Bank Account &amp; Settlement Details (Encrypted at Rest)
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block font-bold mb-1">Account Holder Name *</label>
                                <input
                                  type="text"
                                  placeholder="As printed on bank passbook"
                                  value={accountHolderName}
                                  onChange={(e) => setAccountHolderName(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block font-bold mb-1">Bank Name *</label>
                                <input
                                  type="text"
                                  placeholder="HDFC Bank / ICICI Bank"
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block font-bold mb-1">Branch</label>
                                <input
                                  type="text"
                                  placeholder="Indiranagar Branch"
                                  value={branch}
                                  onChange={(e) => setBranch(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold mb-1">IFSC Code *</label>
                                <input
                                  type="text"
                                  placeholder="HDFC0001234"
                                  value={ifscCode}
                                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono uppercase"
                                />
                              </div>
                              <div>
                                <label className="block font-bold mb-1">UPI ID *</label>
                                <input
                                  type="text"
                                  placeholder="owner@upi"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold mb-1">Account Number *</label>
                                <input
                                  type="password"
                                  placeholder="Account Number"
                                  value={accountNumber}
                                  onChange={(e) => setAccountNumber(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="block font-bold mb-1">Confirm Account Number *</label>
                                <input
                                  type="text"
                                  placeholder="Confirm Account Number"
                                  value={confirmAccountNumber}
                                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="terms-check"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-5 h-5 mt-0.5 accent-amber-500 cursor-pointer"
                        />
                        <label htmlFor="terms-check" className="text-xs leading-relaxed cursor-pointer text-slate-600 dark:text-slate-400">
                          I agree to RoomBae&apos;s <strong className="text-amber-500">Terms &amp; Conditions</strong> and <strong className="text-amber-500">Privacy Policy</strong>. All uploaded financial documents are subject to zero-trust encryption.
                        </label>
                      </div>

                      <ReCaptchaWidget action="signup" className="mt-4 mb-2 flex justify-center" />

                      {/* Final Submit Button (Golden Glowing when isStep3Valid is true) */}
                      <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => setRegStep(2)}
                          className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Personal Details
                        </button>
                        <button
                          type="submit"
                          disabled={!agreeTerms || !isStep3Valid || isSubmitting}
                          className={`px-8 py-3.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all duration-300 ${
                            agreeTerms && isStep3Valid && !isSubmitting
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:shadow-[0_0_35px_rgba(16,185,129,0.8)] hover:scale-105 cursor-pointer"
                              : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60"
                          }`}
                        >
                          {isSubmitting ? "Processing Signup..." : "Complete RoomBae Signup 🚀"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* FORGOT & OTP MODES */}
              {mode === "forgot" && (
                <>
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h2 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Reset Password
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your email address to receive a secure password reset link
                    </p>
                  </div>
                  <div className="mb-5">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => animateSwitch("otp")}
                    className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 cursor-pointer mb-4 hover:bg-amber-400 transition-colors"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => animateSwitch("login")}
                    className="w-full text-center text-xs font-bold text-amber-500 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </>
              )}

              {mode === "otp" && (
                <>
                  <div className="mb-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h2 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Enter Verification Code
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the 6-digit OTP code sent to your email or mobile
                    </p>
                  </div>

                  <OTPInput
                    length={6}
                    value={phoneOtp}
                    onChange={setPhoneOtp}
                    onComplete={handleLoginSubmit}
                  />

                  <button
                    type="button"
                    onClick={handleLoginSubmit}
                    className="w-full mt-4 py-3.5 rounded-xl bg-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 cursor-pointer mb-4 hover:bg-amber-400 transition-colors"
                  >
                    Verify &amp; Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => animateSwitch("login")}
                    className="w-full text-center text-xs font-bold text-amber-500 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <PhoneAuthModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        initialPhone={phone}
        onSuccess={(data) => {
          setIsPhoneVerified(true);
          setAuthSuccessMsg("Phone number verified successfully!");
          if (data.accessToken) {
            authService.setToken(data.accessToken);
          }
          if (loginRole === "owner") {
            navigate("dashboard");
          } else {
            navigate("resident-portal");
          }
        }}
      />
    </div>
  );
}
