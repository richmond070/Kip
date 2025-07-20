import { CustomerService } from '../../src/services/customerService';
import Customer from '../../src/models/customer.model';
import { CustomerTransformer } from '../../src/utils/customerTransformer';
import { CreateCustomerDTO } from '../../src/dtos/customerDTO';

// Mock the Customer model and CustomerTransformer
// Proper mock setup
jest.mock('../../src/models/customer.model', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        save: jest.fn()
    })),
    // Also mock static methods
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn()
}));

jest.mock('../../src/utils/customerTransformer', () => ({
    CustomerTransformer: {
        toDocument: jest.fn()
    }
}));

// Type the mocked Customer
const MockedCustomer = Customer as jest.MockedClass<typeof Customer>;

describe('CustomerService', () => {
    let customerService: CustomerService;
    let mockCustomerInstance: any;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create a mock customer instance
        mockCustomerInstance = {
            save: jest.fn()
        };

        // Set up mock methods
        MockedCustomer.findByIdAndDelete = jest.fn();
        MockedCustomer.findOne = jest.fn();
        MockedCustomer.findByIdAndUpdate = jest.fn();
        MockedCustomer.create = jest.fn();

        // Make the constructor return our mock instance
        (MockedCustomer as any).mockImplementation(() => mockCustomerInstance);

        customerService = new CustomerService();
    });

    describe('createCustomer', () => {
        it('should create and return a new customer', async () => {
            const mockDto: CreateCustomerDTO = {
                name: 'John Doe',
                phone: '1234567890',
                role: 'customer',
            };

            const mockTransformedData = { name: 'John Doe', phone: 1234567890 };
            const mockSavedCustomer = { _id: '123', ...mockTransformedData };

            // Mock the transformer
            (CustomerTransformer.toDocument as jest.Mock).mockReturnValue(mockTransformedData);

            // Mock the save method on the instance
            mockCustomerInstance.save.mockResolvedValue(mockSavedCustomer);

            const result = await customerService.createCustomer(mockDto);

            expect(CustomerTransformer.toDocument).toHaveBeenCalledWith(mockDto);
            expect(mockCustomerInstance.save).toHaveBeenCalled();
            expect(result).toEqual(mockSavedCustomer);
        });

        it('should handle errors during customer creation', async () => {
            const mockDto: CreateCustomerDTO = {
                name: 'John Doe',
                phone: '1234567890',
                role: 'customer',
            };

            (CustomerTransformer.toDocument as jest.Mock).mockReturnValue({});
            mockCustomerInstance.save.mockRejectedValue(new Error('Database error'));

            await expect(customerService.createCustomer(mockDto)).rejects.toThrow('Database error');
        });
    });

    describe('deleteCustomerById', () => {
        it('should delete a customer by ID', async () => {
            const mockCustomerId = '507f1f77bcf86cd799439011';
            const mockDeletedCustomer = { _id: mockCustomerId, name: 'John Doe' };

            // Mock the static method
            (Customer.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDeletedCustomer);

            const result = await customerService.deleteCustomerById(mockCustomerId);

            expect(Customer.findByIdAndDelete).toHaveBeenCalledWith(mockCustomerId);
            expect(result).toEqual(mockDeletedCustomer);
        });

        it('should throw an error if customer not found', async () => {
            (Customer.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            await expect(customerService.deleteCustomerById('invalid-id')).rejects.toThrow('User not found');
        });
    });

    describe('findCustomerByPhoneOrName', () => {
        it('should find customer by phone number', async () => {
            const phoneValue = '1234567890';
            const mockCustomer = { _id: '123', phone: 1234567890, name: 'John Doe' };

            (Customer.findOne as jest.Mock).mockResolvedValue(mockCustomer);

            const result = await customerService.findCustomerByPhoneOrName(phoneValue);

            expect(Customer.findOne).toHaveBeenCalledWith({ phone: 1234567890 });
            expect(result).toEqual(mockCustomer);
        });

        it('should find customer by name (case insensitive)', async () => {
            const nameValue = 'john';
            const mockCustomer = { _id: '123', phone: 1234567890, name: 'John Doe' };

            (Customer.findOne as jest.Mock).mockResolvedValue(mockCustomer);

            const result = await customerService.findCustomerByPhoneOrName(nameValue);

            expect(Customer.findOne).toHaveBeenCalledWith({ name: new RegExp(nameValue, 'i') });
            expect(result).toEqual(mockCustomer);
        });

        it('should throw an error if customer not found', async () => {
            (Customer.findOne as jest.Mock).mockResolvedValue(null);

            await expect(customerService.findCustomerByPhoneOrName('nonexistent')).rejects.toThrow('User not found');
        });
    });

    describe('updateCustomerPhone', () => {
        it('should update customer phone number', async () => {
            const mockCustomerId = '507f1f77bcf86cd799439011';
            const newPhone = '9876543210';
            const mockUpdatedCustomer = { _id: mockCustomerId, phone: 9876543210, name: 'John Doe' };

            (Customer.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedCustomer);

            const result = await customerService.updateCustomerPhone(mockCustomerId, newPhone);

            expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(
                mockCustomerId,
                { phone: 9876543210 },
                { new: true }
            );
            expect(result).toEqual(mockUpdatedCustomer);
        });

        it('should throw an error if update fails', async () => {
            (Customer.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(
                customerService.updateCustomerPhone('invalid-id', '1234567890')
            ).rejects.toThrow('User not found or update failed');
        });
    });
});