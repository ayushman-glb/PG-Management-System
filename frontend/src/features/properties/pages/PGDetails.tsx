import { useState } from "react";
import {
  Star,
  Heart,
  Share2,
  MapPin,
  ShieldCheck,
  Wifi,
  Utensils,
} from "lucide-react";
import type { Page } from "@app/App";
import { ThemeToggle } from "@theme/index";
import { BackButton } from "@app/navigation";
import { Logo } from "@components/ui/Logo";
import { Button } from "@components/ui/Button";

interface Props {
  navigate: (p: Page) => void;
}

const photoGallery = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
];

const WEEKLY_MEALS = [
  { day: "Monday", b: "Idli Vada, Sambar, Filter Coffee", l: "Dal Tadka, Mix Veg, Rice, Roti", d: "Rajma Masala, Jeera Rice, Chapati" },
  { day: "Tuesday", b: "Masala Dosa, Chutney, Tea", l: "Paneer Butter Masala, Rice, Roti", d: "Egg Curry / Aloo Gobi, Rice, Roti" },
  { day: "Wednesday", b: "Puri Bhaji, Hot Chai", l: "Chole Bhature, Veg Pulao", d: "Kadai Paneer, Rice, Gulab Jamun" },
  { day: "Thursday", b: "Poha & Jalebi, Coffee", l: "Kadi Pakoda, Rice, Chapati", d: "Mix Dal, Aloo Bhindi, Roti" },
  { day: "Friday", b: "Uttapam, Sambar, Tea", l: "Biryani Delight, Raita, Salad", d: "Dal Makhani, Butter Naan" },
  { day: "Saturday", b: "Aloo Paratha, Curd", l: "South Indian Deluxe Thali", d: "Paneer Do Pyaza, Rice, Roti" },
  { day: "Sunday (Special)", b: "Mysore Dosa & Espresso", l: "Chef Special Biryani & Kheer", d: "Paneer Tikka Masala, Naan" },
];

