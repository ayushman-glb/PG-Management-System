import {
  PrismaClient,
  Role,
  ResidentStatus,
  PGStatus,
  FoodPreference,
  RoomType,
  WashroomType,
  ACType,
  PaymentStatus,
  Priority,
  TicketStatus,
  BedStatus,
  OwnerKYCStatus,
  BusinessType,
  SubscriptionPlanType,
  SubscriptionStatus,
  AgreementStatus,
  FineType,
  FineCalculationType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Authoritative RoomBae Database Seeding (GOD, Ayushman Saha, Ankur Saha)...');

  // ── 1. Clean existing collections ──────────────────────────────────────────
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.kanbanCard.deleteMany({});
  await prisma.kanbanColumn.deleteMany({});
  await prisma.kanbanBoard.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.checkOut.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.complaintReply.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.mealSchedule.deleteMany({});
  await prisma.mealPlan.deleteMany({});
  await prisma.holdApplication.deleteMany({});
  await prisma.leaveApplication.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.signature.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.agreementVersion.deleteMany({});
  await prisma.agreement.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.emergencyContact.deleteMany({});
  await prisma.fine.deleteMany({});
  await prisma.fineRule.deleteMany({});
  await prisma.propertyDocument.deleteMany({});
  await prisma.bedHold.deleteMany({});
  await prisma.bedHistory.deleteMany({});
  await prisma.roomTransferRequest.deleteMany({});
  await prisma.residentStatusHistory.deleteMany({});
  await prisma.resident.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.pG.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.ownerKYC.deleteMany({});
  await prisma.owner.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.sessionFamily.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.phoneOTP.deleteMany({});
  await prisma.otpToken.deleteMany({});
  await prisma.userDevice.deleteMany({});
  await prisma.securityAuditEvent.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.deviceHistory.deleteMany({});
  await prisma.revokedToken.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.rbacRole.deleteMany({});
  await prisma.user.deleteMany({});

  const saltRounds = 12;

  // ── 2. RBAC Roles & Permissions ──────────────────────────────────────────
  const godRole = await prisma.rbacRole.create({
    data: {
      name: Role.GOD,
      description: 'Platform Owner (GOD) with unrestricted access to all platform systems and global analytics.',
    },
  });

  await prisma.rbacRole.create({
    data: {
      name: Role.OWNER,
      description: 'PG Property Owner with property, resident, and financial management access.',
    },
  });

  await prisma.rbacRole.create({
    data: {
      name: Role.RESIDENT,
      description: 'Resident Tenant with access to self-service portal, payments, and agreements.',
    },
  });

  // ── 3. PLATFORM OWNER ("GOD") ────────────────────────────────────────────────
  const godPassHash = await bcrypt.hash('987456', saltRounds);
  const godUser = await prisma.user.create({
    data: {
      name: 'GOD',
      email: 'ayushman@globussoft.in',
      phone: '+919900000001',
      passwordHash: godPassHash,
      role: Role.GOD,
      is2FAEnabled: false,
      emailVerified: true,
      phoneVerified: true,
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      kycStatus: 'APPROVED',
    },
  });

  await prisma.admin.create({
    data: {
      name: 'GOD',
      email: 'ayushman@globussoft.in',
      passwordHash: godPassHash,
      roleId: godRole.id,
    },
  });
  console.log('   ✅ Platform Owner (GOD) initialized.');

  // ── 4. PG OWNER (Ayushman Saha) ───────────────────────────────────────────
  const ownerPassHash = await bcrypt.hash('123456', saltRounds);
  const ownerUser = await prisma.user.create({
    data: {
      name: 'Ayushman Saha',
      email: 'ayushmansaha917@gmail.com',
      phone: '+916297750585',
      passwordHash: ownerPassHash,
      role: Role.OWNER,
      is2FAEnabled: false,
      emailVerified: true,
      phoneVerified: true,
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      kycStatus: 'APPROVED',
      avatarUrl: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/avatars/ayushman_owner.webp',
    },
  });

  const owner = await prisma.owner.create({
    data: {
      userId: ownerUser.id,
      name: 'Ayushman Saha',
      email: 'ayushmansaha917@gmail.com',
      phone: '+916297750585',
      photo: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/avatars/ayushman_owner.webp',
      address: 'Suite 401, Commercial Hub, Koramangala 4th Block, Bengaluru, Karnataka 560034',
      aadhaarNumber: '0000-0000-0000',
      panNumber: 'ABCDE1234F',
      upiId: 'ayushman@okaxis',
      bankName: 'HDFC Bank Enterprise',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0001234',
      emergencyContact: '+919900000001',
      bio: 'Enterprise Coliving Operator managing premier accommodations in Bengaluru.',
    },
  });

  await prisma.ownerKYC.create({
    data: {
      ownerId: owner.id,
      aadhaarNumber: '0000-0000-0000',
      aadhaarDocUrl: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/kyc/aadhaar_placeholder.pdf',
      panNumber: 'ABCDE1234F',
      panDocUrl: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/kyc/pan_placeholder.pdf',
      verificationStatus: OwnerKYCStatus.VERIFIED,
      verifiedAt: new Date(),
    },
  });

  await prisma.business.create({
    data: {
      ownerId: owner.id,
      businessName: 'Ayushman Living Solutions Pvt Ltd',
      businessType: BusinessType.PVT_LIMITED,
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      businessAddress: 'No. 45, 80ft Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
      businessEmail: 'ayushmansaha917@gmail.com',
      businessPhone: '+916297750585',
    },
  });

  await prisma.subscription.create({
    data: {
      ownerId: owner.id,
      planType: SubscriptionPlanType.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      maxProperties: 5,
      maxResidents: 150,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('   ✅ PG Owner (Ayushman Saha) with full KYC & Business Profile initialized.');

  // ── 5. PG PROPERTY (RoomBae Aurora Residency) ─────────────────────────────
  const pg = await prisma.pG.create({
    data: {
      ownerId: owner.id,
      name: 'RoomBae Aurora Residency',
      slug: 'roombae-aurora-residency',
      logo: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/properties/aurora_logo.webp',
      galleryImages: [
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/properties/aurora_hero.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/rooms/aurora_room_101.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/rooms/aurora_room_201.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/rooms/aurora_washroom.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/amenities/aurora_mess.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/amenities/aurora_gym.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/amenities/aurora_study.webp',
        'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/amenities/aurora_rooftop.webp',
      ],
      description: 'Luxury co-living residency in Koramangala with ultra high-speed optical fiber WiFi, gourmet dining, gym, and 24/7 security.',
      amenities: ['WiFi', 'Laundry', 'CCTV', 'Power Backup', 'Lift', 'Mess', 'Security', 'Gym', 'Biometric Gate', 'Gaming Zone'],
      rules: ['No loud music after 10:30 PM', 'Visitors allowed in common areas till 8:00 PM', 'Biometric check-in mandatory'],
      rentStartingFrom: 14500,
      securityDeposit: 29000,
      latitude: 12.9352,
      longitude: 77.6245,
      address: 'No. 45, 80ft Road, 4th Block, Koramangala',
      city: 'Bengaluru',
      pincode: '560034',
      nearbyColleges: ['Christ University (1.5 km)', 'St. John’s Medical College (1.2 km)', 'Jyoti Nivas College (0.8 km)'],
      nearbyCompanies: ['Flipkart Embassy TechVillage', 'Wipro Sarjapur', 'Koramangala Tech Hub', 'Google RMZ Ecoworld'],
      nearbyMetro: ['Koramangala Metro Station (0.5 km)', 'Sony World Junction Bus Stop (0.3 km)'],
      capacity: 7,
      currentOccupancy: 1,
      availableBeds: 6,
      status: PGStatus.ACTIVE,
      buildingCount: 1,
      floorCount: 2,
      totalRoomsCount: 3,
      totalBedsCount: 7,
    },
  });

  await prisma.propertyDocument.create({
    data: {
      pgId: pg.id,
      documentType: 'TRADE_LICENSE',
      documentNumber: 'TL-BLR-2026-0981',
      fileUrl: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/documents/trade_license_aurora.pdf',
      isApproved: true,
    },
  });

  await prisma.fineRule.create({
    data: {
      pgId: pg.id,
      fineType: FineType.LATE_RENT,
      calculationType: FineCalculationType.FLAT,
      amount: 500,
      gracePeriodDays: 3,
      isActive: true,
    },
  });
  console.log('   ✅ PG Property (RoomBae Aurora Residency) created.');

  // ── 6. BUILDING, FLOORS, ROOMS & BEDS ─────────────────────────────────────
  const building = await prisma.building.create({
    data: {
      pgId: pg.id,
      name: 'Building A',
      floorsCount: 2,
    },
  });

  // Floor 1
  const floor1 = await prisma.floor.create({
    data: {
      buildingId: building.id,
      floorNumber: 1,
    },
  });

  const room101 = await prisma.room.create({
    data: {
      floorId: floor1.id,
      roomNumber: '101',
      roomType: RoomType.DOUBLE,
      acType: ACType.AC,
      washroomType: WashroomType.ATTACHED,
      rentAmount: 14500,
    },
  });

  const bed101A = await prisma.bed.create({
    data: {
      roomId: room101.id,
      bedNumber: '101-Bed A',
      status: BedStatus.OCCUPIED,
      isOccupied: true,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room101.id,
      bedNumber: '101-Bed B',
      status: BedStatus.AVAILABLE,
      isOccupied: false,
    },
  });

  // Floor 2
  const floor2 = await prisma.floor.create({
    data: {
      buildingId: building.id,
      floorNumber: 2,
    },
  });

  const room201 = await prisma.room.create({
    data: {
      floorId: floor2.id,
      roomNumber: '201',
      roomType: RoomType.DOUBLE,
      acType: ACType.AC,
      washroomType: WashroomType.ATTACHED,
      rentAmount: 15000,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room201.id,
      bedNumber: '201-Bed A',
      status: BedStatus.AVAILABLE,
      isOccupied: false,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room201.id,
      bedNumber: '201-Bed B',
      status: BedStatus.AVAILABLE,
      isOccupied: false,
    },
  });

  const room202 = await prisma.room.create({
    data: {
      floorId: floor2.id,
      roomNumber: '202',
      roomType: RoomType.TRIPLE,
      acType: ACType.AC,
      washroomType: WashroomType.ATTACHED,
      rentAmount: 12500,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room202.id,
      bedNumber: '202-Bed A',
      status: BedStatus.AVAILABLE,
      isOccupied: false,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room202.id,
      bedNumber: '202-Bed B',
      status: BedStatus.AVAILABLE,
      isOccupied: false,
    },
  });

  await prisma.bed.create({
    data: {
      roomId: room202.id,
      bedNumber: '202-Bed C',
      status: BedStatus.AVAILABLE,
      isOccupied: false,
    },
  });
  console.log('   ✅ Building A structure (Floors, Rooms 101/201/202, Beds) created.');

  // ── 7. RESIDENT (Ankur Saha) ──────────────────────────────────────────────
  const residentPassHash = await bcrypt.hash('654123', saltRounds);
  const residentUser = await prisma.user.create({
    data: {
      name: 'Ankur Saha',
      email: 'ankursaha985@gmail.com',
      phone: '+918653826643',
      residentCode: 'RES1001',
      passwordHash: residentPassHash,
      role: Role.RESIDENT,
      is2FAEnabled: false,
      emailVerified: true,
      phoneVerified: true,
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      kycStatus: 'APPROVED',
      avatarUrl: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/avatars/ankur_resident.webp',
    },
  });

  const resident = await prisma.resident.create({
    data: {
      userId: residentUser.id,
      pgId: pg.id,
      bedId: bed101A.id,
      name: 'Ankur Saha',
      gender: 'Male',
      age: 24,
      email: 'ankursaha985@gmail.com',
      phone: '+918653826643',
      bloodGroup: 'O+',
      foodPreference: FoodPreference.NON_VEG,
      status: ResidentStatus.ACTIVE,
      occupation: 'Software Engineer',
      company: 'Globussoft',
      permanentAddress: 'Flat 402, Green Valley Residency, Koramangala, Bengaluru, Karnataka',
      moveInDate: new Date(),
      rentDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
    },
  });

  await prisma.guardian.create({
    data: {
      residentId: resident.id,
      name: 'Subhash Saha',
      relation: 'Father',
      phone: '+919830012345',
      address: 'Flat 402, Green Valley Residency, Bengaluru',
    },
  });

  await prisma.emergencyContact.create({
    data: {
      residentId: resident.id,
      name: 'Ayushman Saha',
      relation: 'Brother / PG Operator',
      phone: '+916297750585',
    },
  });

  await prisma.document.create({
    data: {
      residentId: resident.id,
      documentType: 'AADHAAR',
      documentNumber: '0000-0000-0000',
      fileUrl: 'https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/documents/aadhaar_ankur.pdf',
      isVerified: true,
    },
  });
  console.log('   ✅ Resident (Ankur Saha) initialized in Room 101, Bed A.');

  // ── 8. DIGITAL RENTAL AGREEMENT ───────────────────────────────────────────
  const agreement = await prisma.agreement.create({
    data: {
      agreementNumber: 'AGR-AURORA-1001',
      residentId: resident.id,
      ownerId: owner.id,
      pgId: pg.id,
      roomNumber: '101',
      bedNumber: '101-Bed A',
      rentAmount: 14500,
      securityDeposit: 29000,
      maintenanceCharges: 500,
      electricityCharges: 'As per Sub-Meter Reading',
      wifiCharges: 'Complimentary High-Speed Optical WiFi',
      foodCharges: 'Included in Monthly Rent',
      noticePeriodDays: 30,
      refundPolicy: 'Security deposit refundable within 7 days post checkout deduction.',
      houseRules: [
        'No loud music after 10:30 PM',
        'Visitors allowed in common areas till 8:00 PM',
        'Biometric check-in mandatory',
      ],
      startDate: new Date(),
      endDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000), // 11 months
      status: AgreementStatus.COMPLETED,
      contractPdfUrl: 'https://roombae-documents.s3.amazonaws.com/agreements/AGR-AURORA-1001.pdf',
    },
  });

  await prisma.signature.create({
    data: {
      agreementId: agreement.id,
      signerType: 'RESIDENT',
      signerName: 'Ankur Saha',
      signatureDataSvg: '<svg viewBox="0 0 200 50"><path d="M10 30 Q 50 10, 90 30 T 170 30" stroke="blue" fill="none"/></svg>',
      ipAddress: '127.0.0.1',
      hashHmac: 'hmac_sha256_sig_ankur_saha_2026',
    },
  });
  console.log('   ✅ Digital Tenancy Agreement (AGR-AURORA-1001) registered.');

  // ── 9. BILLING INVOICE & RAZORPAY PAYMENT ─────────────────────────────────
  const payment = await prisma.payment.create({
    data: {
      residentId: resident.id,
      pgId: pg.id,
      invoiceNumber: 'INV-AURORA-1001',
      baseAmount: 14500,
      cgstAmount: 1305,
      sgstAmount: 1305,
      igstAmount: 0,
      totalAmount: 17110,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
      paidAt: new Date(),
      paymentMethod: 'UPI_ONLINE',
      status: PaymentStatus.PAID,
      razorpayOrderId: 'order_RB_AURORA_001',
      razorpayPaymentId: 'pay_rzp_ankur_2026_001',
      razorpaySignature: 'sig_rzp_verified_hmac_2026',
    },
  });

  await prisma.invoice.create({
    data: {
      paymentId: payment.id,
      residentId: resident.id,
      pgId: pg.id,
      invoiceNumber: payment.invoiceNumber,
      pdfUrl: 'https://roombae-documents.s3.amazonaws.com/invoices/INV-AURORA-1001.pdf',
    },
  });
  console.log('   ✅ Billing Invoice & Payment Transaction (INV-AURORA-1001) registered.');

  // ── 10. MAINTENANCE COMPLAINT TICKET ──────────────────────────────────────
  await prisma.complaint.create({
    data: {
      ticketCode: 'TICK-AURORA-101',
      residentId: resident.id,
      pgId: pg.id,
      category: 'WiFi',
      title: 'High-Speed WiFi Access Point Configuration in Room 101',
      description: 'Request for secondary 5GHz router band setup for low latency remote development workstation.',
      priority: Priority.MEDIUM,
      status: TicketStatus.RESOLVED,
      assignedStaff: 'Ramesh Network Engineer',
    },
  });

  // ── 11. MESS & MEAL SCHEDULE ──────────────────────────────────────────────
  await prisma.mealSchedule.create({
    data: {
      pgId: pg.id,
      dayOfWeek: 'MONDAY',
      breakfastMenu: 'Masala Dosa, Sambar, Coconut Chutney, Tea/Coffee',
      lunchMenu: 'Steamed Rice, Dal Tadka, Paneer Butter Masala, Phulka, Curd',
      snacksMenu: 'Chai, Veg Pakora',
      dinnerMenu: 'Jeera Rice, Dal Fry, Seasonal Mixed Vegetables, Chapati, Gulab Jamun',
      calories: 2200,
    },
  });

  console.log('\n🎉 ========================================================================');
  console.log('   ROOMBAE AUTHORITATIVE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('   1. Super Admin ("GOD"): ayushman@globussoft.in (Pass: 987456, OTP: 123456 / 000000)');
  console.log('   2. PG Owner (Ayushman Saha): ayushmansaha917@gmail.com (Pass: 123456, Phone: +916297750585)');
  console.log('   3. Resident (Ankur Saha): ankursaha985@gmail.com (Pass: 654123, Phone: +918653826643)');
  console.log('   Property: RoomBae Aurora Residency (Koramangala, Bengaluru)');
  console.log('========================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
