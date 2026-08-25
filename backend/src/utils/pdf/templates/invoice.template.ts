import { wrapBaseHtml } from './base.template';

export interface InvoiceItemPdf {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  status: string;
  billingMonth: number;
  billingYear: number;
  issueDate: Date | string;
  dueDate: Date | string;
  residentName: string;
  residentEmail: string;
  residentPhone?: string;
  pgName: string;
  pgAddress?: string;
  items: InvoiceItemPdf[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  fineAmount?: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
}

export function renderInvoiceHtml(data: InvoicePdfData): string {
  const issueDateFormatted = new Date(data.issueDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dueDateFormatted = new Date(data.dueDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const statusLower = (data.status || 'UNPAID').toLowerCase();
  const statusClass = statusLower.includes('paid') && !statusLower.includes('unpaid')
    ? 'status-paid'
    : statusLower.includes('overdue')
    ? 'status-overdue'
    : 'status-pending';

  const rowsHtml = (data.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="width: 40px;" class="text-center">${idx + 1}</td>
        <td><strong>${escapeHtml(item.description)}</strong></td>
        <td style="width: 60px;" class="text-center">${item.quantity}</td>
        <td style="width: 110px;" class="text-right">₹${Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="width: 110px;" class="text-right"><strong>₹${Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
      </tr>`
    )
    .join('');

  const content = `
    <div class="header-banner">
      <div>
        <div class="brand-title">ROOMBAE</div>
        <div class="brand-subtitle">Smart Co-Living & PG Management</div>
      </div>
      <div class="doc-type-badge">
        <div class="doc-type-title">TAX INVOICE</div>
        <div class="doc-type-meta">Original for Recipient · GSTIN: 29AABCR8901M1ZX</div>
      </div>
    </div>

    <div class="card-box grid-3">
      <div>
        <div class="label">Invoice Number</div>
        <div class="value-highlight">${escapeHtml(data.invoiceNumber)}</div>
      </div>
      <div>
        <div class="label">Billing Cycle</div>
        <div class="value">Month ${data.billingMonth}/${data.billingYear}</div>
      </div>
      <div>
        <div class="label">Payment Status</div>
        <div><span class="status-badge ${statusClass}">${escapeHtml(data.status)}</span></div>
      </div>
      <div>
        <div class="label">Issue Date</div>
        <div class="value">${issueDateFormatted}</div>
      </div>
      <div>
        <div class="label">Due Date</div>
        <div class="value" style="color: #B45309;">${dueDateFormatted}</div>
      </div>
      <div>
        <div class="label">Currency</div>
        <div class="value">INR (₹)</div>
      </div>
    </div>

    <div class="card-box grid-2">
      <div>
        <div class="section-title">Billed To (Resident)</div>
        <div class="value">${escapeHtml(data.residentName)}</div>
        <div style="font-size: 11px; color: #6E5A52; margin-top: 3px;">${escapeHtml(data.residentEmail)}</div>
        ${data.residentPhone ? `<div style="font-size: 11px; color: #6E5A52;">Phone: ${escapeHtml(data.residentPhone)}</div>` : ''}
      </div>
      <div>
        <div class="section-title">Property / Provider</div>
        <div class="value">${escapeHtml(data.pgName)}</div>
        ${data.pgAddress ? `<div style="font-size: 11px; color: #6E5A52; margin-top: 3px;">${escapeHtml(data.pgAddress)}</div>` : ''}
      </div>
    </div>

    <div class="card-box">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;" class="text-center">#</th>
            <th>Item Description</th>
            <th style="width: 60px;" class="text-center">Qty</th>
            <th style="width: 110px;" class="text-right">Unit Price</th>
            <th style="width: 110px;" class="text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" class="text-center" style="padding: 16px; color: #8C786E;">No line items</td></tr>'}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="summary-box">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹${Number(data.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span>GST (${data.gstPercentage}%)</span>
            <span>₹${Number(data.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          ${(data.fineAmount || 0) > 0 ? `
          <div class="summary-row" style="color: #DC2626;">
            <span>Late Fine</span>
            <span>₹${Number(data.fineAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>` : ''}
          <div class="summary-row total">
            <span>Total Due</span>
            <span>₹${Number(data.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row paid">
            <span>Amount Paid</span>
            <span>₹${Number(data.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row balance">
            <span>Balance Due</span>
            <span>₹${Number(data.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-note">
      This is a digitally generated tax invoice issued by RoomBae PG Management System.<br>
      Please make payment on or before the due date to avoid service interruptions. For billing inquiries, contact your PG administrator.
    </div>
  `;

  return wrapBaseHtml(content, `Invoice - ${data.invoiceNumber}`);
}

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
