import { useState, useRef, useEffect } from "react";
import {
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  User,
  Shield,
  MapPin,
  Home,
  Briefcase,
  HeartPulse,
  CreditCard,
  Check,
  X,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  FileCheck,
} from "lucide-react";
import gsap from "gsap";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";

interface Props {
  navigate: (p: Page) => void;
}

interface UploadedDoc {
  fileName: string;
  fileSize: string;
  uploadTime: string;
  type: "image" | "pdf";
  previewUrl?: string;
  progress: number; // 0 to 100
  status: "idle" | "uploading" | "success";
}

export default function ResidentRegister({ navigate }: Props) {
  const [step, setStep] = useState(1);
  const { darkMode } = useTheme();
  const [submitted, setSubmitted] = useState(false);

  const stepCardRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: "Ankit Joshi",
    gender: "Male",
    dob: "1998-05-14",
    mobile: "9876543210",
    altMobile: "9876543211",
    email: "ankit.joshi@example.com",
    emergencyName: "Ramesh Joshi",
    emergencyPhone: "9876500000",
    emergencyRelation: "Father",
    bloodGroup: "O+",
    occupation: "Working Professional",
    companyCollege: "TechCorp Solutions",

    // Step 2: Identity & Docs Numbers
    aadhaarNumber: "1234 5678 9012",
    panNumber: "ABCDE1234F",
    passportNumber: "",
    drivingLicense: "",

    // Step 3: Address & Guardian
    permanentAddress: "123 Heritage Lane, Civil Lines",
    currentAddress: "45 Lotus Garden, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    guardianName: "Ramesh Joshi",
    guardianPhone: "9876500000",
    guardianAddress: "123 Heritage Lane, Civil Lines",

    // Step 4: PG Preferences & Stay
    preferredPg: "Sunrise PG Homes",
    roomSharing: "Double Sharing",
    checkInDate: "2025-08-01",
    stayDuration: "6 Months",
    foodPref: "North Indian (Veg & Non-Veg)",
    parkingRequired: "Two Wheeler",
    vehicleNumber: "KA-01-EQ-4521",

    // Step 5: Bank Details
    bankName: "HDFC Bank",
    accountHolder: "Ankit Joshi",
    accountNumber: "5010023456789",
    ifscCode: "HDFC0000128",
    upiId: "ankit@upi",
    agreeTerms: true,
  });

  // Document Uploads State
  const [docs, setDocs] = useState<Record<string, UploadedDoc>>({
    aadhaarFront: {
      fileName: "aadhaar_front.jpg",
      fileSize: "1.8 MB",
      uploadTime: "Just now",
      type: "image",
      previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop",
      progress: 100,
      status: "success",
    },
    aadhaarBack: {
      fileName: "aadhaar_back.jpg",
      fileSize: "1.6 MB",
      uploadTime: "Just now",
      type: "image",
      previewUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&auto=format&fit=crop",
      progress: 100,
      status: "success",
    },
    panCard: {
      fileName: "pan_card_copy.pdf",
      fileSize: "840 KB",
      uploadTime: "Just now",
      type: "pdf",
      progress: 100,
      status: "success",
    },
    photo: {
      fileName: "profile_photo.jpg",
      fileSize: "920 KB",
      uploadTime: "Just now",
      type: "image",
      previewUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop",
      progress: 100,
      status: "success",
    },
  });

  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<UploadedDoc | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (stepCardRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        stepCardRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [step]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  // Simulate GSAP Animated Upload
  const handleFileUpload = (docKey: string, file: File) => {
    const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
    const previewUrl = isPdf ? undefined : URL.createObjectURL(file);

    setDocs((prev) => ({
      ...prev,
      [docKey]: {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadTime: "Uploading...",
        type: isPdf ? "pdf" : "image",
        previewUrl,
        progress: 10,
        status: "uploading",
      },
    }));

    // GSAP Progress Animation
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 25) + 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        setDocs((prev) => ({
          ...prev,
          [docKey]: {
            ...prev[docKey],
            progress: 100,
            status: "success",
            uploadTime: "Just now",
          },
        }));
        showToast(`"${file.name}" uploaded successfully!`);
      } else {
        setDocs((prev) => ({
          ...prev,
          [docKey]: {
            ...prev[docKey],
            progress: currentProgress,
          },
        }));
      }
    }, 250);
  };

  const handleDeleteDoc = (docKey: string) => {
    const cardEl = document.getElementById(`doc-card-${docKey}`);
    if (cardEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(cardEl, {
        opacity: 0,
        scale: 0.9,
        height: 0,
        marginBottom: 0,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          setDocs((prev) => {
            const copy = { ...prev };
            delete copy[docKey];
            return copy;
          });
          showToast("Document removed");
        },
      });
    } else {
      setDocs((prev) => {
        const copy = { ...prev };
        delete copy[docKey];
        return copy;
      });
    }
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.fullName.trim()) errs.fullName = "Full Name is required";
      if (!formData.mobile.trim() || formData.mobile.length < 10) errs.mobile = "Valid 10-digit mobile required";
      if (!formData.email.trim() || !formData.email.includes("@")) errs.email = "Valid email is required";
      if (!formData.emergencyPhone.trim()) errs.emergencyPhone = "Emergency contact is required";
    } else if (s === 2) {
      if (!formData.aadhaarNumber.trim() || formData.aadhaarNumber.replace(/\s/g, "").length < 12) {
        errs.aadhaarNumber = "Valid 12-digit Aadhaar number required";
      }
      if (!formData.panNumber.trim() || formData.panNumber.length < 10) {
        errs.panNumber = "Valid 10-character PAN required";
      }
    } else if (s === 3) {
      if (!formData.permanentAddress.trim()) errs.permanentAddress = "Permanent address required";
      if (!formData.city.trim()) errs.city = "City is required";
      if (!formData.pincode.trim()) errs.pincode = "Pincode is required";
    } else if (s === 4) {
      if (!formData.checkInDate) errs.checkInDate = "Check-in date required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // GSAP Shake animation on error
      if (stepCardRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.to(stepCardRef.current, {
          x: [-10, 10, -8, 8, -4, 4, 0],
          duration: 0.4,
          ease: "power2.inOut",
        });
      }
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 5) setStep(step + 1);
      else handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: "You must accept the terms & rules to register" });
      return;
    }
    setSubmitted(true);
  };

  const steps = [
    { num: 1, label: "Personal", icon: User },
    { num: 2, label: "Identity & Docs", icon: Shield },
    { num: 3, label: "Address", icon: MapPin },
    { num: 4, label: "PG Preference", icon: Home },
    { num: 5, label: "Review & Bank", icon: CreditCard },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#1D1B1A] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 animate-bounce bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2">
          <FileCheck className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-30 px-6 py-4 border-b backdrop-blur-md flex items-center justify-between ${darkMode ? "bg-[#2B2725]/90 border-[#4A433F]" : "bg-[#FFFDFB]/90 border-[#E6D7CA]"}`}>
        <button
          onClick={() => navigate("landing")}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity text-left"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">RoomBae Resident Onboarding</h1>
            <p className={`text-xs ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Join your PG community in 5 simple steps</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <BackButton />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Step Indicator */}
        <div className={`rounded-2xl p-4 md:p-6 border shadow-sm ${darkMode ? "bg-[#2B2725] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 transition-all duration-500 z-0"
              style={{
                width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                background: darkMode ? "linear-gradient(90deg, #C89A4B, #D8B36A)" : "linear-gradient(90deg, #D9A87C, #C58B63)",
              }}
            />
            {steps.map((s) => {
              const Icon = s.icon;
              const isDone = s.num < step;
              const isCurrent = s.num === step;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (s.num < step) setStep(s.num);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isDone
                        ? "bg-[#5E9F72] text-white shadow-md"
                        : isCurrent
                          ? darkMode
                            ? "bg-[#C89A4B] text-[#1D1B1A] ring-4 ring-[#C89A4B]/20 shadow-md"
                            : "bg-[#D9A87C] text-white ring-4 ring-[#D9A87C]/30 shadow-md"
                          : darkMode
                            ? "bg-[#332D2B] text-[#C6B9AE] border border-[#4A433F]"
                            : "bg-[#F8EEE5] text-[#6E5A52] border border-[#E6D7CA]"
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </button>
                  <span className={`text-xs font-semibold hidden md:block ${isCurrent ? (darkMode ? "text-[#C89A4B]" : "text-[#C58B63]") : (darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]")}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Form Card */}
        <div ref={stepCardRef} className={`luxury-card p-6 md:p-8 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black mb-1">Personal Details</h2>
                <p className={`text-sm ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Provide your basic identification and contact details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="e.g. Ankit Joshi"
                  />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateForm("gender", e.target.value)}
                    className="w-full luxury-input"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateForm("dob", e.target.value)}
                    className="w-full luxury-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => updateForm("mobile", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="10-digit mobile"
                  />
                  {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Alternate Mobile</label>
                  <input
                    type="tel"
                    value={formData.altMobile}
                    onChange={(e) => updateForm("altMobile", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="Secondary contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Emergency Contact Name *</label>
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => updateForm("emergencyName", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="Parent / Relative name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Emergency Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateForm("emergencyPhone", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="Emergency mobile"
                  />
                  {errors.emergencyPhone && <p className="text-xs text-red-500 mt-1">{errors.emergencyPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Relationship</label>
                  <select
                    value={formData.emergencyRelation}
                    onChange={(e) => updateForm("emergencyRelation", e.target.value)}
                    className="w-full luxury-input"
                  >
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                    <option>Sibling</option>
                    <option>Spouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => updateForm("bloodGroup", e.target.value)}
                    className="w-full luxury-input"
                  >
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IDENTITY & DOCS (GSAP Drag & Drop Uploads) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black mb-1">Identity &amp; KYC Verification</h2>
                <p className={`text-sm ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Upload your profile photo and government ID proof documents</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => updateForm("aadhaarNumber", e.target.value)}
                    className="w-full luxury-input font-mono"
                    placeholder="12-digit Aadhaar number"
                  />
                  {errors.aadhaarNumber && <p className="text-xs text-red-500 mt-1">{errors.aadhaarNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">PAN Card Number *</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => updateForm("panNumber", e.target.value.toUpperCase())}
                    className="w-full luxury-input font-mono uppercase"
                    placeholder="10-character PAN"
                  />
                  {errors.panNumber && <p className="text-xs text-red-500 mt-1">{errors.panNumber}</p>}
                </div>
              </div>

              {/* Upload Dropzones */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-sm">Upload Documents &amp; Photo (Drag &amp; Drop Supported)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "photo", label: "Profile Photo (JPG / PNG / WEBP)", accept: "image/*" },
                    { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: "image/*,.pdf" },
                    { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: "image/*,.pdf" },
                    { key: "panCard", label: "PAN Card Document", accept: "image/*,.pdf" },
                  ].map((field) => {
                    const doc = docs[field.key];
                    const isDragging = activeDrag === field.key;

                    return (
                      <div
                        key={field.key}
                        id={`doc-card-${field.key}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setActiveDrag(field.key);
                        }}
                        onDragLeave={() => setActiveDrag(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setActiveDrag(null);
                          if (e.dataTransfer.files?.[0]) {
                            handleFileUpload(field.key, e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-4 transition-all duration-300 relative flex flex-col justify-between ${
                          isDragging
                            ? darkMode
                              ? "border-[#C89A4B] bg-[#C89A4B]/10 scale-[1.02]"
                              : "border-[#D9A87C] bg-[#D9A87C]/10 scale-[1.02]"
                            : darkMode
                              ? "border-[#4A433F] bg-[#2B2725]"
                              : "border-[#E6D7CA] bg-[#F8EEE5]/40"
                        }`}
                      >
                        {doc && doc.status === "uploading" ? (
                          <div className="py-4 text-center space-y-2">
                            <p className="text-xs font-bold">Uploading {doc.fileName}...</p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#D9A87C] dark:bg-[#C89A4B] transition-all duration-200"
                                style={{ width: `${doc.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{doc.progress}% Completed</span>
                          </div>
                        ) : doc && doc.status === "success" ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              {doc.type === "image" && doc.previewUrl ? (
                                <img
                                  src={doc.previewUrl}
                                  alt={doc.fileName}
                                  className="w-14 h-14 rounded-xl object-cover border flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-7 h-7" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs truncate">{doc.fileName}</p>
                                <p className="text-[10px] text-slate-400">{doc.fileSize} · {doc.uploadTime}</p>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                                  <Check className="w-3 h-3" /> Uploaded Successfully
                                </span>
                              </div>
                            </div>

                            {/* Actions: View, Replace, Delete */}
                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                              <button
                                onClick={() => setPreviewModal(doc)}
                                className="text-slate-600 dark:text-slate-300 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <label className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5" /> Replace
                                <input
                                  type="file"
                                  accept={field.accept}
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileUpload(field.key, e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                onClick={() => handleDeleteDoc(field.key)}
                                className="text-red-500 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center flex flex-col items-center justify-center">
                            <Upload className={`w-6 h-6 mb-2 ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`} />
                            <p className="text-xs font-bold mb-0.5">{field.label}</p>
                            <p className="text-[10px] text-slate-400 mb-2">Drag &amp; Drop or Browse File</p>
                            <label className="luxury-btn-primary px-3 py-1.5 text-xs font-bold cursor-pointer">
                              Select File
                              <input
                                type="file"
                                accept={field.accept}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleFileUpload(field.key, e.target.files[0]);
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADDRESS & GUARDIAN */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black mb-1">Address &amp; Guardian Details</h2>
                <p className={`text-sm ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Provide permanent residence and guardian contact information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Permanent Address *</label>
                  <textarea
                    rows={2}
                    value={formData.permanentAddress}
                    onChange={(e) => updateForm("permanentAddress", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="House no, Street, Landmark"
                  />
                  {errors.permanentAddress && <p className="text-xs text-red-500 mt-1">{errors.permanentAddress}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Current Address</label>
                  <textarea
                    rows={2}
                    value={formData.currentAddress}
                    onChange={(e) => updateForm("currentAddress", e.target.value)}
                    className="w-full luxury-input"
                    placeholder="Current staying address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateForm("city", e.target.value)}
                      className="w-full luxury-input"
                    />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateForm("state", e.target.value)}
                      className="w-full luxury-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => updateForm("pincode", e.target.value)}
                      className="w-full luxury-input font-mono"
                    />
                    {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                  </div>
                </div>

                <hr className={`my-4 ${darkMode ? "border-[#4A433F]" : "border-[#E6D7CA]"}`} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => updateForm("guardianName", e.target.value)}
                      className="w-full luxury-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Guardian Contact Number</label>
                    <input
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => updateForm("guardianPhone", e.target.value)}
                      className="w-full luxury-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PG PREFERENCES */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black mb-1">PG &amp; Stay Preferences</h2>
                <p className={`text-sm ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Select your preferred RoomBae property, room sharing, and stay requirements</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Preferred PG Branch</label>
                  <select
                    value={formData.preferredPg}
                    onChange={(e) => updateForm("preferredPg", e.target.value)}
                    className="w-full luxury-input"
                  >
                    <option>Sunrise PG Homes — Indiranagar</option>
                    <option>Green Valley PG — Koramangala</option>
                    <option>Urban Nest Co-Living — HSR Layout</option>
                    <option>City Heights PG — Whitefield</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Room Sharing Type</label>
                  <select
                    value={formData.roomSharing}
                    onChange={(e) => updateForm("roomSharing", e.target.value)}
                    className="w-full luxury-input"
                  >
                    <option>Single Private Room</option>
                    <option>Double Sharing</option>
                    <option>Triple Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Expected Check-in Date *</label>
                  <input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => updateForm("checkInDate", e.target.value)}
                    className="w-full luxury-input"
                  />
                  {errors.checkInDate && <p className="text-xs text-red-500 mt-1">{errors.checkInDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Stay Duration</label>
                  <select
                    value={formData.stayDuration}
                    onChange={(e) => updateForm("stayDuration", e.target.value)}
                    className="w-full luxury-input"
                  >
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>11 Months (Standard)</option>
                    <option>1 Year+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & BANK */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black mb-1">Review &amp; Refund Bank Details</h2>
                <p className={`text-sm ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>Verify your details and add account details for deposit refund processing</p>
              </div>

              <div className={`p-4 rounded-xl space-y-3 ${darkMode ? "bg-[#2B2725] border border-[#4A433F]" : "bg-[#F8EEE5] border border-[#E6D7CA]"}`}>
                <h3 className="font-bold text-sm">Registration Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Name</span>
                    <span className="font-semibold">{formData.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mobile</span>
                    <span className="font-semibold">{formData.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">PG Branch</span>
                    <span className="font-semibold">{formData.preferredPg}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sharing</span>
                    <span className="font-semibold">{formData.roomSharing}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Uploaded Docs</span>
                    <span className="font-semibold text-emerald-600">{Object.keys(docs).length} Verified Files</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Bank Account Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => updateForm("accountNumber", e.target.value)}
                    className="w-full luxury-input font-mono"
                    placeholder="For security deposit refund"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">IFSC Code (Optional)</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => updateForm("ifscCode", e.target.value.toUpperCase())}
                    className="w-full luxury-input font-mono uppercase"
                    placeholder="e.g. HDFC0000128"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => updateForm("agreeTerms", e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-[#D9A87C]"
                  />
                  <span className={`text-xs leading-relaxed ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
                    I confirm all provided information and KYC documents are accurate. I agree to abide by RoomBae's Resident Code of Conduct and Booking Terms.
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-xs text-red-500 mt-1">{errors.agreeTerms}</p>}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t mt-8 border-slate-200 dark:border-slate-700">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${darkMode ? "bg-[#2B2725] hover:bg-[#3E3735] text-[#F7F3EE]" : "bg-[#F8EEE5] hover:bg-[#EAE0D5] text-[#3B2A24]"}`}
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <button
                onClick={() => navigate("auth")}
                className="text-xs text-slate-400 hover:underline cursor-pointer"
              >
                Cancel &amp; Back to Login
              </button>
            )}

            <button
              onClick={handleNext}
              className="luxury-btn-primary px-7 py-3 text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              {step === 5 ? "Submit Application" : "Next Step"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-lg p-6 ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{previewModal.fileName}</h3>
              <button onClick={() => setPreviewModal(null)}><X className="w-5 h-5" /></button>
            </div>
            {previewModal.type === "image" && previewModal.previewUrl ? (
              <img src={previewModal.previewUrl} alt={previewModal.fileName} className="w-full h-64 object-cover rounded-xl border mb-4" />
            ) : (
              <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center mb-4">
                <FileText className="w-16 h-16 mb-2 text-[#D9A87C]" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{previewModal.fileName}</p>
                <p className="text-xs text-slate-400 mt-1">Verified PDF Copy ({previewModal.fileSize})</p>
              </div>
            )}
            <button onClick={() => setPreviewModal(null)} className="w-full luxury-btn-primary py-2.5 font-bold text-xs cursor-pointer">
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {submitted && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`luxury-card w-full max-w-md p-8 text-center animate-slide-in-up ${darkMode ? "bg-[#332D2B] border-[#4A433F]" : "bg-[#FFFDFB] border-[#E6D7CA]"}`}>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-2">Welcome to RoomBae!</h2>
            <p className={`text-sm mb-6 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`}>
              Your resident onboarding for <strong>Sunrise PG Homes</strong> has been submitted. Your assigned Resident ID:
            </p>

            <div className={`p-4 rounded-xl mb-6 font-mono font-bold text-lg border ${darkMode ? "bg-[#2B2725] border-[#4A433F] text-[#C89A4B]" : "bg-[#F8EEE5] border-[#E6D7CA] text-[#C58B63]"}`}>
              Resident ID: RES1001
            </div>

            <button
              onClick={() => navigate("resident-portal")}
              className="w-full luxury-btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter Resident Portal <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
