import { BasePdfGenerator, BRAND, PdfDocInstance } from './BasePdfGenerator';

export interface KycSnapshot {
  verificationRef: string;
  verificationDate: string | Date;
  verificationStatus: string;
  // Resident Identity
  residentName: string;
  residentCode: string;
  residentEmail?: string;
  residentPhone?: string;
  residentAddress?: string;
  residentOccupation?: string;
  residentGender?: string;
  residentAge?: number;
  bloodGroup?: string;
  // KYC Documents
  documents: Array<{
    documentType: string;
    documentNumber: string; // will be masked
    isVerified: boolean;
    uploadedAt?: string | Date;
  }>;
  // PG info
  pgName?: string;
  pgAddress?: string;
  pgCity?: string;
  roomNumber?: string;
  bedNumber?: string;
  // Emergency contact
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

export class KycPdfGenerator extends BasePdfGenerator {
  async generate(snapshot: KycSnapshot): Promise<Buffer> {
    return this.generateBuffer(async (doc) => {
      await this.buildKyc(doc, snapshot);
    });
  }

  private async buildKyc(doc: PdfDocInstance, s: KycSnapshot): Promise<void> {
    this.renderWatermark(doc, 'KYC DOCUMENT');
    this.renderHeader(
      doc,
      'KYC VERIFICATION CERTIFICATE',
      'Resident Identity Verification — RoomBae Co-Living Systems'
    );

    let curY = 108;

    // Verification status badge
    const statusColor = s.verificationStatus === 'VERIFIED' ? BRAND.successGreen
      : s.verificationStatus === 'PENDING' ? BRAND.warningAmber
      : BRAND.dangerRed;
    doc.rect(BRAND.marginH, curY, 180, 28).fill(statusColor);
    doc.fillColor(BRAND.white).fontSize(11).font('Helvetica-Bold');
    doc.text(`KYC: ${s.verificationStatus}`, BRAND.marginH, curY + 9, { width: 180, align: 'center' });

    doc.fillColor(BRAND.textSecondary).fontSize(8.5).font('Helvetica');
    doc.text(`Verification Ref: ${s.verificationRef}`, 240, curY + 3, { width: 305 });
    doc.text(`Date: ${this.formatDate(s.verificationDate)}`, 240, curY + 17, { width: 305 });
    curY += 42;

    doc.strokeColor(BRAND.lineColor).lineWidth(1).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // --- Resident Identity ---
    doc.fillColor(BRAND.darkBg).fontSize(9.5).font('Helvetica-Bold').text('1. RESIDENT IDENTITY INFORMATION', BRAND.marginH, curY);
    curY += 14;

    this.renderInfoBlock(doc, BRAND.marginH, curY, 230, 'PERSONAL DETAILS', [
      { label: 'Full Name', value: s.residentName },
      { label: 'Resident Code', value: s.residentCode },
      { label: 'Gender', value: s.residentGender ?? 'N/A' },
      { label: 'Age', value: s.residentAge ? `${s.residentAge} years` : 'N/A' },
      { label: 'Blood Group', value: s.bloodGroup ?? 'N/A' },
      { label: 'Occupation', value: s.residentOccupation ?? 'N/A' },
    ]);

    this.renderInfoBlock(doc, 300, curY, 245, 'CONTACT & ADDRESS', [
      { label: 'Phone', value: s.residentPhone ?? 'N/A' },
      { label: 'Email', value: s.residentEmail ?? 'N/A' },
      { label: 'Address', value: s.residentAddress ?? 'N/A' },
    ]);

    curY += 90;

    // --- PG Accommodation ---
    if (s.pgName) {
      this.renderInfoBlock(doc, BRAND.marginH, curY, 495, 'ACCOMMODATION', [
        { label: 'PG Property', value: s.pgName },
        { label: 'Address', value: `${s.pgAddress ?? ''}${s.pgCity ? ', ' + s.pgCity : ''}` },
        { label: 'Room / Bed', value: `${s.roomNumber ?? 'N/A'} / ${s.bedNumber ?? 'N/A'}` },
      ]);
      curY += 55;
    }

    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // --- Submitted Documents ---
    doc.fillColor(BRAND.darkBg).fontSize(9.5).font('Helvetica-Bold').text('2. IDENTITY DOCUMENTS SUBMITTED', BRAND.marginH, curY);
    curY += 14;

    if (s.documents.length > 0) {
      const DOC_COLS = [
        { label: 'DOCUMENT TYPE', x: 60, width: 190, align: 'left' as const },
        { label: 'DOCUMENT NUMBER (MASKED)', x: 260, width: 180, align: 'left' as const },
        { label: 'STATUS', x: 450, width: 85, align: 'center' as const },
      ];
      this.renderTableHeader(doc, curY, DOC_COLS);
      curY += 26;

      for (let i = 0; i < s.documents.length; i++) {
        const d = s.documents[i];
        const masked = this.maskDocumentNumber(d.documentNumber);
        const statusText = d.isVerified ? '✓ VERIFIED' : '⏳ PENDING';
        const statusClr = d.isVerified ? BRAND.successGreen : BRAND.warningAmber;

        if (curY > 760) { doc.addPage(); this.renderWatermark(doc, 'KYC DOCUMENT'); curY = 60; }

        this.renderTableRow(doc, curY, i, [
          { value: d.documentType, x: 60, width: 190 },
          { value: masked, x: 260, width: 180 },
          { value: statusText, x: 450, width: 85, align: 'center', color: statusClr },
        ]);
        curY += 20;
      }
    } else {
      doc.fontSize(8.5).fillColor(BRAND.textMuted).text('No identity documents on record.', BRAND.marginH, curY);
      curY += 20;
    }

    curY += 8;
    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // --- Emergency Contact ---
    if (s.emergencyContactName) {
      doc.fillColor(BRAND.darkBg).fontSize(9.5).font('Helvetica-Bold').text('3. EMERGENCY CONTACT', BRAND.marginH, curY);
      curY += 14;
      this.renderInfoBlock(doc, BRAND.marginH, curY, 495, '', [
        { label: 'Name', value: s.emergencyContactName },
        { label: 'Relation', value: s.emergencyContactRelation ?? 'N/A' },
        { label: 'Phone', value: s.emergencyContactPhone ?? 'N/A' },
      ]);
      curY += 50;
    }

    // --- QR ---
    if (curY > 720) { doc.addPage(); this.renderWatermark(doc, 'KYC DOCUMENT'); curY = 60; }
    const qrPayload = `https://roombae.com/verify-kyc?code=${encodeURIComponent(s.residentCode)}&ref=${encodeURIComponent(s.verificationRef)}`;
    await this.renderQrSection(
      doc, curY, qrPayload, 'SCAN TO VERIFY KYC',
      `Resident: ${s.residentName} (${s.residentCode}) | Ref: ${s.verificationRef} | Status: ${s.verificationStatus} | ${this.formatDate(s.verificationDate)}`
    );

    this.renderFooter(doc, 1, 1);
  }

  private maskDocumentNumber(num: string): string {
    if (!num || num.length <= 4) return '****';
    const visible = num.slice(-4);
    const masked = '*'.repeat(Math.min(num.length - 4, 8));
    return `${masked}${visible}`;
  }
}
