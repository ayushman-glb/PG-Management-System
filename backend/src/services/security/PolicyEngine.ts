import { KycAuthorizationService } from "./KycAuthorizationService";

export interface AuthUserContext {
  id: string;
  email?: string;
  role: string;
  residentCode?: string;
  ownerId?: string;
  residentId?: string;
}

export interface PolicyResult {
  allowed: boolean;
  code?: string;
  message?: string;
}

/**
 * Centralized Enterprise Authorization Policy Engine
 * 
 * Centralizes all role-based (RBAC), resource-level (ownership), and status-based (KYC)
 * authorization decisions. Eliminates duplicate authorization logic across controllers.
 */
export class PolicyEngine {
  /**
   * Evaluates if a user is authorized to create a new PG property.
   * Requires OWNER role and VERIFIED KYC status.
   */
  public static async canCreateProperty(user: AuthUserContext): Promise<PolicyResult> {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return { allowed: true };
    }

    if (user.role !== "OWNER") {
      return {
        allowed: false,
        code: "FORBIDDEN_ROLE",
        message: "Only property owners can register PG properties",
      };
    }

    const kycResult = await KycAuthorizationService.evaluateOwnerKycStatus(user.id);
    if (!kycResult.isApproved) {
      return {
        allowed: false,
        code: "KYC_REQUIRED",
        message: kycResult.denialReason || "Owner KYC verification is pending review or unverified",
      };
    }

    return { allowed: true };
  }

  /**
   * Evaluates if a user can edit an existing property.
   */
  public static async canEditProperty(user: AuthUserContext, propertyOwnerId: string): Promise<PolicyResult> {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return { allowed: true };
    }

    if (user.role !== "OWNER") {
      return { allowed: false, code: "FORBIDDEN_ROLE", message: "Only property owners can edit properties" };
    }

    if (user.id !== propertyOwnerId && user.ownerId !== propertyOwnerId) {
      return {
        allowed: false,
        code: "CROSS_PROPERTY_FORBIDDEN",
        message: "You do not have permission to modify properties belonging to another owner",
      };
    }

    return { allowed: true };
  }

  /**
   * Evaluates if a user can delete a property.
   */
  public static async canDeleteProperty(user: AuthUserContext, propertyOwnerId: string): Promise<PolicyResult> {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN") {
      return { allowed: true };
    }

    if (user.role === "OWNER" && (user.id === propertyOwnerId || user.ownerId === propertyOwnerId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "You do not have permission to delete this property",
    };
  }

  /**
   * Evaluates if an owner can withdraw revenue funds.
   */
  public static async canWithdrawRevenue(user: AuthUserContext): Promise<PolicyResult> {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role !== "OWNER" && user.role !== "GOD" && user.role !== "SUPER_ADMIN") {
      return { allowed: false, code: "FORBIDDEN_ROLE", message: "Only property owners can withdraw revenue" };
    }

    if (user.role === "OWNER") {
      const kycResult = await KycAuthorizationService.evaluateOwnerKycStatus(user.id);
      if (!kycResult.isApproved) {
        return {
          allowed: false,
          code: "KYC_REQUIRED",
          message: "Payouts and revenue withdrawals require a fully verified KYC status",
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Evaluates if a user can approve or reject KYC submissions.
   */
  public static canApproveKyc(user: AuthUserContext): PolicyResult {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: "ADMIN_REQUIRED",
      message: "Only administrators can approve or reject KYC documents",
    };
  }

  /**
   * Evaluates if a user can resolve a resident complaint.
   */
  public static canResolveComplaint(user: AuthUserContext, complaintOwnerId?: string): PolicyResult {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER") {
      return { allowed: true };
    }

    if (user.role === "OWNER" && (!complaintOwnerId || user.id === complaintOwnerId || user.ownerId === complaintOwnerId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "You do not have permission to resolve complaints for this property",
    };
  }

  /**
   * Evaluates if a user can manage resident admissions/evictions.
   */
  public static canManageResident(user: AuthUserContext, propertyOwnerId?: string): PolicyResult {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER") {
      return { allowed: true };
    }

    if (user.role === "OWNER" && (!propertyOwnerId || user.id === propertyOwnerId || user.ownerId === propertyOwnerId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "You do not have permission to manage residents for this property",
    };
  }

  /**
   * Evaluates if a user can view an invoice.
   */
  public static canViewInvoice(
    user: AuthUserContext,
    invoiceOwnerId?: string,
    invoiceResidentId?: string
  ): PolicyResult {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return { allowed: true };
    }

    if (user.role === "OWNER" && (user.id === invoiceOwnerId || user.ownerId === invoiceOwnerId)) {
      return { allowed: true };
    }

    if (user.role === "RESIDENT" && (user.id === invoiceResidentId || user.residentId === invoiceResidentId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "You do not have permission to view this invoice",
    };
  }

  /**
   * Evaluates if a user can assign or allocate a bed.
   */
  public static canAssignBed(user: AuthUserContext, propertyOwnerId?: string): PolicyResult {
    if (!user) {
      return { allowed: false, code: "UNAUTHORIZED", message: "Authentication required" };
    }

    if (user.role === "GOD" || user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MANAGER") {
      return { allowed: true };
    }

    if (user.role === "OWNER" && (!propertyOwnerId || user.id === propertyOwnerId || user.ownerId === propertyOwnerId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      code: "FORBIDDEN",
      message: "You do not have permission to assign beds for this property",
    };
  }
}
