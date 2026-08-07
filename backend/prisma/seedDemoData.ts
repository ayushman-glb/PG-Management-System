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
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Demo data seeder for the RoomBae PG Management System.
 * Pushes realistic demo data into the database so the live frontend
 * renders real backend data (properties, rooms, beds, residents, payments).
 */
export async function seedDemoData() {
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  const ownerUser = await prisma.user.upsert({
    where: { email: "owner1@roombae.com" },
    update: {},
    create: {
      name: "Demo Owner",
      email: "owner1@roombae.com",
      phone: "+919876543210",
      passwordHash: defaultPasswordHash,
      role: Role.OWNER,
      is2FAEnabled: false,
    },
  });

  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      name: "Demo Owner",
      email: "owner1@roombae.com",
      phone: "+919876543210",
      photo:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      address: "Suite 101, Indiranagar, Bengaluru",
      aadhaarNumber: "452189012345",
      panNumber: "ABCDE1234F",
      upiId: "demoowner@okaxis",
      bankName: "HDFC Bank",
      accountNumber: "5010023456789",
      ifscCode: "HDFC0001234",
      emergencyContact: "+919123456789",
    },
  });

  const pg = await prisma.pG.upsert({
    where: { slug: "demopg-bengaluru-1" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Demo PG Executive Living Bengaluru",
      slug: "demopg-bengaluru-1",
      logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200",
      galleryImages: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ],
      description:
        "Premium co-living PG in Indiranagar with high-speed WiFi and gourmet mess.",
      amenities: [
        "WiFi",
        "Laundry",
        "CCTV",
        "Power Backup",
        "Lift",
        "Mess",
        "Security",
      ],
      rules: [
        "No loud music after 10 PM",
        "Visitors till 8 PM",
        "Biometric check-in mandatory",
      ],
      rentStartingFrom: 9500,
      securityDeposit: 15000,
      latitude: 12.9716,
      longitude: 77.5946,
      address: "12, Tech Park Outer Ring Road, Bengaluru",
      city: "Bengaluru",
      pincode: "560103",
      capacity: 24,
      currentOccupancy: 12,
      availableBeds: 12,
      status: PGStatus.ACTIVE,
      totalRoomsCount: 8,
      totalBedsCount: 24,
      floorCount: 2,
      buildingCount: 1,
    },
  });

  // Create building -> floors -> rooms -> beds
  const building = await prisma.building.upsert({
    where: {
      id:
        (await prisma.building.findFirst({ where: { pgId: pg.id } }))?.id ||
        "000000000000000000000000",
    },
    update: {},
    create: {
      pgId: pg.id,
      name: "Main Block",
      floorsCount: 2,
    },
  });

  let residentCount = 0;
  for (let f = 1; f <= 2; f++) {
    const floor = await prisma.floor.create({
      data: { buildingId: building.id, floorNumber: f },
    } as any);

    for (let r = 1; r <= 4; r++) {
      const roomNum = `${f}0${r}`;
      const room = await prisma.room.create({
        data: {
          floorId: floor.id,
          roomNumber: roomNum,
          roomType: r % 2 === 0 ? RoomType.DOUBLE : RoomType.TRIPLE,
          acType: ACType.NON_AC,
          washroomType: WashroomType.ATTACHED,
          rentAmount: 8500 + r * 300,
        },
      });

      for (let b = 1; b <= 3; b++) {
        const bedNum = `${roomNum}-${String.fromCharCode(64 + b)}`;
        const isOccupied = residentCount < 12;

        const bed = await prisma.bed.create({
          data: { roomId: room.id, bedNumber: bedNum, isOccupied },
        });

        if (isOccupied) {
          residentCount++;
          const residentUser = await prisma.user.create({
            data: {
              name: `Resident ${residentCount}`,
              email: `resident${residentCount}@roombae.com`,
              phone: `+9198000${String(residentCount).padStart(5, "0")}`,
              passwordHash: defaultPasswordHash,
              residentCode: `RES${1000 + residentCount}`,
              role: Role.RESIDENT,
            },
          });

          const resident = await prisma.resident.create({
            data: {
              userId: residentUser.id,
              pgId: pg.id,
              bedId: bed.id,
              profilePicture:
                "https://images.unsplash.com/photo-1500000000000?w=300",
              name: `Resident ${residentCount}`,
              gender: residentCount % 2 === 0 ? "Male" : "Female",
              age: 21 + (residentCount % 6),
              phone: residentUser.phone!,
              email: residentUser.email,
              permanentAddress: `House #${residentCount}, Model Town, Bengaluru`,
              college: residentCount % 2 === 0 ? "Christ University" : null,
              company: residentCount % 2 !== 0 ? "Infosys" : null,
              occupation:
                residentCount % 2 === 0 ? "Student" : "Software Engineer",
              bloodGroup: "O+",
              foodPreference: FoodPreference.VEG,
              moveInDate: new Date("2026-01-15"),
              rentDueDate: new Date("2026-08-05"),
              status: ResidentStatus.ACTIVE,
            },
          });

          await prisma.payment.create({
            data: {
              residentId: resident.id,
              pgId: pg.id,
              invoiceNumber: `INV-DEMO-${1000 + residentCount}`,
              baseAmount: 8500,
              cgstAmount: 765,
              sgstAmount: 765,
              igstAmount: 0,
              totalAmount: 10030,
              dueDate: new Date("2026-08-05"),
              paymentMethod: "RAZORPAY",
              status: PaymentStatus.PAID,
            },
          });

          await prisma.complaint.create({
            data: {
              ticketCode: `TICK-DEMO-${100 + residentCount}`,
              residentId: resident.id,
              pgId: pg.id,
              category: "WiFi",
              title: `Sample complaint ${residentCount}`,
              description: "Demo complaint for resident " + residentCount,
              priority: Priority.MEDIUM,
              status: TicketStatus.OPEN,
              assignedStaff: "Ramesh Maintenance",
            },
          });
        }
      }
    }
  }

  console.log(
    `✅ Demo data seeded: 1 owner, 1 PG, ${residentCount} residents with rooms/beds/payments/complaints.`,
  );
  return { ownerId: owner.id, pgId: pg.id, residents: residentCount };
}

if (require.main === module) {
  seedDemoData()
    .catch((e) => {
      console.error("❌ Demo seed error:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
