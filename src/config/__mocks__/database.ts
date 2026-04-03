const mockPrisma = {
  admin: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  villa: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

export default mockPrisma;