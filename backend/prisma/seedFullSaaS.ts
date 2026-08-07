import { PrismaClient, Role, ResidentStatus, PGStatus, OwnerKYCStatus, BusinessType, PropertyType, PropertyOwnershipType, SubscriptionPlanType, SubscriptionStatus, FineType, FineCalculationType, FineStatus, DraftStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFullSaaS() {
  console.log('🌱 Starting RoomBae Enterprise Full-Stack Data Seeding (20 Owners, 100 Residents)...');

  const indianCities = [
    { city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
    { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { city: 'Delhi NCR', state: 'Delhi', pincode: '110001' },
    { city: 'Hyderabad', state: 'Telangana', pincode: '500081' },
    { city: 'Pune', state: 'Maharashtra', pincode: '411057' }
  ];

  const firstNames = ['Rajesh', 'Anil', 'Priya', 'Sunita', 'Vikram', 'Meenakshi', 'Suresh', 'Pooja', 'Manish', 'Kavita', 'Rohan', 'Sneha', 'Amit', 'Neha', 'Rahul', 'Deepak', 'Ananya', 'Karan', 'Tarun', 'Swati'];
  const lastNames = ['Kumar', 'Sharma', 'Reddy', 'Iyer', 'Rao', 'Menon', 'Agarwal', 'Gupta', 'Deshmukh', 'Verma', 'Joshi', 'Chawla', 'Patel', 'Singh', 'Nair', 'Kulkarni', 'Bhat', 'Dube', 'Saxena', 'Mehta'];

  // Seed 20 Owners
  const createdOwners = [];
  for (let i = 1; i <= 20; i++) {
    const fname = firstNames[(i - 1) % firstNames.length];
    const lname = lastNames[(i - 1) % lastNames.length];
    const name = `${fname} ${lname}`;
    const email = `owner${i}@roombae.com`;
    const phone = `+91 98765 432${i < 10 ? '0' + i : i}`;
    const loc = indianCities[i % indianCities.length];

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        role: Role.OWNER,
        phone,
        phoneVerified: true,
        emailVerified: true,
        passwordHash: '$2a$10$xB8nPGQdM2lKhzU07wn3XOzKKbz36pQ4cLoPOgsXu6.yL2CVxqTvG' // Password123!
      },
      update: {
        passwordHash: '$2a$10$xB8nPGQdM2lKhzU07wn3XOzKKbz36pQ4cLoPOgsXu6.yL2CVxqTvG'
      }
    });

    const owner = await prisma.owner.upsert({
      where: { email },
      create: {
        userId: user.id,
        name,
        photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        email,
        phone,
        address: `${100 + i}, Main Road, ${loc.city}`,
        aadhaarNumber: `5432-8765-${1000 + i}`,
        panNumber: `ABCDE${1000 + i}F`,
        upiId: `owner${i}@okaxis`,
        bankName: 'HDFC Bank',
        accountNumber: `5010049283740${i}`,
        ifscCode: 'HDFC0001234',
        emergencyContact: '+91 98765 00000',
        bio: `Owner of premier co-living spaces in ${loc.city}`
      },
      update: {}
    });

    createdOwners.push(owner);
  }

  // Seed 10 PGs across the first 10 owners
  const createdBeds = [];
  const createdPGs = [];
  for (let p = 1; p <= 10; p++) {
    const owner = createdOwners[p - 1];
    const loc = indianCities[p % indianCities.length];
    const slug = `roombae-${owner.name.split(' ')[0].toLowerCase()}-pg-${p}`;

    const pg = await prisma.pG.upsert({
      where: { slug },
      create: {
        ownerId: owner.id,
        name: `RoomBae ${owner.name.split(' ')[0]} Executive Stays`,
        slug,
        logo: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300',
        galleryImages: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
        description: `Luxury co-living residence for professionals in ${loc.city}`,
        amenities: ['WiFi', 'Laundry', 'CCTV', 'Power Backup', 'Lift', 'Mess', 'RO Water', 'Geyser'],
        rules: ['No Smoking', 'No Alcohol'],
        rentStartingFrom: 8500,
        securityDeposit: 17000,
        latitude: 12.9716 + p * 0.005,
        longitude: 77.5946 + p * 0.005,
        address: `${p * 10}, Tech Park Avenue`,
        city: loc.city,
        pincode: loc.pincode,
        capacity: 10,
        currentOccupancy: 10,
        availableBeds: 0,
        status: PGStatus.ACTIVE,
        draftStatus: DraftStatus.APPROVED,
        propertyType: PropertyType.PG,
        ownershipType: PropertyOwnershipType.OWNED
      },
      update: {}
    });

    createdPGs.push(pg);

    // Create Building & Floor
    const building = await prisma.building.create({
      data: { pgId: pg.id, name: 'Block A', floorsCount: 2 }
    }).catch(() => null);

    if (building) {
      const floor = await prisma.floor.create({
        data: { buildingId: building.id, floorNumber: 1 }
      });

      for (let r = 1; r <= 5; r++) {
        const room = await prisma.room.create({
          data: {
            floorId: floor.id,
            roomNumber: `10${r}`,
            roomType: 'DOUBLE',
            acType: 'AC',
            washroomType: 'ATTACHED',
            rentAmount: 8500
          }
        });

        for (let b = 1; b <= 2; b++) {
          const bed = await prisma.bed.create({
            data: {
              roomId: room.id,
              bedNumber: `10${r}-${b === 1 ? 'A' : 'B'}`,
              status: 'OCCUPIED',
              isOccupied: true
            }
          });
          createdBeds.push({ bed, pg });
        }
      }
    }
  }

  // Seed 100 Residents
  console.log('🌱 Seeding 100 Residents across 10 PGs...');
  for (let r = 1; r <= 100; r++) {
    const fname = firstNames[r % firstNames.length];
    const lname = lastNames[r % lastNames.length];
    const name = `${fname} ${lname} ${r}`;
    const email = `resident${r}@roombae.com`;
    const phone = `+91 91234 ${50000 + r}`;
    const residentCode = `RES${1000 + r}`;

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        role: Role.RESIDENT,
        residentCode,
        phone,
        phoneVerified: true,
        emailVerified: true,
        passwordHash: '$2a$10$xB8nPGQdM2lKhzU07wn3XOzKKbz36pQ4cLoPOgsXu6.yL2CVxqTvG'
      },
      update: {
        passwordHash: '$2a$10$xB8nPGQdM2lKhzU07wn3XOzKKbz36pQ4cLoPOgsXu6.yL2CVxqTvG'
      }
    });

    const bedObj = createdBeds[(r - 1) % createdBeds.length];

    if (bedObj) {
      await prisma.resident.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          pgId: bedObj.pg.id,
          bedId: bedObj.bed.id,
          name,
          gender: r % 2 === 0 ? 'MALE' : 'FEMALE',
          age: 22 + (r % 8),
          phone,
          email,
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          permanentAddress: '100 Street, Bengaluru',
          bloodGroup: 'O+',
          moveInDate: new Date(),
          rentDueDate: new Date(Date.now() + 30 * 86400000),
          status: ResidentStatus.ACTIVE,

          foodPreference: r % 2 === 0 ? 'VEG' : 'NON_VEG',
          occupation: 'Software Engineer',
          company: 'TechCorp India'

        },
        update: {}
      }).catch(() => {});
    }
  }

  // Seed Sample OtpTokens
  await prisma.otpToken.createMany({
    data: [
      { phone: '+91 98765 43210', otp: '123456', purpose: 'PHONE_VERIFICATION', expiresAt: new Date(Date.now() + 300000), verified: true },
      { email: 'owner1@roombae.com', otp: '654321', purpose: 'EMAIL_VERIFICATION', expiresAt: new Date(Date.now() + 300000), verified: true }
    ]
  }).catch(() => {});

  console.log('✅ RoomBae Enterprise Database Seeded Successfully (20 Owners, 100 Residents, 10 PGs)!');
}

if (require.main === module) {
  seedFullSaaS()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
