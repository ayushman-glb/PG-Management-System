import { PrismaClient, Role, PGStatus, BedStatus, ResidentStatus, AgreementStatus, TicketStatus, PaymentStatus, PassStatus, OwnerKYCStatus, BusinessType, PropertyType, PropertyOwnershipType, SubscriptionPlanType, SubscriptionStatus, FineType, FineCalculationType, FineStatus, Priority, LeaveStatus, HoldStatus, RoomType, ACType, WashroomType, BedHoldReason, RoomTransferStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🌱 ROOMBAE MASTER DATABASE SEEDING ENGINE STARTING');
  console.log('====================================================\n');

  // 1. RBAC Roles & Permissions
  console.log('📦 1. Seeding RBAC Roles & Permissions...');
  const roleNames: Role[] = ['SUPER_ADMIN', 'ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'RESIDENT', 'PUBLIC'];
  const roles: Record<string, any> = {};

  for (const rName of roleNames) {
    let existingRole = await prisma.rbacRole.findUnique({ where: { name: rName } });
    if (!existingRole) {
      existingRole = await prisma.rbacRole.create({
        data: {
          name: rName,
          description: `${rName} Role with appropriate platform access permissions.`,
        },
      });
    }
    roles[rName] = existingRole;
  }
  console.log(`   ✅ Roles initialized: ${Object.keys(roles).length}`);

  // Permissions
  const permissionsData = [
    { action: 'manage:all', resource: 'system' },
    { action: 'manage:pg', resource: 'pg' },
    { action: 'read:resident', resource: 'resident' },
    { action: 'manage:resident', resource: 'resident' },
    { action: 'read:billing', resource: 'billing' },
    { action: 'manage:billing', resource: 'billing' },
    { action: 'read:complaint', resource: 'complaint' },
    { action: 'manage:complaint', resource: 'complaint' },
  ];

  for (const pData of permissionsData) {
    const existingPerm = await prisma.permission.findFirst({ where: { action: pData.action, resource: pData.resource } });
    if (!existingPerm) {
      await prisma.permission.create({
        data: {
          action: pData.action,
          resource: pData.resource,
        },
      });
    }
  }
  console.log('   ✅ Permissions verified.');

  // 2. Admins & Platform Leadership
  console.log('📦 2. Seeding Platform Admins...');
  const adminAccounts = [
    { name: 'Super Admin', email: 'superadmin@roombae.com', password: 'SuperAdmin_RB_2026!', phone: '+919900000001', role: Role.SUPER_ADMIN },
    { name: 'Platform Admin', email: 'admin@roombae.com', password: 'Admin_RoomBae_7890!', phone: '+919900000002', role: Role.ADMIN },
    { name: 'Lead Engineer', email: 'tech@roombae.com', password: 'Admin_RoomBae_7890!', phone: '+919900000003', role: Role.ADMIN },
  ];

  for (const adm of adminAccounts) {
    const passwordHash = await bcrypt.hash(adm.password, 12);
    
    // Seed in User collection for Unified Auth Handshake
    let user = await prisma.user.findUnique({ where: { email: adm.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: adm.name,
          email: adm.email,
          phone: adm.phone,
          passwordHash,
          role: adm.role,
          emailVerified: true,
          phoneVerified: true,
          accountStatus: 'ACTIVE',
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, accountStatus: 'ACTIVE', emailVerified: true },
      });
    }

    // Seed in Admin table for Admin Console relations
    const existingAdmin = await prisma.admin.findUnique({ where: { email: adm.email } });
    if (!existingAdmin) {
      await prisma.admin.create({
        data: {
          name: adm.name,
          email: adm.email,
          passwordHash,
          roleId: roles['SUPER_ADMIN'].id,
        },
      });
    }
  }
  console.log('   ✅ Admins ready.');

  // 3. PG Owners & Linked Accounts (10 Owners matching USER_CREDENTIALS.md)
  console.log('📦 3. Seeding 10 PG Owners with Business & KYC records...');
  const ownerList = [
    { name: 'Rajesh Sharma', email: 'rajesh.owner@roombae.com', phone: '+919876543210', password: 'Owner_Rajesh_1001!', city: 'Bengaluru' },
    { name: 'Priya Venkatesh', email: 'priya.owner@roombae.com', phone: '+919876543211', password: 'Owner_Priya_1002!', city: 'Bengaluru' },
    { name: 'Amitabh Malhotra', email: 'amitabh.owner@roombae.com', phone: '+919876543212', password: 'Owner_Amitabh_1003!', city: 'Gurugram' },
    { name: 'Sunita Aggarwal', email: 'sunita.owner@roombae.com', phone: '+919876543213', password: 'Owner_Sunita_1004!', city: 'Gurugram' },
    { name: 'Vikram Joshi', email: 'vikram.owner@roombae.com', phone: '+919876543214', password: 'Owner_Vikram_1005!', city: 'Pune' },
    { name: 'Ananya Deshmukh', email: 'ananya.owner@roombae.com', phone: '+919876543215', password: 'Owner_Ananya_1006!', city: 'Pune' },
    { name: 'Suresh Reddy', email: 'suresh.owner@roombae.com', phone: '+919876543216', password: 'Owner_Suresh_1007!', city: 'Hyderabad' },
    { name: 'Kavitha Rao', email: 'kavitha.owner@roombae.com', phone: '+919876543217', password: 'Owner_Kavitha_1008!', city: 'Hyderabad' },
    { name: 'Rohan Gupta', email: 'rohan.owner@roombae.com', phone: '+919876543218', password: 'Owner_Rohan_1009!', city: 'Bengaluru' },
    { name: 'Meenakshi Sundaram', email: 'meenakshi.owner@roombae.com', phone: '+919876543219', password: 'Owner_Meenakshi_1010!', city: 'Bengaluru' },
  ];

  const dbOwners: any[] = [];
  for (let i = 0; i < ownerList.length; i++) {
    const o = ownerList[i];
    const passwordHash = await bcrypt.hash(o.password, 12);
    let user = await prisma.user.findUnique({ where: { email: o.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: o.name,
          email: o.email,
          phone: o.phone,
          passwordHash,
          role: 'OWNER',
          emailVerified: true,
          phoneVerified: true,
          accountStatus: 'ACTIVE',
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, accountStatus: 'ACTIVE', emailVerified: true },
      });
    }

    let owner = await prisma.owner.findUnique({ where: { userId: user.id } });
    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          userId: user.id,
          name: o.name,
          email: o.email,
          phone: o.phone,
          photo: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/avatars/owner_${i + 1}.webp`,
          address: `No. ${10 + i * 5}, MG Road, ${o.city}`,
          aadhaarNumber: `45678901234${i}`,
          panNumber: `ABCDE123${i}F`,
          upiId: `owner${i + 1}@hdfcbank`,
          bankName: 'HDFC Bank',
          accountNumber: `5010023456780${i}`,
          ifscCode: 'HDFC0001234',
          emergencyContact: '+919811122233',
          bio: `Experienced PG operator with 8+ years managing premium coliving spaces in ${o.city}.`,
        },
      });
    }

    // Owner KYC
    let kyc = await prisma.ownerKYC.findUnique({ where: { ownerId: owner.id } });
    if (!kyc) {
      await prisma.ownerKYC.create({
        data: {
          ownerId: owner.id,
          aadhaarNumber: owner.aadhaarNumber,
          aadhaarDocUrl: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/kyc/aadhaar_${i + 1}.pdf`,
          panNumber: owner.panNumber,
          panDocUrl: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/kyc/pan_${i + 1}.pdf`,
          verificationStatus: OwnerKYCStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });
    }

    // Business
    let bus = await prisma.business.findUnique({ where: { ownerId: owner.id } });
    if (!bus) {
      await prisma.business.create({
        data: {
          ownerId: owner.id,
          businessName: `${o.name.split(' ')[0]} Living Solutions Pvt Ltd`,
          businessType: BusinessType.PVT_LIMITED,
          gstin: `29ABCDE1234F${i}Z5`,
          panNumber: owner.panNumber,
          businessAddress: owner.address,
          businessEmail: owner.email,
          businessPhone: owner.phone,
        },
      });
    }

    // Subscription
    let sub = await prisma.subscription.findUnique({ where: { ownerId: owner.id } });
    if (!sub) {
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
    }

    dbOwners.push(owner);
  }
  console.log(`   ✅ 10 Owners ready with full KYC & Subscriptions.`);

  // 4. PGs, Buildings, Floors, Rooms, and Beds (10 PGs)
  console.log('📦 4. Seeding 10 PGs with Buildings, Floors, Rooms & Beds...');
  const pgSeedList = [
    { name: 'RoomBae Luxury Coliving — Indiranagar', city: 'Bengaluru', rent: 14500, deposit: 29000, capacity: 40 },
    { name: 'RoomBae Executive Stay — Koramangala', city: 'Bengaluru', rent: 16000, deposit: 32000, capacity: 35 },
    { name: 'RoomBae Tech Park Residency — HSR Layout', city: 'Bengaluru', rent: 13500, deposit: 27000, capacity: 45 },
    { name: 'RoomBae Silicon Heights — Gachibowli', city: 'Hyderabad', rent: 12000, deposit: 24000, capacity: 30 },
    { name: 'RoomBae Cyber Hub Living — HITEC City', city: 'Hyderabad', rent: 15000, deposit: 30000, capacity: 40 },
    { name: 'RoomBae IT Park View — Viman Nagar', city: 'Pune', rent: 13000, deposit: 26000, capacity: 30 },
    { name: 'RoomBae Premium Residency — Baner', city: 'Pune', rent: 14000, deposit: 28000, capacity: 35 },
    { name: 'RoomBae Sea Breeze Coliving — Bandra', city: 'Mumbai', rent: 22000, deposit: 44000, capacity: 25 },
    { name: 'RoomBae Metro Elite — Powai', city: 'Mumbai', rent: 19000, deposit: 38000, capacity: 30 },
    { name: 'RoomBae Capital Heights — Gurgaon Sec 44', city: 'Delhi NCR', rent: 16500, deposit: 33000, capacity: 40 },
  ];

  const allBeds: any[] = [];
  const dbPGs: any[] = [];

  for (let i = 0; i < pgSeedList.length; i++) {
    const pgData = pgSeedList[i];
    const owner = dbOwners[i % dbOwners.length];
    const slug = pgData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let pg = await prisma.pG.findUnique({ where: { slug } });
    if (!pg) {
      pg = await prisma.pG.create({
        data: {
          ownerId: owner.id,
          name: pgData.name,
          slug,
          logo: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/properties/pg_logo_${i + 1}.webp`,
          galleryImages: [
            `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/rooms/room_img_${i + 1}_1.webp`,
            `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/rooms/room_img_${i + 1}_2.webp`,
          ],
          description: `State-of-the-art coliving property featuring high-speed WiFi, biometric access, daily housekeeping, and 3-time nutritious meals in ${pgData.city}.`,
          amenities: ['WiFi', 'Laundry', 'CCTV', 'Power Backup', 'Lift', 'Mess', 'Security', 'Gym', 'Gaming Zone'],
          rules: ['No Smoking inside rooms', 'Curfew 10:30 PM', 'Visitors till 8 PM', 'Keep common areas clean'],
          rentStartingFrom: pgData.rent,
          securityDeposit: pgData.deposit,
          latitude: 12.9716 + i * 0.01,
          longitude: 77.5946 + i * 0.01,
          address: `Plot 10${i}, Main Road, ${pgData.city}`,
          city: pgData.city,
          pincode: `5600${10 + i}`,
          nearbyColleges: ['St. Josephs College', 'Christ University', 'Jain University'],
          nearbyCompanies: ['Google', 'Microsoft', 'Amazon', 'Infosys', 'Wipro'],
          nearbyMetro: ['Indiranagar Metro', 'MG Road Metro', 'HSR Metro'],
          capacity: pgData.capacity,
          availableBeds: Math.floor(pgData.capacity * 0.25),
          currentOccupancy: Math.floor(pgData.capacity * 0.75),
          status: PGStatus.ACTIVE,
          buildingCount: 1,
          floorCount: 3,
          totalRoomsCount: 10,
          totalBedsCount: pgData.capacity,
        },
      });
    }
    dbPGs.push(pg);

    // Property Document
    const existingDoc = await prisma.propertyDocument.findFirst({ where: { pgId: pg.id } });
    if (!existingDoc) {
      await prisma.propertyDocument.create({
        data: {
          pgId: pg.id,
          documentType: 'TRADE_LICENSE',
          documentNumber: `TL-2025-00${i + 1}`,
          fileUrl: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/documents/license_${i + 1}.pdf`,
          isApproved: true,
        },
      });
    }

    // Fine Rule
    const existingRule = await prisma.fineRule.findFirst({ where: { pgId: pg.id } });
    if (!existingRule) {
      await prisma.fineRule.create({
        data: {
          pgId: pg.id,
          fineType: FineType.LATE_RENT,
          calculationType: FineCalculationType.FLAT,
          amount: 500,
          gracePeriodDays: 3,
        },
      });
    }

    // Building
    let building = await prisma.building.findFirst({ where: { pgId: pg.id } });
    if (!building) {
      building = await prisma.building.create({
        data: {
          pgId: pg.id,
          name: 'Main Block',
          floorsCount: 3,
        },
      });
    }

    // Floors & Rooms
    for (let f = 1; f <= 3; f++) {
      let floor = await prisma.floor.findFirst({ where: { buildingId: building.id, floorNumber: f } });
      if (!floor) {
        floor = await prisma.floor.create({
          data: {
            buildingId: building.id,
            floorNumber: f,
          },
        });
      }

      for (let r = 1; r <= 3; r++) {
        const roomNo = `${f}0${r}`;
        let room = await prisma.room.findFirst({ where: { floorId: floor.id, roomNumber: roomNo } });
        if (!room) {
          room = await prisma.room.create({
            data: {
              floorId: floor.id,
              roomNumber: roomNo,
              roomType: r % 2 === 0 ? RoomType.SINGLE : RoomType.DOUBLE,
              acType: ACType.AC,
              washroomType: WashroomType.ATTACHED,
              rentAmount: pgData.rent,
            },
          });
        }

        // Beds per room
        const bedCount = room.roomType === RoomType.SINGLE ? 1 : 2;
        for (let b = 1; b <= bedCount; b++) {
          const bedNo = `${roomNo}-${String.fromCharCode(64 + b)}`;
          let bed = await prisma.bed.findFirst({ where: { roomId: room.id, bedNumber: bedNo } });
          if (!bed) {
            bed = await prisma.bed.create({
              data: {
                roomId: room.id,
                bedNumber: bedNo,
                status: BedStatus.AVAILABLE,
                isOccupied: false,
              },
            });
          }
          allBeds.push(bed);
        }
      }
    }

    // Meal Schedules & Plans
    const existingMeal = await prisma.mealPlan.findFirst({ where: { pgId: pg.id } });
    if (!existingMeal) {
      await prisma.mealPlan.create({
        data: {
          pgId: pg.id,
          name: 'Standard 3-Meal Plan',
          price: 3500,
          description: 'Includes Breakfast, Lunch & Dinner with weekend specials.',
        },
      });
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      const existingSched = await prisma.mealSchedule.findFirst({ where: { pgId: pg.id, dayOfWeek: day } });
      if (!existingSched) {
        await prisma.mealSchedule.create({
          data: {
            pgId: pg.id,
            dayOfWeek: day,
            breakfastMenu: 'Idli, Sambar, Chutney & Tea/Coffee',
            lunchMenu: 'Roti, Dal Tadka, Rice, Veg Sabzi & Salad',
            snacksMenu: 'Samosa / Pakoda with Tea',
            dinnerMenu: 'Paneer Butter Masala, Roti, Rice & Gulab Jamun',
            calories: 2200,
            ratingAverage: 4.6,
          },
        });
      }
    }
  }
  console.log(`   ✅ 10 PGs created with ${allBeds.length} total beds.`);

  // 5. Residents, Users, Guardians, Agreements & Payments (200 Residents)
  console.log('📦 5. Seeding 200 Residents with complete relational trees...');
  const residentNames = [
    'Aarav Kumar', 'Ananya Sharma', 'Rohan Verma', 'Isha Gupta', 'Karan Patel',
    'Sneha Deshmukh', 'Aditya Roy', 'Pooja Hegde', 'Rahul Nair', 'Meera Joshi',
    'Tanvi Saxena', 'Varun Kapoor', 'Shruti Iyer', 'Gautam Menon', 'Divya Pillai'
  ];

  const availableBedsForSeeding = allBeds.filter((b) => !b.isOccupied);
  const targetResidentCount = Math.min(150, availableBedsForSeeding.length);

  for (let i = 0; i < targetResidentCount; i++) {
    const rName = `${residentNames[i % residentNames.length]} ${i + 1}`;
    const email = `resident${i + 1}@roombae.com`;
    const resCode = `RES${1001 + i}`;
    const rawPass = `Resident_${resCode}_Pass!`;
    const phone = i < 9 ? `+91900002000${i + 1}` : i === 9 ? `+919000020010` : `+9190000${String(10000 + i)}`;
    const bed = availableBedsForSeeding[i];
    const pg = dbPGs[i % dbPGs.length];
    const passwordHash = await bcrypt.hash(rawPass, 12);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: rName,
          email,
          phone,
          residentCode: resCode,
          passwordHash,
          role: 'RESIDENT',
          emailVerified: true,
          phoneVerified: true,
          accountStatus: 'ACTIVE',
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { residentCode: resCode, passwordHash, accountStatus: 'ACTIVE', emailVerified: true },
      });
    }

    let resident = await prisma.resident.findUnique({ where: { userId: user.id } });
    if (!resident) {
      resident = await prisma.resident.create({
        data: {
          userId: user.id,
          pgId: pg.id,
          bedId: bed.id,
          name: rName,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          age: 21 + (i % 6),
          phone,
          email,
          permanentAddress: `House No. ${i + 12}, Green Park Extension, New Delhi`,
          occupation: i % 2 === 0 ? 'Software Engineer' : 'MBA Student',
          college: i % 2 !== 0 ? 'Christ University' : null,
          company: i % 2 === 0 ? 'Infosys Ltd' : null,
          bloodGroup: 'O+',
          profilePicture: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/avatars/resident_${(i % 10) + 1}.webp`,
          moveInDate: new Date(Date.now() - (i * 3 + 10) * 24 * 60 * 60 * 1000),
          rentDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: ResidentStatus.ACTIVE,
        },
      });

      // Update Bed to Occupied
      await prisma.bed.update({
        where: { id: bed.id },
        data: { isOccupied: true, status: BedStatus.OCCUPIED },
      });
    }

    // Guardian
    const existingGuardian = await prisma.guardian.findUnique({ where: { residentId: resident.id } });
    if (!existingGuardian) {
      await prisma.guardian.create({
        data: {
          residentId: resident.id,
          name: `Father of ${rName.split(' ')[0]}`,
          relation: 'Father',
          phone: `+919811100${String(100 + i)}`,
          address: resident.permanentAddress || 'House No. 12, Green Park Extension, New Delhi',
        },
      });
    }

    // Emergency Contact
    const existingEmergency = await prisma.emergencyContact.findUnique({ where: { residentId: resident.id } });
    if (!existingEmergency) {
      await prisma.emergencyContact.create({
        data: {
          residentId: resident.id,
          name: `Mother of ${rName.split(' ')[0]}`,
          relation: 'Mother',
          phone: `+919822200${String(100 + i)}`,
        },
      });
    }

    // Document
    const existingDoc = await prisma.document.findFirst({ where: { residentId: resident.id } });
    if (!existingDoc) {
      await prisma.document.create({
        data: {
          residentId: resident.id,
          documentType: 'AADHAAR',
          documentNumber: `54326789012${i % 10}`,
          fileUrl: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/documents/aadhaar_res_${i + 1}.pdf`,
          isVerified: true,
        },
      });
    }

    // Agreement
    let agreement = await prisma.agreement.findFirst({ where: { residentId: resident.id } });
    if (!agreement) {
      agreement = await prisma.agreement.create({
        data: {
          agreementNumber: `AGR-2025-00${i + 1}`,
          residentId: resident.id,
          ownerId: pg.ownerId,
          pgId: pg.id,
          roomNumber: '101',
          bedNumber: bed.bedNumber,
          rentAmount: pg.rentStartingFrom,
          securityDeposit: pg.securityDeposit,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
          status: AgreementStatus.COMPLETED,
          contractPdfUrl: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/agreements/contract_${i + 1}.pdf`,
        },
      });

      // Agreement Version & Signature
      await prisma.agreementVersion.create({
        data: {
          agreementId: agreement.id,
          versionNumber: 1,
          contractHtml: '<h1>RoomBae Coliving Legal Rental Contract</h1><p>Standard terms and conditions apply.</p>',
        },
      });

      await prisma.signature.create({
        data: {
          agreementId: agreement.id,
          signerType: 'RESIDENT',
          signerName: resident.name,
          signatureDataSvg: '<svg>signature</svg>',
          ipAddress: '127.0.0.1',
          hashHmac: 'hmac_signature_hash_123',
        },
      });

      await prisma.verification.create({
        data: {
          agreementId: agreement.id,
          verificationCode: `VER-${agreement.id.slice(-6).toUpperCase()}`,
          ipAddress: '127.0.0.1',
        },
      });
    }

    // Payment & Invoice
    const existingPayment = await prisma.payment.findFirst({ where: { residentId: resident.id } });
    if (!existingPayment) {
      const p = await prisma.payment.create({
        data: {
          residentId: resident.id,
          pgId: pg.id,
          invoiceNumber: `INV-2025-00${i + 1}`,
          baseAmount: pg.rentStartingFrom,
          cgstAmount: pg.rentStartingFrom * 0.06,
          sgstAmount: pg.rentStartingFrom * 0.06,
          igstAmount: 0,
          totalAmount: pg.rentStartingFrom * 1.12,
          dueDate: new Date(),
          paymentMethod: 'UPI',
          status: PaymentStatus.PAID,
          razorpayPaymentId: `pay_RzP${i + 10000}`,
        },
      });

      await prisma.invoice.create({
        data: {
          paymentId: p.id,
          residentId: resident.id,
          pgId: pg.id,
          invoiceNumber: p.invoiceNumber,
          pdfUrl: `https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/documents/invoice_${i + 1}.pdf`,
        },
      });
    }

    // Attendance
    const existingAttendance = await prisma.attendance.findFirst({ where: { residentId: resident.id } });
    if (!existingAttendance) {
      await prisma.attendance.create({
        data: {
          residentId: resident.id,
          pgId: pg.id,
          date: new Date(),
          isPresent: true,
          checkInTime: new Date(Date.now() - 12 * 3600 * 1000),
        },
      });

      await prisma.checkIn.create({
        data: {
          residentId: resident.id,
          pgId: pg.id,
          checkInTime: new Date(Date.now() - 12 * 3600 * 1000),
          remarks: 'Standard Biometric Scan In',
        },
      });
    }

    // Complaints (for every 3rd resident)
    if (i % 3 === 0) {
      const existingComplaint = await prisma.complaint.findFirst({ where: { residentId: resident.id } });
      if (!existingComplaint) {
        const ticketCode = `TKT-2025-00${i + 1}`;
        const complaint = await prisma.complaint.create({
          data: {
            ticketCode,
            residentId: resident.id,
            pgId: pg.id,
            category: i % 2 === 0 ? 'Plumbing' : 'WiFi',
            title: i % 2 === 0 ? 'Bathroom Tap Leakage' : 'Slow Internet Speed in Room',
            description: 'Please send a technician to inspect and resolve.',
            priority: Priority.MEDIUM,
            status: TicketStatus.IN_PROGRESS,
            images: [`https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/complaints/complaint_${i + 1}.webp`],
          },
        });

        await prisma.complaintReply.create({
          data: {
            complaintId: complaint.id,
            senderName: 'Property Manager',
            senderRole: 'STAFF',
            message: 'Technician scheduled for visit at 4 PM today.',
          },
        });
      }
    }

    // Visitors (for every 4th resident)
    if (i % 4 === 0) {
      const existingVisitor = await prisma.visitor.findFirst({ where: { residentId: resident.id } });
      if (!existingVisitor) {
        await prisma.visitor.create({
          data: {
            passCode: `VPASS-2025-00${i + 1}`,
            residentId: resident.id,
            pgId: pg.id,
            visitorName: `Guest of ${rName.split(' ')[0]}`,
            visitorMobile: `+919777700${String(100 + i)}`,
            relation: 'Friend',
            visitDate: new Date(),
            timeSlot: '4:00 PM - 7:00 PM',
            status: PassStatus.APPROVED,
          },
        });
      }
    }
  }
  console.log(`   ✅ ${targetResidentCount} Residents fully connected!`);

  // 6. Maintenance & Analytics Records
  console.log('📦 6. Seeding Maintenance & Historical Analytics...');
  for (let i = 0; i < dbPGs.length; i++) {
    const pg = dbPGs[i];
    const existingMaint = await prisma.maintenance.findFirst({ where: { pgId: pg.id } });
    if (!existingMaint) {
      await prisma.maintenance.create({
        data: {
          pgId: pg.id,
          title: 'AC Servicing & Filter Replacement',
          vendorName: 'CoolAir Maintenance Pvt Ltd',
          cost: 4500,
          scheduleDate: new Date(),
          status: 'COMPLETED',
        },
      });
    }

    const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
    for (const m of months) {
      const existingAnalytics = await prisma.analytics.findFirst({ where: { pgId: pg.id, month: m } });
      if (!existingAnalytics) {
        await prisma.analytics.create({
          data: {
            pgId: pg.id,
            month: m,
            mrr: pg.rentStartingFrom * (pg.capacity * 0.8),
            occupancyRatePercent: 82.5,
            totalRevenue: pg.rentStartingFrom * (pg.capacity * 0.8),
            pendingDues: pg.rentStartingFrom * 2,
            resolvedComplaints: 14,
          },
        });
      }
    }
  }
  console.log('   ✅ Historical Analytics & Maintenance seeded.');

  // 7. Activity Logs, Login Histories & Notifications
  console.log('📦 7. Seeding Activity Logs, Notifications & Login Histories...');
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    const existingLog = await prisma.activityLog.findFirst({ where: { userId: firstUser.id } });
    if (!existingLog) {
      await prisma.activityLog.create({
        data: {
          userId: firstUser.id,
          action: 'USER_LOGIN',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: 'User authenticated via SMS OTP successfully.',
        },
      });
    }

    const existingNotif = await prisma.notification.findFirst({ where: { userId: firstUser.id } });
    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId: firstUser.id,
          title: 'Welcome to RoomBae Coliving!',
          message: 'Your rental agreement has been signed and verified.',
          type: 'AGREEMENT',
          isRead: false,
        },
      });
    }
  }
  console.log('   ✅ Notifications & System Logs ready.');

  console.log('\n====================================================');
  console.log('🎉 ROOMBAE MASTER DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ MASTER SEEDING FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
