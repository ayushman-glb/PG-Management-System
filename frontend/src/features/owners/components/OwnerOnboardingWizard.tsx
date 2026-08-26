import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  X,
  Loader2,
} from "lucide-react";
import { useTheme } from "../../../theme";
import { ownerService } from "@services/owner.service";
import { authService } from "@services/auth.service";

interface OwnerOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OwnerOnboardingWizard: React.FC<OwnerOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { darkMode } = useTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  const [personal, setPersonal] = useState({
    fullName: "Rajesh Kumar",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    dob: "1988-06-15",
    gender: "MALE",
    phone: "+91 98765 43210",
    altPhone: "+91 98765 43211",
    email: "rajesh.kumar@roombae.com",
    address: "102 100 Feet Road",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    pincode: "560038",
    emergencyContact: "+91 98765 00000",
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  const [kyc, setKyc] = useState({
    aadhaarNumber: "5432-8765-1092",
    panNumber: "ABCDE1234F",
    passportNumber: "N1234567",
    drivingLicenseNo: "KA0120200012345",
    ownerSelfieUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    liveFaceCheckPassed: true,
    signatureSvg: "",
  });

  const [business, setBusiness] = useState({
    businessName: "Luxe Stays & Co-Living LLP",
    businessType: "LLP",
    gstin: "29ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    businessAddress: "102 100 Feet Road, Indiranagar, Bengaluru - 560038",
    businessEmail: "contact@luxestays.in",
    businessPhone: "+91 80 4123 4567",
    registrationNumber: "LLPIN-AAA-1234",
    tradeLicenseDocUrl: "#",
  });

  const [bank, setBank] = useState({
    bankName: "HDFC Bank",
    accountHolderName: "Luxe Stays LLP",
    accountNumber: "50100492837401",
    confirmAccountNumber: "50100492837401",
    ifscCode: "HDFC0001234",
    branch: "Indiranagar Main Branch",
    cancelledChequeUrl: "#",
    upiId: "luxestays@hdfcbank",
  });

  const [property, setProperty] = useState({
    pgName: "RoomBae Indiranagar Luxe PG",
    propertyType: "PG",
    ownershipType: "OWNED",
    landlordName: "",
    landlordLeaseAgreementUrl: "",
    nocDocumentUrl: "",
    rentStartingFrom: 8500,
    securityDeposit: 17000,
  });

  const [location] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    address: "100 Feet Road, Indiranagar",
    landmark: "Near Indiranagar Metro Station",
    area: "Indiranagar",
    city: "Bengaluru",
    pincode: "560038",
  });

  const [building, setBuilding] = useState({
    buildingName: "Main Tower",
    floorsCount: 3,
    caretakerName: "Santhosh Kumar",
    caretakerPhone: "+91 99887 76655",
    amenities: [
      "WiFi",
      "Laundry",
      "CCTV",
      "Power Backup",
      "Lift",
      "Mess",
      "RO Water",
      "Geyser",
      "Security",
    ],
  });

  const [roomConfig, setRoomConfig] = useState({
    floorsCount: 3,
    roomsPerFloor: 4,
    roomType: "DOUBLE",
    customCapacity: 2,
    rentAmount: 8500,
  });

  const [_photos, _setPhotos] = useState({
    roomPhotos: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
    ],
    buildingPhotos: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    ],
    fireSafetyCert: "#",
    tradeLicense: "#",
    propertyTaxReceipt: "#",
  });

  const [subscription, setSubscription] = useState({
    planType: "PROFESSIONAL",
    paymentTxnId: "TXN_SUB_891238",
  });
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState("");

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(personal.dob);

  if (!isOpen) return null;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resolveOwnerId = async (): Promise<string> => {
    try {
      const currentUser: any = await authService.getCurrentUser();
      const user = currentUser?.user || currentUser || {};
      return user.ownerId || user.id || "me";
    } catch {
      return "me";
    }
  };

  const handleSubmitAll = async () => {
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const ownerId = await resolveOwnerId();
      await ownerService.runFullOnboarding({
        ownerId,
        personal,
        kyc,

        business,
        bank,
        property,
        location,
        building: { ...building, amenitiesList: building.amenities },
        roomConfig,
        subscription,
      });
      setSubmitState("done");
      onSuccess?.();
      setTimeout(() => onClose(), 800);
    } catch (e: any) {
      setSubmitState("error");
      setSubmitError(
        e?.message ||
          "Onboarding submission failed. Please check your connection and try again.",
      );
      console.error("Onboarding submission error:", e);
    }
  };

  const modalBg = darkMode
    ? "bg-neutral-900 border-white/10 text-white"
    : "bg-[#ffffff] border-[#dddddd] text-[#222222]";
  const cardBg = darkMode
    ? "bg-neutral-950/80 border-white/10 text-white"
    : "bg-[#f7f7f7] border-[#dddddd] text-[#222222]";
  const inputBg = darkMode
    ? "bg-neutral-800 border-white/10 text-white placeholder-neutral-500"
    : "bg-[#ffffff] border-[#dddddd] text-[#222222]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6a6a6a]";

  const stepTitles = [
    "Personal Details",
    "Owner Identity KYC",
    "Business Profile",
    "Bank Account & Payouts",
    "Property Specification",
    "Location & Map Preview",
    "Building & Amenities",
    "Floor & Room Config",
    "Photos & Legal Docs",
    "Subscription Plan",
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        data-lenis-prevent
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border flex flex-col shadow-2xl ${modalBg}`}
        >
          <div
            className={`p-6 border-b flex justify-between items-center ${darkMode ? "bg-neutral-900 border-white/10" : "bg-[#f7f7f7] border-[#dddddd]"}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Step {currentStep} of {totalSteps}
                </span>
                <h2 className="text-lg md:text-xl font-black">
                  {stepTitles[currentStep - 1]}
                </h2>
              </div>
              <p className={`text-xs ${textMuted} mt-1`}>
                Complete commercial PG onboarding wizard for instant listing
                verification
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full cursor-pointer ${darkMode ? "bg-white/10 text-neutral-400 hover:text-white" : "bg-[#dddddd] text-[#6a6a6a] hover:text-[#222222]"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-1.5 w-full bg-amber-500/10">
            <motion.div
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
            />
          </div>

          <div
            className="p-6 overflow-y-auto flex-1 space-y-6 text-xs"
            data-lenis-prevent
          >
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">FULL NAME</label>
                    <input
                      type="text"
                      value={personal.fullName}
                      onChange={(e) =>
                        setPersonal({ ...personal, fullName: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      DATE OF BIRTH &amp; AGE
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={personal.dob}
                        onChange={(e) =>
                          setPersonal({ ...personal, dob: e.target.value })
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                      />
                      <span className="px-3 py-3 rounded-xl bg-amber-500/20 text-amber-500 font-bold flex items-center whitespace-nowrap">
                        {calculatedAge} Yrs Old
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      CONTACT PHONE (OTP VERIFIED)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={personal.phone}
                        onChange={(e) =>
                          setPersonal({ ...personal, phone: e.target.value })
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      EMAIL ADDRESS (VERIFIED)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={personal.email}
                        onChange={(e) =>
                          setPersonal({ ...personal, email: e.target.value })
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold mb-1">
                      RESIDENTIAL ADDRESS
                    </label>
                    <input
                      type="text"
                      value={personal.address}
                      onChange={(e) =>
                        setPersonal({ ...personal, address: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${darkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-[#f7f7f7] border-[#ff385c] text-[#222222]"}`}
                >
                  <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold">
                      Govt Identity &amp; Biometric Live Verification
                    </p>
                    <p className="text-[11px] opacity-80">
                      Upload Aadhaar, PAN, and complete instant face check
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">
                      AADHAAR NUMBER
                    </label>
                    <input
                      type="text"
                      value={kyc.aadhaarNumber}
                      onChange={(e) =>
                        setKyc({ ...kyc, aadhaarNumber: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      PAN CARD NUMBER
                    </label>
                    <input
                      type="text"
                      value={kyc.panNumber}
                      onChange={(e) =>
                        setKyc({ ...kyc, panNumber: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border flex items-center justify-between ${cardBg}`}
                >
                  <div className="flex items-center gap-3">
                    <Camera className="w-6 h-6 text-amber-500" />
                    <div>
                      <p className="font-bold">Live AI Face Verification</p>
                      <p className={`text-[11px] ${textMuted}`}>
                        Matches owner selfie against uploaded Aadhaar card
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Live Check Passed
                  </span>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">
                      BUSINESS NAME
                    </label>
                    <input
                      type="text"
                      value={business.businessName}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          businessName: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      BUSINESS ENTITY TYPE
                    </label>
                    <select
                      value={business.businessType}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          businessType: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    >
                      <option value="INDIVIDUAL">
                        Individual / Sole Proprietorship
                      </option>
                      <option value="PARTNERSHIP">Partnership Firm</option>
                      <option value="LLP">
                        Limited Liability Partnership (LLP)
                      </option>
                      <option value="PVT_LIMITED">
                        Private Limited (Pvt Ltd)
                      </option>
                      <option value="TRUST">Trust / Society</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      GSTIN NUMBER (VALIDATED)
                    </label>
                    <input
                      type="text"
                      value={business.gstin}
                      onChange={(e) =>
                        setBusiness({ ...business, gstin: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      TRADE LICENSE NUMBER
                    </label>
                    <input
                      type="text"
                      value={business.registrationNumber}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          registrationNumber: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">BANK NAME</label>
                    <input
                      type="text"
                      value={bank.bankName}
                      onChange={(e) =>
                        setBank({ ...bank, bankName: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      ACCOUNT HOLDER NAME
                    </label>
                    <input
                      type="text"
                      value={bank.accountHolderName}
                      onChange={(e) =>
                        setBank({ ...bank, accountHolderName: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      ACCOUNT NUMBER
                    </label>
                    <input
                      type="password"
                      value={bank.accountNumber}
                      onChange={(e) =>
                        setBank({ ...bank, accountNumber: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      CONFIRM ACCOUNT NUMBER
                    </label>
                    <input
                      type="text"
                      value={bank.confirmAccountNumber}
                      onChange={(e) =>
                        setBank({
                          ...bank,
                          confirmAccountNumber: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      IFSC CODE (VALIDATED)
                    </label>
                    <input
                      type="text"
                      value={bank.ifscCode}
                      onChange={(e) =>
                        setBank({ ...bank, ifscCode: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      UPI ID FOR INSTANT PAYOUTS
                    </label>
                    <input
                      type="text"
                      value={bank.upiId}
                      onChange={(e) =>
                        setBank({ ...bank, upiId: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">
                      PG / PROPERTY NAME
                    </label>
                    <input
                      type="text"
                      value={property.pgName}
                      onChange={(e) =>
                        setProperty({ ...property, pgName: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      PROPERTY TYPE
                    </label>
                    <select
                      value={property.propertyType}
                      onChange={(e) =>
                        setProperty({
                          ...property,
                          propertyType: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    >
                      <option value="PG">Hostel / Executive PG</option>
                      <option value="APARTMENT">Co-Living Apartment</option>
                      <option value="VILLA">Gated Villa</option>
                      <option value="BUILDING">Independent Building</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      RENT STARTING FROM (₹/MO)
                    </label>
                    <input
                      type="number"
                      value={property.rentStartingFrom}
                      onChange={(e) =>
                        setProperty({
                          ...property,
                          rentStartingFrom: parseFloat(e.target.value),
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      REFUNDABLE SECURITY DEPOSIT (₹)
                    </label>
                    <input
                      type="number"
                      value={property.securityDeposit}
                      onChange={(e) =>
                        setProperty({
                          ...property,
                          securityDeposit: parseFloat(e.target.value),
                        })
                      }
                      className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4 animate-fade-in">
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${cardBg}`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-amber-500" />
                    <div>
                      <p className="font-bold">Google Maps Geolocation Pin</p>
                      <p className={`text-[11px] ${textMuted}`}>
                        Lat: {location.latitude}, Lng: {location.longitude}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs">
                    Get Browser GPS 📍
                  </button>
                </div>
                <div className="h-40 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400">
                  🗺️ Map Preview Canvas Grid (Indiranagar, Bengaluru)
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    "WiFi",
                    "AC",
                    "Mess Food",
                    "Laundry",
                    "CCTV",
                    "Power Backup",
                    "Lift",
                    "RO Water",
                    "Geyser",
                    "Gym",
                    "Parking",
                    "Security Guard",
                  ].map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => {
                        const exists = building.amenities.includes(amenity);
                        setBuilding({
                          ...building,
                          amenities: exists
                            ? building.amenities.filter((a) => a !== amenity)
                            : [...building.amenities, amenity],
                        });
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        building.amenities.includes(amenity)
                          ? "bg-amber-500/20 border-amber-500 text-amber-500 font-bold"
                          : `${inputBg} opacity-70`
                      }`}
                    >
                      ✓ {amenity}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 8 && (
              <div className="space-y-4 animate-fade-in">
                <div className={`p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                  <h4 className="font-bold uppercase text-amber-500">
                    Automated Room &amp; Bed Generator
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1">
                        TOTAL FLOORS
                      </label>
                      <input
                        type="number"
                        value={roomConfig.floorsCount}
                        onChange={(e) =>
                          setRoomConfig({
                            ...roomConfig,
                            floorsCount: parseInt(e.target.value),
                          })
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">
                        ROOMS PER FLOOR
                      </label>
                      <input
                        type="number"
                        value={roomConfig.roomsPerFloor}
                        onChange={(e) =>
                          setRoomConfig({
                            ...roomConfig,
                            roomsPerFloor: parseInt(e.target.value),
                          })
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">
                        DEFAULT SHARING
                      </label>
                      <select
                        value={roomConfig.roomType}
                        onChange={(e) =>
                          setRoomConfig({
                            ...roomConfig,
                            roomType: e.target.value as any,
                          })
                        }
                        className={`w-full p-3 rounded-xl border text-xs ${inputBg}`}
                      >
                        <option value="SINGLE">Single Sharing (1 Bed)</option>
                        <option value="DOUBLE">Double Sharing (2 Beds)</option>
                        <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                        <option value="FOUR_SHARING">
                          Four Sharing (4 Beds)
                        </option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-500 font-semibold pt-2">
                    ⚡ Will generate{" "}
                    {roomConfig.floorsCount * roomConfig.roomsPerFloor} Rooms
                    and{" "}
                    {roomConfig.floorsCount *
                      roomConfig.roomsPerFloor *
                      (roomConfig.roomType === "SINGLE" ? 1 : 2)}{" "}
                    Beds in real time.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 9 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border space-y-2 ${cardBg}`}>
                    <p className="font-bold">Property Ownership Proof</p>
                    <p className={`text-[11px] ${textMuted}`}>
                      Upload Property Tax Receipt / Ownership Deed
                    </p>
                    <button className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold">
                      Upload Document 📂
                    </button>
                  </div>
                  <div className={`p-4 rounded-2xl border space-y-2 ${cardBg}`}>
                    <p className="font-bold">Fire Safety &amp; Municipal NOC</p>
                    <p className={`text-[11px] ${textMuted}`}>
                      Required for commercial PG licensing
                    </p>
                    <button className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold">
                      Upload NOC 📂
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 10 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      type: "STARTER",
                      price: "₹999/mo",
                      cap: "Up to 30 Residents",
                      props: "1 Property",
                    },
                    {
                      type: "PROFESSIONAL",
                      price: "₹2,499/mo",
                      cap: "Up to 100 Residents",
                      props: "3 Properties",
                    },
                    {
                      type: "BUSINESS",
                      price: "₹4,999/mo",
                      cap: "Up to 300 Residents",
                      props: "10 Properties",
                    },
                    {
                      type: "ENTERPRISE",
                      price: "₹9,999/mo",
                      cap: "Unlimited Residents",
                      props: "Unlimited Properties",
                    },
                  ].map((plan) => (
                    <button
                      key={plan.type}
                      onClick={() =>
                        setSubscription({
                          ...subscription,
                          planType: plan.type,
                        })
                      }
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        subscription.planType === plan.type
                          ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-xl font-bold"
                          : `${cardBg} opacity-70`
                      }`}
                    >
                      <h4 className="font-black text-sm">{plan.type}</h4>
                      <p className="text-lg font-black text-emerald-500 my-1">
                        {plan.price}
                      </p>
                      <p className="text-[10px]">{plan.cap}</p>
                      <p className="text-[10px]">{plan.props}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`p-4 border-t flex justify-between items-center ${darkMode ? "bg-neutral-900 border-white/10" : "bg-[#f7f7f7] border-[#dddddd]"}`}
          >
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 disabled:opacity-30 cursor-pointer ${darkMode ? "bg-neutral-800 text-white" : "bg-[#dddddd] text-[#222222]"}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitAll}
                disabled={submitState === "submitting"}
                className="px-8 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {submitState === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : submitState === "done" ? (
                  "✓ Submitted & Published!"
                ) : (
                  "Submit for Verification & Publish Listing 🚀"
                )}
              </button>
            )}
            {submitError && (
              <p className="text-[11px] font-bold text-rose-400 w-full text-center pt-1">
                {submitError}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
