import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed villa
  const existingVilla = await prisma.villa.findFirst();

  if (!existingVilla) {
    const villa = await prisma.villa.create({
      data: {
        nameEn: "Sunset Villa",
        descriptionEn:
          "A stunning luxury villa nestled in the heart of the Greek countryside, offering breathtaking views of the Aegean Sea. Sunset Villa combines traditional architecture with modern amenities to create an unforgettable holiday experience.",
        shortDescriptionEn:
          "Luxury villa in Greece with stunning Aegean Sea views, private pool, and traditional charm.",
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 10,
        basePricePerNight: 250,
        currency: "EUR",
        touristTaxPerNight: 15,
        minNights: 1,
        checkInTime: "15:00",
        checkOutTime: "11:00",
        address: "Sunset Villa, Greece",
        amenitiesEn: [
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
        houseRulesEn:
          "No smoking indoors. No parties or events. Quiet hours from 23:00 to 08:00.",
      },
    });

    console.log("Sunset Villa seeded");

    // Seed contact info
    await prisma.contactInfo.create({
      data: {
        villaId: villa.id,
        ownerFullName: "Villa Owner",
        ownerDisplayName: "Sunset Villa",
        email: "info@sunsetvilla.com",
        streetAddress: "Sunset Villa",
        city: "Greece",
        postalCode: "00000",
        country: "GR",
      },
    });

    console.log("Contact info seeded");

    // Seed legal pages
    await prisma.sitePage.createMany({
      data: [
        {
          villaId: villa.id,
          slug: "privacy-policy",
          titleEn: "Privacy Policy",
          contentEn: "Privacy policy content will be added here.",
        },
        {
          villaId: villa.id,
          slug: "terms-and-conditions",
          titleEn: "Terms and Conditions",
          contentEn: "Terms and conditions content will be added here.",
        },
      ],
    });

    console.log("Site pages seeded");
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
