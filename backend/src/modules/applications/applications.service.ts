import { PrismaClient, ApplicationStatus, ApplicationDocType } from "@prisma/client";
import crypto from "crypto";
import { SocketServer } from "../../socket/socketServer";
import { env } from "../../config/env";

export class ApplicationsService {
  constructor(private readonly db: PrismaClient) {}

  async createApplication(data: {
    userId: string;
    pgId: string;
    roomId?: string;
    bedId?: string;
    moveInDate: Date | string;
    monthlyRent: number;
    securityDeposit: number;
    notes?: string;
  }) {
    const property = await this.db.pG.findUnique({ where: { id: data.pgId } });
    if (!property) throw new Error("Property not found");

    const application = await this.db.application.create({
      data: {
        userId: data.userId,
        pgId: data.pgId,
        ownerId: property.ownerId,
        roomId: data.roomId,
        bedId: data.bedId,
        moveInDate: new Date(data.moveInDate),
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
        notes: data.notes,
        status: "SUBMITTED",
      },
      include: { pg: true, user: true, documents: true },
    });

    // Notify owner in real-time
    SocketServer.emitToUser(property.ownerId, "application:submitted", {
      message: `New rental application received for ${property.name}`,
      application,
    });

    return application;
  }

  async addDocument(applicationId: string, data: { docType: ApplicationDocType; fileName: string; fileUrl: string }) {
    const doc = await this.db.applicationDocument.create({
      data: {
        applicationId,
        docType: data.docType,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
      },
    });
    return doc;
  }

  async getApplicationById(id: string, user: { id: string; role: string }) {
    const app = await this.db.application.findUnique({
      where: { id },
      include: {
        pg: true,
        user: true,
        documents: true,
        leaseSignature: true,
      },
    });
    if (!app) throw new Error("Application not found");

    // Scoping authorization check
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && app.userId !== user.id) {
      const owner = await this.db.owner.findFirst({ where: { userId: user.id } });
      if (!owner || owner.id !== app.ownerId) {
        throw new Error("Unauthorized to view this application");
      }
    }

    return app;
  }

  async listApplications(user: { id: string; role: string }) {
    if (user.role === "OWNER" || user.role === "MANAGER" || user.role === "ADMIN") {
      const owner = await this.db.owner.findFirst({ where: { userId: user.id } });
      const ownerId = owner?.id || user.id;

      return this.db.application.findMany({
        where: { ownerId },
        include: { pg: true, user: true, documents: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return this.db.application.findMany({
      where: { userId: user.id },
      include: { pg: true, documents: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReason?: string
  ) {
    const app = await this.db.application.update({
      where: { id },
      data: { status, rejectionReason },
      include: { pg: true },
    });

    // Notify tenant via Socket.IO
    SocketServer.emitToUser(app.userId, "application:status_changed", {
      message: `Your application for ${app.pg.name} status is now: ${status}`,
      application: app,
    });

    return app;
  }

  async signLease(
    applicationId: string,
    signerName: string,
    signerEmail: string,
    ipAddress: string,
    signatureDataSvg?: string
  ) {
    const app = await this.db.application.findUnique({
      where: { id: applicationId },
      include: { pg: true },
    });
    if (!app) throw new Error("Application not found");

    const hmacSecret = env.JWT_SECRET;
    const hashHmac = crypto
      .createHmac("sha256", hmacSecret)
      .update(`${applicationId}:${signerEmail}:${signerName}:${Date.now()}`)
      .digest("hex");

    const signature = await this.db.leaseSignature.create({
      data: {
        applicationId,
        signerName,
        signerEmail,
        signatureDataSvg,
        ipAddress,
        hashHmac,
      },
    });

    const updatedApp = await this.db.application.update({
      where: { id: applicationId },
      data: { status: "LEASE_SIGNED" },
      include: { pg: true, leaseSignature: true },
    });

    // Notify owner
    SocketServer.emitToUser(app.ownerId, "application:lease_signed", {
      message: `${signerName} has signed the lease for ${app.pg.name}`,
      application: updatedApp,
    });

    return { signature, application: updatedApp };
  }
}
