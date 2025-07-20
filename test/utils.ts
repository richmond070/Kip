// Updated version with proper error typing
import { faker } from '@faker-js/faker';
import { CreateOrderDTO } from '../src/dtos/orderDTO';
import { CreateTransactionDTO } from '../src/dtos/transactionDTO';

export const mockCustomerData = () => ({
    name: 'Test User',
    phone: `+1${Math.floor(Math.random() * 10000000000)}`,
    role: 'customer'
});

export const mockOrderData = (customerId: string): CreateOrderDTO => ({
    name: 'Test Order',
    description: 'Test Description',
    price: 100,
    quantity: 1,
    category: 'test',
    customerPhone: `+1${Math.floor(Math.random() * 10000000000)}`,
    customerId // Add required field
});

export const mockTransactionData = (orderId: string): CreateTransactionDTO => ({
    orderId,
    type: 'income', // Required field
    date: new Date(),
    amount: 100 // Required field
});

// Updated error handler with proper typing
export const expectError = async (
    fn: () => Promise<any>,
    errorMessage?: string | RegExp
) => {
    try {
        await fn();
        fail('Expected error but none was thrown');
    } catch (error: unknown) {
        // Type guard to check if it's an Error
        if (error instanceof Error) {
            if (errorMessage) {
                if (typeof errorMessage === 'string') {
                    expect(error.message).toContain(errorMessage);
                } else {
                    expect(error.message).toMatch(errorMessage);
                }
            }
        } else {
            // Handle non-Error thrown values
            const message = typeof error === 'object' ? JSON.stringify(error) : String(error);
            if (errorMessage) {
                if (typeof errorMessage === 'string') {
                    expect(message).toContain(errorMessage);
                } else {
                    expect(message).toMatch(errorMessage);
                }
            }
        }
    }
};