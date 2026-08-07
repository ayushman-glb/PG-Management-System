import { BasePdfGenerator, BRAND, PdfDocInstance } from './BasePdfGenerator';

export interface AgreementSnapshot {
  agreementNumber: string;
  agreementVersion: number;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string | Date;
  // Owner / Lessor
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerAddress?: string;
  // Resident / Lessee
  residentName: string;
  residentEmail?: string;
  residentPhone?: string;
  residentCode?: string;
  residentAddress?: string;
  residentOccupation?: string;
  // Property
  pgName: string;
  pgAddress?: string;
  pgCity?: string;
  roomNumber: string;
  bedNumber: string;
  // Financial Terms
  rentAmount: number;
  securityDeposit: number;
  maintenanceCharges: number;
  electricityCharges: string;
  wifiCharges: string;
  foodCharges: string;
  noticePeriodDays: number;
  // Rules
  houseRules: string[];
  visitorPolicy: string;
  curfewTime: string;
  damagePolicy: string;
  prohibitedActivities: string[];
  terminationClause: string;
  disputeJurisdiction: string;
  refundPolicy: string;
  // Signatures
  signatures: Array<{
    signerType: string;
    signerName: string;
    signatureDataSvg?: string;
    ipAddress?: string;
    timestamp?: string | Date;
    hashHmac?: string;
  }>;
  // Witness
  witnessName?: string;
  witnessPhone?: string;
}

export class AgreementPdfGenerator extends BasePdfGenerator {
  async generate(snapshot: AgreementSnapshot): Promise<Buffer> {
    return this.generateBuffer(async (doc) => {
      await this.buildAgreement(doc, snapshot);
    });
  }

  private async buildAgreement(doc: PdfDocInstance, s: AgreementSnapshot): Promise<void> {
    this.renderWatermark(doc, 'RENTAL AGREEMENT');
    this.renderHeader(
      doc,
      `MODEL RESIDENTIAL PG LEASE AGREEMENT v${s.agreementVersion}`,
      'Executed under Indian Contract Act 1872 & IT Act 2000 — Legally Binding'
    );

    let curY = 105;

    // --- Agreement metadata ---
    this.renderInfoBlock(doc, BRAND.marginH, curY, 230, 'AGREEMENT DETAILS', [
      { label: 'Agreement No', value: s.agreementNumber },
      { label: 'Version', value: `v${s.agreementVersion}` },
      { label: 'Status', value: s.status },
      { label: 'Start Date', value: this.formatDate(s.startDate) },
      { label: 'End Date', value: this.formatDate(s.endDate) },
      { label: 'Executed On', value: this.formatDate(s.createdAt) },
    ]);

    this.renderInfoBlock(doc, 300, curY, 245, 'ACCOMMODATION UNIT', [
      { label: 'PG Property', value: s.pgName },
      { label: 'Address', value: `${s.pgAddress ?? ''}${s.pgCity ? ', ' + s.pgCity : ''}` },
      { label: 'Room No', value: s.roomNumber },
      { label: 'Bed No', value: s.bedNumber },
      { label: 'Notice Period', value: `${s.noticePeriodDays} Days` },
    ]);

    curY += 90;

    // --- Section 1: Parties ---
    this.renderSectionHeading(doc, curY, '1. PARTIES TO THE AGREEMENT');
    curY += 18;

    // Owner
    this.renderInfoBlock(doc, BRAND.marginH, curY, 220, 'LESSOR / PG OWNER', [
      { label: 'Name', value: s.ownerName },
      { label: 'Phone', value: s.ownerPhone ?? 'N/A' },
      { label: 'Email', value: s.ownerEmail ?? 'N/A' },
      { label: 'Address', value: s.ownerAddress ?? 'N/A' },
    ]);

    this.renderInfoBlock(doc, 300, curY, 245, 'LESSEE / RESIDENT', [
      { label: 'Name', value: s.residentName },
      { label: 'Code', value: s.residentCode ?? 'N/A' },
      { label: 'Phone', value: s.residentPhone ?? 'N/A' },
      { label: 'Permanent Address', value: s.residentAddress ?? 'N/A' },
    ]);

    curY += 65;

    // Divider
    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 10;

    // --- Section 2: Financial Terms ---
    this.renderSectionHeading(doc, curY, '2. FINANCIAL TERMS & OBLIGATIONS');
    curY += 18;

    const TABLE_COLS = [
      { label: 'CHARGE TYPE', x: 60, width: 240, align: 'left' as const },
      { label: 'AMOUNT / TERMS', x: 310, width: 225, align: 'left' as const },
    ];
    this.renderTableHeader(doc, curY, TABLE_COLS);
    curY += 26;

    const finRows = [
      { label: 'Monthly Rent (Accommodation Fee)', value: this.formatCurrency(s.rentAmount) + '/month (Due by 5th)' },
      { label: 'Refundable Security Deposit', value: this.formatCurrency(s.securityDeposit) },
      { label: 'Monthly Maintenance Charges', value: this.formatCurrency(s.maintenanceCharges) + '/month' },
      { label: 'Electricity Charges', value: s.electricityCharges },
      { label: 'WiFi / Internet', value: s.wifiCharges },
      { label: 'Food / Mess', value: s.foodCharges },
      { label: 'Refund Policy', value: s.refundPolicy },
    ];

    for (let i = 0; i < finRows.length; i++) {
      if (curY > 760) { doc.addPage(); this.renderWatermark(doc, 'RENTAL AGREEMENT'); curY = 60; }
      this.renderTableRow(doc, curY, i, [
        { value: finRows[i].label, x: 60, width: 240 },
        { value: finRows[i].value, x: 310, width: 225 },
      ]);
      curY += 18;
    }

    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY + 4).lineTo(545, curY + 4).stroke();
    curY += 16;

