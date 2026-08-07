import { PrismaClient, Role, ResidentStatus, PGStatus, HoldStatus, LeaveStatus, FoodPreference, RoomType, WashroomType, ACType, PaymentStatus, Priority, TicketStatus, PassStatus } from '@prisma/client';
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
  { name: 'Rajesh Sharma', city: 'Bengaluru', phone: '+919876543210', email: 'rajesh.owner@roombae.com' },
  { name: 'Priya Venkatesh', city: 'Bengaluru', phone: '+919876543211', email: 'priya.owner@roombae.com' },
  { name: 'Amitabh Malhotra', city: 'Gurugram', phone: '+919876543212', email: 'amitabh.owner@roombae.com' },
  { name: 'Sunita Aggarwal', city: 'Gurugram', phone: '+919876543213', email: 'sunita.owner@roombae.com' },
  { name: 'Vikram Joshi', city: 'Pune', phone: '+919876543214', email: 'vikram.owner@roombae.com' },
  { name: 'Ananya Deshmukh', city: 'Pune', phone: '+919876543215', email: 'ananya.owner@roombae.com' },
  { name: 'Suresh Reddy', city: 'Hyderabad', phone: '+919876543216', email: 'suresh.owner@roombae.com' },
  { name: 'Kavitha Rao', city: 'Hyderabad', phone: '+919876543217', email: 'kavitha.owner@roombae.com' },
  { name: 'Rohan Gupta', city: 'Bengaluru', phone: '+919876543218', email: 'rohan.owner@roombae.com' },
  { name: 'Meenakshi Sundaram', city: 'Bengaluru', phone: '+919876543219', email: 'meenakshi.owner@roombae.com' }
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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function main() {
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

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  let globalResidentCount = 0;

  // 1. Seed 10 Owners
  for (let i = 0; i < OWNER_SEEDS.length; i++) {
    const ownerData = OWNER_SEEDS[i];
    const cityMeta = CITY_COORDINATES[ownerData.city];

    const user = await prisma.user.create({
      data: {
        name: ownerData.name,
        email: ownerData.email,
        phone: ownerData.phone,
        passwordHash: defaultPasswordHash,
        role: Role.OWNER,
        is2FAEnabled: true
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
        emergencyContact: '+919123456789',
        bio: `Senior Hospitality Executive & PG Property Manager in ${ownerData.city} with 10+ years operational experience.`
      }
    });

    // Seed 3-4 PGs per Owner
    const pgsToCreate = 3 + (i % 2); // 3 or 4 PGs
    for (let p = 1; p <= pgsToCreate; p++) {
      const pgName = `RoomBae Executive Living ${ownerData.city} ${p}`;
      const slug = `roombae-${ownerData.city.toLowerCase()}-owner${i + 1}-pg${p}`;

      const pg = await prisma.pG.create({
        data: {
          ownerId: owner.id,
          name: pgName,
          slug,
          logo: `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop&q=80`,
          galleryImages: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'
          ],
          description: `Premium co-living luxury PG in prime locality of ${ownerData.city}. Features high-speed WiFi, daily housekeeping, biometric security, and gourmet 3-meal mess service.`,
          amenities: ['WiFi', 'Laundry', 'Parking', 'CCTV', 'Power Backup', 'Lift', 'Mess', 'Security', 'Gaming Lounge', 'Gym'],
          rules: ['No loud music after 10 PM', 'Visitors allowed till 8 PM in common areas', 'Biometric check-in mandatory'],
          rentStartingFrom: 9500,
          securityDeposit: 15000,
          latitude: cityMeta.lat + (Math.random() * 0.05 - 0.025),
          longitude: cityMeta.lng + (Math.random() * 0.05 - 0.025),
          address: `${p * 12}, Tech Park Outer Ring Road, ${ownerData.city}`,
          city: ownerData.city,
          pincode: '560103',
          nearbyColleges: cityMeta.colleges,
          nearbyCompanies: cityMeta.companies,
          nearbyMetro: cityMeta.metro,
          capacity: 72,
          currentOccupancy: 35,
          availableBeds: 37,
          status: PGStatus.ACTIVE
        }
      });

      // Seed 7-Day Meal Schedule
      for (const day of DAYS_OF_WEEK) {
        await prisma.mealSchedule.create({
          data: {
            pgId: pg.id,
            dayOfWeek: day,
            breakfastMenu: day === 'Sunday' ? 'Masala Dosa, Sambar, Coconut Chutney, Tea/Coffee' : 'Idli Vada, Sambar, Tea/Coffee',
            lunchMenu: day === 'Sunday' ? 'Paneer Butter Masala, Veg Biryani, Raita, Gulab Jamun' : 'Dal Tadka, Mix Veg Curry, Rice, Roti, Salad',
            snacksMenu: 'Veg Cutlet / Samosa & Hot Filter Coffee',
            dinnerMenu: 'Rajma Masala, Jeera Rice, Chapati, Kheer',
            calories: 2100,
            isSpecialDay: day === 'Sunday',
            specialDetails: day === 'Sunday' ? 'Chef Special Dessert & Biryani Delight' : null,
            ratingAverage: 4.6
          }
        });
      }

      // Seed Building -> 3 Floors -> 8 Rooms -> 3 Beds = 72 beds per PG
      const building = await prisma.building.create({
        data: {
          pgId: pg.id,
          name: 'Main Block A',
          floorsCount: 3
        }
      });

      let pgResidentCount = 0;

      for (let f = 1; f <= 3; f++) {
        const floor = await prisma.floor.create({
          data: {
            buildingId: building.id,
            floorNumber: f
          }
        } as any);

        for (let r = 1; r <= 8; r++) {
          const roomNum = `${f}0${r}`;
          const room = await prisma.room.create({
            data: {
              floorId: floor.id,
              roomNumber: roomNum,
              roomType: r % 2 === 0 ? RoomType.DOUBLE : RoomType.TRIPLE,
              acType: r % 3 === 0 ? ACType.AC : ACType.NON_AC,
              washroomType: WashroomType.ATTACHED,
              rentAmount: 8500 + (r * 300)
            }
          });

          for (let b = 1; b <= 3; b++) {
            const bedNum = `${roomNum}-${String.fromCharCode(64 + b)}`;
            const isOccupied = pgResidentCount < 35; // 35 residents per PG

            const bed = await prisma.bed.create({
              data: {
                roomId: room.id,
                bedNumber: bedNum,
                isOccupied
              }
            });

            if (isOccupied) {
              pgResidentCount++;
              globalResidentCount++;

              const residentUser = await prisma.user.create({
                data: {
                  name: `Resident ${globalResidentCount}`,
                  email: `resident${globalResidentCount}@roombae.com`,
                  phone: `+9198000${String(globalResidentCount).padStart(5, '0')}`,
                  passwordHash: defaultPasswordHash,
                  residentCode: `RES${1000 + globalResidentCount}`,
                  role: Role.RESIDENT
                }
              });

              const resident = await prisma.resident.create({
                data: {
                  userId: residentUser.id,
                  pgId: pg.id,
                  bedId: bed.id,
                  profilePicture: `https://images.unsplash.com/photo-${1500000000000 + (globalResidentCount % 100)}?w=300&auto=format&fit=crop&q=80`,
                  name: `Resident ${globalResidentCount}`,
                  gender: globalResidentCount % 2 === 0 ? 'Male' : 'Female',
                  age: 21 + (globalResidentCount % 6),
                  phone: residentUser.phone!,
                  email: residentUser.email,
                  permanentAddress: `House #${globalResidentCount}, Model Town, ${ownerData.city}`,
                  college: globalResidentCount % 2 === 0 ? cityMeta.colleges[0] : null,
                  company: globalResidentCount % 2 !== 0 ? cityMeta.companies[0] : null,
                  occupation: globalResidentCount % 2 === 0 ? 'Student' : 'Software Engineer',
                  bloodGroup: 'O+',
                  foodPreference: globalResidentCount % 3 === 0 ? FoodPreference.JAIN : FoodPreference.VEG,
                  moveInDate: new Date('2026-01-15'),
                  rentDueDate: new Date('2026-08-05'),
                  status: globalResidentCount % 10 === 0 ? ResidentStatus.ON_LEAVE : ResidentStatus.ACTIVE
                }
              });

              // Create Guardian
              await prisma.guardian.create({
                data: {
                  residentId: resident.id,
                  name: `Parent of Resident ${globalResidentCount}`,
                  relation: 'Father',
                  phone: `+9191000${String(globalResidentCount).padStart(5, '0')}`,
                  address: `House #${globalResidentCount}, Model Town, ${ownerData.city}`
                }
              });

              // Create Payment
              await prisma.payment.create({
                data: {
                  residentId: resident.id,
                  pgId: pg.id,
                  invoiceNumber: `INV-2026-${1000 + globalResidentCount}`,
                  baseAmount: 8500,
                  cgstAmount: 765,
                  sgstAmount: 765,
                  igstAmount: 0,
                  totalAmount: 10030,
                  dueDate: new Date('2026-08-05'),
                  paymentMethod: 'RAZORPAY',
                  status: PaymentStatus.PAID
                }
              });
            }
          }
        }
      }

      // Seed 5 Complaints per PG
      for (let c = 0; c < 5; c++) {
        const topic = COMPLAINT_TOPICS[c % COMPLAINT_TOPICS.length];
        const residentFirst = await prisma.resident.findFirst({ where: { pgId: pg.id } });
        if (residentFirst) {
          await prisma.complaint.create({
            data: {
              ticketCode: `TICK-${pg.id.slice(-4)}-${100 + c}`,
              residentId: residentFirst.id,
              pgId: pg.id,
              category: topic.category,
              title: topic.title,
              description: `Detailed report: ${topic.title}. Requires immediate facility management review.`,
              priority: topic.priority,
              status: TicketStatus.OPEN,
              assignedStaff: 'Ramesh Maintenance Engineer'
            }
          });
        }
      }
    }
  }

  console.log(`✅ RoomBae Database Seeding Completed Successfully! Seeded 10 Owners, 35 PGs, & ${globalResidentCount} Residents.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
