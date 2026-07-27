import { useState } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Shield,
  Smartphone,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle } from "../theme";
import { BackButton } from "../navigation";

interface Props {
  navigate: (p: Page) => void;
}

type AuthMode = "login" | "register" | "forgot" | "otp" | "2fa";

export default function Auth({ navigate }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState<"owner" | "resident">("owner");

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
      navigate("dashboard");
    } else if (mode === "register") {
      setMode("otp");
    } else if (mode === "forgot") {
      setMode("otp");
    } else if (mode === "otp") {
      setMode("2fa");
    } else if (mode === "2fa") {
      navigate("dashboard");
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-y-auto">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <BackButton />
        <ThemeToggle />
      </div>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=1000&fit=crop&auto=format"
          alt="PG building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-violet-900/80 to-blue-900/70" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">PG Manager</span>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              The smarter way to manage your PG business.
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Join 500+ property owners who run their PGs with zero paperwork.
            </p>
            <div className="space-y-3">
              {[
                "Automated rent collection & reminders",
                "Real-time occupancy & analytics",
                "Digital agreements & KYC",
                "Resident complaint management",
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
              { value: "500+", label: "PG Owners" },
              { value: "10K+", label: "Residents" },
              { value: "99.9%", label: "Uptime" },
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
      <div className="w-full lg:w-[45%] flex items-center justify-center px-6 pt-20 pb-12 lg:py-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">PG Manager</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            {/* Login */}
            {mode === "login" && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-slate-900">
                    Welcome back
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Sign in to manage your PG properties
                  </p>
                </div>

                {/* Role toggle */}
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl mb-6">
                  {(["owner", "resident"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${role === r ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
                    >
                      {r === "owner" ? "🏢 Owner" : "👤 Resident"}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email or Phone
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      defaultValue="rajesh@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-slate-700">
                        Password
                      </label>
                      <button
                        onClick={() => setMode("forgot")}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        defaultValue="password123"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all"
                      />
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-blue-200"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative text-center text-xs text-slate-400 bg-white px-3 mx-auto w-fit">
                    or continue with
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 border border-slate-200 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-slate-200 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Smartphone className="w-4 h-4" />
                    OTP Login
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500 mt-5">
                  New to PG Manager?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="text-blue-600 font-semibold hover:underline"
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
                  <h1 className="text-2xl font-black text-slate-900">
                    Create your account
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Start your free 14-day trial today
                  </p>
                </div>

                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl mb-5">
                  {(["owner", "resident"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${role === r ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
                    >
                      {r === "owner" ? "🏢 PG Owner" : "👤 Resident"}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 mb-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="Rajesh"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Kumar"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50">
                        +91
                      </div>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min 8 characters"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      />
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-blue-200"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-slate-400 mt-4">
                  By signing up, you agree to our{" "}
                  <button
                    onClick={() => navigate("terms-of-service")}
                    className="text-blue-600 hover:underline"
                  >
                    Terms
                  </button>{" "}
                  and{" "}
                  <button
                    onClick={() => navigate("privacy-policy")}
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </button>
                </p>

                <p className="text-center text-sm text-slate-500 mt-4">
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-blue-600 font-semibold hover:underline"
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
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Reset password
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Enter your email and we'll send a reset link
                  </p>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-blue-200 mb-4"
                >
                  Send OTP
                </button>
                <button
                  onClick={() => setMode("login")}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Back to sign in
                </button>
              </>
            )}

            {/* OTP */}
            {mode === "otp" && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                    <Smartphone className="w-6 h-6 text-violet-600" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Enter OTP
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    We sent a 6-digit code to your phone
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
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-blue-200 mb-4"
                >
                  Verify OTP
                </button>
                <p className="text-center text-sm text-slate-500">
                  Didn't receive it?{" "}
                  <button className="text-blue-600 font-semibold hover:underline">
                    Resend in 0:45
                  </button>
                </p>
              </>
            )}

            {/* 2FA */}
            {mode === "2fa" && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-teal-600" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Two-Factor Auth
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Enter the code from your authenticator app
                  </p>
                </div>
                <div className="flex gap-2 justify-center mb-6">
                  {otp.slice(0, 6).map((digit, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-teal-200 mb-3"
                >
                  Verify & Sign In
                </button>
                <button
                  onClick={() => navigate("dashboard")}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Skip for now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
