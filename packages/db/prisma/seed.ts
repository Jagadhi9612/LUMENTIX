import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const gym = await prisma.gym.upsert({
    where: { id: "elite-hq" },
    update: {},
    create: {
      id: "elite-hq",
      name: "ELITE FITNESS",
      address: "Banjara Hills, Hyderabad, Telangana",
      phone: "+91 90000 11111",
      email: "hello@elitefitness.com",
      gstNumber: "36ABCDE1234F1Z5"
    }
  });

  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      {
        gymId: gym.id,
        name: "Aarav Elite",
        email: "admin@elitefitness.com",
        passwordHash: "$2b$12$seed.hash.replace.in.production",
        role: Role.SUPER_ADMIN
      },
      {
        gymId: gym.id,
        name: "Meera Kapoor",
        email: "manager@elitefitness.com",
        passwordHash: "$2b$12$seed.hash.replace.in.production",
        role: Role.GYM_MANAGER
      },
      {
        gymId: gym.id,
        name: "Riya Frontdesk",
        email: "frontdesk@elitefitness.com",
        passwordHash: "$2b$12$seed.hash.replace.in.production",
        role: Role.RECEPTIONIST
      }
    ]
  });

  const trainer = await prisma.trainer.upsert({
    where: { email: "vikram@elitefitness.com" },
    update: {},
    create: {
      gymId: gym.id,
      name: "Vikram Rao",
      email: "vikram@elitefitness.com",
      phone: "+91 98888 77777",
      specialization: "Strength and Conditioning",
      certifications: ["ACE CPT", "Sports Nutrition"],
      experienceYears: 9,
      salary: 85000,
      shift: "Morning"
    }
  });

  const elitePlan = await prisma.membershipPackage.upsert({
    where: { gymId_name: { gymId: gym.id, name: "Elite Annual" } },
    update: {},
    create: {
      gymId: gym.id,
      name: "Elite Annual",
      durationDays: 365,
      price: 54999,
      discountPercent: 10,
      gstPercent: 18,
      description: "Unlimited gym access, premium classes, quarterly assessment, and lounge access.",
      facilities: ["Strength Floor", "Cardio Theatre", "Steam", "Group Classes", "Nutrition Review"],
      personalTrainingSessions: 24,
      freezeDays: 30,
      color: "#E10600",
      badge: "Best Value"
    }
  });

  const member = await prisma.member.upsert({
    where: { memberCode: "ELT-2026-0001" },
    update: {},
    create: {
      gymId: gym.id,
      memberCode: "ELT-2026-0001",
      fullName: "Ananya Sharma",
      gender: "Female",
      dateOfBirth: new Date("1995-08-14"),
      phone: "+91 97777 66666",
      whatsapp: "+91 97777 66666",
      email: "ananya@example.com",
      address: "Road No. 12",
      city: "Hyderabad",
      state: "Telangana",
      pin: "500034",
      emergencyContact: "+91 96666 55555",
      occupation: "Product Manager",
      bloodGroup: "O+",
      medicalConditions: "None",
      heightCm: 168,
      weightKg: 62,
      bmi: 21.97,
      bodyFatPercent: 22,
      trainerId: trainer.id,
      packageId: elitePlan.id,
      joiningDate: new Date(),
      membershipStart: new Date(),
      membershipEnd: new Date("2027-06-19"),
      lockerNumber: "A-18",
      qrCode: "ELT-2026-0001",
      barcode: "890000000001"
    }
  });

  await prisma.payment.createMany({
    skipDuplicates: true,
    data: [
      {
        gymId: gym.id,
        memberId: member.id,
        packageId: elitePlan.id,
        invoiceNumber: "ELT-INV-20260619-0001",
        amount: 54999,
        discount: 5500,
        gst: 8909.82,
        paidAmount: 58408.82,
        balance: 0,
        method: "UPI",
        status: "PAID",
        paidAt: new Date()
      }
    ]
  });

  await prisma.expense.createMany({
    data: [
      {
        gymId: gym.id,
        category: "Equipment",
        vendor: "PowerFit India",
        amount: 185000,
        taxAmount: 33300,
        description: "Commercial cable crossover maintenance and attachments",
        spentAt: new Date()
      },
      {
        gymId: gym.id,
        category: "Marketing",
        vendor: "Local Ads",
        amount: 28000,
        description: "Corporate membership campaign",
        spentAt: new Date()
      }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
