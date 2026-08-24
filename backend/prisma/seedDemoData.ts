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
  SignatureType,
  InvoiceStatus,
  InvoiceItemType,
  PaymentStatus,
  PaymentMethod,
  PaymentPurpose,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  NotificationType,
  NotificationChannel,
  DocumentType,
  VerificationStatus,
  LegalDocType,
  Gender,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================================
// PRODUCTION SAFETY AUTHORIZATION GATE
// ============================================================================
function verifySafetyAuthorization() {
  const isAuthorized =
    process.env.SEED_DEMO_RESET === 'true' ||
    process.argv.includes('--force') ||
    process.argv.includes('-f');

  console.log('\n============================================================');
  console.log('🏛️  ROOMBAE DEMO DATABASE RESET & SEEDING ENGINE');
  console.log('============================================================');
  console.log(`Environment       : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database Provider : MongoDB (Prisma Client v6)`);
  console.log(`Application URL   : ${process.env.APP_URL || 'http://localhost:5000'}`);
  console.log(`Target Script     : seedDemoData.ts`);
  console.log('------------------------------------------------------------');

  if (!isAuthorized) {
    console.error('\x1b[31m[ABORTED]\x1b[0m DESTRUCTIVE SEEDING REJECTED!');
    console.error('This command will delete and reinitialize application data.');
    console.error('To authorize execution, pass SEED_DEMO_RESET=true or --force:');
    console.error('\n  \x1b[33mSEED_DEMO_RESET=true npm run db:seed:demo\x1b[0m\n');
    console.log('============================================================\n');
    process.exit(1);
  }

  console.log('\x1b[33m⚠️  WARNING: EXPLICIT DESTRUCTIVE RESET AUTHORIZED.\x1b[0m');
  console.log('Existing application records will be purged and re-seeded.');
  console.log('============================================================\n');
}

// Helper: Deterministic Date Generator for the previous 12 months
function getHistoricalDate(monthsAgo: number, dayOfMonth: number = 5): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsAgo;
  return new Date(year, month, dayOfMonth, 10, 0, 0);
}

