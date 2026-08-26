export class PrismaComplaintRepository {
  constructor(private db: any) {}

  async findById(id: string, propertyId?: string) {
    const complaint = await this.db.complaint.findUnique({ where: { id } });
    if (!complaint) return null;
    if (propertyId && complaint.pgId !== propertyId) {
      return null;
    }
    return complaint;
  }

  async updateStatus(id: string, status: any, propertyId?: string) {
    const complaint = await this.db.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error('Complaint not found');
    if (propertyId && complaint.pgId !== propertyId) {
      throw new Error('Unauthorized: Complaint does not belong to specified PG tenant');
    }
    return await this.db.complaint.update({
      where: { id },
      data: { status },
    });
  }
}
