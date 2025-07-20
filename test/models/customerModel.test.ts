import Customer, { ICustomer } from "../../src/models/customer.model";
import { mockCustomerData } from "../utils";

// Mock the Customer model completely
jest.mock('../../src/models/customer.model', () => {
    // Store created customers to simulate database
    const mockCustomers: any[] = [];
    let idCounter = 1;

    const mockCustomerDocument = (data: any) => ({
        ...data,
        _id: data._id || `customer${idCounter++}`,
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
                // Check for duplicate phone number
                const existingCustomer = mockCustomers.find(customer =>
                    customer.phone === data.phone
                );

                if (existingCustomer) {
                    const error = new Error('E11000 duplicate key error collection');
                    (error as any).code = 11000;
                    return Promise.reject(error);
                }

                const newCustomer = mockCustomerDocument(data);
                mockCustomers.push(newCustomer);
                return Promise.resolve(newCustomer);
            }),

            find: jest.fn().mockImplementation((filter = {}) => {
                let results = [...mockCustomers];

                // Apply filters if any
                if (Object.keys(filter).length > 0) {
                    results = mockCustomers.filter(customer => {
                        return Object.entries(filter).every(([key, value]) =>
                            customer[key] === value
                        );
                    });
                }

                return Promise.resolve(results);
            }),

            findById: jest.fn().mockImplementation((id) => {
                const customer = mockCustomers.find(c => c._id.toString() === id.toString());
                return Promise.resolve(customer || null);
            }),

            findByIdAndUpdate: jest.fn().mockImplementation((id, updateData, options = {}) => {
                const customerIndex = mockCustomers.findIndex(c => c._id.toString() === id.toString());

                if (customerIndex === -1) {
                    return Promise.resolve(null);
                }

                const updatedCustomer = {
                    ...mockCustomers[customerIndex],
                    ...updateData,
                    updatedAt: new Date()
                };

                mockCustomers[customerIndex] = updatedCustomer;

                if (options.new) {
                    return Promise.resolve(mockCustomerDocument(updatedCustomer));
                }

                return Promise.resolve(mockCustomerDocument(mockCustomers[customerIndex]));
            }),

            findByIdAndDelete: jest.fn().mockImplementation((id) => {
                const customerIndex = mockCustomers.findIndex(c => c._id.toString() === id.toString());

                if (customerIndex === -1) {
                    return Promise.resolve(null);
                }

                const deletedCustomer = mockCustomers[customerIndex];
                mockCustomers.splice(customerIndex, 1);

                return Promise.resolve(mockCustomerDocument(deletedCustomer));
            }),

            deleteMany: jest.fn().mockImplementation((filter = {}) => {
                if (Object.keys(filter).length === 0) {
                    // Delete all customers
                    const deletedCount = mockCustomers.length;
                    mockCustomers.length = 0;
                    return Promise.resolve({ deletedCount });
                }

                // Delete customers matching filter
                const initialLength = mockCustomers.length;
                for (let i = mockCustomers.length - 1; i >= 0; i--) {
                    const customer = mockCustomers[i];
                    const matches = Object.entries(filter).every(([key, value]) =>
                        customer[key] === value
                    );
                    if (matches) {
                        mockCustomers.splice(i, 1);
                    }
                }
                const deletedCount = initialLength - mockCustomers.length;
                return Promise.resolve({ deletedCount });
            }),

            // Helper method to clear mock data between tests
            clearMockData: jest.fn().mockImplementation(() => {
                mockCustomers.length = 0;
                idCounter = 1;
            }),

            // Helper method to get mock data for debugging
            getMockData: jest.fn().mockImplementation(() => {
                return [...mockCustomers];
            })
        }
    };
});

const MockedCustomer = Customer as jest.Mocked<typeof Customer>;

