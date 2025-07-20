// jest.setup.js
// This file runs before each test file

// Mock Mongoose completely
jest.mock('mongoose', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    save: jest.fn(),
    startSession: jest.fn(),
  };

  const MockSchema = function Schema() {
    return {
      pre: jest.fn(),
      post: jest.fn(),
      index: jest.fn(),
    };
  };

  // Add Types to Schema
  MockSchema.Types = {
    ObjectId: jest.fn().mockImplementation((id) => ({
      toString: () => id || '507f1f77bcf86cd799439011',
    })),
  };

  return {
    __esModule: true,
    default: {
      connect: jest.fn(),
      disconnect: jest.fn(),
      connection: {
        close: jest.fn(),
      },
      startSession: jest.fn().mockResolvedValue(mockSession),
      model: jest.fn().mockReturnValue(mockModel),
      Schema: MockSchema,
      Types: {
        ObjectId: jest.fn().mockImplementation((id) => ({
          toString: () => id || '507f1f77bcf86cd799439011',
        })),
      },
    },
    connect: jest.fn(),
    disconnect: jest.fn(),
    startSession: jest.fn().mockResolvedValue(mockSession),
    model: jest.fn().mockReturnValue(mockModel),
    Schema: MockSchema,
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => ({
        toString: () => id || '507f1f77bcf86cd799439011',
      })),
    },
  };
});

// Set up global test timeout
jest.setTimeout(30000); // 30 seconds

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb+srv://ekezierichmond:richard031@firstcluster.bzfljz3.mongodb.net/kip?retryWrites=true&w=majority';

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
  }),
  
  createMockOrder: () => ({
    id: '456',
    userId: '123',
    amount: 100,
    status: 'pending',
  }),
};

// Global mock objects for tests
global.mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Optional: Add global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});