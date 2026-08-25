import { wrapBaseHtml } from './base.template';

export interface AgreementSignaturePdf {
  signerRole: string;
  signatureType: string;
  signedAt: Date | string;
  ipAddress?: string;
}

export interface AgreementPdfData {
  agreementNumber: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  version: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  residentName: string;
  residentEmail: string;
  residentPhone?: string;
  pgName: string;
  pgAddress?: string;
  floorNumber?: string | number;
  roomNumber?: string;
  bedNumber?: string;
  roomType?: string;
  rentAmount: number;
  depositAmount: number;
  lockInPeriodMonths: number;
  noticePeriodDays: number;
  signatures: AgreementSignaturePdf[];
  documentHash?: string;
  verificationUrl: string;
  qrCodeDataUrl?: string | null;
}

export function renderAgreementHtml(data: AgreementPdfData): string {
  const startDateFormatted = new Date(data.startDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const endDateFormatted = new Date(data.endDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const signaturesHtml = (data.signatures || []).length > 0
    ? data.signatures
        .map(
          (sig) => `
        <div style="padding: 8px 12px; background: #FDFAF7; border: 1px solid #E6D7CA; border-radius: 6px; margin-bottom: 8px; font-size: 11.5px;">
          <div style="font-weight: 700; color: #059669;">✔ Digitally Signed by ${escapeHtml(sig.signerRole)} (${sig.signerRole === 'RESIDENT' ? escapeHtml(data.residentName) : escapeHtml(data.ownerName)})</div>
          <div style="font-size: 10.5px; color: #6E5A52; margin-top: 2px;">
            Method: <strong>${escapeHtml(sig.signatureType)}</strong> · Signed: ${new Date(sig.signedAt).toISOString()} · IP: ${escapeHtml(sig.ipAddress || '127.0.0.1')}
          </div>
        </div>`
        )
        .join('')
    : `<div style="padding: 10px 14px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; color: #DC2626; font-size: 11.5px; font-style: italic;">
        ⚠ Awaiting digital signatures from parties.
      </div>`;

  const content = `
    <div class="header-banner">
      <div>
        <div class="brand-title">ROOMBAE</div>
        <div class="brand-subtitle">Model Co-Living Tenancy Agreement</div>
      </div>
      <div class="doc-type-badge">
        <div class="doc-type-title">RESIDENTIAL LEASE CONTRACT</div>
        <div class="doc-type-meta">Standard Indian Tenancy & Co-Living Framework</div>
      </div>
    </div>

    <div class="card-box grid-3">
      <div>
        <div class="label">Agreement Number</div>
        <div class="value-highlight">${escapeHtml(data.agreementNumber)}</div>
      </div>
      <div>
        <div class="label">Contract Term</div>
        <div class="value">${startDateFormatted} to ${endDateFormatted}</div>
      </div>
      <div>
        <div class="label">Agreement Status</div>
        <div><span class="status-badge status-active">${escapeHtml(data.status || 'ACTIVE')}</span></div>
      </div>
      <div>
        <div class="label">Contract Version</div>
        <div class="value">v${data.version || 1}.0</div>
      </div>
      <div>
        <div class="label">Lock-in Period</div>
        <div class="value">${data.lockInPeriodMonths || 6} Months</div>
      </div>
      <div>
        <div class="label">Notice Period</div>
        <div class="value">${data.noticePeriodDays || 30} Days</div>
      </div>
    </div>

    <div class="card-box page-break-avoid">
      <div class="section-title">1. Parties to this Lease Agreement</div>
      <div class="grid-2" style="margin-top: 8px;">
        <div style="padding: 10px; background: #F8EEE5; border-radius: 6px;">
          <div class="label">Lessor / Property Owner</div>
          <div class="value">${escapeHtml(data.ownerName)}</div>
          <div style="font-size: 11px; color: #6E5A52; margin-top: 2px;">Email: ${escapeHtml(data.ownerEmail)}</div>
          ${data.ownerPhone ? `<div style="font-size: 11px; color: #6E5A52;">Phone: ${escapeHtml(data.ownerPhone)}</div>` : ''}
        </div>
        <div style="padding: 10px; background: #F8EEE5; border-radius: 6px;">
          <div class="label">Lessee / Resident</div>
          <div class="value">${escapeHtml(data.residentName)}</div>
          <div style="font-size: 11px; color: #6E5A52; margin-top: 2px;">Email: ${escapeHtml(data.residentEmail)}</div>
          ${data.residentPhone ? `<div style="font-size: 11px; color: #6E5A52;">Phone: ${escapeHtml(data.residentPhone)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="card-box page-break-avoid">
      <div class="section-title">2. Premises & Allocated Accommodation Details</div>
      <div class="grid-2" style="margin-top: 8px;">
        <div>
          <div class="label">Property Name</div>
          <div class="value">${escapeHtml(data.pgName)}</div>
          <div style="font-size: 11px; color: #6E5A52; margin-top: 2px;">${escapeHtml(data.pgAddress || 'Address on record')}</div>
        </div>
        <div>
          <div class="label">Allocated Unit</div>
          <div class="value" style="color: #C58B63;">
            Floor ${data.floorNumber ?? '1'} · Room ${escapeHtml(data.roomNumber ?? 'N/A')} · Bed ${escapeHtml(data.bedNumber ?? 'N/A')}
          </div>
          <div style="font-size: 11px; color: #6E5A52; margin-top: 2px;">Sharing Type: ${escapeHtml(data.roomType ?? 'DOUBLE')}</div>
        </div>
      </div>
    </div>

    <div class="card-box page-break-avoid">
      <div class="section-title">3. Financial Terms & Payment Schedule</div>
      <div class="grid-3" style="margin-top: 8px;">
        <div>
          <div class="label">Monthly Rent (License Fee)</div>
          <div class="value-highlight" style="font-size: 16px;">₹${Number(data.rentAmount || 0).toLocaleString('en-IN')}/mo</div>
          <div style="font-size: 10px; color: #8C786E; margin-top: 2px;">Due on or before 5th of each calendar month</div>
        </div>
        <div>
          <div class="label">Security Deposit</div>
          <div class="value" style="font-size: 16px; font-weight: 700; color: #3B2A24;">₹${Number(data.depositAmount || 0).toLocaleString('en-IN')}</div>
          <div style="font-size: 10px; color: #8C786E; margin-top: 2px;">Refundable upon checkout inspection</div>
        </div>
        <div>
          <div class="label">Lock-in & Notice</div>
          <div class="value">${data.lockInPeriodMonths} Mo. Lock-in / ${data.noticePeriodDays} Days Notice</div>
        </div>
      </div>
    </div>

    <div class="card-box page-break-avoid">
      <div class="section-title">4. Code of Conduct & Covenants</div>
      <ul style="padding-left: 18px; font-size: 11px; color: #4A3B32; line-height: 1.6; margin-top: 6px;">
        <li><strong>Visitors & Guests:</strong> Permitted in common areas between 09:00 - 20:00 with digital guest pass registered via portal.</li>
        <li><strong>Quiet Hours:</strong> Mandatory quiet hours observed from 22:30 to 06:30 for community peaceful enjoyment.</li>
        <li><strong>Property Care:</strong> Tenant is strictly responsible for allocated room fixtures, furniture, and amenities.</li>
        <li><strong>Notice & Checkout:</strong> Minimum 30 days prior written notice via RoomBae portal required before vacate.</li>
      </ul>
    </div>

    <div class="card-box page-break-avoid">
      <div class="section-title">5. Digital Execution & Signatures</div>
      ${signaturesHtml}
    </div>

    <div class="card-box page-break-avoid" style="display: flex; gap: 16px; align-items: center; background: #F8EEE5;">
      ${data.qrCodeDataUrl ? `<div style="flex-shrink: 0;"><img src="${data.qrCodeDataUrl}" alt="QR Verification" style="width: 80px; height: 80px; border-radius: 6px; border: 1px solid #E6D7CA; background: #FFFFFF; padding: 3px;" /></div>` : ''}
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 12px; color: #3B2A24;">Document Integrity & Cryptographic Verification</div>
        <div style="font-size: 10px; color: #6E5A52; margin-top: 3px; word-break: break-all;">
          <strong>SHA-256 Hash:</strong> <span style="font-family: monospace;">${escapeHtml(data.documentHash || 'Awaiting Execution')}</span>
        </div>
        <div style="font-size: 10px; color: #6E5A52; margin-top: 2px;">
          <strong>Verify Online:</strong> <a href="${escapeHtml(data.verificationUrl)}" style="color: #C58B63; text-decoration: none;">${escapeHtml(data.verificationUrl)}</a>
        </div>
      </div>
    </div>

    <div class="footer-note">
      This agreement is executed under the Information Technology Act, 2000 and the Indian Contract Act, 1872.<br>
      Electronic signatures affixed hereon are legally binding on all contracting parties.
    </div>
  `;

  return wrapBaseHtml(content, `Agreement - ${data.agreementNumber}`);
}

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
