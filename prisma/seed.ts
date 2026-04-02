import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log(`Admin user created/verified: ${adminEmail}`);

  // Seed villa
  const existingVilla = await prisma.villa.findFirst();

  if (!existingVilla) {
    await prisma.villa.create({
      data: {
        name: "Villa Elara",
        description:
          "A stunning luxury villa nestled in the heart of the Greek countryside, offering breathtaking views of the Aegean Sea. Villa Elara combines traditional architecture with modern amenities to create an unforgettable holiday experience.",
        shortDescription:
          "Luxury villa in Greece with stunning Aegean Sea views, private pool, and traditional charm.",
        maxGuests: 10,
        basePricePerNight: 250,
        touristTaxPerNight: 15,
        minNights: 2,
        checkInTime: "15:00",
        checkOutTime: "11:00",
        address: "Villa Elara, Greece",
        amenities: [
          "pool",
          "wifi",
          "parking",
          "air_conditioning",
          "kitchen",
          "washing_machine",
          "bbq",
          "garden",
          "sea_view",
        ],
        houseRules:
          "No smoking indoors. No parties or events. Quiet hours from 23:00 to 08:00.",
      },
    });

    console.log("Villa Elara seeded");
  } else {
    console.log("Villa already exists, skipping seed");
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
