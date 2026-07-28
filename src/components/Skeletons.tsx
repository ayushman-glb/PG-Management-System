import type { Page } from "../App";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "../theme";

// ============================================================================
// SKELETON DEBUG CONFIGURATION
// ============================================================================
// For development and testing: Set to true with 1000ms delay to verify skeleton UI.
// Set to false before production deployment to disable artificial delay.
export const ENABLE_SKELETON_DEBUG_DELAY = true;
export const SKELETON_DEBUG_DELAY_MS = 1000;

// Base primitive block
export function SkeletonBlock({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-xl select-none ${className}`}
      style={style}
    />
  );
}

// ----------------------------------------------------------------------------
// 1. Dashboard Skeleton
// ----------------------------------------------------------------------------
export function DashboardSkeleton() {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage="dashboard">
      <div className="p-4 md:p-6 space-y-5 animate-fade-in" aria-busy="true">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <SkeletonBlock className="w-56 h-8" />
            <SkeletonBlock className="w-80 h-4" />
          </div>
          <SkeletonBlock className="w-36 h-10 rounded-xl" />
        </div>

        {/* 6 Stats Widgets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 border space-y-3 ${
                darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
              }`}
            >
              <div className="flex items-center justify-between">
                <SkeletonBlock className="w-8 h-8 rounded-lg" />
                <SkeletonBlock className="w-4 h-4 rounded-full" />
              </div>
              <SkeletonBlock className="w-20 h-7" />
              <SkeletonBlock className="w-16 h-3.5" />
              <SkeletonBlock className="w-24 h-3" />
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue chart placeholder */}
          <div
            className={`lg:col-span-2 rounded-2xl border p-6 space-y-4 ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1.5">
                <SkeletonBlock className="w-44 h-5" />
                <SkeletonBlock className="w-28 h-3.5" />
              </div>
              <div className="flex gap-3">
                <SkeletonBlock className="w-20 h-4" />
                <SkeletonBlock className="w-20 h-4" />
              </div>
            </div>
            <SkeletonBlock className="w-full h-48 rounded-xl" />
          </div>

          {/* Occupancy Donut chart placeholder */}
          <div
            className={`rounded-2xl border p-6 space-y-4 ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
            }`}
          >
            <SkeletonBlock className="w-36 h-5" />
            <SkeletonBlock className="w-24 h-3.5" />
            <div className="flex justify-center my-2">
              <SkeletonBlock className="w-36 h-36 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="w-full h-4" />
              <SkeletonBlock className="w-full h-4" />
            </div>
          </div>
        </div>

        {/* Resident Table Skeleton */}
        <div
          className={`rounded-2xl border overflow-hidden ${
            darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
          }`}
        >
          <div className="p-4 border-b border-slate-200/20 flex justify-between">
            <SkeletonBlock className="w-36 h-5" />
            <SkeletonBlock className="w-28 h-4" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="w-9 h-9 rounded-full" />
                  <div className="space-y-1.5">
                    <SkeletonBlock className="w-32 h-4" />
                    <SkeletonBlock className="w-20 h-3" />
                  </div>
                </div>
                <SkeletonBlock className="w-16 h-4" />
                <SkeletonBlock className="w-24 h-4" />
                <SkeletonBlock className="w-16 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 2. Residents Skeleton
// ----------------------------------------------------------------------------
export function ResidentsSkeleton() {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage="residents">
      <div className="flex h-full flex-col lg:flex-row animate-fade-in" aria-busy="true">
        {/* Left List Column */}
        <div
          className={`w-full lg:w-96 border-b lg:border-b-0 lg:border-r space-y-3 p-4 ${
            darkMode ? "border-[#4A443F] bg-[#2B2725]" : "border-[#E6D7CA] bg-[#FFFDFB]"
          }`}
        >
          <div className="flex justify-between items-center">
            <SkeletonBlock className="w-28 h-6" />
            <SkeletonBlock className="w-16 h-8 rounded-xl" />
          </div>
          <SkeletonBlock className="w-full h-10 rounded-xl" />
          <div className="flex gap-2">
            <SkeletonBlock className="w-20 h-7 rounded-lg" />
            <SkeletonBlock className="w-20 h-7 rounded-lg" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  darkMode ? "border-[#4A443F] bg-[#332D2B]" : "border-[#E6D7CA] bg-[#FFF8F2]"
                }`}
              >
                <SkeletonBlock className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBlock className="w-28 h-4" />
                  <SkeletonBlock className="w-36 h-3" />
                </div>
                <SkeletonBlock className="w-12 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 p-6 space-y-6">
          <SkeletonBlock className="w-full h-36 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBlock className="w-full h-44 rounded-2xl" />
            <SkeletonBlock className="w-full h-44 rounded-2xl" />
          </div>
          <SkeletonBlock className="w-full h-40 rounded-2xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 3. Properties Skeleton
