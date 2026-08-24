import {
  PrismaClient,
  Role,
  SubscriptionTier,
  SubscriptionStatus,
  PGStatus,
  PGGenderType,
  RoomType,
  BedStatus,
  BookingStatus,
  AgreementStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentPurpose,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  LegalDocType,
  Gender,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RoomBae Authoritative Database Seeding...');

  // ── 1. Clean Database Collections ──────────────────────────────────────────
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.complaintMessage.deleteMany({});
  await prisma.complaintStatusHistory.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.digitalSignature.deleteMany({});
  await prisma.agreement.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.paymentWebhook.deleteMany({});
  await prisma.fine.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.rentSchedule.deleteMany({});
  await prisma.roomChangeRequest.deleteMany({});
  await prisma.roomAllocation.deleteMany({});
  await prisma.bookingStatusHistory.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.mealPlan.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.pGAmenity.deleteMany({});
  await prisma.amenity.deleteMany({});
  await prisma.pGImage.deleteMany({});
  await prisma.pGLocation.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.revenueEntry.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.pG.deleteMany({});
  await prisma.subscriptionPayment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.legalAcceptance.deleteMany({});
  await prisma.legalDocument.deleteMany({});
  await prisma.oTP.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.pDFDocument.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('RoomBae@2026!', 10);

  // ── 2. Seed Subscription Plans (Database-Driven SRS Plans) ──────────────────
  console.log('📦 Seeding Subscription Plans...');
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic Plan',
      tier: SubscriptionTier.BASIC,
      monthlyPrice: 1499,
      pgLimit: 4,
      description: 'Ideal for independent PG operators managing up to 4 properties.',
      features: ['Up to 4 PGs', 'Room & Bed Management', 'Basic Booking Kanban', 'Standard Invoicing', 'Email Support'],
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Professional Plan',
      tier: SubscriptionTier.PROFESSIONAL,
      monthlyPrice: 2499,
      pgLimit: 10,
      description: 'Built for scaling PG owners managing up to 10 properties with real-time operations.',
      features: ['Up to 10 PGs', 'Real-Time Kanban', 'Automated GST Billing & Fines', 'Digital Agreements & Signatures', 'Priority Email & SMS Support'],
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Enterprise Plan',
      tier: SubscriptionTier.ENTERPRISE,
      monthlyPrice: 4999,
      pgLimit: 20,
      description: 'Full multi-property enterprise automation for large coliving networks.',
      features: ['Up to 20 PGs', 'Multi-Floor Operations', 'Full Financial & Occupancy Analytics', 'Custom Legal Terms', 'Dedicated Account Manager'],
    },
  });

  // ── 3. Seed Standard Legal Documents ────────────────────────────────────────
  console.log('📜 Seeding Legal Documents...');
  const termsDoc = await prisma.legalDocument.create({
    data: {
      type: LegalDocType.TERMS_AND_CONDITIONS,
      title: 'RoomBae Platform Terms and Conditions',
      version: '1.0.0',
      content: 'Standard terms of service governing PG discovery, booking, payments, and platform usage.',
      isActive: true,
    },
  });

  const privacyDoc = await prisma.legalDocument.create({
    data: {
      type: LegalDocType.PRIVACY_POLICY,
      title: 'RoomBae Privacy and Data Policy',
      version: '1.0.0',
      content: 'Privacy policy outlining personal information handling, document security, and device data protection.',
      isActive: true,
    },
  });

  const bookingPolicyDoc = await prisma.legalDocument.create({
    data: {
      type: LegalDocType.BOOKING_POLICY,
      title: 'RoomBae Booking and Cancellation Policy',
      version: '1.0.0',
      content: 'Rules governing room reservation, advance token payments, security deposit, and refund timelines.',
      isActive: true,
    },
  });

  // ── 4. Seed Standard Amenities ──────────────────────────────────────────────
  console.log('✨ Seeding Amenities Catalog...');
  const amenitiesList = [
    { name: 'High-Speed Wi-Fi', category: 'ROOM', icon: 'Wifi', isDefault: true },
    { name: 'Air Conditioning', category: 'ROOM', icon: 'AirVent', isDefault: true },
    { name: 'Daily Housekeeping', category: 'PG', icon: 'Sparkles', isDefault: true },
    { name: '3-Times Nutritious Meals', category: 'FOOD', icon: 'Utensils', isDefault: true },
    { name: 'Attached Bathroom', category: 'ROOM', icon: 'Bath', isDefault: true },
    { name: 'Power Backup (24x7)', category: 'PG', icon: 'Zap', isDefault: true },
    { name: 'Automatic Washing Machine', category: 'PG', icon: 'Shirt', isDefault: true },
    { name: 'CCTV Surveillance & Security Guard', category: 'SECURITY', icon: 'ShieldCheck', isDefault: true },
    { name: 'Geyser / 24x7 Hot Water', category: 'ROOM', icon: 'Flame', isDefault: true },
    { name: 'Two-Wheeler & Four-Wheeler Parking', category: 'PG', icon: 'Car', isDefault: true },
  ];

  const createdAmenities: Record<string, string> = {};
  for (const item of amenitiesList) {
    const created = await prisma.amenity.create({ data: item });
    createdAmenities[item.name] = created.id;
  }

  // ── 5. Seed Core Platform Users ─────────────────────────────────────────────
  console.log('👥 Seeding Core System Users (Admin, Owner, Resident)...');

  // 5.1 Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@roombae.com',
      phone: '+919999000001',
      username: 'roombae_admin',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      profile: {
        create: {
          firstName: 'RoomBae',
          lastName: 'SuperAdmin',
          gender: Gender.OTHER,
          occupation: 'Platform Administrator',
        },
      },
    },
  });

  // 5.2 PG Owner User
  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@roombae.com',
      phone: '+919999000002',
      username: 'ayushman_owner',
      passwordHash,
      role: Role.PG_OWNER,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      currentAddress: 'Sector 5, HSR Layout, Bengaluru, Karnataka, 560102',
      profile: {
        create: {
          firstName: 'Ayushman',
          lastName: 'Saha',
          gender: Gender.MALE,
          occupation: 'PG Owner & Operator',
          emergencyContactName: 'Ankur Saha',
          emergencyContactPhone: '+919999000003',
          emergencyContactRelation: 'Brother',
        },
      },
    },
  });

  // 5.3 Resident User
  const residentUser = await prisma.user.create({
    data: {
      email: 'resident@roombae.com',
      phone: '+919999000004',
      username: 'ankur_resident',
      passwordHash,
      role: Role.RESIDENT,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      currentAddress: 'Indiranagar 100ft Road, Bengaluru, Karnataka, 560038',
      profile: {
        create: {
          firstName: 'Ankur',
          lastName: 'Saha',
          gender: Gender.MALE,
          occupation: 'Senior Software Engineer',
          companyOrCollege: 'Tech Corp India',
          emergencyContactName: 'Ayushman Saha',
          emergencyContactPhone: '+919999000002',
          emergencyContactRelation: 'Brother',
          bloodGroup: 'O+',
        },
      },
    },
  });

  // ── 6. Seed Legal Acceptances ───────────────────────────────────────────────
  for (const user of [adminUser, ownerUser, residentUser]) {
    await prisma.legalAcceptance.create({
      data: {
        userId: user.id,
        documentId: termsDoc.id,
        documentType: LegalDocType.TERMS_AND_CONDITIONS,
        documentVersion: termsDoc.version,
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Engine Mozilla/5.0',
      },
    });
    await prisma.legalAcceptance.create({
      data: {
        userId: user.id,
        documentId: privacyDoc.id,
        documentType: LegalDocType.PRIVACY_POLICY,
        documentVersion: privacyDoc.version,
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Engine Mozilla/5.0',
      },
    });
  }

  // ── 7. Seed Owner Subscription ──────────────────────────────────────────────
  console.log('💳 Seeding Owner Subscription...');
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

  const ownerSubscription = await prisma.subscription.create({
    data: {
      ownerId: ownerUser.id,
      planId: proPlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: subscriptionEndDate,
      autoRenew: true,
    },
  });

  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: ownerSubscription.id,
      ownerId: ownerUser.id,
      amount: proPlan.monthlyPrice,
      currency: 'INR',
      status: PaymentStatus.VERIFIED,
      paidAt: new Date(),
    },
  });

  // ── 8. Seed PG Properties, Floors, Rooms & Beds ─────────────────────────────
  console.log('🏢 Seeding PG Properties and Bed Inventory...');

  // PG 1: Prime Co-Living HSR
  const pg1 = await prisma.pG.create({
    data: {
      ownerId: ownerUser.id,
      name: 'RoomBae Sanctuary — HSR Premium Co-Living',
      description: 'Luxury co-living residency located in the heart of HSR Layout with high-speed fiber internet, chef-prepared meals, daily housekeeping, and full power backup.',
      genderType: PGGenderType.CO_LIVING,
      rules: [
        'Gate closes at 11:30 PM. Late entry requires prior digital pass.',
        'Visitors allowed in lounge area until 8:00 PM.',
        'No smoking inside rooms.',
        'Quiet hours from 11:00 PM to 6:00 AM.',
      ],
      noticePeriodDays: 30,
      gateClosingTime: '11:30 PM',
      status: PGStatus.APPROVED,
      basePrice: 12500,
      depositMonths: 1,
      contactPhone: '+919999000002',
      contactEmail: 'owner@roombae.com',
      location: {
        create: {
          address: 'Plot 412, 14th Main Rd, Sector 7, HSR Layout',
          locality: 'HSR Layout',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560102',
          country: 'India',
          latitude: 12.9116,
          longitude: 77.6389,
          googleMapsUrl: 'https://maps.google.com/?q=12.9116,77.6389',
        },
      },
      images: {
        create: [
          {
            publicId: 'roombae/pg1/hero',
            secureUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
            caption: 'Modern Living Lounge',
            isFeatured: true,
            order: 0,
          },
          {
            publicId: 'roombae/pg1/room_double',
            secureUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
            caption: 'Double Sharing AC Room',
            order: 1,
          },
        ],
      },
    },
  });

  // Link Amenities to PG 1
  for (const amenityId of Object.values(createdAmenities)) {
    await prisma.pGAmenity.create({
      data: {
        pgId: pg1.id,
        amenityId,
        isAvailable: true,
      },
    });
  }

  // Meal Plan for PG 1
  await prisma.mealPlan.create({
    data: {
      pgId: pg1.id,
      name: 'All-Inclusive 3-Meal Plan',
      description: 'Fresh home-style breakfast, lunch, and dinner with South & North Indian options.',
      isIncludedInRent: true,
      monthlyPrice: 0,
      breakfastTime: '7:30 AM – 9:30 AM',
      lunchTime: '12:30 PM – 2:30 PM',
      dinnerTime: '7:30 PM – 10:00 PM',
      snacksTime: '5:00 PM – 6:00 PM',
      isVegOnly: false,
    },
  });

  // Floor 1
  const floor1 = await prisma.floor.create({
    data: {
      pgId: pg1.id,
      floorNumber: 1,
      floorName: 'First Floor — Executive Suites',
      wifiSsid: 'RoomBae_HSR_F1',
      wifiPassword: 'RoomBaeSecure@2026',
    },
  });

  // Room 101: Double Sharing
  const room101 = await prisma.room.create({
    data: {
      pgId: pg1.id,
      floorId: floor1.id,
      roomNumber: '101',
      roomType: RoomType.DOUBLE,
      allowedGender: Gender.MALE,
      baseRent: 12500,
      depositAmount: 12500,
      isAc: true,
      hasAttachedBathroom: true,
      status: BedStatus.AVAILABLE,
    },
  });

  // Beds in 101
  const bed101A = await prisma.bed.create({
    data: {
      pgId: pg1.id,
      roomId: room101.id,
      bedNumber: '101-A',
      status: BedStatus.OCCUPIED,
      currentResidentId: residentUser.id,
      baseRent: 12500,
      depositAmount: 12500,
    },
  });

  const bed101B = await prisma.bed.create({
    data: {
      pgId: pg1.id,
      roomId: room101.id,
      bedNumber: '101-B',
      status: BedStatus.AVAILABLE,
      baseRent: 12500,
      depositAmount: 12500,
    },
  });

  // Room 102: Single Private Suite
  const room102 = await prisma.room.create({
    data: {
      pgId: pg1.id,
      floorId: floor1.id,
      roomNumber: '102',
      roomType: RoomType.SINGLE,
      allowedGender: Gender.MALE,
      baseRent: 21000,
      depositAmount: 21000,
      isAc: true,
      hasAttachedBathroom: true,
      status: BedStatus.AVAILABLE,
    },
  });

  await prisma.bed.create({
    data: {
      pgId: pg1.id,
      roomId: room102.id,
      bedNumber: '102-A',
      status: BedStatus.AVAILABLE,
      baseRent: 21000,
      depositAmount: 21000,
    },
  });

  // ── 9. Seed Active Booking, Allocation, Agreement & Invoice for Resident ───
  console.log('📑 Seeding Active Booking, Allocation, and Billing Records...');

  const activeBooking = await prisma.booking.create({
    data: {
      residentId: residentUser.id,
      pgId: pg1.id,
      roomId: room101.id,
      bedId: bed101A.id,
      roomType: RoomType.DOUBLE,
      preferredMoveInDate: new Date(),
      expectedStayMonths: 6,
      status: BookingStatus.CONFIRMED,
      rentAmount: 12500,
      depositAmount: 12500,
      advanceAmountPaid: 5000,
    },
  });

  const activeAllocation = await prisma.roomAllocation.create({
    data: {
      bookingId: activeBooking.id,
      residentId: residentUser.id,
      pgId: pg1.id,
      floorId: floor1.id,
      roomId: room101.id,
      bedId: bed101A.id,
      rent: 12500,
      deposit: 12500,
      checkInDate: new Date(),
      isActive: true,
      allocatedById: ownerUser.id,
    },
  });

  const agreementEndDate = new Date();
  agreementEndDate.setMonth(agreementEndDate.getMonth() + 11);

  await prisma.agreement.create({
    data: {
      bookingId: activeBooking.id,
      residentId: residentUser.id,
      ownerId: ownerUser.id,
      pgId: pg1.id,
      allocationId: activeAllocation.id,
      agreementNumber: 'RB-AGR-2026-0001',
      status: AgreementStatus.COMPLETED,
      rentAmount: 12500,
      depositAmount: 12500,
      lockInPeriodMonths: 3,
      noticePeriodDays: 30,
      startDate: new Date(),
      endDate: agreementEndDate,
    },
  });

  // Current Month Rent Invoice
  const dueDate = new Date();
  dueDate.setDate(5); // 5th of current month
  const subtotal = 12500;
  const gstAmount = subtotal * 0.18; // 18% GST = 2250
  const totalAmount = subtotal + gstAmount; // 14750

  const invoice = await prisma.invoice.create({
    data: {
      residentId: residentUser.id,
      pgId: pg1.id,
      bookingId: activeBooking.id,
      invoiceNumber: 'INV-2026-0089',
      billingMonth: new Date().getMonth() + 1,
      billingYear: new Date().getFullYear(),
      issueDate: new Date(),
      dueDate,
      gracePeriodDays: 5,
      subtotal,
      gstPercentage: 18.0,
      gstAmount,
      fineAmount: 0,
      totalAmount,
      amountPaid: totalAmount,
      balanceDue: 0,
      status: InvoiceStatus.PAID,
      items: {
        create: [
          {
            description: 'Monthly Room Rent (Room 101, Bed 101-A)',
            itemType: 'RENT',
            unitPrice: 12500,
            quantity: 1,
            total: 12500,
          },
          {
            description: 'Applicable GST @ 18% (SAC Code 9963)',
            itemType: 'OTHER',
            unitPrice: 2250,
            quantity: 1,
            total: 2250,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      bookingId: activeBooking.id,
      payerId: residentUser.id,
      payeeId: ownerUser.id,
      pgId: pg1.id,
      amount: totalAmount,
      currency: 'INR',
      paymentMethod: PaymentMethod.RAZORPAY,
      purpose: PaymentPurpose.MONTHLY_RENT,
      status: PaymentStatus.VERIFIED,
      razorpayPaymentId: 'pay_demo_verified_12345',
      receiptNumber: 'REC-2026-0089',
    },
  });

  // Rent Schedule for future auto-invoicing
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  nextBilling.setDate(1);

  await prisma.rentSchedule.create({
    data: {
      residentId: residentUser.id,
      pgId: pg1.id,
      roomId: room101.id,
      bedId: bed101A.id,
      monthlyRent: 12500,
      billingDayOfMonth: 1,
      dueDayOfMonth: 5,
      graceDays: 5,
      lateFinePerDay: 50,
      maxFineAmount: 1000,
      isActive: true,
      nextBillingDate: nextBilling,
    },
  });

  // Sample Complaint
  await prisma.complaint.create({
    data: {
      residentId: residentUser.id,
      pgId: pg1.id,
      roomId: room101.id,
      category: ComplaintCategory.WIFI,
      title: 'Intermittent Wi-Fi signal in Room 101 corner',
      description: 'Wi-Fi speeds drop during peak evening hours (8 PM - 10 PM) in the corner of room 101.',
      priority: ComplaintPriority.MEDIUM,
      status: ComplaintStatus.IN_PROGRESS,
      messages: {
        create: [
          {
            senderId: residentUser.id,
            senderRole: Role.RESIDENT,
            message: 'Hello, please check if the mesh repeater on Floor 1 needs a reboot.',
          },
          {
            senderId: ownerUser.id,
            senderRole: Role.PG_OWNER,
            message: 'Acknowledged! The technician is scheduled to install an additional access point today at 4 PM.',
          },
        ],
      },
    },
  });

  console.log('✅ RoomBae Database Seeding Completed Successfully!');
  console.log('──────────────────────────────────────────────────');
  console.log('👑 Admin:    admin@roombae.com    | RoomBae@2026!');
  console.log('🏠 PG Owner: owner@roombae.com    | RoomBae@2026!');
  console.log('👤 Resident: resident@roombae.com | RoomBae@2026!');
  console.log('──────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
