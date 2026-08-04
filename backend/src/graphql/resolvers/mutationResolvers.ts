import { GraphQLContext } from "../context";
import crypto from "crypto";
import { Container } from "../../container";
import { env } from "../../config/env";

export const mutationResolvers = {
  signAgreement: async (
    _: any,
    args: { agreementId: string; input: any },
    ctx: GraphQLContext,
  ) => {
    const agreement = await ctx.prisma.agreement.findUnique({
      where: { id: args.agreementId },
    });
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    const hmacSecret = env.JWT_SECRET;
    if (!hmacSecret) {
      throw new Error(
        "FATAL: JWT_SECRET not set — cannot generate agreement signature hash",
      );
    }
    const hashHmac = crypto
      .createHmac("sha256", hmacSecret)
      .update(
        `${args.agreementId}:${args.input.signerType}:${args.input.signerName}:${Date.now()}`,
      )
      .digest("hex");

    await ctx.prisma.signature.create({
      data: {
        agreementId: args.agreementId,
        signerType: args.input.signerType,
        signerName: args.input.signerName,
        signatureDataSvg: args.input.signatureDataSvg,
        ipAddress: args.input.ipAddress || "unknown",
        hashHmac,
      },
    });

    return ctx.prisma.agreement.update({
      where: { id: args.agreementId },
      data: { status: "COMPLETED" },
      include: { signatures: true },
    });
  },
  changeResidentStatus: async (
    _: any,
    args: { residentId: string; status: any; reason?: string },
    ctx: GraphQLContext,
  ) => {
    return Container.residentManagementService.updateResidentStatus(
      {
        residentId: args.residentId,
        status: args.status,
        reason: args.reason,
        updatedBy: ctx.user?.userId || "system",
      },
      ctx.user?.role || "OWNER",
      ctx.user?.userId || "system",
    );
  },
  updateBedStatus: async (
    _: any,
    args: { bedId: string; status: any; notes?: string },
    ctx: GraphQLContext,
  ) => {
    await Container.residentManagementService.updateBedStatus(
      args.bedId,
      args.status,
      ctx.user?.userId || "system",
      ctx.user?.role || "OWNER",
      args.notes,
    );
    return true;
  },
  createBedHold: async (
    _: any,
    args: {
      bedId: string;
      reason: any;
      holdStartDate?: string;
      holdEndDate?: string;
      notes?: string;
    },
    ctx: GraphQLContext,
  ) => {
    const res = await Container.residentManagementService.createBedHold(
      {
        bedId: args.bedId,
        reason: args.reason,
        holdStartDate: args.holdStartDate
          ? new Date(args.holdStartDate)
          : new Date(),
        holdEndDate: args.holdEndDate ? new Date(args.holdEndDate) : undefined,
        createdBy: ctx.user?.userId || "system",
        notes: args.notes,
      },
      ctx.user?.role || "OWNER",
    );
    return res.hold;
  },
  releaseBedHold: async (
    _: any,
    args: { holdId: string },
    ctx: GraphQLContext,
  ) => {
    await Container.residentManagementService.releaseBedHold(
      args.holdId,
      ctx.user?.userId || "system",
      ctx.user?.role || "OWNER",
    );
    return true;
  },
  requestRoomTransfer: async (_: any, args: any, ctx: GraphQLContext) => {
    return Container.residentManagementService.createRoomTransferRequest({
      ...args,
      budget: args.budget ? parseFloat(args.budget) : undefined,
      preferredMoveDate: args.preferredMoveDate
        ? new Date(args.preferredMoveDate)
        : undefined,
    });
  },
  approveRoomTransfer: async (
    _: any,
    args: {
      requestId: string;
      targetBedId?: string;
      scheduledDate?: string;
      notes?: string;
    },
    ctx: GraphQLContext,
  ) => {
    return Container.residentManagementService.approveRoomTransferRequest(
      {
        requestId: args.requestId,
        targetBedId: args.targetBedId,
        scheduledDate: args.scheduledDate
          ? new Date(args.scheduledDate)
          : undefined,
        performedBy: ctx.user?.userId || "system",
        notes: args.notes,
      },
      ctx.user?.role || "OWNER",
    );
  },
  rejectRoomTransfer: async (
    _: any,
    args: { requestId: string; rejectionReason: string },
    ctx: GraphQLContext,
  ) => {
    return Container.residentManagementService.rejectRoomTransferRequest(
      args.requestId,
      args.rejectionReason,
      ctx.user?.userId || "system",
      ctx.user?.role || "OWNER",
    );
  },
  completeRoomTransfer: async (
    _: any,
    args: { requestId: string },
    ctx: GraphQLContext,
  ) => {
    const res = await Container.residentManagementService.completeRoomTransfer(
      args.requestId,
      ctx.user?.userId || "system",
      ctx.user?.role || "OWNER",
    );
    return res.request;
  },
  convertRoomType: async (
    _: any,
    args: { roomId: string; newType: "SINGLE" | "DOUBLE" | "TRIPLE" },
    ctx: GraphQLContext,
  ) => {
    await Container.residentManagementService.convertRoomType(
      args.roomId,
      args.newType,
      ctx.user?.userId || "system",
      ctx.user?.role || "OWNER",
    );
    return true;
  },
  createFineRule: async (_: any, args: any, ctx: GraphQLContext) => {
    return ctx.prisma.fineRule.create({
      data: {
        pgId: args.pgId,
        fineType: args.fineType,
        calculationType: args.calculationType || "FLAT",
        amount: args.amount,
        gracePeriodDays: args.gracePeriodDays ?? 3,
      },
    });
  },
  issueFine: async (_: any, args: any, ctx: GraphQLContext) => {
    return ctx.prisma.fine.create({
      data: {
        residentId: args.residentId,
        fineType: args.fineType,
        amount: args.amount,
        reason: args.reason,
        dueDate: new Date(args.dueDate),
        status: "UNPAID",
      },
    });
  },
  waiveFine: async (
    _: any,
    args: { fineId: string; ownerId: string },
    ctx: GraphQLContext,
  ) => {
    return ctx.prisma.fine.update({
      where: { id: args.fineId },
      data: {
        status: "WAIVED",
        waivedBy: args.ownerId,
        waivedAt: new Date(),
      },
    });
  },
  register: async (_: any, args: any, ctx: GraphQLContext) => {
    const res = await Container.authService.register(args);
    return {
      success: true,
      message: "User registered",
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    };
  },
  login: async (
    _: any,
    args: { identifier: string; password: string },
    ctx: GraphQLContext,
  ) => {
    const res = await Container.authService.login(
      args.identifier,
      args.password,
    );
    return {
      success: true,
      message: "Login successful",
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    };
  },
  logout: async () => {
    return true;
  },
  sendPhoneOTP: async (_: any, args: { phone: string }) => {
    const res = await Container.authService.sendPhoneOtp(args.phone);
    return { success: res.success, message: res.message };
  },
  verifyPhoneOTP: async (_: any, args: { phone: string; otp: string }) => {
    const res = await Container.authService.verifyPhoneOtp(
      args.phone,
      args.otp,
    );
    return { success: res.success, message: res.message };
  },
  sendEmailOTP: async (_: any, args: { email: string }) => {
    const res = await Container.authService.sendEmailVerification(args.email);
    return { success: res.success, message: res.message };
  },
  verifyEmailOTP: async (_: any, args: { email: string; code: string }) => {
    const res = await Container.authService.verifyEmail(args.email, args.code);
    return { success: res.success, message: res.message };
  },
  enable2FA: async (_: any, args: { userId: string }) => {
    const res = await Container.authService.enableTwoFactor(args.userId);
    return { success: true, message: `2FA QR Code: ${res.qrCodeUrl}` };
  },
  disable2FA: async (_: any, args: { userId: string }) => {
    const res = await Container.authService.disableTwoFactor(args.userId);
    return { success: res.success, message: res.message };
  },
};
