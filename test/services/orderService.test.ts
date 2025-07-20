import { OrderService } from '../../src/services/orderService';
import Order from '../../src/models/order.model';
import Customer from '../../src/models/customer.model';
import { CreateOrderDTO } from '../../src/dtos/orderDTO';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../src/models/order.model', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        save: jest.fn()
    })),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

jest.mock('../../src/models/customer.model', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        save: jest.fn()
    })),
    findOne: jest.fn()
}));

// Fix: Mock mongoose.startSession correctly
jest.mock('mongoose', () => ({
    startSession: jest.fn(() => ({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
    }))
}));

// Type the mocked models correctly
const MockedOrder = Order as jest.MockedClass<typeof Order>;
const MockedCustomer = Customer as jest.MockedClass<typeof Customer>;

describe('OrderService', () => {
    let orderService: OrderService;
    let mockSession: any;
    let mockOrderInstance: any;
    let mockCustomerInstance: any;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockOrderInstance = { save: jest.fn() };
        mockCustomerInstance = { save: jest.fn() };

        // Set up constructor mocks
        (MockedOrder as any).mockImplementation(() => mockOrderInstance);
        (MockedCustomer as any).mockImplementation(() => mockCustomerInstance);

        // Set up static method mocks
        MockedOrder.findByIdAndUpdate = jest.fn();
        MockedOrder.find = jest.fn();
        MockedOrder.findByIdAndDelete = jest.fn();
        MockedCustomer.findOne = jest.fn();

        // Set up mongoose session mock
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        };
        (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

        // Initialize orderService before each test
        orderService = new OrderService();
    });

    describe('createOrder', () => {
        const mockDto: CreateOrderDTO = {
            customerPhone: '1234567890',
            customerId: 'customer123',
            name: 'Test Order',
            description: 'Test Description',
            price: 100,
            quantity: 2,
            category: 'Test Category',
        };

        it('should create order with existing customer', async () => {
            const mockCustomer = { _id: 'customer123', phone: mockDto.customerPhone };
            const mockOrder = { _id: 'order123', ...mockDto, customerId: mockCustomer._id };

            // Fix: Mock findOne to return the customer with proper session handling
            (MockedCustomer.findOne as jest.Mock).mockResolvedValue(mockCustomer);
            mockOrderInstance.save.mockResolvedValue(mockOrder);

            const result = await orderService.createOrder(mockDto);

            // Fix: Check for proper session usage
            expect(MockedCustomer.findOne).toHaveBeenCalledWith(
                { phone: mockDto.customerPhone },
                null,
                { session: mockSession }
            );
            expect(mockOrderInstance.save).toHaveBeenCalledWith({ session: mockSession });
            expect(result).toEqual({
                order: mockOrder,
                transactionData: {
                    amount: mockDto.price * mockDto.quantity,
                    orderId: mockOrder._id
                }
            });
        });

        it('should create new customer if not found', async () => {
            const mockCustomer = { _id: 'newCustomer123', phone: mockDto.customerPhone };
            const mockOrder = { _id: 'order123', ...mockDto, customerId: mockCustomer._id };

            (MockedCustomer.findOne as jest.Mock).mockResolvedValue(null);
            mockCustomerInstance.save.mockResolvedValue(mockCustomer);
            mockOrderInstance.save.mockResolvedValue(mockOrder);

            await orderService.createOrder(mockDto);

            expect(mockCustomerInstance.save).toHaveBeenCalledWith({ session: mockSession });
        });

        it('should handle transaction correctly when no session provided', async () => {
            const mockCustomer = { _id: 'customer123', phone: mockDto.customerPhone };
            const mockOrder = { _id: 'order123', ...mockDto };

            (MockedCustomer.findOne as jest.Mock).mockResolvedValue(mockCustomer);
            mockOrderInstance.save.mockResolvedValue(mockOrder);

            await orderService.createOrder(mockDto);

            expect(mongoose.startSession).toHaveBeenCalled();
            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        it('should use existing session when provided', async () => {
            const existingSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };
            const mockCustomer = { _id: 'customer123', phone: mockDto.customerPhone };
            const mockOrder = { _id: 'order123', ...mockDto };

            (MockedCustomer.findOne as jest.Mock).mockResolvedValue(mockCustomer);
            mockOrderInstance.save.mockResolvedValue(mockOrder);

            await orderService.createOrder(mockDto, existingSession as any);

            expect(mongoose.startSession).not.toHaveBeenCalled();
            // Should not start/commit/end transaction when session is provided
            expect(existingSession.startTransaction).not.toHaveBeenCalled();
        });

        it('should abort transaction on error', async () => {
            (MockedCustomer.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await expect(orderService.createOrder(mockDto)).rejects.toThrow('DB Error');
            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });
    });

    describe('updateOrder', () => {
        const orderId = 'order123';
        const updates = { price: 150, quantity: 3 };

        it('should update order successfully', async () => {
            const updatedOrder = {
                _id: orderId,
                price: updates.price,
                quantity: updates.quantity,
                updatedAt: new Date()
            };

            (MockedOrder.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedOrder);

            const result = await orderService.updateOrder(orderId, updates);

            expect(MockedOrder.findByIdAndUpdate).toHaveBeenCalledWith(
                orderId,
                { ...updates, updatedAt: expect.any(Date) },
                { new: true, runValidators: true, session: mockSession }
            );
            expect(result).toEqual({
                order: updatedOrder,
                requiresTransactionUpdate: true,
                newAmount: updates.price * updates.quantity
            });
        });

        it('should not require transaction update if price/quantity not changed', async () => {
            const updates = { description: 'New description' };
            const updatedOrder = {
                _id: orderId,
                price: 100,
                quantity: 1,
                description: updates.description,
                updatedAt: new Date()
            };

            (MockedOrder.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedOrder);

            const result = await orderService.updateOrder(orderId, updates);

            expect(result.requiresTransactionUpdate).toBe(false);
        });

        it('should throw error if order not found', async () => {
            (MockedOrder.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(orderService.updateOrder(orderId, updates))
                .rejects.toThrow('Order not found');
        });
    });

    describe('getOrdersByUser', () => {
        it('should return orders for existing customer', async () => {
            const mockCustomer = { _id: 'customer123', phone: '1234567890' };
            const mockOrders = [
                { _id: 'order1', customerId: mockCustomer._id },
                { _id: 'order2', customerId: mockCustomer._id }
            ];

            (MockedCustomer.findOne as jest.Mock).mockResolvedValue(mockCustomer);
            (MockedOrder.find as jest.Mock).mockResolvedValue(mockOrders);

            const result = await orderService.getOrdersByUser({ phone: mockCustomer.phone });

            expect(MockedCustomer.findOne).toHaveBeenCalledWith({ phone: mockCustomer.phone });
            expect(MockedOrder.find).toHaveBeenCalledWith({ customerId: mockCustomer._id });
            expect(result).toEqual(mockOrders);
        });

        it('should return empty array for non-existent customer', async () => {
            (MockedCustomer.findOne as jest.Mock).mockResolvedValue(null);

            const result = await orderService.getOrdersByUser({ phone: 'nonexistent' });

            expect(result).toEqual([]);
        });
    });

    describe('getOrdersByDate', () => {
        it('should return orders for given date', async () => {
            const testDate = new Date('2023-01-01');
            const mockOrders = [
                { _id: 'order1', createdAt: new Date('2023-01-01T12:00:00') },
                { _id: 'order2', createdAt: new Date('2023-01-01T15:30:00') }
            ];

            (MockedOrder.find as jest.Mock).mockResolvedValue(mockOrders);

            const result = await orderService.getOrdersByDate(testDate);

            const startDate = new Date(testDate.setHours(0, 0, 0, 0));
            const endDate = new Date(testDate.setHours(23, 59, 59, 999));

            expect(MockedOrder.find).toHaveBeenCalledWith({
                createdAt: { $gte: startDate, $lte: endDate }
            });
            expect(result).toEqual(mockOrders);
        });
    });

    describe('deleteOrder', () => {
        const orderId = 'order123';

        it('should delete order successfully', async () => {
            const mockDeletedOrder = { _id: orderId };

            (MockedOrder.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDeletedOrder);

            const result = await orderService.deleteOrder(orderId);

            expect(MockedOrder.findByIdAndDelete).toHaveBeenCalledWith(orderId, { session: mockSession });
            expect(result).toEqual({
                deletedOrder: mockDeletedOrder,
                requiresTransactionDeletion: true,
                orderId: mockDeletedOrder._id
            });
        });

        it('should throw error if order not found', async () => {
            (MockedOrder.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            await expect(orderService.deleteOrder(orderId))
                .rejects.toThrow('Order not found');
        });

        it('should handle transaction correctly', async () => {
            (MockedOrder.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: orderId });

            await orderService.deleteOrder(orderId);

            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });
    });
});