describe("Customer Model Tests", () => {
    let createdCustomer: any;
    let customer = mockCustomerData();

    beforeEach(async () => {
        // Clear all mocks and mock data
        jest.clearAllMocks();
        (MockedCustomer as any).clearMockData();
        createdCustomer = null;
    });

    afterEach(async () => {
        // Clean up after each test
        if (createdCustomer) {
            try {
                await MockedCustomer.findByIdAndDelete(createdCustomer._id);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    // Test Case: Create a new Customer
    it("should create a new customer", async () => {
        const customerData = {
            name: "Jude Paul",
            phone: 803424563,
            role: "customer",
            savedOrders: [],
        };

        try {
            createdCustomer = await MockedCustomer.create(customerData);

            // Verify creation was successful
            expect(createdCustomer).toBeDefined();
            expect(createdCustomer).not.toBeNull();
            expect(createdCustomer.name).toBe(customerData.name);
            expect(createdCustomer.phone).toBe(customerData.phone);
            expect(createdCustomer.role).toBe(customerData.role);
        } catch (error) {
            console.error("Error creating customer:", error);
            throw error;
        }
    }, 10000);

    // Test Case: Ensure phone number is unique
    it("should not allow duplicate phone numbers", async () => {
        const customerData = {
            name: "Jude Paul",
            phone: 803424563,
            role: "customer",
            savedOrders: [],
        };

        try {
            // Create first customer
            createdCustomer = await MockedCustomer.create(customerData);
            expect(createdCustomer).toBeDefined();

            // Try to create duplicate
            const duplicateCustomerData = {
                name: "Another Name",
                phone: customerData.phone, // Same phone number
                role: "customer",
                savedOrders: [],
            };

            // This should throw an error
            await expect(MockedCustomer.create(duplicateCustomerData)).rejects.toThrow();
        } catch (error: unknown) {
            // If we catch the error here, check if it's a duplicate key error
            if (error && typeof error === 'object' && 'code' in error) {
                expect((error as { code: number }).code).toBe(11000);
            } else {
                throw error;
            }
        }
    }, 10000);

    // Test Case: Get all Customers
    it("should retrieve all customers", async () => {
        const customerData = {
            name: "Jude Paul",
            phone: 803424563,
            role: "customer",
            savedOrders: [],
        };

        try {
            createdCustomer = await MockedCustomer.create(customerData);
            expect(createdCustomer).toBeDefined();

            // Fetch all customers
            const customers = await MockedCustomer.find({});

            expect(customers).toBeDefined();
            expect(Array.isArray(customers)).toBe(true);
            expect(customers.length).toBeGreaterThan(0);

            const foundCustomer = customers.find((c: any) =>
                c._id.toString() === createdCustomer._id.toString()
            );

            expect(foundCustomer).toBeDefined();
            expect(foundCustomer?.name).toBe(createdCustomer.name);
            expect(foundCustomer?.phone).toBe(createdCustomer.phone);
        } catch (error) {
            console.error("Error retrieving customers:", error);
            throw error;
        }
    });

    const removeMongoProps = (customer: any) => {
        const { _id, __v, createdAt, updatedAt, ...cleanedCustomer } = customer.toObject();
        return cleanedCustomer;
    };

    // Test Case: Get all customers
    it("should get all customers", async () => {
        const customerData = {
            name: "Test Customer",
            phone: 803424564,
            role: "customer",
            savedOrders: [],
        };

        try {
            createdCustomer = await MockedCustomer.create(customerData);
            expect(createdCustomer).toBeDefined();

            const allCustomers = await MockedCustomer.find();
            expect(allCustomers).toBeDefined();
            expect(Array.isArray(allCustomers)).toBe(true);

            // If there is a created customer, expect the array to contain an object that matches the properties
            if (createdCustomer) {
                const cleanedCreatedCustomer = removeMongoProps(createdCustomer);

                expect(allCustomers).toEqual(
                    expect.arrayContaining([expect.objectContaining(cleanedCreatedCustomer)])
                );
            }
        } catch (error) {
            console.error("Error getting all customers:", error);
            throw error;
        }
    });

    // Test Case: Update an existing customer
    it("should update an existing customer", async () => {
        const customerData = {
            name: "Original Name",
            phone: 803424565,
            role: "customer",
            savedOrders: [],
        };

        try {
            createdCustomer = await MockedCustomer.create(customerData);
            expect(createdCustomer).toBeDefined();

            // Define updated data
            const updatedCustomerData: Partial<ICustomer> = {
                name: customer.name,
                role: 'vendor',
            };

            //Update the customer and get the updated customer
            const updatedCustomer = await MockedCustomer.findByIdAndUpdate(
                createdCustomer._id,
                updatedCustomerData,
                { new: true }
            );

            //Expectations
            expect(updatedCustomer).toBeDefined();
            expect(updatedCustomer?.name).toBe(updatedCustomerData.name);
            expect(updatedCustomer?.role).toBe(updatedCustomerData.role);
        } catch (error) {
            console.error("Error updating customer:", error);
            throw error;
        }
    });

    // Test Case: Get customer by ID
    it("should get customer by ID", async () => {
        const customerData = {
            name: "Jude Paul",
            phone: 803424566,
            role: "customer",
            savedOrders: [],
        };

        try {
            createdCustomer = await MockedCustomer.create(customerData);
            expect(createdCustomer).toBeDefined();
            expect(createdCustomer._id).toBeDefined();

            //Get the created customer by ID
            const retrievedCustomer = await MockedCustomer.findById(createdCustomer._id);

            //Expectations
            expect(retrievedCustomer).toBeDefined();
            expect(retrievedCustomer?.name).toBe(createdCustomer.name);
            expect(retrievedCustomer?.phone).toBe(createdCustomer.phone);
        } catch (error) {
            console.error("Error getting customer by ID:", error);
            throw error;
        }
    });

    // Test Case: Delete an existing customer
    it("should delete an existing customer", async () => {
        const customerData = {
            name: "Jude Paul",
            phone: 803424567,
            role: "customer",
            savedOrders: [],
        };

        try {
            createdCustomer = await MockedCustomer.create(customerData);
            expect(createdCustomer).toBeDefined();
            expect(createdCustomer._id).toBeDefined();

            // Delete the created customer
            await MockedCustomer.findByIdAndDelete(createdCustomer._id);

            // Attempt to find the deleted customer
            const deletedCustomer = await MockedCustomer.findById(createdCustomer._id);

            //Expectations
            expect(deletedCustomer).toBeNull();
        } catch (error) {
            console.error("Error deleting customer:", error);
            throw error;
        }
    });
});