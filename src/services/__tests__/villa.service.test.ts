jest.mock("../../config/database");

import prisma from "../../config/database";
import { getVilla, updateVilla } from "../villa.service";
import type { UpdateVillaInput } from "../../schemas/villa.schema";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const fakeImage = {
  id: 1,
  villaId: 1,
  imageUrl: "https://example.com/image.jpg",
  altText: "Villa",
  displayOrder: 0,
  isHero: true,
  createdAt: new Date(),
};

const fakeVilla = {
  id: 1,
  name: "Villa Elara",
  description: "A stunning luxury villa",
  shortDescription: "Luxury villa",
  maxGuests: 10,
  basePricePerNight: "250.00",
  touristTaxPerNight: "15.00",
  minNights: 2,
  maxNights: null,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  address: "Villa Elara, Greece",
  latitude: null,
  longitude: null,
  amenities: ["pool", "wifi"],
  houseRules: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  images: [fakeImage],
};

describe("villa.service - getVilla", () => {
  it("calls prisma.villa.findFirst with images included", async () => {
    (mockPrisma.villa.findFirst as jest.Mock).mockResolvedValue(fakeVilla);
    const result = await getVilla();
    expect(mockPrisma.villa.findFirst).toHaveBeenCalledWith({
      include: {
        images: { orderBy: { displayOrder: "asc" } },
      },
    });
    expect(result).toEqual(fakeVilla);
  });

  it("returns null when no villa exists", async () => {
    (mockPrisma.villa.findFirst as jest.Mock).mockResolvedValue(null);
    const result = await getVilla();
    expect(result).toBeNull();
  });
});

describe("villa.service - updateVilla", () => {
  const updateInput: UpdateVillaInput = {
    name: "Updated Villa",
    maxGuests: 8,
    basePricePerNight: 300,
  };

  beforeEach(() => {
    (mockPrisma.villa.update as jest.Mock).mockResolvedValue({
      ...fakeVilla,
      ...updateInput,
    });
  });

  it("calls prisma.villa.update with correct id and data", async () => {
    await updateVilla(1, updateInput);
    expect(mockPrisma.villa.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: updateInput,
      include: {
        images: { orderBy: { displayOrder: "asc" } },
      },
    });
  });

  it("returns the updated villa", async () => {
    const result = await updateVilla(1, updateInput);
    expect(result).toMatchObject({ name: "Updated Villa", maxGuests: 8 });
  });

  it("passes data directly without transformation", async () => {
    const data: UpdateVillaInput = {
      amenities: ["pool", "garden"],
      houseRules: null,
    };
    await updateVilla(1, data);
    const callArg = (mockPrisma.villa.update as jest.Mock).mock.calls[0][0];
    expect(callArg.data).toEqual(data);
  });

  it("includes images ordered by displayOrder in the result", async () => {
    await updateVilla(1, updateInput);
    const callArg = (mockPrisma.villa.update as jest.Mock).mock.calls[0][0];
    expect(callArg.include).toEqual({
      images: { orderBy: { displayOrder: "asc" } },
    });
  });

  it("passes null houseRules directly without special handling", async () => {
    const data: UpdateVillaInput = { houseRules: null };
    await updateVilla(1, data);
    const callArg = (mockPrisma.villa.update as jest.Mock).mock.calls[0][0];
    expect(callArg.data.houseRules).toBeNull();
  });
});