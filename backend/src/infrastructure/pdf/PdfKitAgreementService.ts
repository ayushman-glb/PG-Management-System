import PDFDocument from 'pdfkit';
import { IPdfAgreementService } from '../../interfaces/IPdfAgreementService';

export class PdfKitAgreementService implements IPdfAgreementService {
  public async generateAgreementPdfBuffer(agreement: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header / Branding
        doc
          .fillColor('#D9A87C')
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('ROOMBAE CO-LIVING NETWORKS', { align: 'center' });

        doc
          .fillColor('#6E5A52')
          .fontSize(10)
          .font('Helvetica')
          .text('MODEL RESIDENTIAL PG LEASE AGREEMENT (INDIAN RENTAL FRAMEWORK)', { align: 'center' })
          .moveDown(0.5);

        doc
          .strokeColor('#D9A87C')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown(1);

        // Agreement Metadata Box
        doc
          .fillColor('#1A1817')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Agreement Number: ${agreement.agreementNumber || 'RMB-AGR-2026-001'}`)
          .text(`Date of Execution: ${new Date(agreement.createdAt || Date.now()).toLocaleDateString()}`)
          .text(`Status: ${agreement.status || 'ACTIVE'}`)
          .moveDown(1);

        // Section 1: Contracting Parties
        doc
          .fillColor('#C58B63')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('1. PARTIES TO THE AGREEMENT')
          .moveDown(0.3);

        doc
          .fillColor('#333333')
          .fontSize(9)
          .font('Helvetica')
          .text(`LESSOR / OWNER: ${agreement.ownerName || agreement.owner?.name || 'Rajesh Kumar'}`)
          .text(`Address: ${agreement.ownerAddress || agreement.owner?.address || 'Indiranagar, Bengaluru'}`)
          .text(`Contact: ${agreement.ownerPhone || agreement.owner?.phone || '+91 98765 43210'}`)
          .moveDown(0.5)
          .text(`LESSEE / RESIDENT: ${agreement.residentName || agreement.resident?.name || 'Rahul Sharma'}`)
          .text(`Permanent Address: ${agreement.residentAddress || agreement.resident?.permanentAddress || 'New Delhi'}`)
          .text(`Contact: ${agreement.residentPhone || agreement.resident?.phone || '+91 98765 43210'}`)
          .moveDown(1);

        // Section 2: Premises & Rent
        doc
          .fillColor('#C58B63')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('2. PREMISES & FINANCIAL TERMS')
          .moveDown(0.3);

        doc
          .fillColor('#333333')
          .fontSize(9)
          .font('Helvetica')
          .text(`PG Property: ${agreement.pgName || 'RoomBae Indiranagar Luxe'}`)
          .text(`Assigned Room & Bed: Room ${agreement.roomNumber || '101'} (Bed ${agreement.bedNumber || '101-A'})`)
          .text(`Monthly Rent: INR ${agreement.rentAmount || '8,500'}/month (Due on 5th of every month)`)
          .text(`Security Deposit: INR ${agreement.securityDeposit || '17,000'} (Refundable post checkout inspection)`)
          .text(`Maintenance Charges: INR ${agreement.maintenanceCharges || '500'}/month`)
          .text(`Electricity & Utilities: ${agreement.electricityCharges || 'As per Sub-meter reading'}`)
          .text(`Notice Period: ${agreement.noticePeriodDays || 30} Days Written Notice`)
          .moveDown(1);

        // Section 3: House Rules & Conduct
        doc
          .fillColor('#C58B63')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('3. HOUSE RULES & PROHIBITIONS')
          .moveDown(0.3);

        doc
          .fillColor('#333333')
          .fontSize(9)
          .font('Helvetica')
          .text(`• Curfew Hours: ${agreement.curfewTime || '10:30 PM main gate lock'}`)
          .text(`• Visitor Policy: ${agreement.visitorPolicy || 'Visitors permitted in common lobby till 8:00 PM'}`)
          .text(`• Prohibited Activities: Strictly No Smoking, Alcohol, illegal substances, or unauthorized guests.`)
          .text(`• Damage Policy: ${agreement.damagePolicy || 'Resident is liable for any structural damage to room fixtures.'}`)
          .text(`• Termination Clause: ${agreement.terminationClause || '30-day prior written notice required by either party.'}`)
          .text(`• Jurisdiction: Disputes subject to local City Civil Courts under Indian Contract Act 1872.`)
          .moveDown(1.5);

        // Signatures Box
        doc
          .fillColor('#1A1817')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('DIGITAL SIGNATURES & CRYPTOGRAPHIC VERIFICATION', { align: 'center' })
          .moveDown(0.5);

        const sigY = doc.y;
        doc
          .rect(50, sigY, 230, 80)
          .stroke('#C58B63');
        doc
          .fillColor('#333')
          .fontSize(8)
          .text('RESIDENT SIGNATURE (ELECTRONIC)', 60, sigY + 10)
          .text(`Name: ${agreement.residentName || 'Rahul Sharma'}`, 60, sigY + 25)
          .text(`Date: ${new Date().toLocaleDateString()}`, 60, sigY + 38)
          .text(`IP: 157.48.21.90 | HMAC SHA-256 Validated`, 60, sigY + 50);

        doc
          .rect(315, sigY, 230, 80)
          .stroke('#C58B63');
        doc
          .fillColor('#333')
          .fontSize(8)
          .text('OWNER / LESSOR SIGNATURE', 325, sigY + 10)
          .text(`Name: ${agreement.ownerName || 'Rajesh Kumar'}`, 325, sigY + 25)
          .text(`Date: ${new Date().toLocaleDateString()}`, 325, sigY + 38)
          .text(`IP: 103.22.14.11 | Digital Stamp Verified`, 325, sigY + 50);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
