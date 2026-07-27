import { useState } from "react";
import { Building2, Plus, MapPin, BedDouble, X, Star } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import type { Page } from "../App";

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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Properties</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your PG properties and bed allocation
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
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
              className={`bg-white rounded-2xl border overflow-hidden cursor-pointer card-hover transition-all ${selectedProperty.id === prop.id ? "border-blue-400 shadow-lg shadow-blue-100" : "border-slate-100"}`}
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
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  {prop.name}
                </h3>
                <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{prop.location}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="font-bold text-slate-900 text-sm">
                      {prop.beds}
                    </p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-600 text-sm">
                      {prop.occupied}
                    </p>
                    <p className="text-xs text-slate-400">Occupied</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600 text-sm">
                      {prop.revenue}
                    </p>
                    <p className="text-xs text-slate-400">Revenue</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Occupancy</span>
                    <span className="font-semibold text-slate-700">
                      {Math.round((prop.occupied / prop.beds) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div
                      className="h-1.5 bg-blue-600 rounded-full"
                      style={{ width: `${(prop.occupied / prop.beds) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bed allocation */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">
                {selectedProperty.name} — Bed Allocation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag vacant beds to assign residents
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block" />{" "}
                Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 inline-block" />{" "}
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
                  ${bed.status === "occupied" ? "bg-blue-50 border-2 border-blue-200 hover:border-blue-400" : ""}
                  ${bed.status === "vacant" ? "bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-400" : ""}
                  ${bed.status === "maintenance" ? "bg-orange-50 border-2 border-orange-200" : ""}
                  ${dragOver === bed.id ? "scale-105 border-blue-500" : ""}
                `}
              >
                <BedDouble
                  className={`w-4 h-4 mx-auto mb-1 ${
                    bed.status === "occupied"
                      ? "text-blue-600"
                      : bed.status === "vacant"
                        ? "text-slate-400"
                        : "text-orange-500"
                  }`}
                />
                <p className="text-xs font-bold text-slate-700">{bed.id}</p>
                {bed.name && (
                  <p className="text-xs text-slate-500 leading-tight mt-0.5 truncate">
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
                color: "text-slate-900",
              },
              {
                label: "Occupied",
                value: beds.filter((b) => b.status === "occupied").length,
                color: "text-blue-600",
              },
              {
                label: "Vacant",
                value: beds.filter((b) => b.status === "vacant").length,
                color: "text-green-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center bg-slate-50 rounded-xl py-4"
              >
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
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
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">Add New Property</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Beds", placeholder: "e.g. 40" },
                  { label: "Total Floors", placeholder: "e.g. 3" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
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