    // --- Section 3: House Rules ---
    if (curY > 700) { doc.addPage(); this.renderWatermark(doc, 'RENTAL AGREEMENT'); curY = 60; }
    this.renderSectionHeading(doc, curY, '3. HOUSE RULES & CODE OF CONDUCT');
    curY += 16;

    doc.fontSize(8).font('Helvetica').fillColor(BRAND.textSecondary);

    const allRules = [
      `• Curfew / Security: ${s.curfewTime}`,
      `• Visitor Policy: ${s.visitorPolicy}`,
      `• Prohibited: ${s.prohibitedActivities.join(', ')} strictly not allowed.`,
      `• Damage Liability: ${s.damagePolicy}`,
      ...s.houseRules.map(r => `• ${r}`),
    ];

    for (const rule of allRules) {
      if (curY > 760) { doc.addPage(); this.renderWatermark(doc, 'RENTAL AGREEMENT'); curY = 60; }
      doc.text(rule, BRAND.marginH, curY, { width: BRAND.contentWidth });
      curY += 13;
    }

    curY += 6;
    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 10;

    // --- Section 4: Legal Terms ---
    if (curY > 680) { doc.addPage(); this.renderWatermark(doc, 'RENTAL AGREEMENT'); curY = 60; }
    this.renderSectionHeading(doc, curY, '4. TERMINATION, JURISDICTION & LEGAL CLAUSES');
    curY += 16;
    doc.fontSize(8).font('Helvetica').fillColor(BRAND.textSecondary);
    doc.text(`• Termination: ${s.terminationClause}`, BRAND.marginH, curY, { width: BRAND.contentWidth }); curY += 14;
    doc.text(`• Jurisdiction: ${s.disputeJurisdiction} under Indian Contract Act 1872 & DPDP Act 2023.`, BRAND.marginH, curY, { width: BRAND.contentWidth }); curY += 14;
    doc.text('• Digital Execution: This agreement is executed electronically under IT Act 2000 Sec. 11. HMAC-SHA256 signature timestamps constitute legal proof of consent.', BRAND.marginH, curY, { width: BRAND.contentWidth }); curY += 18;

    // --- Section 5: Signatures ---
    if (curY > 680) { doc.addPage(); this.renderWatermark(doc, 'RENTAL AGREEMENT'); curY = 60; }
    this.renderSectionHeading(doc, curY, '5. CRYPTOGRAPHIC SIGNATURES & EXECUTION');
    curY += 18;

