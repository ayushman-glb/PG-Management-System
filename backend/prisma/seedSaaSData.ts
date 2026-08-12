import { PrismaClient, Role, ResidentStatus, PGStatus, OwnerKYCStatus, BusinessType, PropertyType, PropertyOwnershipType, SubscriptionPlanType, SubscriptionStatus, FineType, FineCalculationType, FineStatus, DraftStatus, RoomType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSaaSData() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocalDB = dbUrl.startsWith('mongodb://localhost') || dbUrl.startsWith('mongodb://127.0.0.1');
  if (!isLocalDB) {
    console.error('❌ SEED REFUSED: DATABASE_URL does not look like a local/dev database.');
    console.error('   Only run seeds against localhost MongoDB. Current URL:', dbUrl.slice(0, 40) + '...');
    process.exit(1);
  }

  console.log('🌱 Starting RoomBae SaaS Platform Data Seeding...');

  // Create 10 Verified Owners
  for (let i = 1; i <= 10; i++) {
    const email = `owner${i}@roombae.com`;
    const name = [
      'Rajesh Kumar', 'Anil Sharma', 'Sunita Reddy', 'Vikramaditya Rao', 'Meenakshi Iyer',
      'Suresh Menon', 'Pooja Agarwal', 'Manish Gupta', 'Rohan Deshmukh', 'Kavita Verma'
    ][i - 1];

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        role: Role.OWNER,
        phone: `+91 98765 4321${i - 1}`,
        passwordHash: '$2a$10$xB8nPGQdM2lKhzU07wn3XOzKKbz36pQ4cLoPOgsXu6.yL2CVxqTvG' // Password: Password123!
      },
      update: {}
    });

    const owner = await prisma.owner.upsert({
      where: { email },
      create: {
        userId: user.id,
        name,
        photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        email,
        phone: user.phone || '+91 98765 43210',
        address: `${100 + i}, HSR Layout, Sector ${i}, Bengaluru, Karnataka`,
        aadhaarNumber: `5432-8765-${1000 + i}`,
        panNumber: `ABCDE${1000 + i}F`,
        upiId: `owner${i}@okaxis`,
        bankName: 'HDFC Bank',
        accountNumber: `5010049283740${i}`,
        ifscCode: 'HDFC0001234',
        emergencyContact: '+91 98765 00000',
        bio: 'Premium PG & Co-living Space Owner in South Bengaluru'
      },
      update: {}
    });

    // KYC Record
    await prisma.ownerKYC.upsert({
      where: { ownerId: owner.id },
      create: {
        ownerId: owner.id,
        aadhaarNumber: owner.aadhaarNumber,
        panNumber: owner.panNumber,
        verificationStatus: OwnerKYCStatus.VERIFIED,
        verifiedAt: new Date()
      },
      update: {}
    });

    // Business Profile
    await prisma.business.upsert({
      where: { ownerId: owner.id },
      create: {
        ownerId: owner.id,
        businessName: `${name} Hospitality & Stays`,
        businessType: BusinessType.INDIVIDUAL,
        gstin: `29ABCDE${1000 + i}F1Z5`,
        businessAddress: owner.address,
        businessEmail: email,
        businessPhone: owner.phone
      },
      update: {}
    });

    // Subscription
    const planTypes: SubscriptionPlanType[] = [SubscriptionPlanType.STARTER, SubscriptionPlanType.PROFESSIONAL, SubscriptionPlanType.BUSINESS, SubscriptionPlanType.ENTERPRISE];
    const plan = planTypes[i % planTypes.length];
    await prisma.subscription.upsert({
      where: { ownerId: owner.id },
      create: {
        ownerId: owner.id,
        planType: plan,
        status: SubscriptionStatus.ACTIVE,
        maxResidents: plan === SubscriptionPlanType.STARTER ? 30 : 100,
        maxProperties: 5,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000)
      },
      update: {}
    });

    // Create 3 PGs per owner
    for (let p = 1; p <= 3; p++) {
      const pgName = `RoomBae ${name.split(' ')[0]} Stays - PG ${p}`;
      const slug = `roombae-${name.split(' ')[0].toLowerCase()}-pg-${p}-${owner.id.slice(-4)}`;

      const pg = await prisma.pG.upsert({
        where: { slug },
        create: {
          ownerId: owner.id,
          name: pgName,
          slug,
          logo: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300',
          galleryImages: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
          description: `Luxury executive PG for working professionals and students in Bengaluru.`,
          amenities: ['WiFi', 'Laundry', 'CCTV', 'Power Backup', 'Lift', 'Mess', 'RO Water', 'Geyser'],
          rules: ['No Smoking', 'No Alcohol', 'Visitor Lobby Access Till 8 PM'],
          rentStartingFrom: 8500,
          securityDeposit: 17000,
          latitude: 12.9716 + i * 0.01,
          longitude: 77.5946 + p * 0.01,
          address: `${p * 12}, 100 Feet Road, Indiranagar`,
          city: 'Bengaluru',
          pincode: '560038',
          capacity: 30,
          currentOccupancy: 20,
          availableBeds: 10,
          status: PGStatus.ACTIVE,
          draftStatus: DraftStatus.APPROVED,
          propertyType: PropertyType.PG,
          ownershipType: PropertyOwnershipType.OWNED,
          caretakerName: 'Santhosh Kumar',
          caretakerPhone: '+91 99887 76655'
        },
        update: {}
      });

      // Add Fine Rules
      await prisma.fineRule.createMany({
        data: [
          { pgId: pg.id, fineType: FineType.LATE_RENT, calculationType: FineCalculationType.FLAT, amount: 500, gracePeriodDays: 3 },
          { pgId: pg.id, fineType: FineType.DAMAGE, calculationType: FineCalculationType.FLAT, amount: 1500, gracePeriodDays: 0 },
          { pgId: pg.id, fineType: FineType.CLEANING, calculationType: FineCalculationType.FLAT, amount: 300, gracePeriodDays: 0 }
        ]
      }).catch(() => {});
    }
  }

  console.log('✅ RoomBae SaaS Platform Seeded Successfully!');
}

if (require.main === module) {
  seedSaaSData()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
