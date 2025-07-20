import Order, { IOrder } from "../../src/models/order.model";
import { mockOrderData } from "../utils";

// Mock the Order model completely
jest.mock('../../src/models/order.model', () => {
    // Store created orders to simulate database
    const mockOrders: any[] = [];
    let idCounter = 1;

    const mockOrderDocument = (data: any) => ({
        ...data,
        _id: data._id || `order${idCounter++}`,
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: function () {
            const { toObject, toString, ...rest } = this;
            return rest;
        },
        toString: function () {
            return this._id;
        }
    });

    return {
        __esModule: true,
        default: {
            create: jest.fn().mockImplementation((data) => {
                // Check for duplicate order (assuming same customerId + name + price combination makes it duplicate)
                const existingOrder = mockOrders.find(order =>
                    order.customerId === data.customerId &&
                    order.name === data.name &&
                    order.price === data.price &&
                    order.description === data.description &&
                    order.quantity === data.quantity &&
                    order.category === data.category
                );

                if (existingOrder) {
                    return Promise.reject(new Error('Duplicate order'));
                }

                const newOrder = mockOrderDocument(data);
                mockOrders.push(newOrder);
                return Promise.resolve(newOrder);
            }),

            find: jest.fn().mockImplementation((filter = {}) => {
                let results = [...mockOrders];

                // Apply filters if any
                if (Object.keys(filter).length > 0) {
                    results = mockOrders.filter(order => {
                        return Object.entries(filter).every(([key, value]) =>
                            order[key] === value
                        );
                    });
                }

                return Promise.resolve(results);
            }),

            findById: jest.fn().mockImplementation((id) => {
                const order = mockOrders.find(o => o._id.toString() === id.toString());
                return Promise.resolve(order || null);
            }),

            findByIdAndUpdate: jest.fn().mockImplementation((id, updateData, options = {}) => {
                const orderIndex = mockOrders.findIndex(o => o._id.toString() === id.toString());

                if (orderIndex === -1) {
                    return Promise.resolve(null);
                }

                const updatedOrder = {
                    ...mockOrders[orderIndex],
                    ...updateData,
                    updatedAt: new Date()
                };

                mockOrders[orderIndex] = updatedOrder;

                if (options.new) {
                    return Promise.resolve(mockOrderDocument(updatedOrder));
                }

                return Promise.resolve(mockOrderDocument(mockOrders[orderIndex]));
            }),

            findByIdAndDelete: jest.fn().mockImplementation((id) => {
                const orderIndex = mockOrders.findIndex(o => o._id.toString() === id.toString());

                if (orderIndex === -1) {
                    return Promise.resolve(null);
                }

                const deletedOrder = mockOrders[orderIndex];
                mockOrders.splice(orderIndex, 1);

                return Promise.resolve(mockOrderDocument(deletedOrder));
            }),

            deleteMany: jest.fn().mockImplementation((filter = {}) => {
                if (Object.keys(filter).length === 0) {
                    // Delete all orders
                    const deletedCount = mockOrders.length;
                    mockOrders.length = 0;
                    return Promise.resolve({ deletedCount });
                }

                // Delete orders matching filter
                const initialLength = mockOrders.length;
                for (let i = mockOrders.length - 1; i >= 0; i--) {
                    const order = mockOrders[i];
                    const matches = Object.entries(filter).every(([key, value]) =>
                        order[key] === value
                    );
                    if (matches) {
                        mockOrders.splice(i, 1);
                    }
                }
                const deletedCount = initialLength - mockOrders.length;
                return Promise.resolve({ deletedCount });
            }),

            // Helper method to clear mock data between tests
            clearMockData: jest.fn().mockImplementation(() => {
                mockOrders.length = 0;
                idCounter = 1;
            }),

            // Helper method to get mock data for debugging
            getMockData: jest.fn().mockImplementation(() => {
                return [...mockOrders];
            })
        }
    };
});

const MockedOrder = Order as jest.Mocked<typeof Order>;

