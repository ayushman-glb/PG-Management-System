import { useState } from "react";
import { Building2, Plus, MapPin, BedDouble, X, Star } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";
import { useTheme } from "../theme";

interface Props {
  navigate: (p: Page) => void;
}

const properties = [
  {
    id: 1,
    name: "Sunrise PG Homes",
    location: "Koramangala, Bengaluru",
    beds: 40,
    occupied: 38,
    revenue: "₹3.8L",
    rating: 4.9,
    floors: 3,
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=220&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Green Valley PG",
    location: "HSR Layout, Bengaluru",
    beds: 35,
    occupied: 32,
    revenue: "₹2.9L",
    rating: 4.7,
    floors: 2,
    image:
      "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=400&h=220&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Urban Nest PG",
    location: "Indiranagar, Bengaluru",
    beds: 50,
    occupied: 47,
    revenue: "₹5.1L",
    rating: 4.8,
    floors: 4,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=220&fit=crop&auto=format",
  },
  {
    id: 4,
    name: "City Heights PG",
    location: "Whitefield, Bengaluru",
    beds: 25,
    occupied: 24,
    revenue: "₹2.1L",
    rating: 4.6,
    floors: 2,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=220&fit=crop&auto=format",
  },
];

const bedGrid = [
  { id: "A1", status: "occupied", name: "Ankit J." },
  { id: "A2", status: "occupied", name: "Priya S." },
  { id: "A3", status: "vacant", name: "" },
  { id: "A4", status: "occupied", name: "Rahul M." },
  { id: "B1", status: "occupied", name: "Kavya N." },
  { id: "B2", status: "maintenance", name: "Repairs" },
  { id: "B3", status: "occupied", name: "Arjun K." },
  { id: "B4", status: "occupied", name: "Meera P." },
  { id: "C1", status: "vacant", name: "" },
  { id: "C2", status: "occupied", name: "Suresh B." },
  { id: "C3", status: "occupied", name: "Rohit S." },
  { id: "C4", status: "occupied", name: "Divya R." },
];

