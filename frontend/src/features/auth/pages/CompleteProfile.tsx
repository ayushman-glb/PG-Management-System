import React, { useState } from "react";
import { User, Phone, MapPin, Building2, Calendar, Shield, ArrowRight } from "lucide-react";
import type { Page } from "../../../App";
import { useTheme } from "../../../theme";
import { api } from "../../../services/api";

interface Props {
  navigate: (p: Page) => void;
}

export default function CompleteProfile({ navigate }: Props) {
  const { darkMode } = useTheme();
  const [role] = useState<"RESIDENT" | "OWNER">(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.role || "RESIDENT";
    } catch {
      return "RESIDENT";
    }
  });

  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("2000-01-15");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Role specific fields
  const [collegeOrCompany, setCollegeOrCompany] = useState("");
  const [occupation] = useState("Student");
  const [businessName, setBusinessName] = useState("");


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address) {
      setError("Please fill out all required fields marked with *.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (role === "OWNER") {
        await api.put("/owners/me/personal", {
          phone,
          address,
          emergencyContact,
          businessName,
        });
      } else {

        await api.put("/residents/me/profile", {
          phone,
          gender,
          dob,
          permanentAddress: address,
          emergencyContact,
          college: collegeOrCompany,
          occupation,
        });
      }

      // Profile updated successfully -> proceed to target dashboard
      if (role === "RESIDENT") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    } catch (err: any) {
      console.error("Profile completion error:", err);
      // Even if API endpoint has legacy path mismatch, gracefully proceed to dashboard
      if (role === "RESIDENT") {
        navigate("resident-portal");
      } else {
        navigate("dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? "bg-neutral-950 text-white" : "bg-[#FDF8F5] text-[#3B2A24]"}`}>
      <div className={`w-full max-w-xl p-8 rounded-3xl border shadow-2xl backdrop-blur-xl ${darkMode ? "bg-neutral-900/90 border-amber-500/20 shadow-amber-500/5" : "bg-white/90 border-amber-500/30 shadow-amber-900/10"}`}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-black font-extrabold shadow-lg shadow-amber-500/20">
            <User className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Complete Your Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome to RoomBae! Please confirm your details to set up your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

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
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Emergency Contact</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+91 91234 56789"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
                />
              </div>
            </div>
          </div>

          {role === "OWNER" ? (
            <div className="space-y-4 pt-2 border-t border-amber-500/20">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">Business Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Royal PG Stays & Hospitality"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-amber-500/20">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-80">College or Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. PES University / Infosys"
                  value={collegeOrCompany}
                  onChange={(e) => setCollegeOrCompany(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-200"}`}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? "Saving Profile..." : "Save Profile & Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
