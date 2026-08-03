export interface Invoice {
  id: string;
  residentId: string;
  residentName?: string;
  amount: number;
  dueDate: string;
  billingMonth: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  pdfUrl?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  residentId: string;
  amount: number;
  method: "RAZORPAY" | "UPI" | "CASH" | "BANK_TRANSFER";
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionDate: string;
}
