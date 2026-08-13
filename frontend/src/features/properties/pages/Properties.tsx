import { useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  BedDouble,
  X,
  Star,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@components/layouts/DashboardLayout";
import type { Page } from "../../../App";
import { useTheme } from "../../../theme";
import { api } from "@services/api";
import { useAdaptiveLoading } from "../../../hooks/useAdaptiveLoading";
import { PropertiesSkeleton } from "@components/Skeletons";

interface Props {
  navigate: (p: Page) => void;
}

const MOCK_FALLBACK_PROPERTIES = [
  {
    id: "prop-1",
    name: "RoomBae Indiranagar Luxe",
    location: "102 100 Feet Road, Indiranagar, Bengaluru",
    city: "Bengaluru",
    totalBeds: 24,
    occupied: 18,
    revenue: "2,25,000",
    rating: 4.9,
    floors: 3,
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600",
  },
  {
    id: "prop-2",
    name: "RoomBae Koramangala Executive",
    location: "5th Block, Koramangala, Bengaluru",
    city: "Bengaluru",
    totalBeds: 30,
    occupied: 26,
    revenue: "2,80,000",
    rating: 4.8,
    floors: 4,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
  },
  {
    id: "prop-3",
    name: "RoomBae HSR Layout Co-Living",
    location: "Sector 1, HSR Layout, Bengaluru",
    city: "Bengaluru",
    totalBeds: 20,
    occupied: 14,
    revenue: "1,60,000",
    rating: 4.7,
    floors: 3,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
  },
];

const emptyBedGrid = [
  { id: "A1", status: "vacant", name: "" },
  { id: "A2", status: "vacant", name: "" },
  { id: "A3", status: "vacant", name: "" },
  { id: "A4", status: "vacant", name: "" },
  { id: "B1", status: "vacant", name: "" },
  { id: "B2", status: "vacant", name: "" },
  { id: "B3", status: "vacant", name: "" },
  { id: "B4", status: "vacant", name: "" },
  { id: "C1", status: "vacant", name: "" },
  { id: "C2", status: "vacant", name: "" },
  { id: "C3", status: "vacant", name: "" },
  { id: "C4", status: "vacant", name: "" },
];

export default function Properties({ navigate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [beds, setBeds] = useState(emptyBedGrid);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const { darkMode } = useTheme();

  // Add Property form state
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    pincode: "",
    buildingName: "Main Block",
    floorsCount: 3,
    roomsPerFloor: 4,
    sharingType: "DOUBLE",
    rentAmount: 8500,
    totalBeds: 24,
  });

  const updateForm = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (
        key === "floorsCount" ||
        key === "roomsPerFloor" ||
        key === "sharingType"
      ) {
        const bedsPerRoom =
          next.sharingType === "SINGLE"
            ? 1
            : next.sharingType === "TRIPLE"
              ? 3
              : next.sharingType === "FOUR_SHARING"
                ? 4
                : 2;
        next.totalBeds =
          (Number(next.floorsCount) || 0) *
          (Number(next.roomsPerFloor) || 0) *
          bedsPerRoom;
      }
      return next;
    });
  };

  const { showSkeleton } = useAdaptiveLoading(
    async () => {
      try {
        const response = await api.getPublicProperties({ limit: 10 });
        const list = Array.isArray(response?.properties) && response.properties.length > 0
          ? response.properties
          : MOCK_FALLBACK_PROPERTIES;
        setProperties(list);
        if (!selectedProperty) setSelectedProperty(list[0]);
        return list;
      } catch {
        setProperties(MOCK_FALLBACK_PROPERTIES);
        if (!selectedProperty) setSelectedProperty(MOCK_FALLBACK_PROPERTIES[0]);
        return MOCK_FALLBACK_PROPERTIES;
      }
    },
    []
  );

  if (showSkeleton) {
    return <PropertiesSkeleton />;
  }

  const handleDrop = (targetId: string) => {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {properties.length === 0 ? (
            <div
              className={`col-span-full rounded-2xl border border-dashed p-8 text-center ${darkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}
            >
              No properties available yet. Create or sync properties from the
              backend to populate this dashboard.
            </div>
          ) : (
            properties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className={`rounded-2xl border overflow-hidden cursor-pointer card-hover transition-all ${darkMode ? "bg-slate-800" : "bg-white"} ${
                  selectedProperty?.id === prop.id
                    ? darkMode
                      ? "border-[#C89A4B] shadow-lg shadow-[#C89A4B]/10"
                      : "border-[#D9A87C] shadow-lg shadow-[#D9A87C]/15"
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
                      {prop.rating ?? 4.8}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 bg-white/90 text-xs font-semibold px-2 py-1 rounded-lg text-slate-700">
                    {prop.floors ?? 1} floors
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
                    <span>
                      {prop.location ?? prop.city ?? "Location unavailable"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p
                        className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {prop.totalBeds ?? prop.beds ?? 0}
                      </p>
                      <p
                        className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Total
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className={`font-bold text-sm ${darkMode ? "text-[#C89A4B]" : "text-[#C58B63]"}`}
                      >
                        {prop.occupied ?? prop.currentOccupancy ?? 0}
                      </p>
                      <p
                        className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Occupied
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-500 text-sm">
                        {prop.revenue ? `₹${prop.revenue}` : "₹0"}
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
                        className={
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }
                      >
                        Occupancy
                      </span>
                      <span
                        className={`font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}
                      >
                        {prop.totalBeds && prop.occupied
                          ? Math.round((prop.occupied / prop.totalBeds) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div
                      className={`h-1.5 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}
                    >
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${prop.totalBeds && prop.occupied ? (prop.occupied / prop.totalBeds) * 100 : 0}%`,
                          background: darkMode
                            ? "linear-gradient(135deg, #C89A4B, #D8B36A)"
                            : "linear-gradient(135deg, #D9A87C, #C58B63)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className={`border rounded-2xl p-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}
              >
                {selectedProperty?.name || "Property Details"} — Bed Allocation
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
                <span
                  className="w-3 h-3 rounded inline-block"
                  style={{ background: darkMode ? "#C89A4B" : "#D9A87C" }}
                />{" "}
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
                  ${bed.status === "occupied" ? (darkMode ? "bg-[#332D2B] border-2 border-[#C89A4B] hover:border-[#E8C98A]" : "bg-[#F8EEE5] border-2 border-[#D9A87C] hover:border-[#C58B63]") : ""}
                  ${bed.status === "vacant" ? (darkMode ? "bg-[#2B2725] border-2 border-dashed border-[#4A443F] hover:border-[#C89A4B]" : "bg-[#FFFDFB] border-2 border-dashed border-[#E6D7CA] hover:border-[#D9A87C]") : ""}
                  ${bed.status === "maintenance" ? (darkMode ? "bg-orange-900/20 border-2 border-orange-700" : "bg-orange-50 border-2 border-orange-200") : ""}
                  ${dragOver === bed.id ? "scale-105 border-[#D9A87C]" : ""}
                `}
              >
                <BedDouble
                  className={`w-4 h-4 mx-auto mb-1 ${
                    bed.status === "occupied"
                      ? darkMode
                        ? "text-[#C89A4B]"
                        : "text-[#C58B63]"
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
              {saveError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  {saveSuccess}
                </div>
              )}

              <div>
                <label
                  className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  Property Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="e.g. Sunrise PG Homes"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  Address *
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="Full address"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => updateForm("pincode", e.target.value)}
                    placeholder="560038"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                >
                  Building Name
                </label>
                <input
                  type="text"
                  value={form.buildingName}
                  onChange={(e) => updateForm("buildingName", e.target.value)}
                  placeholder="e.g. Main Block"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : "border-slate-200"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Floors Count *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.floorsCount}
                    onChange={(e) =>
                      updateForm("floorsCount", parseInt(e.target.value) || 0)
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-slate-200"}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Rooms per Floor *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.roomsPerFloor}
                    onChange={(e) =>
                      updateForm("roomsPerFloor", parseInt(e.target.value) || 0)
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-slate-200"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Sharing Type *
                  </label>
                  <select
                    value={form.sharingType}
                    onChange={(e) => updateForm("sharingType", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-slate-200"}`}
                  >
                    <option value="SINGLE">Single Sharing</option>
                    <option value="DOUBLE">Double Sharing (2)</option>
                    <option value="TRIPLE">Triple Sharing (3)</option>
                    <option value="FOUR_SHARING">Four Sharing (4)</option>
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Rent / Month (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.rentAmount}
                    onChange={(e) =>
                      updateForm("rentAmount", parseFloat(e.target.value) || 0)
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A87C] dark:focus:ring-[#C89A4B] focus:border-transparent ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-slate-200"}`}
                  />
                </div>
              </div>

              <div
                className={`p-3 rounded-xl text-center text-sm font-bold ${darkMode ? "bg-slate-700 text-[#C89A4B]" : "bg-slate-50 text-[#C58B63]"}`}
              >
                ⏱ Will generate {form.floorsCount * form.roomsPerFloor} Rooms &{" "}
                {form.totalBeds} Beds
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
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setSaveError("");
                  setSaveSuccess("");
                  try {
                    if (
                      !form.name ||
                      !form.address ||
                      !form.city ||
                      form.floorsCount <= 0 ||
                      form.roomsPerFloor <= 0
                    ) {
                      setSaveError(
                        "Please fill all required fields (name, address, city, floors, rooms).",
                      );
                      setSaving(false);
                      return;
                    }
                    const bedsPerRoom =
                      form.sharingType === "SINGLE"
                        ? 1
                        : form.sharingType === "TRIPLE"
                          ? 3
                          : form.sharingType === "FOUR_SHARING"
                            ? 4
                            : 2;
                    const totalBeds =
                      form.floorsCount * form.roomsPerFloor * bedsPerRoom;

                    // Create the PG property
                    const created = await api.createProperty({
                      name: form.name,
                      address: form.address,
                      city: form.city,
                      pincode: form.pincode || "560038",
                      latitude: 12.9716,
                      longitude: 77.5946,
                      totalRooms: form.floorsCount * form.roomsPerFloor,
                      totalBeds,
                      rentStartingFrom: form.rentAmount,
                      amenities: ["WiFi", "Meals", "Security"],
                      images: [
                        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=220&fit=crop&auto=format",
                      ],
                    });
                    const pgId = created?.id || created?.data?.id;

                    // Configure building + floors + rooms + beds in bulk
                    if (pgId) {
                      await api.post(`/owners/property/${pgId}/building`, {
                        buildingName: form.buildingName,
                        floorsCount: form.floorsCount,
                        amenitiesList: ["WiFi", "CCTV", "Security"],
                        caretakerName: "",
                        caretakerPhone: "",
                      });
                      await api.post(`/owners/property/${pgId}/rooms/batch`, {
                        floorsCount: form.floorsCount,
                        roomsPerFloor: form.roomsPerFloor,
                        roomType: form.sharingType,
                        customCapacity: bedsPerRoom,
                        rentAmount: form.rentAmount,
                      });
                    }

                    setSaveSuccess(
                      "✅ Property created successfully! Rooms & beds generated.",
                    );
                    setShowModal(false);
                    // Refresh list
                    const res = await api.getPublicProperties({ limit: 10 });
                    const list = Array.isArray(res?.properties)
                      ? res.properties
                      : [];
                    setProperties(list);
                    if (list.length > 0) setSelectedProperty(list[0]);
                  } catch (e: any) {
                    setSaveError(
                      e?.message ||
                        "Failed to create property. Please check the backend connection.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl luxury-btn-primary text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Add Property"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
