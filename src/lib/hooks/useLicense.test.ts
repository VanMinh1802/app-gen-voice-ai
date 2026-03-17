/**
 * useLicense Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLicense } from "./useLicense";

// Mock Next.js router
const mockRouter = {
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => mockRouter),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
}));

// Mock the genation module
vi.mock("@/lib/genation", () => ({
  getLicenses: vi.fn(),
  hasActivePlan: vi.fn(),
  getActivePlanCode: vi.fn(),
  checkProAccess: vi.fn(),
}));

vi.mock("./useAuth", () => ({
  useAuth: vi.fn(),
}));

import { getLicenses, getActivePlanCode } from "@/lib/genation";
import { useAuth } from "./useAuth";

const mockGetLicenses = getLicenses as ReturnType<typeof vi.fn>;
const mockGetActivePlanCode = getActivePlanCode as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("useLicense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.replace.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return default state when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { result } = renderHook(() => useLicense());

    expect(result.current.licenses).toEqual([]);
    expect(result.current.activePlanCode).toBeNull();
    expect(result.current.hasProAccess).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch licenses when authenticated", async () => {
    const mockLicenseData = [
      {
        id: "license-1",
        status: "active",
        plan: { code: "PRO", name: "Pro" },
        expiresAt: "2026-12-31T23:59:59Z",
      },
    ];

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    mockGetLicenses.mockResolvedValue(mockLicenseData);
    mockGetActivePlanCode.mockResolvedValue("PRO");

    const { result } = renderHook(() => useLicense());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.licenses).toEqual(mockLicenseData);
    expect(result.current.activePlanCode).toBe("PRO");
    expect(result.current.hasProAccess).toBe(true);
  });

  it("should handle license refresh", async () => {
    const initialLicense = [
      {
        id: "license-1",
        status: "active",
        plan: { code: "FREE", name: "Miễn phí" },
        expiresAt: null,
      },
    ];

    const updatedLicense = [
      {
        id: "license-1",
        status: "active",
        plan: { code: "PRO", name: "Pro" },
        expiresAt: "2026-12-31T23:59:59Z",
      },
    ];

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    mockGetLicenses
      .mockResolvedValueOnce(initialLicense)
      .mockResolvedValueOnce(updatedLicense);
    mockGetActivePlanCode
      .mockResolvedValueOnce("FREE")
      .mockResolvedValueOnce("PRO");

    const { result } = renderHook(() => useLicense());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activePlanCode).toBe("FREE");
    expect(result.current.hasProAccess).toBe(false);

    // Call refresh
    await act(async () => {
      await result.current.refreshLicenses();
    });

    expect(result.current.activePlanCode).toBe("PRO");
    expect(result.current.hasProAccess).toBe(true);
  });

  it("should return FREE plan features for non-PRO users", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { result } = renderHook(() => useLicense());

    // When not authenticated, should treat as FREE
    expect(result.current.activePlanCode).toBeNull();
  });

  it("should have upgradeToPlan function", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { result } = renderHook(() => useLicense());

    expect(result.current.upgradeToPlan).toBeDefined();
    expect(typeof result.current.upgradeToPlan).toBe("function");
  });
});
