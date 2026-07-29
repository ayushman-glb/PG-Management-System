import { useState, useRef, useEffect } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Shield,
  Smartphone,
} from "lucide-react";
import gsap from "gsap";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";
import { AnimatedTabs } from "../components/MotionPrimitives";

interface Props {
  navigate: (p: Page) => void;
}

type AuthMode = "login" | "register" | "forgot" | "otp" | "2fa";

export default function Auth({ navigate }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState<"owner" | "resident">("owner");
  const { darkMode } = useTheme();

  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const animateSwitch = (newMode: AuthMode) => {
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
  }, [mode, role]);

  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleSubmit = () => {
    if (mode === "login") {
      if (role === "resident") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    } else if (mode === "register") {
      if (role === "resident") {
        navigate("resident-register");
      } else {
        animateSwitch("otp");
      }
    } else if (mode === "forgot") {
      animateSwitch("otp");
    } else if (mode === "otp") {
      animateSwitch("2fa");
    } else if (mode === "2fa") {
      if (role === "resident") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    }
  };

  return (
    <div className={`min-h-screen flex relative overflow-y-auto ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <BackButton />
        <ThemeToggle />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=1000&fit=crop&auto=format"
          alt="RoomBae PG"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3B2A24]/90 via-[#6E5A52]/85 to-[#3B2A24]/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo - Home Button */}
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
            <span className="text-white font-bold text-xl tracking-tight">RoomBae</span>
          </button>

          {/* Content */}
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              The smarter way to manage your PG business &amp; stay.
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Join 500+ property owners and thousands of residents who experience seamless co-living.
            </p>
            <div className="space-y-3">
              {[
                "Automated rent collection & reminders",
                "Real-time occupancy & analytics",
                "Digital agreements & KYC verification",
                "Resident portal with meal menu & visitor passes",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "500+", label: "PG Properties" },
              { value: "10K+", label: "Happy Residents" },
              { value: "99.9%", label: "Platform Uptime" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center"
              >
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className={`w-full lg:w-[45%] flex items-center justify-center px-6 pt-20 pb-12 lg:py-12 ${darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"}`}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <button
            onClick={() => navigate("landing")}
            className="flex items-center gap-2.5 mb-8 lg:hidden cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: darkMode ? "linear-gradient(135deg, #C89A4B, #D8B36A)" : "linear-gradient(135deg, #D9A87C, #C58B63)" }}
            >
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className={`font-bold text-lg ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>RoomBae</span>
          </button>

          <div ref={cardRef} className="luxury-card overflow-hidden">
            <div ref={formRef}>
              {/* Login */}
              {mode === "login" && (
                <>
                  <div className="mb-6">
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Welcome to RoomBae
                    </h1>
                    <p className={`text-sm mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Sign in to access your dashboard &amp; portal
                    </p>
                  </div>

                  {/* Role toggle */}
                  <div className="mb-6">
                    <AnimatedTabs
                      tabs={[
                        { id: "owner", label: "🏢 Owner" },
                        { id: "resident", label: "👤 Resident" },
                      ]}
                      activeTab={role}
                      onChange={(id) => setRole(id as "owner" | "resident")}
                      layoutId="auth-role-tab"
                    />
                  </div>

                  <div className="space-y-4 mb-5">
                    {role === "resident" && (
                      <div className={`p-3 rounded-xl text-xs flex items-center justify-between font-mono ${darkMode ? "bg-[#2B2725] text-[#C89A4B] border border-[#4A433F]" : "bg-[#F8EEE5] text-[#C58B63] border border-[#E6D7CA]"}`}>
                        <span>🔑 Resident Demo: RES1001 / Resident@123</span>
                      </div>
                    )}
                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                        {role === "resident" ? "Resident ID or Email" : "Email or Phone"}
                      </label>
                      <input
                        type="text"
                        placeholder={role === "resident" ? "RES1001 or resident@example.com" : "you@example.com"}
                        defaultValue={role === "resident" ? "RES1001" : "rajesh@example.com"}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                          darkMode
                            ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] placeholder-[#756A63] focus:ring-[#C89A4B]"
                            : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] placeholder-[#A8907F] focus:ring-[#D9A87C]"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`text-sm font-semibold ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                          Password
                        </label>
                        <button
                          onClick={() => animateSwitch("forgot")}
                          className={`text-xs font-medium hover:underline ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          defaultValue={role === "resident" ? "Resident@123" : "password123"}
                          className={`w-full px-4 py-3 rounded-xl border text-sm pr-12 transition-all focus:outline-none focus:ring-2 ${
                            darkMode
                              ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] placeholder-[#756A63] focus:ring-[#C89A4B]"
                              : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] placeholder-[#A8907F] focus:ring-[#D9A87C]"
                          }`}
                        />
                        <button
                          onClick={() => setShowPass(!showPass)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? "text-[#756A63] hover:text-[#C6B9AE]" : "text-[#A8907F] hover:text-[#3B2A24]"}`}
                        >
                          {showPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 luxury-btn-primary py-3.5 text-base font-bold flex-shrink-0 cursor-pointer"
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className={`w-full border-t ${darkMode ? "border-[#4A433F]" : "border-[#E6D7CA]"}`} />
                    </div>
                    <div className={`relative text-center text-xs px-3 mx-auto w-fit ${darkMode ? "bg-[#332D2B] text-[#C6B9AE]" : "bg-[#FFFDFB] text-[#6E5A52]"}`}>
                      or continue with
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className={`flex items-center justify-center gap-2 border py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      darkMode
                        ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] hover:bg-[#3D3632]"
                        : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] hover:bg-[#F8EEE5]"
                    }`}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                    <button className={`flex items-center justify-center gap-2 border py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      darkMode
                        ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] hover:bg-[#3D3632]"
                        : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] hover:bg-[#F8EEE5]"
                    }`}>
                      <Smartphone className="w-4 h-4" />
                      OTP Login
                    </button>
                  </div>

                  <p className={`text-center text-sm mt-5 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                    New to RoomBae?{" "}
                    <button
                      onClick={() => {
                        if (role === "resident") {
                          navigate("resident-register");
                        } else {
                          animateSwitch("register");
                        }
                      }}
                      className={`font-semibold hover:underline cursor-pointer ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                    >
                      Create account
                    </button>
                  </p>
                </>
              )}

              {/* Register */}
              {mode === "register" && (
                <>
                  <div className="mb-6">
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Create your RoomBae account
                    </h1>
                    <p className={`text-sm mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Start your property manager trial or resident onboarding
                    </p>
                  </div>

                  <div className={`flex gap-1.5 p-1 rounded-xl mb-5 ${darkMode ? "bg-[#2B2725]" : "bg-[#F8EEE5]"}`}>
                    {(["owner", "resident"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                          role === r
                            ? darkMode
                              ? "bg-[#332D2B] text-[#F7F3EE] shadow-sm"
                              : "bg-[#FFFDFB] text-[#3B2A24] shadow-sm"
                            : darkMode
                              ? "text-[#C6B9AE]"
                              : "text-[#6E5A52]"
                        }`}
                      >
                        {r === "owner" ? "🏢 PG Owner" : "👤 Resident"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (role === "resident") {
                        navigate("resident-register");
                      } else {
                        handleSubmit();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 luxury-btn-primary py-3.5 text-base font-bold flex-shrink-0 cursor-pointer mb-4"
                  >
                    {role === "resident" ? "Launch Resident Onboarding Wizard" : "Create Owner Account"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className={`text-center text-sm ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                    Already have an account?{" "}
                    <button
                      onClick={() => animateSwitch("login")}
                      className={`font-semibold hover:underline cursor-pointer ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                    >
                      Sign in
                    </button>
                  </p>
                </>
              )}

              {/* Forgot Password */}
              {mode === "forgot" && (
                <>
                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? "bg-[#2B2725] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Reset password
                    </h1>
                    <p className={`text-sm mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      Enter your email and we'll send a reset link
                    </p>
                  </div>
                  <div className="mb-5">
                    <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        darkMode
                          ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] placeholder-[#756A63] focus:ring-[#C89A4B]"
                          : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] placeholder-[#A8907F] focus:ring-[#D9A87C]"
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full luxury-btn-primary py-3.5 text-base font-bold flex-shrink-0 mb-4 cursor-pointer"
                  >
                    Send OTP
                  </button>
                  <button
                    onClick={() => animateSwitch("login")}
                    className={`w-full text-sm font-medium transition-colors cursor-pointer ${darkMode ? "text-[#C6B9AE] hover:text-[#F7F3EE]" : "text-[#6E5A52] hover:text-[#3B2A24]"}`}
                  >
                    ← Back to sign in
                  </button>
                </>
              )}

              {/* OTP & 2FA screens */}
              {(mode === "otp" || mode === "2fa") && (
                <>
                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? "bg-[#2B2725] text-[#C89A4B]" : "bg-[#F8EEE5] text-[#C58B63]"}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h1 className={`text-2xl font-black ${darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}`}>
                      {mode === "otp" ? "Enter OTP" : "Two-Factor Auth"}
                    </h1>
                    <p className={`text-sm mt-1 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                      {mode === "otp" ? "We sent a 6-digit code to your phone" : "Enter the code from your authenticator app"}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center mb-6">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 transition-colors focus:outline-none ${
                          darkMode
                            ? "bg-[#2B2725] border-[#4A433F] text-[#F7F3EE] focus:border-[#C89A4B]"
                            : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] focus:border-[#D9A87C]"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full luxury-btn-primary py-3.5 text-base font-bold flex-shrink-0 mb-4 cursor-pointer"
                  >
                    Verify &amp; Continue
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
