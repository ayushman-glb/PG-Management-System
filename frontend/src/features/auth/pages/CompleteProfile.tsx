import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Building2, Calendar, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Page } from "@/app/App";
import { useTheme } from "../../../theme";
import { authService } from "../../../services/auth.service";

interface Props {
  navigate: (p: Page) => void;
}

export default function CompleteProfile({ navigate }: Props) {
  const { darkMode } = useTheme();

  const [role, setRole] = useState<"RESIDENT" | "PG_OWNER">("RESIDENT");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [dob, setDob] = useState("2000-01-15");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Role specific fields
  const [collegeOrCompany, setCollegeOrCompany] = useState("");
  const [occupation, setOccupation] = useState("Student");
  const [businessName, setBusinessName] = useState("");

  // Legal Acceptances
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setRole(user.role === "PG_OWNER" || user.role === "OWNER" ? "PG_OWNER" : "RESIDENT");
          setEmail(user.email || "");
          setAvatarUrl(user.avatarUrl || "");
          if (user.profile) {
            setFirstName(user.profile.firstName || "");
            setLastName(user.profile.lastName || "");
            if (user.profile.gender) setGender(user.profile.gender);
            if (user.profile.occupation) setOccupation(user.profile.occupation);
            if (user.profile.companyOrCollege) setCollegeOrCompany(user.profile.companyOrCollege);
          }
          if (user.phone) setPhone(user.phone);
          if (user.currentAddress) setAddress(user.currentAddress);
        }
      } catch (e) {
        console.warn("Could not fetch user profile on mount:", e);
      }
    };
    loadUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError("Please provide a valid 10-digit phone number.");
      return;
    }
    if (!address || address.trim().length < 5) {
      setError("Please provide a complete permanent address.");
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError("You must accept the Terms of Service and Privacy Policy to proceed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.completeProfile({
        phone: phone.trim(),
        currentAddress: address.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        gender,
        dateOfBirth: dob ? new Date(dob) : undefined,
        occupation: role === "RESIDENT" ? occupation : undefined,
        companyOrCollege: role === "RESIDENT" ? collegeOrCompany : businessName,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        acceptedTermsVersion: "v1.0",
        acceptedPrivacyVersion: "v1.0",
      });

      // Profile complete -> route to target portal
      if (role === "RESIDENT") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    } catch (err: any) {
      console.error("Profile completion error:", err);
      setError(err.message || "Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        darkMode ? "bg-neutral-950 text-white" : "bg-[#FDF8F5] text-[var(--text-main)]"
      }`}
    >
      <div
        className={`w-full max-w-2xl p-8 rounded-3xl border shadow-2xl backdrop-blur-xl ${
          darkMode
            ? "bg-neutral-900/90 border-amber-500/20 shadow-amber-500/5"
            : "bg-white/90 border-amber-500/30 shadow-amber-900/10"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-black" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight">Complete Your RoomBae Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Setting up account as <span className="font-bold text-amber-500">{role === "PG_OWNER" ? "PG Owner" : "Resident"}</span>
          </p>

          {/* Google Verified Identity Badge */}
          {email && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Google Identity Verified ({email})</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Prefill */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Phone & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Permanent Address */}
          <div>
            <label className="block text-xs font-bold mb-1 opacity-80">Permanent Address *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Street address, City, Pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* DOB & Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="Parent / Guardian Name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 opacity-80">Emergency Contact Number</label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="+91 91234 56789"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Role-Specific Section */}
          {role === "PG_OWNER" ? (
            <div className="space-y-4 pt-2 border-t border-amber-500/20">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">Business / PG Brand Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Royal Living PG & Hostels"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-500/20">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">College or Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. PES University / Infosys"
                  value={collegeOrCompany}
                  onChange={(e) => setCollegeOrCompany(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">Occupation</label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="Student">Student</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Self Employed">Self Employed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Legal Acceptances */}
          <div className="pt-3 border-t border-amber-500/20 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer opacity-90">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>I agree to RoomBae's Terms of Service & House Rules</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer opacity-90">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>I consent to RoomBae's Privacy Policy & KYC Data Processing</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? "Saving Profile..." : "Complete Profile & Enter Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
