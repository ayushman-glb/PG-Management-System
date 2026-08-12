import { PrismaClient, Role, ResidentStatus, PGStatus, FoodPreference, RoomType, WashroomType, ACType, PaymentStatus, Priority, TicketStatus, BedStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITY_COORDINATES: Record<string, { lat: number; lng: number; metro: string[]; colleges: string[]; companies: string[] }> = {
  Bengaluru: {
    lat: 12.9716,
    lng: 77.5946,
    metro: ['Indiranagar Metro', 'MG Road Metro', 'Koramangala Metro', 'Silk Board Metro'],
    colleges: ['Christ University', 'Jyoti Nivas College', 'NHCE Bangalore', 'PES University'],
    companies: ['Infosys Electronic City', 'Wipro Sarjapur', 'Google RMZ Ecoworld', 'Flipkart Embassy TechVillage']
  },
  Gurugram: {
    lat: 28.4595,
    lng: 77.0266,
    metro: ['Cyber City Rapid Metro', 'HUDA City Centre Metro', 'MG Road Gurgaon Metro'],
    colleges: ['Amity University Gurgaon', 'GD Goenka University', 'MDI Gurgaon'],
    companies: ['DLF Cyber City', 'Microsoft Horizon Center', 'Zomato HQ', 'Paytm DLF Phase 2']
  },
  Pune: {
    lat: 18.5204,
    lng: 73.8567,
    metro: ['Viman Nagar Metro', 'Hinjewadi Metro Line', 'Shivajinagar Metro'],
    colleges: ['FLAME University', 'Symbiosis International', 'COEP Pune', 'MIT WPU'],
    companies: ['TCIL Hinjewadi Phase 1', 'Barclays Kharadi', 'Cognizant EON IT Park']
  },
  Hyderabad: {
    lat: 17.3850,
    lng: 78.4867,
    metro: ['HITECH City Metro', 'Raidurg Metro', 'Gachibowli Metro'],
    colleges: ['IIIT Hyderabad', 'ISB Hyderabad', 'CBIT Hyderabad'],
    companies: ['Amazon HYD13', 'Microsoft Campus Gachibowli', 'TCS Synergy Park']
  }
};

const OWNER_SEEDS = [
  { name: 'Rajesh Sharma', city: 'Bengaluru', phone: '+919876543210', email: 'rajesh.owner@roombae.com', pass: 'Owner_Rajesh_1001!' },
  { name: 'Priya Venkatesh', city: 'Bengaluru', phone: '+919876543211', email: 'priya.owner@roombae.com', pass: 'Owner_Priya_1002!' },
  { name: 'Amitabh Malhotra', city: 'Gurugram', phone: '+919876543212', email: 'amitabh.owner@roombae.com', pass: 'Owner_Amitabh_1003!' },
  { name: 'Sunita Aggarwal', city: 'Gurugram', phone: '+919876543213', email: 'sunita.owner@roombae.com', pass: 'Owner_Sunita_1004!' },
  { name: 'Vikram Joshi', city: 'Pune', phone: '+919876543214', email: 'vikram.owner@roombae.com', pass: 'Owner_Vikram_1005!' },
  { name: 'Ananya Deshmukh', city: 'Pune', phone: '+919876543215', email: 'ananya.owner@roombae.com', pass: 'Owner_Ananya_1006!' },
  { name: 'Suresh Reddy', city: 'Hyderabad', phone: '+919876543216', email: 'suresh.owner@roombae.com', pass: 'Owner_Suresh_1007!' },
  { name: 'Kavitha Rao', city: 'Hyderabad', phone: '+919876543217', email: 'kavitha.owner@roombae.com', pass: 'Owner_Kavitha_1008!' },
  { name: 'Rohan Gupta', city: 'Bengaluru', phone: '+919876543218', email: 'rohan.owner@roombae.com', pass: 'Owner_Rohan_1009!' },
  { name: 'Meenakshi Sundaram', city: 'Bengaluru', phone: '+919876543219', email: 'meenakshi.owner@roombae.com', pass: 'Owner_Meenakshi_1010!' }
];

const COMPLAINT_TOPICS = [
  { category: 'WiFi', title: 'High Latency & Slow WiFi Speed in 3rd Floor', priority: Priority.HIGH },
  { category: 'Electrical', title: 'Ceiling Fan Making Squeaking Noise in Room 204', priority: Priority.MEDIUM },
  { category: 'Plumbing', title: 'Bathroom Water Leakage & Tap Dripping', priority: Priority.HIGH },
  { category: 'Appliance', title: 'AC Cooling Insufficient & Remote Battery Dead', priority: Priority.URGENT },
  { category: 'Mess', title: 'Mess Dinner Chapati Softness & Food Quality Issue', priority: Priority.MEDIUM },
  { category: 'Housekeeping', title: 'Laundry Collection Delay on Wednesday', priority: Priority.LOW },
  { category: 'Security', title: 'Noise Disturbance after 11 PM near Balcony', priority: Priority.MEDIUM },
  { category: 'Security', title: 'CCTV Camera 2 Blind Spot near Main Gate', priority: Priority.HIGH },
  { category: 'Housekeeping', title: 'Room Deep Cleaning Request post Rainy Season', priority: Priority.LOW },
  { category: 'Electrical', title: 'Power Socket Inoperative near Bed B', priority: Priority.MEDIUM }
];

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocalDB = dbUrl.startsWith('mongodb://localhost') || dbUrl.startsWith('mongodb://127.0.0.1');
  if (!isLocalDB) {
    console.error('❌ SEED REFUSED: DATABASE_URL does not look like a local/dev database.');
    console.error('   Only run seeds against localhost MongoDB. Current URL:', dbUrl.slice(0, 40) + '...');
    process.exit(1);
  }

  console.log('🚀 Starting Production-Grade RoomBae Database Seeding...');

  // Clean existing collections
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
  await prisma.agreement.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.emergencyContact.deleteMany({});
  await prisma.resident.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.pG.deleteMany({});
  await prisma.owner.deleteMany({});
  await prisma.user.deleteMany({});

  const saltRounds = 12;

  // 1. Seed Super Admin & Admin
  const superAdminSalt = await bcrypt.genSalt(saltRounds);
  const superAdminPassHash = await bcrypt.hash('SuperAdmin_RB_2026!', superAdminSalt);
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@roombae.com',
      phone: '+919900000001',
      passwordHash: superAdminPassHash,
      role: Role.SUPER_ADMIN,
      is2FAEnabled: true,
      emailVerified: true,
    }
  });

  const adminSalt = await bcrypt.genSalt(saltRounds);
  const adminPassHash = await bcrypt.hash('Admin_RoomBae_7890!', adminSalt);
  await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'admin@roombae.com',
      phone: '+919900000002',
      passwordHash: adminPassHash,
      role: Role.ADMIN,
      is2FAEnabled: true,
      emailVerified: true,
    }
  });

  let globalResidentCount = 0;

  // 2. Seed 10 Owners & properties
  for (let i = 0; i < OWNER_SEEDS.length; i++) {
    const ownerData = OWNER_SEEDS[i];
    const cityMeta = CITY_COORDINATES[ownerData.city];

    const ownerSalt = await bcrypt.genSalt(saltRounds);
    const ownerPassHash = await bcrypt.hash(ownerData.pass, ownerSalt);

    const user = await prisma.user.create({
      data: {
        name: ownerData.name,
        email: ownerData.email,
        phone: ownerData.phone,
        passwordHash: ownerPassHash,
        role: Role.OWNER,
        is2FAEnabled: false,
        emailVerified: true,
      }
    });

    const owner = await prisma.owner.create({
      data: {
        userId: user.id,
        name: ownerData.name,
        email: ownerData.email,
        phone: ownerData.phone,
        photo: `https://images.unsplash.com/photo-${1534528741775 + i}?w=400&auto=format&fit=crop&q=80`,
        address: `Suite ${101 + i}, Commercial Tower, ${ownerData.city}`,
        aadhaarNumber: `45218901234${i}`,
        panNumber: `ABCDE123${i}F`,
        upiId: `${ownerData.name.toLowerCase().replace(' ', '')}@okaxis`,
        bankName: 'HDFC Bank Enterprise',
        accountNumber: `5010023456789${i}`,
        ifscCode: 'HDFC0001234',
        emergencyContact: `+91912345678${i}`
      }
    });

    // 3. Create 3 PGs per owner (30 PGs total)
    for (let p = 1; p <= 3; p++) {
      const pgName = `${ownerData.name.split(' ')[0]}'s ${p === 1 ? 'Executive' : p === 2 ? 'Luxury' : 'Premier'} PG ${ownerData.city}`;
      const slug = `${ownerData.name.toLowerCase().split(' ')[0]}-pg-${ownerData.city.toLowerCase()}-${p}`;

      const pg = await prisma.pG.create({
        data: {
          ownerId: owner.id,
          name: pgName,
          slug,
          logo: `https://images.unsplash.com/photo-${1560518883 + p}?w=200&auto=format&fit=crop&q=80`,
          galleryImages: [
            `https://images.unsplash.com/photo-${1522708323590 + p}?w=800&auto=format&fit=crop&q=80`,
            `https://images.unsplash.com/photo-${1502672260266 + p}?w=800&auto=format&fit=crop&q=80`
          ],
          description: `Luxury co-living PG with premium amenities, high-speed optical fiber WiFi, and 24/7 security in ${ownerData.city}.`,
          amenities: ['WiFi', 'Laundry', 'CCTV', 'Power Backup', 'Lift', 'Mess', 'Security', 'Gym', 'Biometric Gate'],
          rules: ['No loud music after 10 PM', 'Visitors allowed in common areas till 8 PM', 'Biometric check-in mandatory'],
          rentStartingFrom: 8500 + (p * 1500),
          securityDeposit: 15000,
          latitude: cityMeta.lat + (p * 0.005),
          longitude: cityMeta.lng + (p * 0.005),
          address: `Plot ${12 + p}, Sector ${4 + i}, ${ownerData.city}`,
          city: ownerData.city,
          pincode: '560038',
          nearbyColleges: cityMeta.colleges,
          nearbyCompanies: cityMeta.companies,
          nearbyMetro: cityMeta.metro,
          capacity: 48,
          currentOccupancy: 0,
          availableBeds: 48,
          status: PGStatus.ACTIVE
        }
      });

      // Create Building, Floor, Rooms, Beds
      const building = await prisma.building.create({
        data: { pgId: pg.id, name: 'Main Block', floorsCount: 3 }
      });

      for (let f = 1; f <= 3; f++) {
        const floor = await prisma.floor.create({
          data: { buildingId: building.id, floorNumber: f }
        });

        for (let r = 1; r <= 4; r++) {
          const roomNum = `${f}0${r}`;
          const room = await prisma.room.create({
            data: {
              floorId: floor.id,
              roomNumber: roomNum,
              roomType: r % 2 === 0 ? RoomType.DOUBLE : RoomType.TRIPLE,
              rentAmount: 9000 + (r * 500),
              washroomType: WashroomType.ATTACHED,
              acType: ACType.AC
            }
          });

          // Create Beds & Residents
          const bedCount = r % 2 === 0 ? 2 : 3;
          for (let b = 1; b <= bedCount; b++) {
            const bedName = `Bed ${String.fromCharCode(64 + b)}`;
            globalResidentCount++;
            const resCode = `RES${1000 + globalResidentCount}`;
            const resEmail = `resident${globalResidentCount}@roombae.com`;
            const resPass = `Resident_RES${1000 + globalResidentCount}_Pass!`;

            const resSalt = await bcrypt.genSalt(saltRounds);
            const resPassHash = await bcrypt.hash(resPass, resSalt);

            const resUser = await prisma.user.create({
              data: {
                name: `Resident ${globalResidentCount} (${ownerData.city})`,
                email: resEmail,
                phone: `+9190000${String(10000 + globalResidentCount).padStart(5, '0')}`,
                residentCode: resCode,
                passwordHash: resPassHash,
                role: Role.RESIDENT,
                is2FAEnabled: false,
                emailVerified: true,
              }
            });

            const bed = await prisma.bed.create({
              data: {
                roomId: room.id,
                bedNumber: `${roomNum}-${bedName}`,
                status: b === 1 ? BedStatus.OCCUPIED : BedStatus.AVAILABLE,
                isOccupied: b === 1
              }
            });

            if (b === 1) {
              const resident = await prisma.resident.create({
                data: {
                  userId: resUser.id,
                  pgId: pg.id,
                  bedId: bed.id,
                  name: resUser.name,
                  email: resUser.email,
                  phone: resUser.phone || "+919000000000",
                  bloodGroup: 'O+',
                  foodPreference: FoodPreference.VEG,
                  status: ResidentStatus.ACTIVE,
                  rentDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5)
                }
              });

              // Create Payment & Invoice
              const payment = await prisma.payment.create({
                data: {
                  residentId: resident.id,
                  pgId: pg.id,
                  invoiceNumber: `INV-${pg.id.slice(-4)}-${1000 + globalResidentCount}`,
                  baseAmount: room.rentAmount,
                  cgstAmount: parseFloat((room.rentAmount * 0.09).toFixed(2)),
                  sgstAmount: parseFloat((room.rentAmount * 0.09).toFixed(2)),
                  igstAmount: 0,
                  totalAmount: parseFloat((room.rentAmount * 1.18).toFixed(2)),
                  dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
                  paymentMethod: 'UPI_ONLINE',
                  status: PaymentStatus.PAID
                }
              });

              await prisma.invoice.create({
                data: {
                  paymentId: payment.id,
                  residentId: resident.id,
                  pgId: pg.id,
                  invoiceNumber: payment.invoiceNumber,
                  pdfUrl: `https://roombae-documents.s3.amazonaws.com/invoices/${payment.invoiceNumber}.pdf`
                }
              });
            }
          }
        }
      }

      // 4. Create Complaints
      const residentFirst = await prisma.resident.findFirst({ where: { pgId: pg.id } });
      if (residentFirst) {
        for (let c = 0; c < 2; c++) {
          const topic = COMPLAINT_TOPICS[c % COMPLAINT_TOPICS.length];
          await prisma.complaint.create({
            data: {
              ticketCode: `TICK-${pg.id.slice(-4)}-${100 + c}`,
              residentId: residentFirst.id,
              pgId: pg.id,
              category: topic.category,
              title: topic.title,
              description: `Detailed report: ${topic.title}. Requires facility management review.`,
              priority: topic.priority,
              status: TicketStatus.OPEN,
              assignedStaff: 'Ramesh Maintenance Engineer'
            }
          });
        }
      }
    }
  }

  console.log(`✅ RoomBae Database Seeding Completed Successfully!`);
  console.log(`   Seeded 1 Super Admin, 1 Admin, 10 Owners, 30 PGs, & ${globalResidentCount} Residents.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
