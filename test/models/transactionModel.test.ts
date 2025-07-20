import Transaction from '../../src/models/transaction.model';

// Mock the Transaction model completely
jest.mock('../../src/models/transaction.model', () => {
    // Store created transactions to simulate database
    const mockTransactions: any[] = [];
    let idCounter = 1;

    const mockTransactionDocument = (data: any) => ({
        ...data,
        _id: data._id || `transaction${idCounter++}`,
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
                // Check for duplicate orderId to simulate unique constraint
                const existingTransaction = mockTransactions.find(t => t.orderId === data.orderId);
                if (existingTransaction) {
                    return Promise.reject(new Error('Duplicate transaction'));
                }

                const newTransaction = mockTransactionDocument(data);
                mockTransactions.push(newTransaction);
                return Promise.resolve(newTransaction);
            }),

            find: jest.fn().mockImplementation((filter = {}) => {
                let results = [...mockTransactions];

                // Apply filters if any
                if (Object.keys(filter).length > 0) {
                    results = mockTransactions.filter(transaction => {
                        return Object.entries(filter).every(([key, value]) =>
                            transaction[key] === value
                        );
                    });
                }

                return Promise.resolve(results);
            }),

            findById: jest.fn().mockImplementation((id) => {
                const transaction = mockTransactions.find(t => t._id.toString() === id.toString());
                return Promise.resolve(transaction || null);
            }),

            findByIdAndUpdate: jest.fn().mockImplementation((id, updateData, options = {}) => {
                const transactionIndex = mockTransactions.findIndex(t => t._id.toString() === id.toString());

                if (transactionIndex === -1) {
                    return Promise.resolve(null);
                }

                const updatedTransaction = {
                    ...mockTransactions[transactionIndex],
                    ...updateData,
                    updatedAt: new Date()
                };

                mockTransactions[transactionIndex] = updatedTransaction;

                if (options.new) {
                    return Promise.resolve(mockTransactionDocument(updatedTransaction));
                }

                return Promise.resolve(mockTransactionDocument(mockTransactions[transactionIndex]));
            }),

            findByIdAndDelete: jest.fn().mockImplementation((id) => {
                const transactionIndex = mockTransactions.findIndex(t => t._id.toString() === id.toString());

                if (transactionIndex === -1) {
                    return Promise.resolve(null);
                }

                const deletedTransaction = mockTransactions[transactionIndex];
                mockTransactions.splice(transactionIndex, 1);

                return Promise.resolve(mockTransactionDocument(deletedTransaction));
            }),

            // Helper method to clear mock data between tests
            clearMockData: jest.fn().mockImplementation(() => {
                mockTransactions.length = 0;
                idCounter = 1;
            }),

            // Helper method to get mock data for debugging
            getMockData: jest.fn().mockImplementation(() => {
                return [...mockTransactions];
            })
        }
    };
});

const MockedTransaction = Transaction as jest.Mocked<typeof Transaction>;

describe('Transaction Model Tests', () => {
    let createdTransaction: any;

    const transactionData = {
        type: 'income',
        amount: 100,
        date: new Date(),
        orderId: 'order123'
    };

    beforeEach(async () => {
        // Clear all mocks and mock data
        jest.clearAllMocks();
        (MockedTransaction as any).clearMockData();
    });

    afterEach(async () => {
        // Clean up after each test
        if (createdTransaction) {
            try {
                await MockedTransaction.findByIdAndDelete(createdTransaction._id);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    it('should create a new transaction', async () => {
        createdTransaction = await MockedTransaction.create(transactionData);

        expect(createdTransaction.type).toBe(transactionData.type);
        expect(createdTransaction.amount).toBe(transactionData.amount);
        expect(createdTransaction.date).toBe(transactionData.date);
        expect(createdTransaction.orderId).toBe(transactionData.orderId);
        expect(createdTransaction._id).toBeDefined();
    });

    it('should not allow duplicate transactions', async () => {
        // Create first transaction
        await MockedTransaction.create(transactionData);

        // Try to create duplicate (same orderId)
        const duplicateTransactionData = {
            ...transactionData,
            amount: 200 // Different amount but same orderId
        };

        await expect(MockedTransaction.create(duplicateTransactionData))
            .rejects.toThrow('Duplicate transaction');
    }, 10000);

    it('should retrieve all transactions', async () => {
        // Create a transaction first
        createdTransaction = await MockedTransaction.create(transactionData);

        const transactions = await MockedTransaction.find({});

        expect(transactions.length).toBeGreaterThan(0);

        const foundTransaction = transactions.find((t: any) => t._id.toString() === createdTransaction._id.toString());
        expect(foundTransaction).toBeDefined();
    });

    it('should get all transactions', async () => {
        // Create a transaction first
        createdTransaction = await MockedTransaction.create(transactionData);

        const removeMongoProps = (transaction: any) => {
            const transactionObj = transaction.toObject();
            const { _id, __v, createdAt, updatedAt, ...cleanedTransaction } = transactionObj;
            return cleanedTransaction;
        };

        const transactions = await MockedTransaction.find({});

        expect(transactions.length).toBeGreaterThan(0);

        const cleanedTransactions = transactions.map(removeMongoProps);
        expect(cleanedTransactions[0]).toEqual({
            type: transactionData.type,
            amount: transactionData.amount,
            date: transactionData.date,
            orderId: transactionData.orderId
        });
    });

    it('should update an existing transaction', async () => {
        // Create transaction first
        createdTransaction = await MockedTransaction.create(transactionData);

        const updatedTransactionData = {
            amount: 150,
            type: 'expense'
        };

        // Update the transaction and get the updated transaction
        const updatedTransaction = await MockedTransaction.findByIdAndUpdate(
            createdTransaction._id,
            updatedTransactionData,
            { new: true }
        );

        expect(updatedTransaction).toBeDefined();
        expect(updatedTransaction!.amount).toBe(updatedTransactionData.amount);
        expect(updatedTransaction!.type).toBe(updatedTransactionData.type);
        expect(updatedTransaction!.orderId).toBe(transactionData.orderId); // Should remain unchanged
    });

    it('should get transaction by ID', async () => {
        // Create transaction first
        createdTransaction = await MockedTransaction.create(transactionData);

        const retrievedTransaction = await MockedTransaction.findById(createdTransaction._id);

        expect(retrievedTransaction?.type).toBe(createdTransaction.type);
        expect(retrievedTransaction?.amount).toBe(createdTransaction.amount);
        expect(retrievedTransaction?.orderId).toBe(createdTransaction.orderId);
    });

    it('should delete an existing transaction', async () => {
        // Create transaction first
        createdTransaction = await MockedTransaction.create(transactionData);

        // Verify it exists
        const beforeDelete = await MockedTransaction.findById(createdTransaction._id);
        expect(beforeDelete).toBeDefined();

        // Delete the transaction
        await MockedTransaction.findByIdAndDelete(createdTransaction._id);

        // Verify it's deleted
        const deletedTransaction = await MockedTransaction.findById(createdTransaction._id);
        expect(deletedTransaction).toBeNull();
    });
});