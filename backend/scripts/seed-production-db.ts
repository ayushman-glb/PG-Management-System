import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const GOD_ADMIN = {
  name: "GOD",
  email: "ayushman@globussoft.in",
  pass: "987456",
  phone: "+919900000001",
  role: "GOD",
};

const OWNER = {
  name: "Ayushman Saha",
  email: "ayushmansaha917@gmail.com",
  pass: "123456",
  phone: "+916297750585",
  role: "OWNER",
};

const RESIDENT = {
  name: "Ankur Saha",
  email: "ankursaha985@gmail.com",
  pass: "654123",
  phone: "+918653826643",
  residentCode: "RES1001",
  role: "RESIDENT",
};

async function seedDatabase(targetDbName: string) {
  const uri = process.env.DATABASE_URL || "mongodb+srv://ayushman_db_user:Ayushman223344@pgm.7dp53y4.mongodb.net/?appName=pgM";
  const client = new MongoClient(uri);
  await client.connect();

  console.log(`\n=================== SEEDING / SYNCING: ${targetDbName} ===================`);
  const db = client.db(targetDbName);
  const usersCol = db.collection("User");
  const ownersCol = db.collection("Owner");
  const residentsCol = db.collection("Resident");

  // 1. Seed Platform Owner ("GOD")
  const saHash = await bcrypt.hash(GOD_ADMIN.pass, 12);
  await usersCol.findOneAndUpdate(
    { email: GOD_ADMIN.email },
    {
      $set: {
        name: GOD_ADMIN.name,
        email: GOD_ADMIN.email,
        phone: GOD_ADMIN.phone,
        role: GOD_ADMIN.role,
        passwordHash: saHash,
        phoneVerified: true,
        isPhoneVerified: true,
        emailVerified: true,
        accountStatus: "ACTIVE",
        verificationStatus: "VERIFIED",
        termsAccepted: true,
        authProvider: "LOCAL",
        twoFactorEnabled: false,
        is2FAEnabled: false,
        tokenVersion: 0,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        _id: new ObjectId(),
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  console.log(`✓ Super Admin ("GOD") synced in ${targetDbName}: ${SUPER_ADMIN.email}`);

  // 2. Seed Owner (Ayushman Saha)
  const ownerHash = await bcrypt.hash(OWNER.pass, 12);
  const ownerUserRes = await usersCol.findOneAndUpdate(
    { email: OWNER.email },
    {
      $set: {
        name: OWNER.name,
        email: OWNER.email,
        phone: OWNER.phone,
        role: OWNER.role,
        passwordHash: ownerHash,
        phoneVerified: true,
        isPhoneVerified: true,
        emailVerified: true,
        accountStatus: "ACTIVE",
        verificationStatus: "VERIFIED",
        termsAccepted: true,
        authProvider: "LOCAL",
        twoFactorEnabled: false,
        is2FAEnabled: false,
        tokenVersion: 0,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        _id: new ObjectId(),
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const ownerUserId = ownerUserRes?._id;
  if (ownerUserId) {
    await ownersCol.findOneAndUpdate(
      { userId: ownerUserId },
      {
        $set: {
          name: OWNER.name,
          email: OWNER.email,
          phone: OWNER.phone,
          photo: "https://res.cloudinary.com/vmivgp12/image/upload/v1/RoomBae-development/avatars/ayushman_owner.webp",
          address: "Suite 401, Commercial Hub, Koramangala 4th Block, Bengaluru, Karnataka 560034",
          aadhaarNumber: "0000-0000-0000",
          panNumber: "ABCDE1234F",
          upiId: "ayushman@okaxis",
          bankName: "HDFC Bank Enterprise",
          accountNumber: "50100234567890",
          ifscCode: "HDFC0001234",
          emergencyContact: "+919900000001",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          _id: new ObjectId(),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
  console.log(`✓ Owner (Ayushman Saha) synced in ${targetDbName}: ${OWNER.email}`);

  // 3. Seed Resident (Ankur Saha)
  const resHash = await bcrypt.hash(RESIDENT.pass, 12);
  const residentUserRes = await usersCol.findOneAndUpdate(
    { email: RESIDENT.email },
    {
      $set: {
        name: RESIDENT.name,
        email: RESIDENT.email,
        phone: RESIDENT.phone,
        residentCode: RESIDENT.residentCode,
        role: RESIDENT.role,
        passwordHash: resHash,
        phoneVerified: true,
        isPhoneVerified: true,
        emailVerified: true,
        accountStatus: "ACTIVE",
        verificationStatus: "VERIFIED",
        termsAccepted: true,
        authProvider: "LOCAL",
        twoFactorEnabled: false,
        is2FAEnabled: false,
        tokenVersion: 0,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        _id: new ObjectId(),
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const residentUserId = residentUserRes?._id;
  if (residentUserId) {
    await residentsCol.findOneAndUpdate(
      { userId: residentUserId },
      {
        $set: {
          name: RESIDENT.name,
          email: RESIDENT.email,
          phone: RESIDENT.phone,
          gender: "Male",
          age: 24,
          bloodGroup: "O+",
          foodPreference: "NON_VEG",
          status: "ACTIVE",
          permanentAddress: "Flat 402, Green Valley Residency, Koramangala, Bengaluru, Karnataka",
          occupation: "Software Engineer",
          company: "Globussoft",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          _id: new ObjectId(),
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
  console.log(`✓ Resident (Ankur Saha) synced in ${targetDbName}: ${RESIDENT.email}`);

  await client.close();
  console.log(`\n🎉 Seeding & sync completed for ${targetDbName}!`);
}

async function main() {
  await seedDatabase("roombae_db");
  await seedDatabase("roombae-db");
}

main().catch(console.error);
