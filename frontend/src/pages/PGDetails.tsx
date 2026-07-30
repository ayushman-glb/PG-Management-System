import { useState } from "react";
import {
  Heart, MapPin, ChevronLeft, ChevronRight, Utensils, BedDouble
} from "lucide-react";
import type { Page } from "../App";
import { ThemeToggle, useTheme } from "../theme";
import { BackButton } from "../navigation";

interface Props {
  navigate: (p: Page) => void;
}

const images = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1200&h=700&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=700&fit=crop&auto=format"
];

const WEEKLY_MEALS = [
  { day: 'Monday', b: 'Idli Vada, Sambar, Tea/Coffee', l: 'Dal Tadka, Mix Veg, Rice, Roti', s: 'Hot Filter Coffee & Cookies', d: 'Rajma Masala, Jeera Rice, Chapati', cal: 2100 },
  { day: 'Tuesday', b: 'Masala Dosa, Chutney, Tea/Coffee', l: 'Paneer Butter Masala, Rice, Roti', s: 'Veg Cutlet & Tea', d: 'Egg Curry / Aloo Gobi, Rice, Roti', cal: 2200 },
  { day: 'Wednesday', b: 'Puri Bhaji, Tea/Coffee', l: 'Chole Bhature, Veg Pulao', s: 'Samosa & Green Chutney', d: 'Kadai Paneer, Rice, Roti, Gulab Jamun', cal: 2300 },
  { day: 'Thursday', b: 'Poha & Jalebi, Tea/Coffee', l: 'Kadi Pakoda, Rice, Chapati', s: 'Banana Bread & Tea', d: 'Mix Dal, Aloo Bhindi, Rice, Roti', cal: 2050 },
  { day: 'Friday', b: 'Uttapam, Sambar, Tea/Coffee', l: 'Biryani Delight, Raita, Salad', s: 'Pakoda & Coffee', d: 'Dal Makhani, Jeera Rice, Butter Naan', cal: 2250 },
  { day: 'Saturday', b: 'Aloo Paratha, Curd, Butter', l: 'Veg Thali Deluxe', s: 'Corn Chaat & Tea', d: 'Paneer Do Pyaza, Rice, Roti', cal: 2150 },
  { day: 'Sunday (Special)', b: 'Mysore Masala Dosa & Special Filter Coffee', l: 'Chef Special Veg Biryani & Kheer', s: 'Cold Coffee & Pastry', d: 'Special Paneer Tikka Masala, Naan', cal: 2400 }
];

const roomMatrix = [
  { room: '101', type: 'Single Sharing', rent: '₹12,000', ac: 'AC', washroom: 'Attached', beds: [{ b: '101-A', occ: true }, { b: '101-B', occ: false }] },
  { room: '102', type: 'Double Sharing', rent: '₹9,500', ac: 'Non-AC', washroom: 'Attached', beds: [{ b: '102-A', occ: true }, { b: '102-B', occ: true }] },
  { room: '201', type: 'Triple Sharing', rent: '₹8,500', ac: 'AC', washroom: 'Common', beds: [{ b: '201-A', occ: true }, { b: '201-B', occ: false }, { b: '201-C', occ: false }] }
];

export default function PGDetails({ navigate }: Props) {
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#1B1816] text-[#F7F3EE]" : "bg-[#FFF8F2] text-[#3B2A24]"}`}>
      {/* Top Navbar */}
      <div className={`sticky top-0 z-40 border-b px-6 py-4 backdrop-blur-md ${darkMode ? "bg-neutral-900/80 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <button onClick={() => navigate("pg-listing")} className="text-sm font-semibold text-neutral-400 hover:text-white">
              Back to PG Directory
            </button>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setLiked(!liked)} className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-2 hover:border-amber-500/40">
              <Heart className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} /> {liked ? "Saved" : "Save PG"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Gallery Carousel */}
        <div className="relative rounded-3xl overflow-hidden h-80 md:h-[450px] bg-neutral-900 border border-white/10 shadow-2xl">
          <img src={images[currentImg]} alt="PG Gallery" className="w-full h-full object-cover" />
          <button onClick={() => setCurrentImg((currentImg - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentImg((currentImg + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Title Header & Occupancy Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Co-Living Executive Luxe
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-2">RoomBae Indiranagar Co-Living</h1>
            <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-amber-400" /> Indiranagar 100ft Road, Bengaluru (Near MG Road Metro)
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-2xl font-black text-amber-400">92% Occupied</p>
              <p className="text-xs text-neutral-400">66 Occupied • 6 Beds Vacant</p>
            </div>
            <button onClick={() => navigate("pg-listing")} className="px-6 py-3 rounded-2xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 shadow-xl shadow-amber-500/20">
              Book Bed Now
            </button>
          </div>
        </div>

        {/* 7-Day Mess Meal Schedule */}
        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" /> 7-Day Weekly Mess Menu & Nutrition
            </h3>
            <span className="text-xs text-amber-400 font-semibold">Average Food Rating: 4.8 ★</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WEEKLY_MEALS.map(m => (
              <div key={m.day} className={`p-4 rounded-2xl border ${m.day.includes('Sunday') ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10 bg-neutral-900'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-amber-400">{m.day}</h4>
                  <span className="text-[10px] text-neutral-400">{m.cal} kcal</span>
                </div>
                <div className="space-y-1.5 text-xs text-neutral-300">
                  <p><strong className="text-neutral-500">Breakfast:</strong> {m.b}</p>
                  <p><strong className="text-neutral-500">Lunch:</strong> {m.l}</p>
                  <p><strong className="text-neutral-500">Snacks:</strong> {m.s}</p>
                  <p><strong className="text-neutral-500">Dinner:</strong> {m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room & Bed Matrix Grid */}
        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-amber-400" /> Room & Bed Inventory Matrix
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roomMatrix.map(r => (
              <div key={r.room} className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-white">Room {r.room}</h4>
                  <span className="text-xs font-bold text-amber-400">{r.rent}/mo</span>
                </div>
                <p className="text-xs text-neutral-400">{r.type} • {r.ac} • {r.washroom}</p>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  {r.beds.map(b => (
                    <span key={b.b} className={`px-3 py-1 rounded-xl text-xs font-bold border ${b.occ ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                      {b.b} ({b.occ ? 'Occupied' : 'Vacant'})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
