import { updateVillaSchema } from "../villa.schema";

describe("updateVillaSchema", () => {
  describe("fully valid input", () => {
    it("parses all optional fields when provided", () => {
      const input = {
        name: "Villa Elara",
        description: "A beautiful villa",
        shortDescription: "Luxury in Greece",
        maxGuests: 10,
        basePricePerNight: 250,
        touristTaxPerNight: 15,
        minNights: 2,
        maxNights: 30,
        checkInTime: "15:00",
        checkOutTime: "11:00",
        address: "Greece",
        latitude: 37.9838,
        longitude: 23.7275,
        amenities: ["pool", "wifi"],
        houseRules: "No smoking",
      };
      const result = updateVillaSchema.parse(input);
      expect(result).toEqual(input);
    });

    it("accepts an empty object (all fields optional)", () => {
      const result = updateVillaSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe("name field", () => {
    it("rejects empty string name", () => {
      expect(() => updateVillaSchema.parse({ name: "" })).toThrow();
    });

    it("accepts a valid name string", () => {
      const result = updateVillaSchema.parse({ name: "Villa Elara" });
      expect(result.name).toBe("Villa Elara");
    });
  });

  describe("description field", () => {
    it("rejects empty string description", () => {
      expect(() => updateVillaSchema.parse({ description: "" })).toThrow();
    });

    it("accepts valid description", () => {
      const result = updateVillaSchema.parse({ description: "A nice place" });
      expect(result.description).toBe("A nice place");
    });
  });

  describe("shortDescription field", () => {
    it("rejects empty string shortDescription", () => {
      expect(() => updateVillaSchema.parse({ shortDescription: "" })).toThrow();
    });

    it("accepts valid shortDescription", () => {
      const result = updateVillaSchema.parse({ shortDescription: "Short" });
      expect(result.shortDescription).toBe("Short");
    });
  });

  describe("numeric fields", () => {
    it("rejects maxGuests of 0", () => {
      expect(() => updateVillaSchema.parse({ maxGuests: 0 })).toThrow();
    });

    it("accepts maxGuests of 1", () => {
      const result = updateVillaSchema.parse({ maxGuests: 1 });
      expect(result.maxGuests).toBe(1);
    });

    it("rejects negative basePricePerNight", () => {
      expect(() => updateVillaSchema.parse({ basePricePerNight: -1 })).toThrow();
    });

    it("rejects basePricePerNight of 0", () => {
      expect(() => updateVillaSchema.parse({ basePricePerNight: 0 })).toThrow();
    });

    it("accepts valid basePricePerNight", () => {
      const result = updateVillaSchema.parse({ basePricePerNight: 250 });
      expect(result.basePricePerNight).toBe(250);
    });

    it("accepts touristTaxPerNight of 0 (nonnegative)", () => {
      const result = updateVillaSchema.parse({ touristTaxPerNight: 0 });
      expect(result.touristTaxPerNight).toBe(0);
    });

    it("rejects negative touristTaxPerNight", () => {
      expect(() => updateVillaSchema.parse({ touristTaxPerNight: -5 })).toThrow();
    });

    it("rejects minNights of 0", () => {
      expect(() => updateVillaSchema.parse({ minNights: 0 })).toThrow();
    });

    it("accepts minNights of 1", () => {
      const result = updateVillaSchema.parse({ minNights: 1 });
      expect(result.minNights).toBe(1);
    });

    it("rejects non-integer minNights", () => {
      expect(() => updateVillaSchema.parse({ minNights: 1.5 })).toThrow();
    });
  });

  describe("maxNights field", () => {
    it("accepts null maxNights", () => {
      const result = updateVillaSchema.parse({ maxNights: null });
      expect(result.maxNights).toBeNull();
    });

    it("accepts positive integer maxNights", () => {
      const result = updateVillaSchema.parse({ maxNights: 30 });
      expect(result.maxNights).toBe(30);
    });

    it("rejects maxNights of 0", () => {
      expect(() => updateVillaSchema.parse({ maxNights: 0 })).toThrow();
    });
  });

  describe("location fields", () => {
    it("accepts null latitude and longitude", () => {
      const result = updateVillaSchema.parse({ latitude: null, longitude: null });
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    it("accepts valid decimal lat/lng", () => {
      const result = updateVillaSchema.parse({ latitude: 37.9838, longitude: 23.7275 });
      expect(result.latitude).toBe(37.9838);
      expect(result.longitude).toBe(23.7275);
    });
  });

  describe("amenities field", () => {
    it("accepts array of strings", () => {
      const result = updateVillaSchema.parse({ amenities: ["pool", "wifi"] });
      expect(result.amenities).toEqual(["pool", "wifi"]);
    });

    it("accepts empty array", () => {
      const result = updateVillaSchema.parse({ amenities: [] });
      expect(result.amenities).toEqual([]);
    });

    it("rejects array with non-string items", () => {
      expect(() => updateVillaSchema.parse({ amenities: [1, 2] })).toThrow();
    });

    it("does not accept localized amenitiesEn or amenitiesEl fields (removed in PR)", () => {
      // These were removed - they should just be ignored by the schema (extra fields stripped)
      // or at minimum not cause parse errors since zod strips unknown keys by default
      const result = updateVillaSchema.parse({
        amenities: ["pool"],
        amenitiesEn: ["pool"],
      });
      expect((result as any).amenitiesEn).toBeUndefined();
    });
  });

  describe("houseRules field", () => {
    it("accepts null houseRules", () => {
      const result = updateVillaSchema.parse({ houseRules: null });
      expect(result.houseRules).toBeNull();
    });

    it("accepts a valid houseRules string", () => {
      const result = updateVillaSchema.parse({ houseRules: "No smoking" });
      expect(result.houseRules).toBe("No smoking");
    });
  });

  describe("removed fields from PR", () => {
    it("does not accept bedrooms field (removed in PR)", () => {
      const result = updateVillaSchema.parse({ bedrooms: 4 });
      expect((result as any).bedrooms).toBeUndefined();
    });

    it("does not accept bathrooms field (removed in PR)", () => {
      const result = updateVillaSchema.parse({ bathrooms: 3 });
      expect((result as any).bathrooms).toBeUndefined();
    });

    it("does not accept currency field (removed in PR)", () => {
      const result = updateVillaSchema.parse({ currency: "EUR" });
      expect((result as any).currency).toBeUndefined();
    });
  });
});