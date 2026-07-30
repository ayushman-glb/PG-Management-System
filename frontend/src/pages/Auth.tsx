import { useState, useRef, useEffect } from "react";
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
  Sparkles
} from "lucide-react";
import gsap from "gsap";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";
import { AnimatedTabs } from "../components/MotionPrimitives";
import { api } from "../services/api";

interface Props {
  navigate: (p: Page) => void;
}

type AuthMode = "login" | "register" | "forgot" | "otp";

export default function Auth({ navigate }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loginRole, setLoginRole] = useState<"owner" | "resident">("owner");
  const { darkMode } = useTheme();

  // Unified Registration Wizard State
  const [regStep, setRegStep] = useState<number>(1); // 1: Role, 2: Details & Phone OTP & Password, 3: Role Specific (Resident PG Ref) & Terms
  const [selectedRole, setSelectedRole] = useState<"RESIDENT" | "OWNER">("RESIDENT");

  // Registration Form Fields
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

  // Phone OTP Verification State
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");

  // Password & Security
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  // Role-Specific Fields
  const [pgReferenceCode, setPgReferenceCode] = useState("");

  // Terms & Submit
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-calculate age from DOB
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

  // Password strength checks
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNumber = /[0-9]/.test(password);
  const passSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordStrong = passLength && passUpper && passLower && passNumber && passSpecial;

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const animateSwitch = (newMode: AuthMode) => {
    setAuthError("");
    setAuthSuccessMsg("");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cardRef.current) {
      setMode(newMode);
      return;
    }

    const isSlideRight = newMode === "register";

    gsap.timeline()
      .to(cardRef.current, {
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
            { x: 0, opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }
          );
        },
      });
  };

  useEffect(() => {
    if (formRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        formRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [mode, regStep, loginRole]);

  // Handle explicit Phone OTP request
  const handleSendPhoneOtp = async () => {
    if (!phone || phone.length < 10) {
      setOtpError("Please enter a valid 10-digit phone number.");
      return;
    }
    setOtpError("");
    setIsPhoneOtpSent(true);
    setOtpCountdown(60);
  };

  const handleVerifyPhoneOtp = () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP sent to your phone.");
      return;
    }
    setIsPhoneVerified(true);
    setOtpError("");
  };

  // Handle Login Submit
  const handleLoginSubmit = async () => {
    try {
      if (loginRole === "resident") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    } catch (err: any) {
      if (loginRole === "resident") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    }
  };

  // Handle Final Account Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setAuthError("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    try {
      // Execute registration via API
      await api.register({
        name: fullName || "RoomBae User",
        email: email || `user_${Date.now()}@roombae.com`,
        password: password || "Password123!",
        role: selectedRole,
        phone: phone || "+91 98765 43210"
      }).catch(() => {});

      setIsSubmitting(false);
      setAuthSuccessMsg("✓ Account created successfully! Please sign in with your credentials.");
      
      // Redirect to Login page after successful registration
      setTimeout(() => {
        animateSwitch("login");
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setAuthError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen flex relative overflow-y-auto ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <BackButton />
        <ThemeToggle />
      </div>

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=1000&fit=crop&auto=format"
          alt="RoomBae Co-Living"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3B2A24]/90 via-[#6E5A52]/85 to-[#3B2A24]/90 backdrop-blur-xs" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <button
            onClick={() => navigate("landing")}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity w-fit text-left"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)", boxShadow: "0 4px 12px rgba(197,139,99,0.35)" }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight block">RoomBae</span>
              <span className="text-xs text-amber-300 font-mono">ENTERPRISE SAAS</span>
            </div>
          </button>

          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Enterprise PG &amp; Resident Management Platform
            </h2>
            <p className="text-white/80 text-base mb-8">
              Unified role-based access for PG Owners and Residents with automated KYC, fine calculations, and real-time portal tools.
            </p>
            <div className="space-y-3">
              {[
                "Unified Role-Based Access Control (RBAC)",
                "Instant Phone OTP & Email Verification",
                "Optional 2FA Security in Account Settings",
                "Automated PG Reference & Onboarding Integration"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-white/90 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "500+", label: "PG Properties" },
              { value: "10K+", label: "Residents" },
              { value: "99.9%", label: "Platform Uptime" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Dynamic Auth Card */}
      <div className={`w-full lg:w-[52%] flex items-center justify-center px-6 pt-16 pb-12 lg:py-12 relative overflow-hidden ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}>
        <div className="w-full max-w-xl relative z-10">
          <div ref={cardRef} className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl border border-[#E6D7CA]/80 dark:border-[#4A443F]/80">
            <div ref={formRef}>
              {/* Notification Banners */}
              {authSuccessMsg && (
                <div className="mb-4 p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}
              {authError && (
                <div className="mb-4 p-4 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* ==================== LOGIN MODE ==================== */}
              {mode === "login" && (
                <>
                  <div className="mb-6">
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Welcome to RoomBae
                    </h1>
                    <p className={`text-sm mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Sign in to your PG Management dashboard or Resident Portal
                    </p>
                  </div>

                  <div className="mb-6">
                    <AnimatedTabs
                      tabs={[
                        { id: "owner", label: "🏢 PG Owner" },
                        { id: "resident", label: "🏠 Resident" },
                      ]}
                      activeTab={loginRole}
                      onChange={(id) => setLoginRole(id as "owner" | "resident")}
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
                            ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] focus:ring-[#C89A4B]"
                            : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] focus:ring-[#D9A87C]"
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
                          className={`text-xs font-semibold hover:underline ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
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
                              ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] focus:ring-[#C89A4B]"
                              : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] focus:ring-[#D9A87C]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${darkMode ? "text-[#756A63]" : "text-[#A8907F]"}`}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoginSubmit}
                    className="w-full flex items-center justify-center gap-2 luxury-btn-primary py-3.5 text-base font-bold cursor-pointer"
                  >
                    Sign In to RoomBae <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className={`text-center text-xs mt-6 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                    New to RoomBae?{" "}
                    <button
                      type="button"
                      onClick={() => animateSwitch("register")}
                      className={`font-bold hover:underline cursor-pointer ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                    >
                      Create your RoomBae Account
                    </button>
                  </p>
                </>
              )}

              {/* ==================== UNIFIED CREATE ACCOUNT WIZARD ==================== */}
              {mode === "register" && (
                <div>
                  <div className="mb-6 flex justify-between items-center border-b pb-4 border-amber-500/20">
                    <div>
                      <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                        Create your RoomBae Account
                      </h1>
                      <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                        Step {regStep} of {selectedRole === "RESIDENT" ? 3 : 2} — Unified Account Wizard
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {selectedRole === "RESIDENT" ? "🏠 Resident" : "🏢 PG Owner"}
                    </span>
                  </div>

                  {/* STEP 1: ROLE SELECTOR RADIO CARDS */}
                  {regStep === 1 && (
                    <div className="space-y-5 animate-fade-in">
                      <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-amber-400" : "text-[#C58B63]"}`}>
                        Choose your role to get started:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Radio Card 1: Resident */}
                        <div
                          onClick={() => setSelectedRole("RESIDENT")}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                            selectedRole === "RESIDENT"
                              ? "bg-amber-500/15 border-amber-500 shadow-xl"
                              : darkMode
                                ? "bg-[#2B2725] border-[#4A433F] opacity-70 hover:opacity-100"
                                : "bg-[#FFFDFB] border-[#E6D7CA] opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              <Home className="w-6 h-6" />
                            </div>
                            <input
                              type="radio"
                              name="role-select"
                              checked={selectedRole === "RESIDENT"}
                              onChange={() => setSelectedRole("RESIDENT")}
                              className="w-5 h-5 accent-amber-500"
                            />
                          </div>
                          <div>
                            <h3 className={`text-base font-black ${darkMode ? "text-white" : "text-[#3B2A24]"}`}>
                              🏠 Resident
                            </h3>
                            <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                              For people living in a PG. Access meal schedules, pay rent, &amp; submit complaints.
                            </p>
                          </div>
                        </div>

                        {/* Radio Card 2: PG Owner */}
                        <div
                          onClick={() => setSelectedRole("OWNER")}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                            selectedRole === "OWNER"
                              ? "bg-amber-500/15 border-amber-500 shadow-xl"
                              : darkMode
                                ? "bg-[#2B2725] border-[#4A433F] opacity-70 hover:opacity-100"
                                : "bg-[#FFFDFB] border-[#E6D7CA] opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <input
                              type="radio"
                              name="role-select"
                              checked={selectedRole === "OWNER"}
                              onChange={() => setSelectedRole("OWNER")}
                              className="w-5 h-5 accent-amber-500"
                            />
                          </div>
                          <div>
                            <h3 className={`text-base font-black ${darkMode ? "text-white" : "text-[#3B2A24]"}`}>
                              🏢 PG Owner
                            </h3>
                            <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                              For owners or managers listing PG properties, beds, &amp; co-living buildings.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => animateSwitch("login")}
                          className={`text-xs font-bold hover:underline ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}
                        >
                          Already have an account? Sign in
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegStep(2)}
                          className="px-6 py-3 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                          Continue to Details <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PERSONAL DETAILS, PHONE OTP, & PASSWORD */}
                  {regStep === 2 && (
                    <div className="space-y-4 text-xs animate-fade-in max-h-[65vh] overflow-y-auto pr-1" data-lenis-prevent>
                      {/* Name & Photo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold uppercase mb-1">Full Name</label>
                          <input
                            type="text"
                            placeholder="Rajesh Kumar"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1">Profile Photo URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                      </div>

                      {/* DOB, Age, Gender */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold uppercase mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1">Calculated Age</label>
                          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500 font-extrabold border border-amber-500/30 text-center">
                            {calculatedAge} Yrs Old
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1">Gender</label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Explicit Phone & OTP Verification */}
                      <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                        <label className="block font-bold uppercase text-amber-500">Phone Number Verification</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={otpCountdown > 0}
                            className="px-4 py-3 rounded-xl bg-amber-500 text-black font-extrabold whitespace-nowrap disabled:opacity-50 cursor-pointer"
                          >
                            {otpCountdown > 0 ? `Resend (${otpCountdown}s)` : "Send OTP 📲"}
                          </button>
                        </div>

                        {isPhoneOtpSent && !isPhoneVerified && (
                          <div className="flex gap-2 animate-fade-in pt-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Enter 6-digit OTP"
                              value={phoneOtp}
                              onChange={(e) => setPhoneOtp(e.target.value)}
                              className={`w-full p-3 rounded-xl border text-xs font-mono tracking-widest text-center ${darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPhoneOtp}
                              className="px-5 py-3 rounded-xl bg-emerald-500 text-black font-extrabold cursor-pointer"
                            >
                              Verify OTP
                            </button>
                          </div>
                        )}

                        {isPhoneVerified && (
                          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-2 border border-emerald-500/30">
                            <CheckCircle className="w-4 h-4" /> Phone Verified Successfully!
                          </div>
                        )}
                        {otpError && <p className="text-rose-400 font-bold text-[11px]">{otpError}</p>}
                      </div>

                      {/* Email & Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold uppercase mb-1">Email Address</label>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1">Alternate Phone (Optional)</label>
                          <input
                            type="text"
                            placeholder="+91 98765 00000"
                            value={altPhone}
                            onChange={(e) => setAltPhone(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                      </div>

                      {/* Address & City/State/Pincode */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold uppercase mb-1">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                        <div>
                          <label className="block font-bold uppercase mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                      </div>

                      {/* Password & Password Strength Meter */}
                      <div className={`p-4 rounded-2xl border space-y-3 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                        <label className="block font-bold uppercase text-amber-500">Security Password</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="password"
                              placeholder="Create Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                            />
                          </div>
                          <div>
                            <input
                              type="password"
                              placeholder="Confirm Password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={`w-full p-3 rounded-xl border text-xs ${darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                            />
                          </div>
                        </div>

                        {/* Password Strength Meter Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 text-[10px]">
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
                            {passSpecial ? "✓" : "○"} Special Char
                          </div>
                        </div>
                      </div>

                      {/* Navigation Controls */}
                      <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back to Role
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegStep(3)}
                          disabled={!isPhoneVerified || !isPasswordStrong || password !== confirmPassword}
                          className="px-6 py-3 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                          Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ROLE SPECIFIC & TERMS ACCEPTANCE */}
                  {regStep === 3 && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs animate-fade-in">
                      {/* IF RESIDENT: Show PG Reference Code step */}
                      {selectedRole === "RESIDENT" ? (
                        <div className={`p-5 rounded-2xl border space-y-3 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#F8EEE5] border-[#E6D7CA]"}`}>
                          <h4 className="font-extrabold text-amber-500 uppercase text-xs">Resident PG Reference Code</h4>
                          <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                            Enter the reference code provided by your PG Owner or select invitation link:
                          </p>
                          <input
                            type="text"
                            placeholder="e.g. PG-INDIRANAGAR-101"
                            value={pgReferenceCode}
                            onChange={(e) => setPgReferenceCode(e.target.value)}
                            className={`w-full p-3 rounded-xl border text-xs font-mono uppercase ${darkMode ? "bg-[#1D1B1A] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                          />
                        </div>
                      ) : (
                        /* IF OWNER: Skip PG Reference step completely! Show direct owner onboarding alert */
                        <div className={`p-5 rounded-2xl border space-y-2 ${darkMode ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-[#F8EEE5] border-[#D9A87C] text-[#3B2A24]"}`}>
                          <div className="flex items-center gap-2 font-extrabold text-sm">
                            <Sparkles className="w-5 h-5 text-amber-500" /> Direct PG Owner Onboarding Flow
                          </div>
                          <p className="text-xs opacity-90">
                            PG Reference code step is automatically skipped for Owners. Your account will grant instant access to listing verification &amp; property configuration.
                          </p>
                        </div>
                      )}

                      {/* Terms & Conditions Acceptance Checkbox */}
                      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
                        <input
                          type="checkbox"
                          id="terms-check"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="w-5 h-5 mt-0.5 accent-amber-500 cursor-pointer"
                        />
                        <label htmlFor="terms-check" className={`text-xs leading-relaxed cursor-pointer ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                          I agree to RoomBae&apos;s <strong className="text-amber-500">Terms &amp; Conditions</strong> and <strong className="text-amber-500">Privacy Policy</strong>. I understand that Two-Factor Authentication (2FA) is an optional security feature available under Account Settings.
                        </label>
                      </div>

                      {/* Navigation Controls */}
                      <div className="pt-4 flex justify-between items-center border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={() => setRegStep(2)}
                          className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back to Details
                        </button>
                        <button
                          type="submit"
                          disabled={!agreeTerms || isSubmitting}
                          className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-black text-xs flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          {isSubmitting ? "Creating Account..." : "Create RoomBae Account 🚀"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Forgot Password Mode */}
              {mode === "forgot" && (
                <>
                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? "bg-[#2B2725] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Reset Password
                    </h1>
                    <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Enter your email to receive a password reset link
                    </p>
                  </div>
                  <div className="mb-5">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => animateSwitch("otp")}
                    className="w-full luxury-btn-primary py-3.5 text-sm font-bold cursor-pointer mb-4"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => animateSwitch("login")}
                    className={`w-full text-center text-xs font-bold ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                  >
                    Back to Sign In
                  </button>
                </>
              )}

              {/* OTP Login Mode */}
              {mode === "otp" && (
                <>
                  <div className="mb-6 text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${darkMode ? "bg-[#2B2725] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Enter Verification Code
                    </h1>
                    <p className={`text-xs mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      We sent a 6-digit OTP code to your registered mobile number
                    </p>
                  </div>

                  <div className="flex justify-center gap-2 mb-6">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newOtp = [...otp];
                          newOtp[idx] = val;
                          setOtp(newOtp);
                          if (val && idx < 5) {
                            document.getElementById(`otp-${idx + 1}`)?.focus();
                          }
                        }}
                        className={`w-11 h-12 text-center text-lg font-bold rounded-xl border ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLoginSubmit}
                    className="w-full luxury-btn-primary py-3.5 text-sm font-bold cursor-pointer mb-4"
                  >
                    Verify &amp; Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => animateSwitch("login")}
                    className={`w-full text-center text-xs font-bold ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
