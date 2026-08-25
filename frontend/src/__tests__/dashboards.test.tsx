import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock services & hooks
vi.mock("@services/api", () => ({
  api: {
    getOwnerSummary: vi.fn(),
    getPortalMe: vi.fn(),
    getProperties: vi.fn(),
    getResidents: vi.fn(),
    getComplaints: vi.fn(),
    getInvoices: vi.fn(),
    getMealSchedule: vi.fn(),
    updateResidentStatus: vi.fn(),
  },
}));

vi.mock("@hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "usr_test_1", name: "Test User", email: "user@roombae.com", role: "RESIDENT" },
    logout: vi.fn(),
    isAuthenticated: true,
  })),
}));

vi.mock("@theme/index", () => ({
  useTheme: vi.fn(() => ({
    darkMode: true,
    setDarkMode: vi.fn(),
  })),
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("../../../theme", () => ({
  useTheme: vi.fn(() => ({
    darkMode: true,
    setDarkMode: vi.fn(),
  })),
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("@components/layouts/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock("@components/Skeletons", () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading Dashboard Skeleton...</div>,
  ResidentPortalSkeleton: () => <div data-testid="resident-skeleton">Loading Resident Portal Skeleton...</div>,
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

vi.mock("@features/dashboard/components/BentoDashboard", () => ({
  BentoDashboard: () => <div data-testid="bento-dashboard">Bento Multi-Property Metrics</div>,
}));

vi.mock("@features/complaints/components/KanbanBoards", () => ({
  KanbanBoards: () => <div data-testid="kanban-boards">Kanban 5-Stage Workflows</div>,
}));

vi.mock("@features/residents/components/ResidentProfileModal", () => ({
  ResidentProfileModal: () => null,
}));

vi.mock("@components/ui/Logo", () => ({
  Logo: ({ badge }: { badge?: string }) => <div data-testid="app-logo">RoomBae {badge}</div>,
}));

vi.mock("@app/navigation", () => ({
  BackButton: () => <button data-testid="back-button">Back</button>,
}));

vi.mock("@services/fileDownload.service", () => ({
  downloadFile: vi.fn(),
}));

vi.mock("@features/documents/components/AgreementViewerModal", () => ({
  AgreementViewerModal: () => null,
}));

vi.mock("@components/DocumentUploadPortal", () => ({
  DocumentUploadPortal: () => null,
}));

vi.mock("@features/rooms/components/RoomTransferModal", () => ({
  RoomTransferModal: () => null,
}));

vi.mock("@features/billing/components/PayRentModal", () => ({
  PayRentModal: () => null,
}));

// Mutable mock hook for useAdaptiveLoading
let mockShowSkeleton = false;
vi.mock("@hooks/useAdaptiveLoading", () => ({
  useAdaptiveLoading: (fetcher: () => Promise<any>) => {
    React.useEffect(() => {
      fetcher().catch(() => {});
    }, []);
    return {
      showSkeleton: mockShowSkeleton,
      isLoading: mockShowSkeleton,
      data: null,
      error: null,
      refetch: fetcher,
    };
  },
}));

vi.mock("../hooks/useAdaptiveLoading", () => ({
  useAdaptiveLoading: (fetcher: () => Promise<any>) => {
    React.useEffect(() => {
      fetcher().catch(() => {});
    }, []);
    return {
      showSkeleton: mockShowSkeleton,
      isLoading: mockShowSkeleton,
      data: null,
      error: null,
      refetch: fetcher,
    };
  },
}));

// Import components under test
import Dashboard from "../features/dashboard/pages/Dashboard";
import ResidentPortal from "../features/residents/pages/ResidentPortal";
import { api } from "@services/api";

describe("Frontend Dashboard Components — 3-State Render Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowSkeleton = false;
  });

  describe("1. PG Owner Dashboard (Dashboard.tsx)", () => {
    it("renders loading skeleton during initial state", async () => {
      mockShowSkeleton = true;
      (api.getOwnerSummary as any).mockImplementation(() => new Promise(() => {}));

      render(<Dashboard navigate={vi.fn()} />);
      expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
    });

    it("renders success state with Bento metrics when data resolves", async () => {
      mockShowSkeleton = false;
      (api.getOwnerSummary as any).mockResolvedValue({
        success: true,
        data: { totalProperties: 3, totalBeds: 50, occupiedBeds: 45, mrr: 150000 },
      });

      render(<Dashboard navigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/RoomBae Command Center/i)).toBeInTheDocument();
      });
      expect(screen.getByTestId("bento-dashboard")).toBeInTheDocument();
    });

    it("handles error state gracefully without blank screen", async () => {
      mockShowSkeleton = false;
      (api.getOwnerSummary as any).mockRejectedValue(new Error("Network Error"));

      render(<Dashboard navigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
      });
    });
  });

  describe("2. Resident Portal (ResidentPortal.tsx)", () => {
    it("renders loading skeleton during initial fetch", async () => {
      mockShowSkeleton = true;
      (api.getPortalMe as any).mockImplementation(() => new Promise(() => {}));

      render(<ResidentPortal navigate={vi.fn()} />);
      expect(screen.getByTestId("resident-skeleton")).toBeInTheDocument();
    });

    it("renders guided onboarding state if resident profile is incomplete (no blank screen)", async () => {
      mockShowSkeleton = false;
      (api.getPortalMe as any).mockRejectedValue({
        status: 404,
        code: "RESIDENT_PROFILE_INCOMPLETE",
        message: "Resident profile record not found",
      });

      render(<ResidentPortal navigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome to RoomBae!/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Complete Resident KYC Onboarding/i)).toBeInTheDocument();
    });

    it("renders success state with resident stay, room, and action tabs", async () => {
      mockShowSkeleton = false;
      (api.getPortalMe as any).mockResolvedValue({
        profile: {
          id: "res_001",
          name: "John Doe",
          status: "ACTIVE",
          phone: "+91 9876543210",
        },
        currentMonth: "August 2026",
        rentAmount: 8500,
        dueDate: "5th August",
        room: { roomNumber: "204" },
        bed: { bedNumber: "B1" },
        complaints: [],
        payments: [{ id: "pay_01", amount: 8500, status: "PAID", invoiceNumber: "INV-2026-001" }],
        agreements: [{ id: "agr_01", status: "ACTIVE" }],
        visitorPasses: [],
        gatePasses: [],
      });

      render(<ResidentPortal navigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Pay Rent Now/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/Review Agreement/i)).toBeInTheDocument();
      expect(screen.getByText(/Request Room Change/i)).toBeInTheDocument();
    });

    it("renders error view on API failure with retry action", async () => {
      mockShowSkeleton = false;
      (api.getPortalMe as any).mockRejectedValue(new Error("Unable to connect to Resident API"));

      render(<ResidentPortal navigate={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to Load Resident Portal/i)).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
    });
  });
});
