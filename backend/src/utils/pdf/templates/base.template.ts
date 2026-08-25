/**
 * RoomBae Brand Base HTML Template Shell for Puppeteer PDF Generation.
 * Embeds self-contained styling, print page-break rules, and RoomBae brand tokens.
 */

export function wrapBaseHtml(content: string, title: string = 'RoomBae Official Document'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #FFF8F2;
      color: #3B2A24;
      font-size: 13px;
      line-height: 1.5;
      padding: 10px;
    }
    .page-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-banner {
      background: linear-gradient(135deg, #2D2420 0%, #1A1412 100%);
      color: #FFFFFF;
      padding: 22px 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 3px solid #D9A87C;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #F8EEE5 0%, #D9A87C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #D9A87C;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }
    .doc-type-badge {
      text-align: right;
    }
    .doc-type-title {
      font-size: 16px;
      font-weight: 700;
      color: #F8EEE5;
    }
    .doc-type-meta {
      font-size: 10px;
      color: #A08C82;
      margin-top: 2px;
    }
    .card-box {
      background: #FFFFFF;
      border: 1px solid #E6D7CA;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(59, 42, 36, 0.04);
      page-break-inside: avoid;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #8C786E;
      margin-bottom: 2px;
    }
    .value {
      font-size: 13px;
      font-weight: 600;
      color: #3B2A24;
    }
    .value-highlight {
      font-size: 15px;
      font-weight: 700;
      color: #C58B63;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid, .status-verified, .status-active {
      background-color: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .status-pending, .status-unpaid {
      background-color: #FFFBEB;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .status-failed, .status-overdue, .status-cancelled {
      background-color: #FEF2F2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
    }
    table.data-table th {
      background-color: #F8EEE5;
      color: #3B2A24;
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      border-bottom: 2px solid #E6D7CA;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #E6D7CA;
      color: #4A3B32;
    }
    table.data-table tbody tr:nth-child(even) {
      background-color: #FDFAF7;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 14px;
      page-break-inside: avoid;
    }
    .summary-box {
      width: 280px;
      background: #F8EEE5;
      border: 1px solid #E6D7CA;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      color: #6E5A52;
    }
    .summary-row.total {
      border-top: 2px solid #D9A87C;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 14px;
      font-weight: 800;
      color: #3B2A24;
    }
    .summary-row.balance {
      font-size: 13px;
      font-weight: 700;
      color: #DC2626;
    }
    .summary-row.paid {
      font-size: 13px;
      font-weight: 700;
      color: #059669;
    }
    .footer-note {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #E6D7CA;
      font-size: 10px;
      color: #A08C82;
      text-align: center;
      line-height: 1.6;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #3B2A24;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #D9A87C;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .page-break-avoid {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${content}
  </div>
</body>
</html>`;
}
