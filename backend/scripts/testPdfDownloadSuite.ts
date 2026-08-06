import { PdfKitInvoiceService } from "../src/infrastructure/pdf/PdfKitInvoiceService";
import { PdfKitAgreementService } from "../src/infrastructure/pdf/PdfKitAgreementService";
import WritableStreamBuffer from "stream";

async function runPdfSuiteVerification() {
  console.log("====================================================");
  console.log("📄 ROOMBAE PDFKIT GENERATION & STREAM SUITE TEST");
  console.log("====================================================\n");

  const pdfInvoiceService = new PdfKitInvoiceService();
  const pdfAgreementService = new PdfKitAgreementService();

  // Test Case 1: Tax Invoice PDF Generation
  console.log("🧪 1. Testing GST Tax Invoice PDF Generation...");
  const mockPayment = {
    id: "pay-test-123",
    invoiceNumber: "INV-2026-TEST",
    paymentDate: new Date(),
    status: "PAID",
    paymentMethod: "RAZORPAY",
    baseAmount: 8500,
    cgstAmount: 765,
    sgstAmount: 765,
    totalAmount: 10030,
    resident: {
      user: { name: "Test Resident", residentCode: "RES-TEST" },
      bed: { room: { roomNumber: "101" }, bedNumber: "A" }
    },
    pg: { name: "RoomBae Test PG", address: "123 Test Street", city: "Bengaluru" }
  };

  const invoiceBuffer = await pdfInvoiceService.generateInvoicePdfBuffer(mockPayment);
  const invoiceHeader = invoiceBuffer.toString("utf8", 0, 5);
  if (invoiceHeader === "%PDF-") {
    console.log(`   ✅ Tax Invoice PDF Buffer generated successfully! Size: ${invoiceBuffer.length} bytes (Header: ${invoiceHeader})`);
  } else {
    throw new Error(`Invalid PDF header for invoice: ${invoiceHeader}`);
  }

  // Test Case 2: Legal Rental Agreement PDF Generation
  console.log("\n🧪 2. Testing Legal Rental Agreement PDF Generation...");
  const mockAgreement = {
    id: "agr-test-123",
    agreementNumber: "RMB-AGR-2026-TEST",
    status: "ACTIVE",
    createdAt: new Date(),
    ownerName: "Test Owner",
    ownerAddress: "Indiranagar, Bengaluru",
    ownerPhone: "+91 98765 43210",
    residentName: "Test Resident",
    residentAddress: "New Delhi",
    residentPhone: "+91 98765 43210",
    pgName: "RoomBae Luxe PG",
    roomNumber: "101",
    bedNumber: "101-A",
    rentAmount: "8,500",
    securityDeposit: "17,000",
  };

  const agreementBuffer = await pdfAgreementService.generateAgreementPdfBuffer(mockAgreement);
  const agreementHeader = agreementBuffer.toString("utf8", 0, 5);
  if (agreementHeader === "%PDF-") {
    console.log(`   ✅ Rental Agreement PDF Buffer generated successfully! Size: ${agreementBuffer.length} bytes (Header: ${agreementHeader})`);
  } else {
    throw new Error(`Invalid PDF header for agreement: ${agreementHeader}`);
  }

  console.log("\n====================================================");
  console.log("🎉 ALL PDFKIT GENERATION & STREAM SUITE TESTS PASSED!");
  console.log("====================================================");
}

runPdfSuiteVerification().catch((err) => {
  console.error("❌ PDF Suite Test Failed:", err);
  process.exit(1);
});