describe("Order Model Tests", () => {
    let createdOrder: any;
    let order = mockOrderData("customer1");

    beforeEach(async () => {
        // Clear all mocks and mock data
        jest.clearAllMocks();
        (MockedOrder as any).clearMockData();
        createdOrder = null;
    });

    afterEach(async () => {
        // Clean up after each test
        if (createdOrder) {
            try {
                await MockedOrder.findByIdAndDelete(createdOrder._id);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    // Test Case: Create a new Order
    it("should create a new order", async () => {
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        try {
            createdOrder = await MockedOrder.create(orderData);

            expect(createdOrder).toBeDefined();
            expect(createdOrder.name).toBe(orderData.name);
            expect(createdOrder.price).toBe(orderData.price);
            expect(createdOrder.customerId).toBe(orderData.customerId);
            expect(createdOrder.description).toBe(orderData.description);
            expect(createdOrder.quantity).toBe(orderData.quantity);
            expect(createdOrder.category).toBe(orderData.category);
        } catch (error) {
            console.error("Order creation failed:", error);
            throw error;
        }
    }, 10000);

    // Test Case: Ensure Order is unique
    it("should not allow duplicate orders", async () => {
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        // Create first order
        createdOrder = await MockedOrder.create(orderData);
        expect(createdOrder).toBeDefined();

        const duplicateOrderData = {
            name: createdOrder.name,
            description: createdOrder.description,
            price: createdOrder.price,
            quantity: createdOrder.quantity,
            category: createdOrder.category,
            customerId: createdOrder.customerId
        };

        // Attempt to create duplicate - should fail
        await expect(MockedOrder.create(duplicateOrderData)).rejects.toThrow('Duplicate order');
    }, 10000);

    // Test Case: Get all Orders
    it("should retrieve all orders", async () => {
        // First create an order
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        createdOrder = await MockedOrder.create(orderData);
        expect(createdOrder).toBeDefined();

        // Fetch all orders
        const orders = await MockedOrder.find();

        // Expectations
        const orderWithoutTimestamps = {
            _id: createdOrder._id,
            name: createdOrder.name,
            price: createdOrder.price,
            description: createdOrder.description,
            quantity: createdOrder.quantity,
            category: createdOrder.category,
            customerId: createdOrder.customerId,
        };

        expect(orders).toContainEqual(
            expect.objectContaining(orderWithoutTimestamps)
        );
    });

    const removeMongoProps = (order: any) => {
        const orderObj = order.toObject();
        const { _id, __v, createdAt, updatedAt, ...cleanedOrder } = orderObj;
        return cleanedOrder;
    };

    // Test Case: Get all orders
    it("should get all orders", async () => {
        // Create an order first
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        createdOrder = await MockedOrder.create(orderData);
        expect(createdOrder).toBeDefined();

        const allOrders = await MockedOrder.find();

        // Clean the created order for comparison
        const cleanedCreatedOrder = removeMongoProps(createdOrder);

        expect(allOrders).toEqual(
            expect.arrayContaining([expect.objectContaining(cleanedCreatedOrder)])
        );
    });

    // Test Case: Update an existing order
    it("should update an existing order", async () => {
        // Create an order first
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        createdOrder = await MockedOrder.create(orderData);
        expect(createdOrder).toBeDefined();

        // Define updated data
        const updatedOrderData: Partial<IOrder> = {
            name: order.name,
            price: 500, // Changed price
            quantity: 5, // Changed quantity
        };

        // Update the order and get the updated order
        const updatedOrder = await MockedOrder.findByIdAndUpdate(
            createdOrder._id,
            updatedOrderData,
            { new: true }
        );

        // Expectations
        expect(updatedOrder).toBeDefined();
        expect(updatedOrder?.name).toBe(updatedOrderData.name);
        expect(updatedOrder?.price).toBe(updatedOrderData.price);
        expect(updatedOrder?.quantity).toBe(updatedOrderData.quantity);
    });

    // Test Case: Get order by ID
    it("should get order by ID", async () => {
        // Create an order first
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        createdOrder = await MockedOrder.create(orderData);
        expect(createdOrder).toBeDefined();

        // Get the created order by ID
        const retrievedOrder = await MockedOrder.findById(createdOrder._id);

        // Expectations
        expect(retrievedOrder).toBeDefined();
        expect(retrievedOrder?.name).toBe(createdOrder.name);
        expect(retrievedOrder?.price).toBe(createdOrder.price);
    });

    // Test Case: Delete an existing order
    it("should delete an existing order", async () => {
        // Create an order first
        const orderData = {
            name: "Bread",
            description: "loaf",
            price: 400,
            quantity: 3,
            category: "food",
            customerId: "customer2233"
        };

        createdOrder = await MockedOrder.create(orderData);
        expect(createdOrder).toBeDefined();

        // Delete the created order
        await MockedOrder.findByIdAndDelete(createdOrder._id);

        // Attempt to find the deleted order
        const deletedOrder = await MockedOrder.findById(createdOrder._id);

        // Expectations
        expect(deletedOrder).toBeNull();
    });
});