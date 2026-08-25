import { wrapBaseHtml } from './base.template';

export interface ReceiptPdfData {
  receiptNumber: string;
  paymentId: string;
  paymentDate: Date | string;
  paymentMethod: string;
  status: string;
  purpose: string;
  amount: number;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  pgName?: string;
  pgAddress?: string;
  transactionId?: string;
}

export function renderReceiptHtml(data: ReceiptPdfData): string {
  const dateFormatted = new Date(data.paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = `₹${Number(data.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const cleanPurpose = (data.purpose || 'RENT').replace(/_/g, ' ');

  const content = `
    <div class="header-banner">
      <div>
        <div class="brand-title">ROOMBAE</div>
        <div class="brand-subtitle">Official Payment Receipt</div>
      </div>
      <div class="doc-type-badge">
        <div class="doc-type-title">PAYMENT ACKNOWLEDGEMENT</div>
        <div class="doc-type-meta">Electronic Transaction Confirmation</div>
      </div>
    </div>

    <div class="card-box grid-3">
      <div>
        <div class="label">Receipt Number</div>
        <div class="value-highlight">${escapeHtml(data.receiptNumber || data.paymentId)}</div>
      </div>
      <div>
        <div class="label">Payment Date & Time</div>
        <div class="value">${dateFormatted}</div>
      </div>
      <div>
        <div class="label">Payment Status</div>
        <div><span class="status-badge status-paid">${escapeHtml(data.status || 'VERIFIED')}</span></div>
      </div>
      <div>
        <div class="label">Payment Mode</div>
        <div class="value">${escapeHtml(data.paymentMethod || 'ONLINE')}</div>
      </div>
      <div>
        <div class="label">Transaction Reference</div>
        <div class="value" style="font-family: monospace; font-size: 11px;">${escapeHtml(data.transactionId || data.paymentId)}</div>
      </div>
      <div>
        <div class="label">Total Amount Paid</div>
        <div class="value" style="color: #059669; font-size: 16px; font-weight: 800;">${formattedAmount}</div>
      </div>
    </div>

    <div class="card-box grid-2">
      <div>
        <div class="section-title">Received From (Payer)</div>
        <div class="value">${escapeHtml(data.payerName)}</div>
        <div style="font-size: 11px; color: #6E5A52; margin-top: 3px;">Email: ${escapeHtml(data.payerEmail)}</div>
        ${data.payerPhone ? `<div style="font-size: 11px; color: #6E5A52;">Phone: ${escapeHtml(data.payerPhone)}</div>` : ''}
      </div>
      <div>
        <div class="section-title">Property / PG Details</div>
        <div class="value">${escapeHtml(data.pgName || 'RoomBae Co-Living')}</div>
        ${data.pgAddress ? `<div style="font-size: 11px; color: #6E5A52; margin-top: 3px;">${escapeHtml(data.pgAddress)}</div>` : ''}
      </div>
    </div>

    <div class="card-box">
      <div class="section-title">Payment Breakdown</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;" class="text-center">#</th>
            <th>Description</th>
            <th style="width: 140px;" class="text-center">Category</th>
            <th style="width: 140px;" class="text-right">Paid Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center">1</td>
            <td><strong>Payment for ${escapeHtml(cleanPurpose)}</strong></td>
            <td class="text-center"><span class="status-badge" style="background: #F8EEE5; color: #6E5A52;">${escapeHtml(data.purpose)}</span></td>
            <td class="text-right"><strong>${formattedAmount}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-box">
          <div class="summary-row total" style="border: none; padding-top: 0;">
            <span style="font-size: 13px;">Net Amount Received</span>
            <span style="color: #059669; font-size: 16px;">${formattedAmount}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-note">
      This is a computer-generated official payment receipt issued by RoomBae PG Management System.<br>
      No physical signature is required. For transaction queries, please quote your Receipt Number.
    </div>
  `;

  return wrapBaseHtml(content, `Receipt - ${data.receiptNumber || data.paymentId}`);
}

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