async function main() {
  verifySafetyAuthorization();

  const startTime = Date.now();

  // ==========================================================================
  // 1. PURGE APPLICATION COLLECTIONS (DEPENDENCY-SAFE ORDER)
  // ==========================================================================
  console.log('🧹 [1/7] Purging existing application collections in dependency-safe order...');

  const deleteStats: Record<string, number> = {};

  async function safeDelete(name: string, deleteFn: () => Promise<{ count: number }>) {
    const res = await deleteFn();
    deleteStats[name] = res.count;
  }

  await safeDelete('AuditLog', () => prisma.auditLog.deleteMany({}));
  await safeDelete('PDFDocument', () => prisma.pDFDocument.deleteMany({}));
  await safeDelete('Document', () => prisma.document.deleteMany({}));
  await safeDelete('Notification', () => prisma.notification.deleteMany({}));
  await safeDelete('NotificationPreference', () => prisma.notificationPreference.deleteMany({}));
  await safeDelete('ComplaintMessage', () => prisma.complaintMessage.deleteMany({}));
  await safeDelete('ComplaintStatusHistory', () => prisma.complaintStatusHistory.deleteMany({}));
  await safeDelete('Complaint', () => prisma.complaint.deleteMany({}));
  await safeDelete('Review', () => prisma.review.deleteMany({}));
  await safeDelete('Expense', () => prisma.expense.deleteMany({}));
  await safeDelete('RevenueEntry', () => prisma.revenueEntry.deleteMany({}));
  await safeDelete('Refund', () => prisma.refund.deleteMany({}));
  await safeDelete('Fine', () => prisma.fine.deleteMany({}));
  await safeDelete('PaymentWebhook', () => prisma.paymentWebhook.deleteMany({}));
  await safeDelete('Payment', () => prisma.payment.deleteMany({}));
  await safeDelete('InvoiceItem', () => prisma.invoiceItem.deleteMany({}));
  await safeDelete('Invoice', () => prisma.invoice.deleteMany({}));
  await safeDelete('RentSchedule', () => prisma.rentSchedule.deleteMany({}));
  await safeDelete('DigitalSignature', () => prisma.digitalSignature.deleteMany({}));
  await safeDelete('Agreement', () => prisma.agreement.deleteMany({}));
  await safeDelete('RoomChangeRequest', () => prisma.roomChangeRequest.deleteMany({}));
  await safeDelete('RoomAllocation', () => prisma.roomAllocation.deleteMany({}));
  await safeDelete('BookingStatusHistory', () => prisma.bookingStatusHistory.deleteMany({}));
  await safeDelete('Booking', () => prisma.booking.deleteMany({}));
  await safeDelete('MealPlan', () => prisma.mealPlan.deleteMany({}));
  await safeDelete('Bed', () => prisma.bed.deleteMany({}));
  await safeDelete('Room', () => prisma.room.deleteMany({}));
  await safeDelete('Floor', () => prisma.floor.deleteMany({}));
  await safeDelete('PGAmenity', () => prisma.pGAmenity.deleteMany({}));
  await safeDelete('Amenity', () => prisma.amenity.deleteMany({}));
  await safeDelete('PGImage', () => prisma.pGImage.deleteMany({}));
  await safeDelete('PGLocation', () => prisma.pGLocation.deleteMany({}));
  await safeDelete('PG', () => prisma.pG.deleteMany({}));
  await safeDelete('SubscriptionPayment', () => prisma.subscriptionPayment.deleteMany({}));
  await safeDelete('Subscription', () => prisma.subscription.deleteMany({}));
  await safeDelete('SubscriptionPlan', () => prisma.subscriptionPlan.deleteMany({}));
  await safeDelete('LegalAcceptance', () => prisma.legalAcceptance.deleteMany({}));
  await safeDelete('LegalDocument', () => prisma.legalDocument.deleteMany({}));
  await safeDelete('OTP', () => prisma.oTP.deleteMany({}));
  await safeDelete('Device', () => prisma.device.deleteMany({}));
  await safeDelete('Session', () => prisma.session.deleteMany({}));
  await safeDelete('UserProfile', () => prisma.userProfile.deleteMany({}));
  await safeDelete('AuthIdentity', () => prisma.authIdentity.deleteMany({}));
  await safeDelete('User', () => prisma.user.deleteMany({}));

  const totalPurged = Object.values(deleteStats).reduce((a, b) => a + b, 0);
  console.log(`   ✅ Purged ${totalPurged} stale records across 43 collections.\n`);

  // ==========================================================================
  // 2. SEED SYSTEM FOUNDATIONS (PLANS, LEGAL DOCS, AMENITIES)
  // ==========================================================================
  console.log('📦 [2/7] Seeding System Foundations (Subscription Plans, Legal Documents, Amenities)...');

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
      description: 'For large coliving enterprises requiring multi-property analytics and custom branding.',
      features: ['Up to 20 PGs', 'Multi-property P&L Analytics', 'Automated Razorpay Subscriptions', '24/7 Dedicated Account Manager'],
    },
  });

  // Legal Documents
  const termsDoc = await prisma.legalDocument.create({
    data: {
      type: LegalDocType.TERMS_AND_CONDITIONS,
      title: 'RoomBae Master Terms of Service',
      version: 'v1.0',
      content: 'Authoritative RoomBae Platform Terms and Conditions governing PG operators and resident tenancies.',
    },
  });

  const privacyDoc = await prisma.legalDocument.create({
    data: {
      type: LegalDocType.PRIVACY_POLICY,
      title: 'RoomBae Privacy & Data Protection Policy',
      version: 'v1.0',
      content: 'Data privacy, security standards, and cryptographic device identifier protocols.',
    },
  });

  // Standard Amenities
  const amenityDefs = [
    { name: 'High-Speed Fiber WiFi (500 Mbps)', category: 'PG', icon: 'wifi', isDefault: true },
    { name: '24/7 Power Backup (DG Generator)', category: 'PG', icon: 'zap', isDefault: true },
    { name: 'Daily Room & Washroom Housekeeping', category: 'PG', icon: 'sparkles', isDefault: true },
    { name: 'Gourmet 3-Meal Mess (North & South Indian)', category: 'FOOD', icon: 'utensils', isDefault: true },
    { name: 'Biometric Smart Gate Access', category: 'SECURITY', icon: 'fingerprint', isDefault: true },
    { name: 'Air Conditioning (Inverter AC)', category: 'ROOM', icon: 'snowflake', isDefault: true },
    { name: 'Attached Western Washroom with Geyser', category: 'ROOM', icon: 'shower', isDefault: true },
    { name: 'Fully Automatic Washing Machines', category: 'PG', icon: 'washing-machine', isDefault: true },
    { name: 'Commercial RO Water Purifier & Cooler', category: 'FOOD', icon: 'droplet', isDefault: true },
    { name: '24/7 High-Definition CCTV Surveillance', category: 'SECURITY', icon: 'video', isDefault: true },
    { name: 'Dedicated Fitness Gym & Workout Area', category: 'PG', icon: 'dumbbell', isDefault: false },
    { name: 'Acoustic Study Lounge & Coworking Pods', category: 'PG', icon: 'book-open', isDefault: false },
  ];

  const seededAmenities: Record<string, string> = {};
  for (const a of amenityDefs) {
    const created = await prisma.amenity.create({ data: a });
    seededAmenities[a.name] = created.id;
  }

  console.log('   ✅ System foundations initialized.');

  // ==========================================================================
  // 3. SEED CORE ACCOUNTS (ADMIN, AYUSHMAN SAHA, ANKUR SAHA)
  // ==========================================================================
  console.log('👤 [3/7] Seeding Core Authoritative Accounts (Admin, PG Owner, Resident)...');

  // Password Hashes using standard RoomBae bcrypt (10 rounds)
  const adminPasswordHash = await bcrypt.hash('GOD@34$%65', 10);
  const ownerPasswordHash = await bcrypt.hash('Ayush@#123', 10);
  const residentPasswordHash = await bcrypt.hash('Ankur@#123', 10);
  const commonResidentHash = await bcrypt.hash('Resident@2026!', 10);

  // ── A. Master Administrator ("GOD") ──
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@roombae.com',
      username: 'god@3456',
      phone: '+919900000001',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      isProfileComplete: true,
      currentAddress: 'RoomBae HQ, Indiranagar, Bengaluru, 560038',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      profile: {
        create: {
          firstName: 'Platform',
          lastName: 'Administrator',
          gender: Gender.MALE,
          occupation: 'System Architect',
          companyOrCollege: 'RoomBae Core Engineering',
        },
      },
      devices: {
        create: {
          visitorId: 'vis_admin_primary_01',
          deviceLabel: 'Admin Secured Workstation',
          browser: 'Chrome 128',
          os: 'Windows 11',
          isPrimary: true,
        },
      },
      legalAcceptances: {
        create: [
          { documentId: termsDoc.id, documentType: LegalDocType.TERMS_AND_CONDITIONS, documentVersion: 'v1.0' },
          { documentId: privacyDoc.id, documentType: LegalDocType.PRIVACY_POLICY, documentVersion: 'v1.0' },
        ],
      },
    },
  });

  // ── B. Primary PG Owner (Ayushman Saha) ──
  const ownerUser = await prisma.user.create({
    data: {
      email: '33200122040@tib.edu.in',
      username: 'ayush321',
      phone: '6297750585',
      passwordHash: ownerPasswordHash,
      role: Role.PG_OWNER,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      isProfileComplete: true,
      currentAddress: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      profile: {
        create: {
          firstName: 'Ayushman',
          lastName: 'Saha',
          gender: Gender.MALE,
          dateOfBirth: new Date('1996-08-20'),
          occupation: 'PG Entrepreneur & Software Architect',
          companyOrCollege: 'Ayushman Living Solutions Pvt Ltd',
          emergencyContactName: 'Subhash Saha',
          emergencyContactPhone: '+919830012345',
          emergencyContactRelation: 'Father',
          bloodGroup: 'B+',
          idProofType: DocumentType.PAN_CARD,
          idProofNumber: 'ABCDE1234F',
          idProofUrl: 'https://images.unsplash.com/photo-synthetic-demo-pan.jpg',
        },
      },
      devices: {
        create: {
          visitorId: 'vis_owner_primary_01',
          deviceLabel: 'Ayushman MacBook Pro',
          browser: 'Chrome 128',
          os: 'macOS Sonoma',
          isPrimary: true,
        },
      },
      legalAcceptances: {
        create: [
          { documentId: termsDoc.id, documentType: LegalDocType.TERMS_AND_CONDITIONS, documentVersion: 'v1.0' },
          { documentId: privacyDoc.id, documentType: LegalDocType.PRIVACY_POLICY, documentVersion: 'v1.0' },
        ],
      },
    },
  });

  // Owner KYC Synthetic Documents
  const kycDocs = [
    { type: DocumentType.PAN_CARD, number: 'ABCDE1234F', url: 'https://roombae-documents.s3.amazonaws.com/demo/owner-pan.pdf' },
    { type: DocumentType.AADHAAR_FRONT, number: 'XXXX-XXXX-9876', url: 'https://roombae-documents.s3.amazonaws.com/demo/owner-aadhaar-front.pdf' },
    { type: DocumentType.PROPERTY_DEED, number: 'DEED-BLR-2024-88', url: 'https://roombae-documents.s3.amazonaws.com/demo/property-deed.pdf' },
    { type: DocumentType.RENT_AGREEMENT, number: 'COMM-LEASE-2024', url: 'https://roombae-documents.s3.amazonaws.com/demo/master-lease.pdf' },
  ];

  for (const doc of kycDocs) {
    await prisma.document.create({
      data: {
        userId: ownerUser.id,
        documentType: doc.type,
        documentNumber: doc.number,
        fileUrl: doc.url,
        status: VerificationStatus.VERIFIED,
        verifiedById: adminUser.id,
        verifiedAt: getHistoricalDate(12, 1),
      },
    });
  }

  // Active Professional Subscription for Ayushman
  const ownerSubscription = await prisma.subscription.create({
    data: {
      ownerId: ownerUser.id,
      planId: proPlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: getHistoricalDate(0, 1),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      razorpaySubscriptionId: 'sub_RB_AYUSHMAN_PRO_2026',
    },
  });

  // 12 Months Historical Subscription Payments
  for (let m = 11; m >= 0; m--) {
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: ownerSubscription.id,
        ownerId: ownerUser.id,
        amount: 2499,
        currency: 'INR',
        status: PaymentStatus.VERIFIED,
        razorpayOrderId: `order_SUB_PRO_${12 - m}`,
        razorpayPaymentId: `pay_SUB_PRO_${12 - m}_OK`,
        paidAt: getHistoricalDate(m, 1),
        createdAt: getHistoricalDate(m, 1),
      },
    });
  }

  // ── C. Primary Resident (Ankur Saha) ──
  const ankurUser = await prisma.user.create({
    data: {
      email: 'ankursaha985@gmail.com',
      username: 'ankur547',
      phone: '8653826643',
      passwordHash: residentPasswordHash,
      role: Role.RESIDENT,
      isActive: true,
      isSuspended: false,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      isProfileComplete: true,
      currentAddress: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      profile: {
        create: {
          firstName: 'Ankur',
          lastName: 'Saha',
          gender: Gender.MALE,
          dateOfBirth: new Date('1998-05-14'),
          occupation: 'Software Engineer',
          companyOrCollege: 'Globussoft Technologies',
          emergencyContactName: 'Ayushman Saha',
          emergencyContactPhone: '+916297750585',
          emergencyContactRelation: 'Brother',
          bloodGroup: 'O+',
          idProofType: DocumentType.AADHAAR_FRONT,
          idProofNumber: 'XXXX-XXXX-1234',
          idProofUrl: 'https://images.unsplash.com/photo-synthetic-demo-aadhaar.jpg',
        },
      },
      devices: {
        create: {
          visitorId: 'vis_ankur_primary_01',
          deviceLabel: 'Ankur iPhone 15 Pro',
          browser: 'Mobile Safari',
          os: 'iOS 18',
          isPrimary: true,
        },
      },
      legalAcceptances: {
        create: [
          { documentId: termsDoc.id, documentType: LegalDocType.TERMS_AND_CONDITIONS, documentVersion: 'v1.0' },
          { documentId: privacyDoc.id, documentType: LegalDocType.PRIVACY_POLICY, documentVersion: 'v1.0' },
        ],
      },
    },
  });

  console.log('   ✅ Core accounts seeded successfully.');

  // ==========================================================================
  // 4. SEED 3 PG PROPERTIES OWNED BY AYUSHMAN SAHA
  // ==========================================================================
  console.log('🏢 [4/7] Seeding 3 PG Properties with Floors, Rooms, and Beds...');

  interface IPGDefinition {
    name: string;
    description: string;
    genderType: PGGenderType;
    basePrice: number;
    depositMonths: number;
    address: string;
    locality: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
    floorsCount: number;
    roomsPerFloor: number;
    roomTypeMix: RoomType[];
    images: string[];
    mealPlan: { name: string; price: number; isVeg: boolean; weeklyMenu: string };
  }

  const pgDefinitions: IPGDefinition[] = [
    {
      name: 'Ayushman PG One (RoomBae Aurora Residency)',
      description: 'Luxury executive coliving & PG residency located in the heart of Koramangala with 500Mbps fiber wifi and 3-meal mess.',
      genderType: PGGenderType.BOYS,
      basePrice: 14500,
      depositMonths: 2,
      address: 'No. 45, 80ft Road, 4th Block, Koramangala',
      locality: 'Koramangala 4th Block',
      city: 'Bengaluru',
      pincode: '560034',
      lat: 12.9352,
      lng: 77.6245,
      floorsCount: 2,
      roomsPerFloor: 3, // 6 rooms total
      roomTypeMix: [RoomType.DOUBLE, RoomType.DOUBLE, RoomType.TRIPLE],
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
      ],
      mealPlan: {
        name: 'Standard 3-Meal North & South Indian Mess',
        price: 3500,
        isVeg: false,
        weeklyMenu: '{"Mon":"Paneer Butter / Chicken Curry","Tue":"Dal Makhani / Fish Fry","Wed":"Biryani Special"}',
      },
    },
    {
      name: 'Ayushman PG Two (RoomBae Serenity Coliving)',
      description: 'Premium co-living space near HSR BDA complex with air conditioning, gym, rooftop cafe, and biometric security.',
      genderType: PGGenderType.CO_LIVING,
      basePrice: 16000,
      depositMonths: 2,
      address: 'Plot 12, 14th Main, Sector 3, HSR Layout',
      locality: 'HSR Layout Sector 3',
      city: 'Bengaluru',
      pincode: '560102',
      lat: 12.9121,
      lng: 77.6446,
      floorsCount: 2,
      roomsPerFloor: 3, // 6 rooms total
      roomTypeMix: [RoomType.SINGLE, RoomType.DOUBLE, RoomType.DOUBLE],
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
      mealPlan: {
        name: 'Executive Breakfast & Dinner Plan',
        price: 3000,
        isVeg: false,
        weeklyMenu: '{"Mon":"Dosa & Sambhar","Tue":"Puri Bhaji & Egg Curry","Wed":"Continental Pasta"}',
      },
    },
    {
      name: 'Ayushman PG Three (RoomBae Zenith Heights)',
      description: 'Boutique women residency off 100ft road Indiranagar with dedicated study lounges and smart biometric security.',
      genderType: PGGenderType.GIRLS,
      basePrice: 15000,
      depositMonths: 2,
      address: '24, 12th Cross, 100ft Road, Indiranagar',
      locality: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      pincode: '560038',
      lat: 12.9719,
      lng: 77.6412,
      floorsCount: 2,
      roomsPerFloor: 3, // 6 rooms total
      roomTypeMix: [RoomType.SINGLE, RoomType.DOUBLE, RoomType.TRIPLE],
      images: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
      ],
      mealPlan: {
        name: 'Gourmet Organic Mess Plan',
        price: 3200,
        isVeg: true,
        weeklyMenu: '{"Mon":"Paneer Tikka Masala","Tue":"Chole Bhature","Wed":"South Indian Thali"}',
      },
    },
  ];

  interface ICreatedBed {
    id: string;
    bedNumber: string;
    roomId: string;
    pgId: string;
    baseRent: number;
    depositAmount: number;
  }

  const createdPGs: any[] = [];
  const allBedsPool: ICreatedBed[] = [];
  let ankurAssignedBed: ICreatedBed | null = null;

  for (let pgIdx = 0; pgIdx < pgDefinitions.length; pgIdx++) {
    const pDef = pgDefinitions[pgIdx];

    const pg = await prisma.pG.create({
      data: {
        ownerId: ownerUser.id,
        name: pDef.name,
        description: pDef.description,
        genderType: pDef.genderType,
        rules: ['No loud music after 10 PM', 'Visitor check-in mandatory at reception', 'Smoking prohibited indoors'],
        noticePeriodDays: 30,
        gateClosingTime: '23:30',
        status: PGStatus.APPROVED,
        basePrice: pDef.basePrice,
        depositMonths: pDef.depositMonths,
        contactPhone: '6297750585',
        contactEmail: '33200122040@tib.edu.in',
        location: {
          create: {
            address: pDef.address,
            locality: pDef.locality,
            city: pDef.city,
            state: 'Karnataka',
            pincode: pDef.pincode,
            latitude: pDef.lat,
            longitude: pDef.lng,
          },
        },
        images: {
          create: pDef.images.map((imgUrl, idx) => ({
            publicId: `pg_${pgIdx + 1}_img_${idx + 1}`,
            secureUrl: imgUrl,
            caption: `${pDef.name} Interior View ${idx + 1}`,
            isFeatured: idx === 0,
            order: idx,
          })),
        },
        mealPlans: {
          create: {
            name: pDef.mealPlan.name,
            monthlyPrice: pDef.mealPlan.price,
            isVegOnly: pDef.mealPlan.isVeg,
            isIncludedInRent: false,
            breakfastTime: '07:30 - 09:30',
            dinnerTime: '19:30 - 22:00',
            weeklyMenu: pDef.mealPlan.weeklyMenu,
          },
        },
      },
    });

    createdPGs.push(pg);

    // Link Amenities to PG
    for (const [amenityName, amenityId] of Object.entries(seededAmenities)) {
      await prisma.pGAmenity.create({
        data: {
          pgId: pg.id,
          amenityId,
          isAvailable: true,
        },
      });
    }

    // Seed Floors, Rooms, and Beds
    for (let f = 1; f <= pDef.floorsCount; f++) {
      const floor = await prisma.floor.create({
        data: {
          pgId: pg.id,
          floorNumber: f,
          floorName: `Floor ${f}`,
          wifiSsid: `RoomBae_${pDef.locality.split(' ')[0]}_F${f}`,
          wifiPassword: 'RoomBaeWiFi@2026',
        },
      });

      for (let r = 1; r <= pDef.roomsPerFloor; r++) {
        const roomType = pDef.roomTypeMix[(r - 1) % pDef.roomTypeMix.length];
        const roomNumber = `${f}0${r}`;
        const bedCount =
          roomType === RoomType.SINGLE ? 1 : roomType === RoomType.DOUBLE ? 2 : roomType === RoomType.TRIPLE ? 3 : 4;
        const roomRent =
          roomType === RoomType.SINGLE ? pDef.basePrice + 3000 : roomType === RoomType.DOUBLE ? pDef.basePrice : pDef.basePrice - 2000;
        const deposit = roomRent * pDef.depositMonths;

        const room = await prisma.room.create({
          data: {
            pgId: pg.id,
            floorId: floor.id,
            roomNumber,
            roomType,
            baseRent: roomRent,
            depositAmount: deposit,
            isAc: true,
            hasAttachedBathroom: true,
            status: BedStatus.AVAILABLE,
          },
        });

        const bedLetters = ['A', 'B', 'C', 'D'];
        for (let b = 0; b < bedCount; b++) {
          const bedNumber = `${roomNumber}-${bedLetters[b]}`;
          const bed = await prisma.bed.create({
            data: {
              pgId: pg.id,
              roomId: room.id,
              bedNumber,
              status: BedStatus.AVAILABLE,
              baseRent: roomRent,
              depositAmount: deposit,
            },
          });

          const bedObj: ICreatedBed = {
            id: bed.id,
            bedNumber,
            roomId: room.id,
            pgId: pg.id,
            baseRent: roomRent,
            depositAmount: deposit,
          };

          if (pgIdx === 0 && f === 1 && r === 1 && b === 0) {
            ankurAssignedBed = bedObj;
          } else {
            allBedsPool.push(bedObj);
          }
        }
      }
    }
  }

  console.log(`   ✅ Seeded 3 PGs with total ${allBedsPool.length + 1} beds across floors and rooms.`);

  // ==========================================================================
  // 5. SEED SYNTHETIC RESIDENTS & BED ALLOCATIONS
  // ==========================================================================
  console.log('👥 [5/7] Seeding ~30 Synthetic Residents and Allocating Beds...');

  const syntheticNames = [
    ['Rohit', 'Verma', 'rohit.verma@gmail.com', '9812345601', 'Frontend Developer', Gender.MALE],
    ['Sneha', 'Mukherjee', 'sneha.m@gmail.com', '9812345602', 'Data Analyst', Gender.FEMALE],
    ['Karan', 'Patel', 'karan.patel@gmail.com', '9812345603', 'Product Manager', Gender.MALE],
    ['Pooja', 'Sharma', 'pooja.sharma@gmail.com', '9812345604', 'UX Designer', Gender.FEMALE],
    ['Aditya', 'Rao', 'aditya.rao@gmail.com', '9812345605', 'Cloud Architect', Gender.MALE],
    ['Meera', 'Nair', 'meera.nair@gmail.com', '9812345606', 'Content Strategist', Gender.FEMALE],
    ['Vikram', 'Malhotra', 'vikram.m@gmail.com', '9812345607', 'Backend Engineer', Gender.MALE],
    ['Divya', 'Iyer', 'divya.iyer@gmail.com', '9812345608', 'Financial Analyst', Gender.FEMALE],
    ['Siddharth', 'Joshi', 'siddharth.j@gmail.com', '9812345609', 'DevOps Specialist', Gender.MALE],
    ['Neha', 'Chawla', 'neha.chawla@gmail.com', '9812345610', 'QA Automation Lead', Gender.FEMALE],
    ['Arjun', 'Reddy', 'arjun.reddy@gmail.com', '9812345611', 'Full Stack Developer', Gender.MALE],
    ['Ananya', 'Sen', 'ananya.sen@gmail.com', '9812345612', 'AI Researcher', Gender.FEMALE],
    ['Manish', 'Gupta', 'manish.g@gmail.com', '9812345613', 'Growth Marketer', Gender.MALE],
    ['Priya', 'Kulkarni', 'priya.k@gmail.com', '9812345614', 'Security Consultant', Gender.FEMALE],
    ['Varun', 'Bansal', 'varun.bansal@gmail.com', '9812345615', 'Operations Lead', Gender.MALE],
    ['Rhea', 'Kapoor', 'rhea.kapoor@gmail.com', '9812345616', 'Brand Manager', Gender.FEMALE],
    ['Nikhil', 'Deshmukh', 'nikhil.d@gmail.com', '9812345617', 'Solutions Architect', Gender.MALE],
    ['Kavya', 'Menon', 'kavya.menon@gmail.com', '9812345618', 'Legal Counsel', Gender.FEMALE],
    ['Sameer', 'Khan', 'sameer.khan@gmail.com', '9812345619', 'Graphic Designer', Gender.MALE],
    ['Tanvi', 'Hegde', 'tanvi.h@gmail.com', '9812345620', 'Mobile App Engineer', Gender.FEMALE],
    ['Harsh', 'Agarwal', 'harsh.ag@gmail.com', '9812345621', 'Systems Engineer', Gender.MALE],
    ['Isha', 'Bhatia', 'isha.bhatia@gmail.com', '9812345622', 'Data Engineer', Gender.FEMALE],
    ['Pranav', 'Pandey', 'pranav.p@gmail.com', '9812345623', 'Scrum Master', Gender.MALE],
    ['Shreya', 'Ghosh', 'shreya.ghosh@gmail.com', '9812345624', 'HR Specialist', Gender.FEMALE],
    ['Gaurav', 'Bose', 'gaurav.bose@gmail.com', '9812345625', 'Database Administrator', Gender.MALE],
    ['Aayushi', 'Saxena', 'aayushi.s@gmail.com', '9812345626', 'Cybersecurity Analyst', Gender.FEMALE],
    ['Kunal', 'Singh', 'kunal.singh@gmail.com', '9812345627', 'Consultant', Gender.MALE],
    ['Ritu', 'Mishra', 'ritu.mishra@gmail.com', '9812345628', 'Sales Director', Gender.FEMALE],
    ['Deepak', 'Yadav', 'deepak.yadav@gmail.com', '9812345629', 'Supply Chain Analyst', Gender.MALE],
  ];

  interface IResidentContext {
    user: any;
    bed: ICreatedBed;
    moveInMonthsAgo: number;
  }

  const activeResidentContexts: IResidentContext[] = [];

  // A. Link Ankur Saha to his bed (101-A at Ayushman PG One)
  if (ankurAssignedBed) {
    await prisma.bed.update({
      where: { id: ankurAssignedBed.id },
      data: { status: BedStatus.OCCUPIED, currentResidentId: ankurUser.id },
    });

    const ankurBooking = await prisma.booking.create({
      data: {
        residentId: ankurUser.id,
        pgId: ankurAssignedBed.pgId,
        roomId: ankurAssignedBed.roomId,
        bedId: ankurAssignedBed.id,
        roomType: RoomType.DOUBLE,
        preferredMoveInDate: getHistoricalDate(11, 1),
        expectedStayMonths: 12,
        status: BookingStatus.CONFIRMED,
        rentAmount: ankurAssignedBed.baseRent,
        depositAmount: ankurAssignedBed.depositAmount,
        advanceAmountPaid: ankurAssignedBed.depositAmount,
      },
    });

    const ankurRoom = await prisma.room.findUnique({ where: { id: ankurAssignedBed.roomId } });

    await prisma.roomAllocation.create({
      data: {
        bookingId: ankurBooking.id,
        residentId: ankurUser.id,
        pgId: ankurAssignedBed.pgId,
        floorId: ankurRoom!.floorId,
        roomId: ankurAssignedBed.roomId,
        bedId: ankurAssignedBed.id,
        rent: ankurAssignedBed.baseRent,
        deposit: ankurAssignedBed.depositAmount,
        checkInDate: getHistoricalDate(11, 1),
        isActive: true,
        allocatedById: ownerUser.id,
      },
    });

    const ankurAgreement = await prisma.agreement.create({
      data: {
        bookingId: ankurBooking.id,
        residentId: ankurUser.id,
        ownerId: ownerUser.id,
        pgId: ankurAssignedBed.pgId,
        agreementNumber: 'AGR-AURORA-1001',
        status: AgreementStatus.COMPLETED,
        rentAmount: ankurAssignedBed.baseRent,
        depositAmount: ankurAssignedBed.depositAmount,
        lockInPeriodMonths: 3,
        noticePeriodDays: 30,
        startDate: getHistoricalDate(11, 1),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        agreementPdfUrl: 'https://roombae-documents.s3.amazonaws.com/agreements/AGR-AURORA-1001.pdf',
      },
    });

    await prisma.digitalSignature.create({
      data: {
        agreementId: ankurAgreement.id,
        signerId: ankurUser.id,
        signerRole: Role.RESIDENT,
        signatureType: SignatureType.TYPED,
        signatureData: 'Ankur Saha (Cryptographically Verified)',
      },
    });

    await prisma.digitalSignature.create({
      data: {
        agreementId: ankurAgreement.id,
        signerId: ownerUser.id,
        signerRole: Role.PG_OWNER,
        signatureType: SignatureType.DRAWN,
        signatureData: 'Ayushman Saha (Authorized Signatory)',
      },
    });

    await prisma.rentSchedule.create({
      data: {
        residentId: ankurUser.id,
        pgId: ankurAssignedBed.pgId,
        roomId: ankurAssignedBed.roomId,
        bedId: ankurAssignedBed.id,
        monthlyRent: ankurAssignedBed.baseRent,
        billingDayOfMonth: 1,
        dueDayOfMonth: 5,
        nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    });

    activeResidentContexts.push({
      user: ankurUser,
      bed: ankurAssignedBed,
      moveInMonthsAgo: 11,
    });
  }

  // B. Seed remaining synthetic residents and allocate to available beds
  const bedsToOccupy = allBedsPool.slice(0, syntheticNames.length);

  for (let i = 0; i < bedsToOccupy.length; i++) {
    const sData = syntheticNames[i];
    const targetBed = bedsToOccupy[i];
    const username = `res_${sData[0].toLowerCase()}_${100 + i}`;
    const moveInMonthsAgo = (i % 11) + 1; // Staggered joining from 1 to 11 months ago

    const resUser = await prisma.user.create({
      data: {
        email: sData[2] as string,
        username,
        phone: sData[3] as string,
        passwordHash: commonResidentHash,
        role: Role.RESIDENT,
        isActive: true,
        isSuspended: false,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        isProfileComplete: true,
        currentAddress: 'Bengaluru, Karnataka',
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=150`,
        profile: {
          create: {
            firstName: sData[0] as string,
            lastName: sData[1] as string,
            gender: sData[5] as Gender,
            occupation: sData[4] as string,
            companyOrCollege: 'Tech Hub Bengaluru',
            emergencyContactName: 'Parent Guardian',
            emergencyContactPhone: '+919800000000',
            emergencyContactRelation: 'Parent',
          },
        },
        legalAcceptances: {
          create: [
            { documentId: termsDoc.id, documentType: LegalDocType.TERMS_AND_CONDITIONS, documentVersion: 'v1.0' },
            { documentId: privacyDoc.id, documentType: LegalDocType.PRIVACY_POLICY, documentVersion: 'v1.0' },
          ],
        },
      },
    });

    // Mark bed occupied
    await prisma.bed.update({
      where: { id: targetBed.id },
      data: { status: BedStatus.OCCUPIED, currentResidentId: resUser.id },
    });

    const booking = await prisma.booking.create({
      data: {
        residentId: resUser.id,
        pgId: targetBed.pgId,
        roomId: targetBed.roomId,
        bedId: targetBed.id,
        roomType: RoomType.DOUBLE,
        preferredMoveInDate: getHistoricalDate(moveInMonthsAgo, 1),
        expectedStayMonths: 12,
        status: BookingStatus.CONFIRMED,
        rentAmount: targetBed.baseRent,
        depositAmount: targetBed.depositAmount,
        advanceAmountPaid: targetBed.depositAmount,
      },
    });

    const targetRoom = await prisma.room.findUnique({ where: { id: targetBed.roomId } });

    await prisma.roomAllocation.create({
      data: {
        bookingId: booking.id,
        residentId: resUser.id,
        pgId: targetBed.pgId,
        floorId: targetRoom!.floorId,
        roomId: targetBed.roomId,
        bedId: targetBed.id,
        rent: targetBed.baseRent,
        deposit: targetBed.depositAmount,
        checkInDate: getHistoricalDate(moveInMonthsAgo, 1),
        isActive: true,
        allocatedById: ownerUser.id,
      },
    });

    await prisma.agreement.create({
      data: {
        bookingId: booking.id,
        residentId: resUser.id,
        ownerId: ownerUser.id,
        pgId: targetBed.pgId,
        agreementNumber: `AGR-RB-${2000 + i}`,
        status: AgreementStatus.COMPLETED,
        rentAmount: targetBed.baseRent,
        depositAmount: targetBed.depositAmount,
        lockInPeriodMonths: 3,
        noticePeriodDays: 30,
        startDate: getHistoricalDate(moveInMonthsAgo, 1),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.rentSchedule.create({
      data: {
        residentId: resUser.id,
        pgId: targetBed.pgId,
        roomId: targetBed.roomId,
        bedId: targetBed.id,
        monthlyRent: targetBed.baseRent,
        billingDayOfMonth: 1,
        dueDayOfMonth: 5,
        nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    });

    activeResidentContexts.push({
      user: resUser,
      bed: targetBed,
      moveInMonthsAgo,
    });
  }

  // Set 2 remaining beds to MAINTENANCE for realistic status representation
  const remainingBeds = allBedsPool.slice(bedsToOccupy.length);
  if (remainingBeds.length >= 2) {
    await prisma.bed.update({ where: { id: remainingBeds[0].id }, data: { status: BedStatus.MAINTENANCE } });
    await prisma.bed.update({ where: { id: remainingBeds[1].id }, data: { status: BedStatus.MAINTENANCE } });
  }

  console.log(`   ✅ Initialized ${activeResidentContexts.length} active residents across all properties.`);

  // ==========================================================================
  // 6. SEED 12-MONTH HISTORICAL PAYMENTS, INVOICES & REVENUE ANALYTICS
  // ==========================================================================
  console.log('💳 [6/7] Generating 1-Year (12 Months) Historical Financial Transactions & Invoices...');

  let totalInvoicesCreated = 0;
  let totalPaymentsCreated = 0;

  for (const rCtx of activeResidentContexts) {
    const resident = rCtx.user;
    const bed = rCtx.bed;
    const baseRent = bed.baseRent;
    const gst = Math.round(baseRent * 0.18);
    const totalAmount = baseRent + gst;

    // Generate monthly invoices and payments for each active month since move-in
    for (let m = rCtx.moveInMonthsAgo; m >= 0; m--) {
      const issueDate = getHistoricalDate(m, 1);
      const dueDate = getHistoricalDate(m, 5);
      const billingMonth = issueDate.getMonth() + 1;
      const billingYear = issueDate.getFullYear();
      const invoiceNumber = `INV-${billingYear}${billingMonth < 10 ? '0' + billingMonth : billingMonth}-${resident.username.toUpperCase()}`;

      // Current month might be UNPAID or PARTIALLY_PAID for realistic current balances
      const isCurrentMonth = m === 0;
      const isOverdue = isCurrentMonth && new Date().getDate() > 5;
      const invoiceStatus = isCurrentMonth
        ? isOverdue
          ? InvoiceStatus.OVERDUE
          : InvoiceStatus.UNPAID
        : InvoiceStatus.PAID;
      const amountPaid = invoiceStatus === InvoiceStatus.PAID ? totalAmount : 0;
      const balanceDue = totalAmount - amountPaid;

      const invoice = await prisma.invoice.create({
        data: {
          residentId: resident.id,
          pgId: bed.pgId,
          invoiceNumber,
          billingMonth,
          billingYear,
          issueDate,
          dueDate,
          subtotal: baseRent,
          gstPercentage: 18.0,
          gstAmount: gst,
          totalAmount,
          amountPaid,
          balanceDue,
          status: invoiceStatus,
          items: {
            create: [
              { description: `Monthly Bed Rent (${bed.bedNumber})`, itemType: InvoiceItemType.RENT, unitPrice: baseRent, quantity: 1, total: baseRent },
              { description: 'Goods & Services Tax (GST 18%)', itemType: InvoiceItemType.OTHER, unitPrice: gst, quantity: 1, total: gst },
            ],
          },
        },
      });

      totalInvoicesCreated++;

      // Create Payment for paid invoices
      if (invoiceStatus === InvoiceStatus.PAID) {
        const paymentDate = getHistoricalDate(m, (m % 4) + 2); // Paid between 2nd and 5th
        const paymentMethod = m % 3 === 0 ? PaymentMethod.RAZORPAY : PaymentMethod.UPI_MANUAL;

        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            payerId: resident.id,
            payeeId: ownerUser.id,
            pgId: bed.pgId,
            amount: totalAmount,
            currency: 'INR',
            paymentMethod,
            purpose: PaymentPurpose.MONTHLY_RENT,
            status: PaymentStatus.VERIFIED,
            razorpayPaymentId: paymentMethod === PaymentMethod.RAZORPAY ? `pay_rzp_${invoiceNumber}` : undefined,
            manualUtr: paymentMethod === PaymentMethod.UPI_MANUAL ? `UTR${billingYear}${100000 + totalPaymentsCreated}` : undefined,
            receiptNumber: `RCP-${invoiceNumber}`,
            verifiedById: ownerUser.id,
            verifiedAt: paymentDate,
            createdAt: paymentDate,
          },
        });

        // Record Revenue Entry for Analytics
        await prisma.revenueEntry.create({
          data: {
            pgId: bed.pgId,
            ownerId: ownerUser.id,
            source: 'RENT',
            amount: totalAmount,
            date: paymentDate,
            description: `Rent collection from ${resident.email}`,
          },
        });

        totalPaymentsCreated++;
      }
    }
  }

  // Create a realistic sample of FAILED and REFUNDED payments
  const sampleResident = activeResidentContexts[1].user;
  await prisma.payment.create({
    data: {
      payerId: sampleResident.id,
      payeeId: ownerUser.id,
      pgId: activeResidentContexts[1].bed.pgId,
      amount: 14500,
      currency: 'INR',
      paymentMethod: PaymentMethod.RAZORPAY,
      purpose: PaymentPurpose.MONTHLY_RENT,
      status: PaymentStatus.FAILED,
      razorpayOrderId: 'order_failed_demo_01',
      rejectionReason: 'Bank Server Timeout / Insufficient Funds',
      createdAt: getHistoricalDate(2, 6),
    },
  });

  // Seed Monthly Operational Expenses across 12 months for Ayushman's PGs
  const expenseCategories = ['ELECTRICITY', 'WATER', 'FOOD_GROCERY', 'STAFF_SALARY', 'INTERNET', 'MAINTENANCE'];
  for (const pg of createdPGs) {
    for (let m = 11; m >= 0; m--) {
      for (const cat of expenseCategories) {
        const amount = cat === 'STAFF_SALARY' ? 25000 : cat === 'FOOD_GROCERY' ? 18000 : cat === 'ELECTRICITY' ? 9500 : 3500;
        await prisma.expense.create({
          data: {
            pgId: pg.id,
            ownerId: ownerUser.id,
            category: cat,
            amount: amount + (m * 120), // Slight variation per month
            date: getHistoricalDate(m, 10),
            description: `Monthly ${cat} expense for ${pg.name}`,
          },
        });
      }
    }
  }

  console.log(`   ✅ Seeded ${totalInvoicesCreated} invoices, ${totalPaymentsCreated} verified payments, and 12-month expense matrix.`);

  // ==========================================================================
  // 7. SEED COMPLAINTS, NOTIFICATIONS & AUDIT LOGS
  // ==========================================================================
  console.log('📢 [7/7] Seeding Complaints, Operational Messages, Notifications & Audit Telemetry...');

  // Ankur's Complaints (1 Resolved with messaging history, 1 In Progress)
  const ankurComplaint1 = await prisma.complaint.create({
    data: {
      residentId: ankurUser.id,
      pgId: ankurAssignedBed!.pgId,
      roomId: ankurAssignedBed!.roomId,
      category: ComplaintCategory.WIFI,
      title: '5GHz High-Speed WiFi Connectivity in Room 101',
      description: 'Requesting access point channel configuration for workstation remote pairing.',
      priority: ComplaintPriority.MEDIUM,
      status: ComplaintStatus.RESOLVED,
      resolutionNotes: 'Access Point restarted and 5GHz dedicated SSID allocated. Signal strength verified at 450 Mbps.',
      resolvedAt: getHistoricalDate(1, 15),
      closedAt: getHistoricalDate(1, 16),
      residentAcknowledgedAt: getHistoricalDate(1, 16),
      createdAt: getHistoricalDate(1, 14),
      messages: {
        create: [
          { senderId: ankurUser.id, senderRole: Role.RESIDENT, message: 'Hi, the 5GHz signal drops occasionally in the corner desk.' },
          { senderId: ownerUser.id, senderRole: Role.PG_OWNER, message: 'Thanks Ankur. Network technician is configuring a mesh repeater today.' },
          { senderId: ownerUser.id, senderRole: Role.PG_OWNER, message: 'Repeater installed and tested. Please check now.' },
          { senderId: ankurUser.id, senderRole: Role.RESIDENT, message: 'Super fast now! Marking as resolved. Thank you!' },
        ],
      },
    },
  });

  await prisma.complaint.create({
    data: {
      residentId: ankurUser.id,
      pgId: ankurAssignedBed!.pgId,
      roomId: ankurAssignedBed!.roomId,
      category: ComplaintCategory.CLEANLINESS,
      title: 'Balcony Deep Cleaning Request',
      description: 'Scheduled weekly deep cleaning for Room 101 attached balcony.',
      priority: ComplaintPriority.LOW,
      status: ComplaintStatus.IN_PROGRESS,
      createdAt: getHistoricalDate(0, 2),
    },
  });

  // Notifications for Ankur
  await prisma.notification.createMany({
    data: [
      {
        userId: ankurUser.id,
        title: 'Rent Receipt Generated',
        message: 'Your rent payment for Room 101-A has been verified. Receipt RCP-INV-202607-ANKUR547 is ready.',
        type: NotificationType.PAYMENT,
        channel: NotificationChannel.IN_APP,
        isRead: true,
      },
      {
        userId: ankurUser.id,
        title: 'WiFi Maintenance Completed',
        message: 'High-speed mesh access point in Floor 1 has been upgraded.',
        type: NotificationType.COMPLAINT,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
    ],
  });

  // Notifications for Ayushman (Owner)
  await prisma.notification.createMany({
    data: [
      {
        userId: ownerUser.id,
        title: 'New Resident Booking Confirmed',
        message: 'Ankur Saha has signed the digital agreement for Room 101-A at Aurora Residency.',
        type: NotificationType.BOOKING,
        channel: NotificationChannel.IN_APP,
        isRead: true,
      },
      {
        userId: ownerUser.id,
        title: 'Monthly Subscription Renewed',
        message: 'Your Professional Plan subscription has been renewed successfully for ₹2,499.',
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        isRead: false,
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorRole: 'ADMIN',
        action: 'PLATFORM_INITIALIZED',
        resource: 'SYSTEM',
        reason: 'Master Seed Data Provisioning',
        timestamp: getHistoricalDate(12, 1),
      },
      {
        actorId: ownerUser.id,
        actorRole: 'PG_OWNER',
        action: 'PG_REGISTERED',
        resource: 'PG',
        resourceId: createdPGs[0].id,
        reason: 'New PG property onboarding',
        timestamp: getHistoricalDate(11, 1),
      },
      {
        actorId: adminUser.id,
        actorRole: 'ADMIN',
        action: 'KYC_APPROVED',
        resource: 'USER',
        resourceId: ownerUser.id,
        reason: 'Owner identity & property documents approved',
        timestamp: getHistoricalDate(11, 2),
      },
    ],
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // ==========================================================================
  // FINAL REPORT & INTEGRITY SUMMARY
  // ==========================================================================
  console.log('\n============================================================');
  console.log('🎉 ROOMBAE PRODUCTION DEMO DATABASE SEED COMPLETE');
  console.log('============================================================');
  console.log(`Execution Time    : ${durationSec}s`);
  console.log(`Total Collections : 43 active Prisma models`);
  console.log('------------------------------------------------------------');
  console.log('📊 SEEDED RECORD INVENTORY:');
  console.log(`  • Users               : ${await prisma.user.count()} (1 Admin, 1 Owner, 30 Residents)`);
  console.log(`  • PGs / Properties    : ${await prisma.pG.count()}`);
  console.log(`  • Rooms               : ${await prisma.room.count()}`);
  console.log(`  • Beds                : ${await prisma.bed.count()} (Occupied: ${await prisma.bed.count({ where: { status: BedStatus.OCCUPIED } })}, Available: ${await prisma.bed.count({ where: { status: BedStatus.AVAILABLE } })}, Maint: ${await prisma.bed.count({ where: { status: BedStatus.MAINTENANCE } })})`);
  console.log(`  • Bookings            : ${await prisma.booking.count()}`);
  console.log(`  • Agreements          : ${await prisma.agreement.count()}`);
  console.log(`  • Invoices            : ${await prisma.invoice.count()}`);
  console.log(`  • Payments            : ${await prisma.payment.count()}`);
  console.log(`  • Subscriptions       : ${await prisma.subscription.count()}`);
  console.log(`  • Sub. Payments       : ${await prisma.subscriptionPayment.count()}`);
  console.log(`  • Complaints          : ${await prisma.complaint.count()}`);
  console.log(`  • Notifications       : ${await prisma.notification.count()}`);
  console.log(`  • Expenses            : ${await prisma.expense.count()}`);
  console.log(`  • Audit Logs          : ${await prisma.auditLog.count()}`);
  console.log('------------------------------------------------------------');
  console.log('🔑 DEMO VERIFIED CREDENTIALS:');
  console.log('  1. RESIDENT : ankursaha985@gmail.com / Ankur@#123 (Room 101-A @ Aurora Residency)');
  console.log('  2. PG OWNER : 33200122040@tib.edu.in / Ayush@#123 (3 PGs, Active Pro Plan)');
  console.log('  3. ADMIN    : god@3456 / GOD@34$%65 (Full Platform Oversight)');
  console.log('  4. OTP TEST : 654123 (Secure fallback for phone/email verification)');
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('\x1b[31m[FATAL ERROR]\x1b[0m Database Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