export default function PGDetails({ navigate }: Props) {
  const [liked, setLiked] = useState(false);
  const [sharingOption, setSharingOption] = useState("Single Private Suite");
  const [moveInDate, setMoveInDate] = useState("2026-09-01");

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-[#222222] dark:text-[#f7f7f7] font-sans transition-colors">
      {/* ─── Airbnb Sticky Top Header ───────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#121212] border-b border-[#ebebeb] dark:border-[#242424] transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <Logo onClick={() => navigate("landing")} size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "RoomBae Indiranagar", url: window.location.href });
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-[#ff385c] text-[#ff385c]" : ""}`} />
              <span className="hidden sm:inline">{liked ? "Saved" : "Save"}</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Title Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222222] dark:text-[#f7f7f7]">
            RoomBae Luxury Co-Living & Executive Suites
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#6a6a6a] dark:text-[#a1a1aa] mt-2">
            <div className="flex items-center gap-1 text-[#222222] dark:text-[#f7f7f7] font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>4.96</span>
              <span>·</span>
              <span className="underline cursor-pointer">128 reviews</span>
            </div>
            <span>·</span>
            <span className="text-[#222222] dark:text-[#f7f7f7] font-bold">🏆 Superhost</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Indiranagar 100ft Road, Bengaluru
            </span>
          </div>
        </div>

        {/* ─── Airbnb 5-Photo Collage ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 rounded-2xl overflow-hidden mb-10 h-72 md:h-[420px]">
          {/* Main Hero Photo */}
          <div className="md:col-span-2 h-full overflow-hidden">
            <img
              src={photoGallery[0]}
              alt="RoomBae suite"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
            />
          </div>

          {/* Sub Photos */}
          <div className="hidden md:grid col-span-2 grid-cols-2 gap-2 md:gap-3 h-full">
            {photoGallery.slice(1, 5).map((photo, i) => (
              <div key={i} className="h-full overflow-hidden">
                <img
                  src={photo}
                  alt={`RoomBae photo ${i + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ─── 2-Column Split: Details Left, Sticky Booking Right ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column (Details) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Host Banner */}
            <div className="pb-6 border-b border-[#dddddd] dark:border-[#2e2e2e] flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#222222] dark:text-[#f7f7f7]">
                  Entire suite managed by RoomBae Verified Host
                </h2>
                <p className="text-xs text-[#6a6a6a] dark:text-[#a1a1aa] mt-0.5">
                  Private bedroom • Attached washroom • 100 Mbps WiFi • 3 Meals included
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#ff385c] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                RB
              </div>
            </div>

            {/* ─── Airbnb Guest Favorite Laurels Box ─────────────────── */}
            <div className="p-6 rounded-2xl border border-[#dddddd] dark:border-[#2e2e2e] flex items-center justify-between bg-[#f7f7f7] dark:bg-[#1a1a1a]">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🌿</span>
                <div>
                  <h3 className="font-bold text-sm text-[#222222] dark:text-[#f7f7f7]">
                    Guest favorite
                  </h3>
                  <p className="text-xs text-[#6a6a6a] dark:text-[#a1a1aa]">
                    One of the most loved PGs on RoomBae based on ratings, reviews, and reliability.
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-4">
                <div className="text-clamp-rating text-[#222222] dark:text-[#f7f7f7]">
                  4.96
                </div>
                <div className="flex justify-end text-xs text-[#222222] dark:text-[#f7f7f7]">
                  ★★★★★
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4 pb-6 border-b border-[#dddddd] dark:border-[#2e2e2e]">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-5 h-5 text-[#ff385c] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#222222] dark:text-[#f7f7f7]">
                    100% Superhost Verified
                  </h4>
                  <p className="text-xs text-[#6a6a6a] dark:text-[#a1a1aa]">
                    Superhosts are experienced, highly rated hosts committed to great stays.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Wifi className="w-5 h-5 text-[#ff385c] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#222222] dark:text-[#f7f7f7]">
                    High-speed Dedicated WiFi
                  </h4>
                  <p className="text-xs text-[#6a6a6a] dark:text-[#a1a1aa]">
                    Gigabit fiber internet with power backup for uninterrupted remote work.
                  </p>
                </div>
              </div>
            </div>

            {/* 7-Day Weekly Food Menu */}
            <div className="pb-6 border-b border-[#dddddd] dark:border-[#2e2e2e]">
              <h3 className="text-base font-bold text-[#222222] dark:text-[#f7f7f7] mb-4 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#ff385c]" />
                7-Day Homestyle Mess Menu
              </h3>
              <div className="space-y-2.5 text-xs">
                {WEEKLY_MEALS.map((meal) => (
                  <div
                    key={meal.day}
                    className="p-3 rounded-xl border border-[#dddddd] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e]"
                  >
                    <span className="font-bold text-[#222222] dark:text-[#f7f7f7] block mb-1">
                      {meal.day}
                    </span>
                    <p className="text-[#6a6a6a] dark:text-[#a1a1aa]">
                      Breakfast: {meal.b} • Lunch: {meal.l} • Dinner: {meal.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Sticky Reservation Box) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 p-6 rounded-2xl border border-[#dddddd] dark:border-[#2e2e2e] shadow-xl bg-white dark:bg-[#1e1e1e] space-y-5">
              
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-[#222222] dark:text-[#f7f7f7]">
                    ₹14,500
                  </span>
                  <span className="text-xs text-[#6a6a6a] dark:text-[#a1a1aa] ml-1">
                    month
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.96</span>
                  <span className="text-[#6a6a6a] dark:text-[#a1a1aa]">(128)</span>
                </div>
              </div>

              {/* Stacked Selection Box */}
              <div className="rounded-xl border border-[#dddddd] dark:border-[#2e2e2e] overflow-hidden text-xs">
                <div className="p-3 border-b border-[#dddddd] dark:border-[#2e2e2e] bg-[#f7f7f7] dark:bg-[#252525]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6a6a6a] dark:text-[#a1a1aa] mb-1">
                    Move-In Date
                  </label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full bg-transparent font-medium outline-none text-[#222222] dark:text-[#f7f7f7]"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#1e1e1e]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6a6a6a] dark:text-[#a1a1aa] mb-1">
                    Room / Sharing
                  </label>
                  <select
                    value={sharingOption}
                    onChange={(e) => setSharingOption(e.target.value)}
                    className="w-full bg-transparent font-medium outline-none text-[#222222] dark:text-[#f7f7f7]"
                  >
                    <option value="Single Private Suite">Single Private Suite - ₹14,500/mo</option>
                    <option value="Double Sharing Executive">Double Sharing Executive - ₹9,500/mo</option>
                    <option value="Triple Sharing Classic">Triple Sharing Classic - ₹7,500/mo</option>
                  </select>
                </div>
              </div>

              {/* Primary CTA */}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => navigate("auth")}
                className="btn-rausch"
              >
                Reserve Bed
              </Button>

              <p className="text-center text-[11px] text-[#6a6a6a] dark:text-[#a1a1aa]">
                You won't be charged yet · Free cancellation within 48 hours
              </p>

              {/* Transparent Pricing Table */}
              <div className="space-y-2 pt-4 border-t border-[#dddddd] dark:border-[#2e2e2e] text-xs text-[#6a6a6a] dark:text-[#a1a1aa]">
                <div className="flex justify-between">
                  <span>₹14,500 x 1 month</span>
                  <span>₹14,500</span>
                </div>
                <div className="flex justify-between">
                  <span>RoomBae Maintenance & WiFi fee</span>
                  <span>₹0 (Included)</span>
                </div>
                <div className="flex justify-between">
                  <span>Zero-Deposit Escrow Protection</span>
                  <span>₹0 (Included)</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#222222] dark:text-[#f7f7f7] pt-2 border-t border-[#dddddd] dark:border-[#2e2e2e]">
                  <span>Total (INR)</span>
                  <span>₹14,500</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
