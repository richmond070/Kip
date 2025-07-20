import { TransactionService } from '../../src/services/transactionService';
import Transaction from '../../src/models/transaction.model';
import Order from '../../src/models/order.model';
import mongoose from 'mongoose';

// Mock mongoose first
jest.mock('mongoose', () => ({
    startSession: jest.fn()
}));

// Mock the models
jest.mock('../../src/models/transaction.model', () => {
    return {
        __esModule: true,
        default: {
            startSession: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndDelete: jest.fn()
        }
    };
});

jest.mock('../../src/models/order.model', () => {
    return {
        __esModule: true,
        default: {
            exists: jest.fn(),
            startSession: jest.fn()
        }
    };
});

// Type-safe mock references
const mockTransactionModel = Transaction as jest.Mocked<typeof Transaction>;
const mockOrderModel = Order as jest.Mocked<typeof Order>;
const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('TransactionService', () => {
    let transactionService: TransactionService;
    let mockSession: any;

    beforeEach(() => {
        transactionService = new TransactionService();
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };

        jest.clearAllMocks();

        // Fix the mongoose.startSession mock
        mockMongoose.startSession.mockResolvedValue(mockSession);
        mockTransactionModel.startSession.mockResolvedValue(mockSession);
        mockOrderModel.startSession.mockResolvedValue(mockSession);
    });

    describe('createTransactionForOrder', () => {
        const orderId = 'order123';
        const amount = 100;
        const type = 'income';

        it('should create transaction for valid order', async () => {
            const mockTransaction = { _id: 'trans123', orderId, amount, type };

            (Order.exists as jest.Mock).mockResolvedValue(true);
            (Transaction.findOne as jest.Mock).mockResolvedValue(null);
            (Transaction.create as jest.Mock).mockResolvedValue([mockTransaction]);

            const result = await transactionService.createTransactionForOrder(orderId, amount, type);

            // FIXED: Session is merged into the query object, not passed as separate parameter
            expect(Order.exists).toHaveBeenCalledWith({ _id: orderId, session: mockSession });
            expect(Transaction.findOne).toHaveBeenCalledWith({ orderId, session: mockSession });
            expect(Transaction.create).toHaveBeenCalledWith([{
                type,
                orderId,
                amount,
                date: expect.any(Date)
            }], { session: mockSession });
            expect(result).toEqual(mockTransaction);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should throw error if order not found', async () => {
            (Order.exists as jest.Mock).mockResolvedValue(false);

            await expect(transactionService.createTransactionForOrder(orderId, amount))
                .rejects.toThrow('Order not found');
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should throw error if transaction already exists', async () => {
            (Order.exists as jest.Mock).mockResolvedValue(true);
            (Transaction.findOne as jest.Mock).mockResolvedValue({ _id: 'existingTrans' });

            await expect(transactionService.createTransactionForOrder(orderId, amount))
                .rejects.toThrow('Transaction already exists');
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should use existing session when provided', async () => {
            const existingSession = { customSession: true };
            (Order.exists as jest.Mock).mockResolvedValue(true);
            (Transaction.findOne as jest.Mock).mockResolvedValue(null);
            (Transaction.create as jest.Mock).mockResolvedValue([{ _id: 'trans123' }]);

            await transactionService.createTransactionForOrder(orderId, amount, type, existingSession as any);

            // FIXED: Session is merged into the query object for Order.exists
            expect(Order.exists).toHaveBeenCalledWith({ _id: orderId, session: existingSession });
            expect(Transaction.create).toHaveBeenCalledWith(expect.anything(), { session: existingSession });
            expect(mockMongoose.startSession).not.toHaveBeenCalled();
        });
    });

    describe('updateTransactionForOrder', () => {
        const orderId = 'order123';
        const newAmount = 200;

        it('should update transaction amount', async () => {
            const updatedTransaction = {
                _id: 'trans123',
                orderId,
                amount: newAmount,
                date: new Date()
            };

            (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedTransaction);

            const result = await transactionService.updateTransactionForOrder(orderId, newAmount);

            expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
                { orderId },
                {
                    amount: newAmount,
                    date: expect.any(Date)
                },
                { new: true, session: mockSession }
            );
            expect(result).toEqual(updatedTransaction);
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should throw error if transaction not found', async () => {
            (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(transactionService.updateTransactionForOrder(orderId, newAmount))
                .rejects.toThrow('No transaction found for this order');
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should use existing session when provided', async () => {
            const existingSession = { customSession: true };
            const mockTransaction = { _id: 'trans123', orderId, amount: newAmount };

            (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(mockTransaction);

            await transactionService.updateTransactionForOrder(orderId, newAmount, existingSession as any);

            expect(Transaction.findOneAndUpdate).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                { new: true, session: existingSession }
            );
            expect(mockMongoose.startSession).not.toHaveBeenCalled();
        });
    });

    describe('findTransaction', () => {
        it('should find transaction by transactionId', async () => {
            const transactionId = 'trans123';
            const mockTransaction = { _id: transactionId, orderId: 'order123' };

            (Transaction.findById as jest.Mock).mockResolvedValue(mockTransaction);

            const result = await transactionService.findTransaction({ transactionId });

            expect(Transaction.findById).toHaveBeenCalledWith(transactionId);
            expect(result).toEqual(mockTransaction);
        });

        it('should find transaction by orderId', async () => {
            const orderId = 'order123';
            const mockTransaction = { _id: 'trans123', orderId };

            (Transaction.findOne as jest.Mock).mockResolvedValue(mockTransaction);

            const result = await transactionService.findTransaction({ orderId });

            expect(Transaction.findOne).toHaveBeenCalledWith({ orderId });
            expect(result).toEqual(mockTransaction);
        });

        it('should return null if no query provided', async () => {
            const result = await transactionService.findTransaction({});
            expect(result).toBeNull();
        });
    });

    describe('deleteTransactionForOrder', () => {
        const orderId = 'order123';

        it('should delete transaction by orderId', async () => {
            (Transaction.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

            const result = await transactionService.deleteTransactionForOrder(orderId);

            expect(Transaction.deleteOne).toHaveBeenCalledWith(
                { orderId },
                { session: mockSession }
            );
            expect(result).toEqual({ success: true, orderId });
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should throw error if no transaction found', async () => {
            (Transaction.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

            await expect(transactionService.deleteTransactionForOrder(orderId))
                .rejects.toThrow('No transaction found for this order');
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should use existing session when provided', async () => {
            const existingSession = { customSession: true };
            (Transaction.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

            await transactionService.deleteTransactionForOrder(orderId, existingSession as any);

            expect(Transaction.deleteOne).toHaveBeenCalledWith(
                { orderId },
                { session: existingSession }
            );
            expect(mockMongoose.startSession).not.toHaveBeenCalled();
        });
    });

    describe('deleteTransaction', () => {
        const transactionId = 'trans123';

        it('should delete transaction by ID', async () => {
            const mockTransaction = { _id: transactionId };
            (Transaction.findByIdAndDelete as jest.Mock).mockResolvedValue(mockTransaction);

            const result = await transactionService.deleteTransaction(transactionId);

            expect(Transaction.findByIdAndDelete).toHaveBeenCalledWith(transactionId);
            expect(result).toEqual({ success: true, transactionId });
        });

        it('should throw error if transaction not found', async () => {
            (Transaction.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            await expect(transactionService.deleteTransaction(transactionId))
                .rejects.toThrow('Transaction not found');
        });
    });
});