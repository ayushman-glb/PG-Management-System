import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const SUPER_ADMIN = {
  name: "Super Admin",
  email: "superadmin@roombae.com",
  pass: "SuperAdmin_RB_2026!",
  phone: "+919900000001",
  role: "SUPER_ADMIN",
};

const ADMIN = {
  name: "Platform Admin",
  email: "admin@roombae.com",
  pass: "Admin_RoomBae_7890!",
  phone: "+919900000002",
  role: "ADMIN",
};

const OWNERS = [
  { name: "Rajesh Sharma", email: "rajesh.owner@roombae.com", pass: "Owner_Rajesh_1001!", phone: "+919876543210" },
  { name: "Priya Venkatesh", email: "priya.owner@roombae.com", pass: "Owner_Priya_1002!", phone: "+919876543211" },
  { name: "Amitabh Malhotra", email: "amitabh.owner@roombae.com", pass: "Owner_Amitabh_1003!", phone: "+919876543212" },
  { name: "Sunita Aggarwal", email: "sunita.owner@roombae.com", pass: "Owner_Sunita_1004!", phone: "+919876543213" },
  { name: "Vikram Joshi", email: "vikram.owner@roombae.com", pass: "Owner_Vikram_1005!", phone: "+919876543214" },
  { name: "Ananya Deshmukh", email: "ananya.owner@roombae.com", pass: "Owner_Ananya_1006!", phone: "+919876543215" },
  { name: "Suresh Reddy", email: "suresh.owner@roombae.com", pass: "Owner_Suresh_1007!", phone: "+919876543216" },
  { name: "Kavitha Rao", email: "kavitha.owner@roombae.com", pass: "Owner_Kavitha_1008!", phone: "+919876543217" },
  { name: "Rohan Gupta", email: "rohan.owner@roombae.com", pass: "Owner_Rohan_1009!", phone: "+919876543218" },
  { name: "Meenakshi Sundaram", email: "meenakshi.owner@roombae.com", pass: "Owner_Meenakshi_1010!", phone: "+919876543219" },
];

async function seedDatabase(targetDbName: string) {
  const uri = "mongodb+srv://ayushman_db_user:Ayushman223344@pgm.7dp53y4.mongodb.net/?appName=pgM";
  const client = new MongoClient(uri);
  await client.connect();

  console.log(`\n=================== SEEDING / SYNCING: ${targetDbName} ===================`);
  const db = client.db(targetDbName);
  const usersCol = db.collection("User");
  const ownersCol = db.collection("Owner");
  const residentsCol = db.collection("Resident");

  // 1. Seed Super Admin
  const saHash = await bcrypt.hash(SUPER_ADMIN.pass, 12);
  const saRes = await usersCol.findOneAndUpdate(
    { email: SUPER_ADMIN.email },
    {
      $set: {
        name: SUPER_ADMIN.name,
        email: SUPER_ADMIN.email,
        phone: SUPER_ADMIN.phone,
        role: SUPER_ADMIN.role,
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
  console.log(`✓ Super Admin synced in ${targetDbName}: ${SUPER_ADMIN.email}`);

  // 2. Seed Platform Admin
  const adminHash = await bcrypt.hash(ADMIN.pass, 12);
  await usersCol.findOneAndUpdate(
    { email: ADMIN.email },
    {
      $set: {
        name: ADMIN.name,
        email: ADMIN.email,
        phone: ADMIN.phone,
        role: ADMIN.role,
        passwordHash: adminHash,
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
  console.log(`✓ Platform Admin synced in ${targetDbName}: ${ADMIN.email}`);

  // 3. Seed / Update 10 Owners
  for (const o of OWNERS) {
    const ownerHash = await bcrypt.hash(o.pass, 12);
    const existingUser = await usersCol.findOne({ email: o.email });
    let userId: ObjectId;
    if (existingUser) {
      userId = existingUser._id;
      await usersCol.updateOne(
        { _id: userId },
        {
          $set: {
            name: o.name,
            phone: o.phone,
            role: "OWNER",
            passwordHash: ownerHash,
            phoneVerified: true,
            isPhoneVerified: true,
            emailVerified: true,
            accountStatus: "ACTIVE",
            verificationStatus: "VERIFIED",
            updatedAt: new Date(),
          },
        }
      );
    } else {
      userId = new ObjectId();
      await usersCol.insertOne({
        _id: userId,
        email: o.email,
        name: o.name,
        phone: o.phone,
        role: "OWNER",
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
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Ensure Owner profile exists
    const existingOwner = await ownersCol.findOne({ userId });
    if (!existingOwner) {
      await ownersCol.insertOne({
        _id: new ObjectId(),
        userId,
        name: o.name,
        businessName: `${o.name}'s Properties`,
        phone: o.phone,
        email: o.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✓ Owner synced in ${targetDbName}: ${o.email}`);
  }

  // 4. Seed / Update Residents (resident1 to resident10)
  for (let i = 1; i <= 10; i++) {
    const resCode = `RES${1000 + i}`;
    const email = `resident${i}@roombae.com`;
    const pass = `Resident_${resCode}_Pass!`;
    const phone = `+9190000${20000 + i}`;
    const name = `Resident ${i}`;

    const resHash = await bcrypt.hash(pass, 12);
    const existingUser = await usersCol.findOne({ email });
    let userId: ObjectId;
    if (existingUser) {
      userId = existingUser._id;
      await usersCol.updateOne(
        { _id: userId },
        {
          $set: {
            name,
            phone,
            role: "RESIDENT",
            residentCode: resCode,
            passwordHash: resHash,
            phoneVerified: true,
            isPhoneVerified: true,
            emailVerified: true,
            accountStatus: "ACTIVE",
            verificationStatus: "VERIFIED",
            updatedAt: new Date(),
          },
        }
      );
    } else {
      userId = new ObjectId();
      await usersCol.insertOne({
        _id: userId,
        email,
        name,
        phone,
        role: "RESIDENT",
        residentCode: resCode,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const existingRes = await residentsCol.findOne({ userId });
    if (!existingRes) {
      await residentsCol.insertOne({
        _id: new ObjectId(),
        userId,
        name,
        phone,
        email,
        residentCode: resCode,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (!existingRes.residentCode) {
      await residentsCol.updateOne({ _id: existingRes._id }, { $set: { residentCode: resCode } });
    }
    console.log(`✓ Resident synced in ${targetDbName}: ${email} (${resCode})`);
  }

  await client.close();
  console.log(`\n🎉 Seeding & sync completed for ${targetDbName}!`);
}

async function main() {
  // Sync both databases to ensure 100% credential consistency regardless of which database is targeted!
  await seedDatabase("roombae_db");
  await seedDatabase("roombae-db");
}

main().catch(console.error);