    const residentSig = s.signatures.find(sig => sig.signerType === 'RESIDENT');
    const ownerSig = s.signatures.find(sig => sig.signerType === 'OWNER');

    // Resident signature box
    doc.rect(BRAND.marginH, curY, 225, 90).stroke(BRAND.brandOrange);
    doc.fillColor(BRAND.darkBg).fontSize(8).font('Helvetica-Bold').text('RESIDENT / LESSEE SIGNATURE', BRAND.marginH + 8, curY + 8, { width: 209 });
    doc.fillColor(BRAND.textSecondary).fontSize(7.5).font('Helvetica');
    if (residentSig) {
      doc.text(`Signed by: ${residentSig.signerName}`, BRAND.marginH + 8, curY + 24, { width: 209 });
      doc.text(`IP: ${residentSig.ipAddress ?? 'N/A'}`, BRAND.marginH + 8, curY + 36, { width: 209 });
      doc.text(`Time: ${this.formatDate(residentSig.timestamp)}`, BRAND.marginH + 8, curY + 48, { width: 209 });
      doc.text(`HMAC: ${(residentSig.hashHmac ?? '').slice(0, 28)}...`, BRAND.marginH + 8, curY + 60, { width: 209 });
      doc.fillColor(BRAND.successGreen).fontSize(8).font('Helvetica-Bold').text('✓ DIGITALLY SIGNED & VERIFIED', BRAND.marginH + 8, curY + 74, { width: 209 });
    } else {
      doc.text('Status: Signature Pending', BRAND.marginH + 8, curY + 24, { width: 209 });
      doc.fillColor(BRAND.warningAmber).fontSize(8).text('⏳ SIGNATURE REQUIRED', BRAND.marginH + 8, curY + 38, { width: 209 });
    }

    // Owner signature box
    doc.rect(320, curY, 225, 90).stroke(BRAND.brandOrange);
    doc.fillColor(BRAND.darkBg).fontSize(8).font('Helvetica-Bold').text('OWNER / LESSOR SIGNATURE', 328, curY + 8, { width: 209 });
    doc.fillColor(BRAND.textSecondary).fontSize(7.5).font('Helvetica');
    if (ownerSig) {
      doc.text(`Signed by: ${ownerSig.signerName}`, 328, curY + 24, { width: 209 });
      doc.text(`IP: ${ownerSig.ipAddress ?? 'N/A'}`, 328, curY + 36, { width: 209 });
      doc.text(`Time: ${this.formatDate(ownerSig.timestamp)}`, 328, curY + 48, { width: 209 });
      doc.text(`HMAC: ${(ownerSig.hashHmac ?? '').slice(0, 28)}...`, 328, curY + 60, { width: 209 });
      doc.fillColor(BRAND.successGreen).fontSize(8).font('Helvetica-Bold').text('✓ DIGITALLY SIGNED & VERIFIED', 328, curY + 74, { width: 209 });
    } else {
      doc.text('Status: Signature Pending', 328, curY + 24, { width: 209 });
      doc.fillColor(BRAND.warningAmber).fontSize(8).text('⏳ SIGNATURE REQUIRED', 328, curY + 38, { width: 209 });
    }

    curY += 104;

    // QR verification
    if (curY > 720) { doc.addPage(); this.renderWatermark(doc, 'RENTAL AGREEMENT'); curY = 60; }
    const qrPayload = `https://roombae.com/verify-agreement?num=${encodeURIComponent(s.agreementNumber)}&status=${s.status}`;
    await this.renderQrSection(
      doc, curY, qrPayload, 'SCAN TO VERIFY AGREEMENT',
      `Agreement: ${s.agreementNumber} | ${s.pgName} | Resident: ${s.residentName} | ` +
      `Owner: ${s.ownerName} | ${this.formatDate(s.startDate)} — ${this.formatDate(s.endDate)}`
    );

    this.renderFooter(doc, 1, 1);
  }

  private renderSectionHeading(doc: PdfDocInstance, y: number, text: string): void {
    doc.fillColor(BRAND.brandOrangeDark).fontSize(10).font('Helvetica-Bold').text(text, BRAND.marginH, y);
  }
}
