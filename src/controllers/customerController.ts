import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { CreateCustomerSchema, UpdateCustomerSchema } from '../dtos/customerDTO';

export class CustomerController {
    private customerService: CustomerService;

    constructor(customerService: CustomerService) {
        this.customerService = customerService;
    }

    createUser = async (req: Request, res: Response) => {
        const parse = CreateCustomerSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.flatten() });
        }

        try {
            const newCustomer = await this.customerService.createCustomer(parse.data);
            return res.status(201).json(newCustomer);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };

    deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deletedCustomer = await this.customerService.deleteCustomerById(id);
            return res.status(200).json(deletedCustomer);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    };

    findUser = async (req: Request, res: Response) => {
        try {
            const { query } = req.params;
            const customer = await this.customerService.findCustomerByPhoneOrName(query);
            return res.status(200).json(customer);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    };

    updatePhone = async (req: Request, res: Response) => {
        const parse = UpdateCustomerSchema.safeParse(req.body);
        if (!parse.success || !parse.data.phone) {
            return res.status(400).json({ error: 'New phone number is required.' });
        }

        try {
            const { id } = req.params;
            const updatedCustomer = await this.customerService.updateCustomerPhone(id, parse.data.phone);
            return res.status(200).json(updatedCustomer);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };
}
