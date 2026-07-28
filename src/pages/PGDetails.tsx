import { useState } from "react";
import {
  Star,
  Heart,
  Share2,
  MapPin,
  Wifi,
  Coffee,
  Car,
  Shield,
  Zap,
  BedDouble,
  Users,
  Phone,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle } from "../theme";
import { BackButton } from "../navigation";

interface Props {
  navigate: (p: Page) => void;
}

const images = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&h=700&fit=crop&auto=format",
];

const amenities = [
  { icon: Wifi, label: "High-Speed WiFi", desc: "100 Mbps fiber" },
  { icon: Coffee, label: "3 Meals / Day", desc: "North & South Indian" },
  { icon: Car, label: "Free Parking", desc: "Covered 2-wheeler" },
  { icon: Shield, label: "24/7 Security", desc: "CCTV + Guard" },
  { icon: Zap, label: "Power Backup", desc: "Full inverter backup" },
  { icon: BedDouble, label: "Furnished Rooms", desc: "Bed, almirah, table" },
  { icon: Users, label: "Common Areas", desc: "Lounge, terrace, gym" },
  { icon: CheckCircle, label: "Housekeeping", desc: "Daily cleaning" },
];

const rooms = [
  {
    type: "Single Sharing",
    price: 12000,
    available: 2,
    features: ["Attached bathroom", "AC", "Window view"],
  },
  {
    type: "Double Sharing",
    price: 9000,
    available: 3,
    features: ["Common bathroom", "Fan", "Balcony access"],
  },
  {
    type: "Triple Sharing",
    price: 7500,
    available: 1,
    features: ["Common bathroom", "Fan", "Ground floor"],
  },
];

const reviews = [
  {
    name: "Priya Sharma",
    rating: 5,
    date: "June 2025",
    avatar: "PS",
    text: "Absolutely love staying here. The food is amazing and the WiFi is super fast. Staff is very helpful.",
  },
  {
    name: "Vikram Nair",
    rating: 5,
    date: "May 2025",
    avatar: "VN",
    text: "Clean, secure, and very well maintained. The location is perfect for my office commute.",
  },
  {
    name: "Ananya Iyer",
    rating: 4,
    date: "April 2025",
    avatar: "AI",
    text: "Great place overall. Meals could be better but everything else is excellent.",
  },
];

const nearbyPlaces = [
  { name: "Koramangala Market", dist: "0.3 km", type: "🛒" },
  { name: "BMTC Bus Stop", dist: "0.1 km", type: "🚌" },
  { name: "Apollo Hospital", dist: "1.2 km", type: "🏥" },
  { name: "Forum Mall", dist: "2.0 km", type: "🏬" },
];

export default function PGDetails({ navigate }: Props) {
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#3B2A24]">
      {/* Top nav */}
      <div className="bg-[#FFFDFB] border-b border-[#E6D7CA] sticky top-0 z-40 px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BackButton />
            <button
              onClick={() => navigate("pg-listing")}
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to Listings
            </button>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`}
              />
              {liked ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div>
              <div className="relative rounded-2xl overflow-hidden h-80 md:h-96 bg-slate-200">
                <img
                  src={images[currentImg]}
                  alt="PG"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setCurrentImg(
                      (currentImg - 1 + images.length) % images.length,
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImg((currentImg + 1) % images.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
                >
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${currentImg === i ? "bg-white w-4" : "bg-white/60"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${currentImg === i ? "border-[#D9A87C]" : "border-transparent"}`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-white px-3 py-1 rounded-full mb-3 inline-block shadow-sm" style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}>
                    Boutique Luxury
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 mb-2">
                    Urban Nest Co-living
                  </h1>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      Indiranagar 100ft Road, Bengaluru — 2 beds available
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-xl font-black text-slate-900">
                      4.8
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">214 reviews</span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenities.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.label}
                      className="bg-white border border-slate-100 rounded-xl p-4 card-hover"
                    >
                      <Icon className="w-5 h-5 text-[#C58B63] mb-2" />
                      <p className="font-semibold text-slate-900 text-sm">
                        {a.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rooms */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Room Options
              </h2>
              <div className="space-y-3">
                {rooms.map((room) => (
                  <button
                    key={room.type}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-all ${selectedRoom.type === room.type ? "border-[#D9A87C] bg-[#F8EEE5]" : "border-slate-100 bg-white hover:border-slate-200"}`}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900">
                          {room.type}
                        </h3>
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                          {room.available} available
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {room.features.map((f) => (
                          <span
                            key={f}
                            className="text-xs text-slate-500 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3 text-teal-500" />{" "}
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-xl font-black text-slate-900">
                        ₹{room.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        /month
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Reviews
                <span className="text-base font-normal text-slate-500 ml-2">
                  ({reviews.length} recent)
                </span>
              </h2>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.name}
                    className="bg-white border border-slate-100 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                        >
                          {r.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {r.name}
                          </p>
                          <p className="text-xs text-slate-400">{r.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Nearby Places
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {nearbyPlaces.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-4"
                  >
                    <span className="text-xl">{p.type}</span>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400">{p.dist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 sticky top-24 shadow-sm">
              <div className="mb-5">
                <span className="text-3xl font-black text-slate-900">
                  ₹{selectedRoom.price.toLocaleString()}
                </span>
                <span className="text-slate-500 text-sm">/month</span>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedRoom.type}
                </p>
              </div>

              <div className="space-y-3 mb-5">
                <div className="border border-slate-200 rounded-xl p-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Move-in Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      className="flex-1 text-sm text-slate-700 outline-none bg-transparent"
                      defaultValue="2025-08-01"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowBooking(true)}
                className="w-full luxury-btn-primary font-bold py-3.5 flex-shrink-0 mb-3"
              >
                Book Visit
              </button>
              <button className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl transition-colors text-sm">
                Schedule Call
              </button>

              {/* Owner info */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">
                  Managed by
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #D9A87C, #C58B63)" }}
                  >
                    RK
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      Rajesh Kumar
                    </p>
                    <p className="text-xs text-slate-500">
                      PG Owner · 4 properties
                    </p>
                  </div>
                  <a
                    href="tel:+919876543210"
                    className="ml-auto w-8 h-8 bg-[#F8EEE5] rounded-xl flex items-center justify-center hover:bg-[#EDE0D4] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C58B63]" />
                  </a>
                </div>
              </div>

              <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                <p className="flex items-center gap-1.5 font-medium text-slate-700 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  Free cancellation before move-in
                </p>
                <p>No booking fee. Pay rent directly to owner.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking confirmation modal */}
      {showBooking && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              Visit Booked!
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Your visit to <strong>Urban Nest Co-living</strong> has been
              scheduled. The owner will call you within 2 hours to confirm.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Property</span>
                <span className="font-semibold text-slate-800">
                  Urban Nest Co-living
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room Type</span>
                <span className="font-semibold text-slate-800">
                  {selectedRoom.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Rent</span>
                <span className="font-semibold text-slate-800">
                  ₹{selectedRoom.price.toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowBooking(false)}
              className="w-full luxury-btn-primary font-semibold py-3"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