// ----------------------------------------------------------------------------
export function PropertiesSkeleton() {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage="properties">
      <div className="p-4 md:p-6 space-y-6 animate-fade-in" aria-busy="true">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBlock className="w-36 h-7" />
            <SkeletonBlock className="w-64 h-4" />
          </div>
          <SkeletonBlock className="w-36 h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden space-y-3 ${
                darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
              }`}
            >
              <SkeletonBlock className="w-full h-36 rounded-none" />
              <div className="p-4 space-y-3">
                <SkeletonBlock className="w-36 h-5" />
                <SkeletonBlock className="w-28 h-3.5" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <SkeletonBlock className="h-8 rounded-lg" />
                  <SkeletonBlock className="h-8 rounded-lg" />
                  <SkeletonBlock className="h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`rounded-2xl border p-6 space-y-4 ${
            darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
          }`}
        >
          <SkeletonBlock className="w-56 h-6" />
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 4. Billing Skeleton
// ----------------------------------------------------------------------------
export function BillingSkeleton() {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage="billing">
      <div className="p-4 md:p-6 space-y-5 animate-fade-in" aria-busy="true">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBlock className="w-48 h-7" />
            <SkeletonBlock className="w-72 h-4" />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="w-32 h-10 rounded-xl" />
            <SkeletonBlock className="w-28 h-10 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border space-y-2 ${
                darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
              }`}
            >
              <SkeletonBlock className="w-24 h-3.5" />
              <SkeletonBlock className="w-28 h-7" />
            </div>
          ))}
        </div>

        <div
          className={`rounded-2xl border overflow-hidden p-4 space-y-4 ${
            darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
          }`}
        >
          <div className="flex justify-between items-center">
            <SkeletonBlock className="w-40 h-8 rounded-xl" />
            <SkeletonBlock className="w-48 h-9 rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <SkeletonBlock className="w-32 h-4" />
                <SkeletonBlock className="w-24 h-4" />
                <SkeletonBlock className="w-20 h-4" />
                <SkeletonBlock className="w-16 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 5. Complaints Skeleton