export default function Properties({ navigate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(properties[0]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [beds, setBeds] = useState(bedGrid);
  const { darkMode } = useTheme();

  const handleDrop = (targetId: string) => {
    // Visual drag-drop demo: swap statuses
    setDragOver(null);
    const vacant = beds.find((b) => b.id === targetId && b.status === "vacant");
    if (vacant) {
      setBeds((prev) =>
        prev.map((b) =>
          b.id === targetId
            ? { ...b, status: "occupied", name: "New Resident" }
            : b,
        ),
      );
    }
  };

  return (
    <DashboardLayout navigate={navigate} activePage="properties">
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1
              className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}
            >
              Properties
            </h1>
            <p
              className={`text-sm mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
            >
              Manage your PG properties and bed allocation
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 luxury-btn-primary text-sm font-semibold px-5 py-2.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>

        {/* Property cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {properties.map((prop) => (
            <div
              key={prop.id}
              onClick={() => setSelectedProperty(prop)}
              className={`rounded-2xl border overflow-hidden cursor-pointer card-hover transition-all ${darkMode ? "bg-slate-800" : "bg-white"} ${
                selectedProperty.id === prop.id
                  ? darkMode ? "border-[#C89A4B] shadow-lg shadow-[#C89A4B]/10" : "border-[#D9A87C] shadow-lg shadow-[#D9A87C]/15"
                  : darkMode
                    ? "border-slate-700"
                    : "border-slate-100"
              }`}
            >
              <div className="relative h-36 bg-slate-100">
                <img
                  src={prop.image}
                  alt={prop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-3 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-white text-xs font-bold">
                    {prop.rating}
                  </span>
                </div>
                <div className="absolute top-2 right-2 bg-white/90 text-xs font-semibold px-2 py-1 rounded-lg text-slate-700">
                  {prop.floors} floors
                </div>
              </div>
              <div className="p-4">
                <h3
                  className={`font-bold text-sm mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  {prop.name}
                </h3>
                <div
                  className={`flex items-center gap-1 text-xs mb-3 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{prop.location}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p
                      className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}
                    >
                      {prop.beds}
                    </p>
                    <p
                      className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Total
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}>
                      {prop.occupied}
                    </p>
                    <p
                      className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Occupied
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-500 text-sm">
                      {prop.revenue}
                    </p>
                    <p
                      className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Revenue
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={darkMode ? "text-slate-400" : "text-slate-500"}
                    >
                      Occupancy
                    </span>
                    <span
                      className={`font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}
                    >
                      {Math.round((prop.occupied / prop.beds) * 100)}%
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(prop.occupied / prop.beds) * 100}%`,
                        background: darkMode ? "linear-gradient(135deg, #C89A4B, #D8B36A)" : "linear-gradient(135deg, #D9A87C, #C58B63)"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bed allocation */}
        <div
          className={`border rounded-2xl p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {selectedProperty.name} — Bed Allocation
              </h3>
              <p
                className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                Drag vacant beds to assign residents
              </p>
            </div>
            <div
              className={`flex items-center gap-4 text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded inline-block" style={{ background: darkMode ? "#C89A4B" : "#D9A87C" }} />{" "}
                Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-3 rounded inline-block ${darkMode ? "bg-slate-600" : "bg-slate-200"}`}
                />{" "}
                Vacant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-400 inline-block" />{" "}
                Maintenance
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
            {beds.map((bed) => (
              <div
                key={bed.id}
                draggable={bed.status === "occupied"}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(bed.id);
                }}
                onDrop={() => handleDrop(bed.id)}
                onDragLeave={() => setDragOver(null)}
                className={`
                  relative rounded-xl p-3 text-center cursor-pointer transition-all select-none
                  ${bed.status === "occupied" ? darkMode ? "bg-[#332D2B] border-2 border-[#C89A4B] hover:border-[#E8C98A]" : "bg-[#F8EEE5] border-2 border-[#D9A87C] hover:border-[#C58B63]" : ""}
                  ${bed.status === "vacant" ? darkMode ? "bg-[#2B2725] border-2 border-dashed border-[#4A443F] hover:border-[#C89A4B]" : "bg-[#FFFDFB] border-2 border-dashed border-[#E6D7CA] hover:border-[#D9A87C]" : ""}
                  ${bed.status === "maintenance" ? darkMode ? "bg-orange-900/20 border-2 border-orange-700" : "bg-orange-50 border-2 border-orange-200" : ""}
                  ${dragOver === bed.id ? "scale-105 border-[#D9A87C]" : ""}
                `}
              >
                <BedDouble
                  className={`w-4 h-4 mx-auto mb-1 ${
                    bed.status === "occupied"
                      ? darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"
                      : bed.status === "vacant"
                        ? darkMode
                          ? "text-slate-500"
                          : "text-slate-400"
                        : "text-orange-500"
                  }`}
                />
                <p
                  className={`text-xs font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  {bed.id}
                </p>
                {bed.name && (
                  <p
                    className={`text-xs leading-tight mt-0.5 truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {bed.name}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              {
                label: "Total Beds",
                value: beds.length,
                color: darkMode ? "text-white" : "text-slate-900",
              },
              {
                label: "Occupied",
                value: beds.filter((b) => b.status === "occupied").length,
                color: darkMode ? "text-[#C89A4B]" : "text-[#C58B63]",
              },
              {
                label: "Vacant",
                value: beds.filter((b) => b.status === "vacant").length,
                color: "text-green-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`text-center rounded-xl py-4 ${darkMode ? "bg-slate-700" : "bg-slate-50"}`}
              >
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p
                  className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Property Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-property-title"
            className={`rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl ${darkMode ? "bg-slate-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? "bg-[#2B2725]" : "bg-[#F8EEE5]"}`}
                >
                  <Building2
                    className={`w-5 h-5 ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                  />
                </div>
                <h3
                  id="add-property-title"
                  className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
                >
                  Add New Property
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close add property modal"
                className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  label: "Property Name",
                  placeholder: "e.g. Sunrise PG Homes",
                },
                { label: "Address", placeholder: "Full address" },
                { label: "City", placeholder: "e.g. Bengaluru" },
              ].map((f) => (
                <div key={f.label}>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Beds", placeholder: "e.g. 40" },
                  { label: "Total Floors", placeholder: "e.g. 3" },
                ].map((f) => (
                  <div key={f.label}>
                    <label
                      className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {f.label}
                    </label>
                    <input
                      type="number"
                      placeholder={f.placeholder}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`flex gap-3 px-6 py-4 border-t ${darkMode ? "border-slate-700" : "border-slate-100"}`}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl luxury-btn-primary text-sm font-semibold transition-colors"
              >
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
