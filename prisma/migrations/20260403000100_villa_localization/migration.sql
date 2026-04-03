-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "deposit_amount" DECIMAL(10,2),
ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'unpaid';

-- AlterTable (phase 1: add new columns as nullable where needed)
ALTER TABLE "villas"
ADD COLUMN "amenities_el" JSONB,
ADD COLUMN "amenities_en" JSONB,
ADD COLUMN "bathrooms" INTEGER,
ADD COLUMN "bedrooms" INTEGER,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN "description_el" TEXT,
ADD COLUMN "description_en" TEXT,
ADD COLUMN "house_rules_el" TEXT,
ADD COLUMN "house_rules_en" TEXT,
ADD COLUMN "name_el" TEXT,
ADD COLUMN "name_en" TEXT,
ADD COLUMN "short_description_el" TEXT,
ADD COLUMN "short_description_en" TEXT;

-- Backfill localized and required fields from existing legacy columns
UPDATE "villas"
SET
  "name_en" = COALESCE("name_en", "name", 'Unnamed Villa'),
  "description_en" = COALESCE("description_en", "description", ''),
  "short_description_en" = COALESCE("short_description_en", "short_description", ''),
  "amenities_en" = COALESCE("amenities_en", "amenities", '[]'::jsonb),
  "house_rules_en" = COALESCE("house_rules_en", "house_rules"),
  "bedrooms" = COALESCE("bedrooms", 1),
  "bathrooms" = COALESCE("bathrooms", 1);

-- AlterTable (phase 2: enforce constraints and defaults)
ALTER TABLE "villas"
ALTER COLUMN "amenities_en" SET DEFAULT '[]',
ALTER COLUMN "amenities_en" SET NOT NULL,
ALTER COLUMN "bathrooms" SET NOT NULL,
ALTER COLUMN "bedrooms" SET NOT NULL,
ALTER COLUMN "description_en" SET NOT NULL,
ALTER COLUMN "name_en" SET NOT NULL,
ALTER COLUMN "short_description_en" SET NOT NULL,
ALTER COLUMN "min_nights" SET DEFAULT 1;

-- Drop legacy columns after backfill
ALTER TABLE "villas"
DROP COLUMN "amenities",
DROP COLUMN "description",
DROP COLUMN "house_rules",
DROP COLUMN "name",
DROP COLUMN "short_description";

-- CreateTable
CREATE TABLE "contact_info" (
    "id" SERIAL NOT NULL,
    "villa_id" INTEGER NOT NULL,
    "owner_full_name" TEXT NOT NULL,
    "owner_display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "street_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_pages" (
    "id" SERIAL NOT NULL,
    "villa_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_el" TEXT,
    "content_en" TEXT NOT NULL,
    "content_el" TEXT,
    "last_modified" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_info_villa_id_key" ON "contact_info"("villa_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_slug_key" ON "site_pages"("slug");

-- AddForeignKey
ALTER TABLE "contact_info" ADD CONSTRAINT "contact_info_villa_id_fkey" FOREIGN KEY ("villa_id") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_villa_id_fkey" FOREIGN KEY ("villa_id") REFERENCES "villas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