// ----------------------------------------------------------------------------
export function ComplaintsSkeleton() {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage="complaints">
      <div className="p-4 md:p-6 space-y-5 animate-fade-in" aria-busy="true">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="w-44 h-7" />
          <SkeletonBlock className="w-36 h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, col) => (
            <div
              key={col}
              className={`rounded-2xl border p-4 space-y-4 ${
                darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#F8EEE5] border-[#E6D7CA]"
              }`}
            >
              <SkeletonBlock className="w-32 h-6" />
              {Array.from({ length: 3 }).map((_, card) => (
                <div
                  key={card}
                  className={`p-4 rounded-xl border space-y-3 ${
                    darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
                  }`}
                >
                  <SkeletonBlock className="w-full h-5" />
                  <SkeletonBlock className="w-3/4 h-3.5" />
                  <div className="flex justify-between items-center pt-2">
                    <SkeletonBlock className="w-20 h-6 rounded-full" />
                    <SkeletonBlock className="w-16 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 6. Analytics Skeleton
// ----------------------------------------------------------------------------
export function AnalyticsSkeleton() {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage="analytics">
      <div className="p-4 md:p-6 space-y-5 animate-fade-in" aria-busy="true">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="w-36 h-7" />
          <SkeletonBlock className="w-48 h-9 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            className={`rounded-2xl border p-6 space-y-4 ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
            }`}
          >
            <SkeletonBlock className="w-48 h-6" />
            <SkeletonBlock className="w-full h-56 rounded-xl" />
          </div>
          <div
            className={`rounded-2xl border p-6 space-y-4 ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
            }`}
          >
            <SkeletonBlock className="w-48 h-6" />
            <SkeletonBlock className="w-full h-56 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 7. PG Listing Skeleton
// ----------------------------------------------------------------------------
export function PGListingSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } animate-fade-in`}
      aria-busy="true"
    >
      <div
        className={`border-b p-4 ${
          darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <SkeletonBlock className="w-24 h-8" />
          <SkeletonBlock className="max-w-xl flex-1 h-10 rounded-2xl" />
          <SkeletonBlock className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="w-64 h-8" />
          <SkeletonBlock className="w-36 h-9 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden space-y-3 ${
                darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-white border-slate-100"
              }`}
            >
              <SkeletonBlock className="w-full h-48 rounded-none" />
              <div className="p-5 space-y-3">
                <SkeletonBlock className="w-3/4 h-5" />
                <SkeletonBlock className="w-1/2 h-3.5" />
                <div className="flex gap-2 pt-2">
                  <SkeletonBlock className="w-8 h-8 rounded-lg" />
                  <SkeletonBlock className="w-8 h-8 rounded-lg" />
                  <SkeletonBlock className="w-8 h-8 rounded-lg" />
                </div>
                <div className="flex justify-between items-center pt-3">
                  <SkeletonBlock className="w-24 h-7" />
                  <SkeletonBlock className="w-28 h-9 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 8. PG Details Skeleton
// ----------------------------------------------------------------------------
export function PGDetailsSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } animate-fade-in`}
      aria-busy="true"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <SkeletonBlock className="w-full h-80 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonBlock className="w-3/4 h-8" />
            <SkeletonBlock className="w-1/2 h-4" />
            <div className="grid grid-cols-3 gap-4">
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
            </div>
          </div>
          <SkeletonBlock className="w-full h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 9. Auth Skeleton
// ----------------------------------------------------------------------------
export function AuthSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } animate-fade-in`}
      aria-busy="true"
    >
      <div
        className={`w-full max-w-md p-8 rounded-3xl border space-y-6 ${
          darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"
        }`}
      >
        <div className="text-center space-y-2">
          <SkeletonBlock className="w-12 h-12 mx-auto rounded-2xl" />
          <SkeletonBlock className="w-48 h-6 mx-auto" />
          <SkeletonBlock className="w-64 h-4 mx-auto" />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="w-full h-11 rounded-xl" />
          <SkeletonBlock className="w-full h-11 rounded-xl" />
          <SkeletonBlock className="w-full h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 10. Resident Portal Skeleton
// ----------------------------------------------------------------------------
export function ResidentPortalSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } p-6 space-y-6 animate-fade-in`}
      aria-busy="true"
    >
      <SkeletonBlock className="w-full h-44 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonBlock className="h-36 rounded-2xl" />
        <SkeletonBlock className="h-36 rounded-2xl" />
        <SkeletonBlock className="h-36 rounded-2xl" />
      </div>
      <SkeletonBlock className="w-full h-64 rounded-3xl" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 11. Resident Register Skeleton
// ----------------------------------------------------------------------------
export function ResidentRegisterSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } p-6 flex justify-center animate-fade-in`}
      aria-busy="true"
    >
      <div
        className={`w-full max-w-3xl p-8 rounded-3xl border space-y-6 ${
          darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"
        }`}
      >
        <SkeletonBlock className="w-full h-12 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBlock className="h-10 rounded-xl" />
          <SkeletonBlock className="h-10 rounded-xl" />
          <SkeletonBlock className="h-10 rounded-xl" />
          <SkeletonBlock className="h-10 rounded-xl" />
        </div>
        <SkeletonBlock className="w-full h-32 rounded-2xl" />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 12. Operations Skeleton (Rooms, Beds, Visitors, Notifications, Settings)
// ----------------------------------------------------------------------------
export function OperationsSkeleton({ page }: { page?: string }) {
  const { darkMode } = useTheme();

  return (
    <DashboardLayout navigate={() => {}} activePage={(page as Page) || "settings"}>
      <div className="p-4 md:p-6 space-y-6 animate-fade-in" aria-busy="true">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBlock className="w-44 h-7" />
            <SkeletonBlock className="w-64 h-4" />
          </div>
          <SkeletonBlock className="w-32 h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div
          className={`rounded-2xl border p-6 space-y-4 ${
            darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-white border-[#E6D7CA]"
          }`}
        >
          <SkeletonBlock className="w-48 h-6" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <SkeletonBlock className="w-9 h-9 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <SkeletonBlock className="w-48 h-4" />
                  <SkeletonBlock className="w-32 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------------------
// 13. Content Page Skeleton (About, Blog, Terms, Privacy, Careers, Docs, etc.)
// ----------------------------------------------------------------------------
export function ContentPageSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } p-6 animate-fade-in`}
      aria-busy="true"
    >
      <div className="max-w-4xl mx-auto space-y-8 py-12">
        <SkeletonBlock className="w-32 h-8 rounded-full" />
        <SkeletonBlock className="w-3/4 h-12" />
        <SkeletonBlock className="w-full h-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <SkeletonBlock className="h-44 rounded-2xl" />
          <SkeletonBlock className="h-44 rounded-2xl" />
          <SkeletonBlock className="h-44 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 14. Landing Skeleton
// ----------------------------------------------------------------------------
export function LandingSkeleton() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#1D1B1A]" : "bg-[#FFF8F2]"
      } p-6 space-y-8 animate-fade-in`}
      aria-busy="true"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4">
        <SkeletonBlock className="w-32 h-8" />
        <SkeletonBlock className="w-48 h-10 rounded-xl" />
      </div>
      <div className="max-w-4xl mx-auto text-center space-y-4 py-12">
        <SkeletonBlock className="w-48 h-8 mx-auto rounded-full" />
        <SkeletonBlock className="w-3/4 h-12 mx-auto" />
        <SkeletonBlock className="w-1/2 h-6 mx-auto" />
        <div className="flex justify-center gap-4 pt-4">
          <SkeletonBlock className="w-40 h-12 rounded-xl" />
          <SkeletonBlock className="w-40 h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 15. Master Page Skeleton Switcher
// ----------------------------------------------------------------------------
export function PageSkeleton({ page }: { page: Page }) {
  switch (page) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "residents":
      return <ResidentsSkeleton />;
    case "properties":
      return <PropertiesSkeleton />;
    case "billing":
      return <BillingSkeleton />;
    case "complaints":
      return <ComplaintsSkeleton />;
    case "analytics":
      return <AnalyticsSkeleton />;
    case "pg-listing":
      return <PGListingSkeleton />;
    case "pg-details":
      return <PGDetailsSkeleton />;
    case "auth":
      return <AuthSkeleton />;
    case "resident-portal":
      return <ResidentPortalSkeleton />;
    case "resident-register":
      return <ResidentRegisterSkeleton />;
    case "rooms":
    case "beds":
    case "visitors":
    case "notifications":
    case "settings":
      return <OperationsSkeleton page={page} />;
    case "about":
    case "blog":
    case "careers":
    case "press":
    case "changelog":
    case "roadmap":
    case "documentation":
    case "help-center":
    case "api-reference":
    case "status":
    case "privacy-policy":
    case "terms-of-service":
    case "cookie-policy":
      return <ContentPageSkeleton />;
    case "landing":
    default:
      return <LandingSkeleton />;
  }
}
