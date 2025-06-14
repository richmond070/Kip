import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Transaction from '../models/transaction.model'; // Assuming Mongoose model
// import Business from '../models/business.model';
import Order from '../models/order.model';
// import AuditLog from '../models/auditLog.model';

interface TransactionRequest {
    type: 'income' | 'expense';
    amount: number;
    date: Date;
    orderId: string;
}

// interface AuthenticatedRequest extends Request {
//     user?: {
//         id: string;
//         // businessId: string;
//         role: string;
//     };
// }



/**
 * Create a new transaction with duplicate detection
 */
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            type,
            date,
            orderId
        } = req.body;

        // Input validation
        if (!type || !date) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: type, amount, date, category, description, businessId'
            });
            return;
        }

        // Validate transaction type
        if (!['income', 'expense'].includes(type)) {
            res.status(400).json({
                success: false,
                message: 'Transaction type must be either "income" or "expense"'
            });
            return;
        }

        // Validate date
        const transactionDate = new Date(date);
        if (isNaN(transactionDate.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
            return;
        }

        const potentialDuplicate = await Transaction.findOne({ orderId, });

        if (potentialDuplicate) {
            res.status(409).json({
                success: false,
                message: 'Potential duplicate transaction detected. A similar transaction exists within 5 minutes of this timestamp.',
                existingTransaction: {
                    id: potentialDuplicate._id,
                    date: potentialDuplicate.date,
                    amount: potentialDuplicate.amount,
                }
            });
            return;
        }

        // Fetch order to calculate amount
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found'
            });
            return;
        }

        // Calculate amount directly
        const amount = order.price * order.quantity;

        if (amount <= 0) {
            res.status(400).json({
                success: false,
                message: 'Calculated transaction amount must be greater than 0'
            });
            return;
        }

        // Create the transaction
        const transaction = new Transaction({
            type,
            amount,
            date: transactionDate,
            createdAt: new Date(),
        });

        const savedTransaction = await transaction.save();

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: savedTransaction
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating transaction'
        });
    }
}

/**
 * Get transactions by business with pagination and filtering
 */
export const getTransactionsByBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const { businessId } = req.params;
        const {
            page = 1,
            limit = 10,
            type,
            category,
            startDate,
            endDate,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Validate business access
        // if (req.user?.businessId !== businessId && req.user?.role !== 'admin') {
        //     res.status(403).json({
        //         success: false,
        //         message: 'Unauthorized to access transactions for this business'
        //     });
        //     return;
        // }

        // // Verify business exists
        // const business = await Business.findById(businessId);
        // if (!business) {
        //     res.status(404).json({
        //         success: false,
        //         message: 'Business not found'
        //     });
        //     return;
        // }

        // Build query filter
        const filter: any = { businessId: new ObjectId(businessId) };

        if (type && ['income', 'expense'].includes(type as string)) {
            filter.type = type;
        }

        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        if (startDate || endDate) {
            // filter.date = {};
            if (startDate) {
                const start = new Date(startDate as string);
                // if (!isNaN(start.getTime())) {
                //     filter.date.$gte = start;
                // }
            }
            if (endDate) {
                const end = new Date(endDate as string);
                // if (!isNaN(end.getTime())) {
                //     filter.date.$lte = end;
                // }
            }
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const sortOptions: any = {};
        const validSortFields = ['date', 'amount', 'type', 'category', 'createdAt'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'date';
        const order = sortOrder === 'asc' ? 1 : -1;
        sortOptions[sortField as string] = order;

        // Execute query
        const [transactions, totalCount] = await Promise.all([
            Transaction.find(filter)
                .populate('productId', 'name')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Transaction.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching transactions'
        });
    }
}

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDate = async (req: Request, res: Response): Promise<void> => {
    try {


        const { businessId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({
                success: false,
                message: 'Both startDate and endDate are required'
            });
            return;


            // Validate business access
            // if (req.user?.businessId !== businessId && req.user?.role !== 'admin') {
            //     res.status(403).json({
            //         success: false,
            //         message: 'Unauthorized to access transactions for this business'
            //     });
            //     return;
            // }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
                return;
            }

            if (start > end) {
                res.status(400).json({
                    success: false,
                    message: 'Start date cannot be later than end date'
                });
                return;
            }

            const transactions = await Transaction.find({
                businessId: new ObjectId(businessId),
                date: {
                    $gte: start,
                    $lte: end
                }
            })
                .populate('productId', 'name')
                .sort({ date: -1 });

            // Calculate summary statistics
            interface TransactionSummary {
                totalIncome: number;
                totalExpenses: number;
                transactionCount: number;
                netAmount: number;
            }

            interface TransactionDocument {
                type: 'income' | 'expense';
                amount: number;
            }

            const summary: TransactionSummary = transactions.reduce((acc: TransactionSummary, transaction: TransactionDocument) => {
                if (transaction.type === 'income') {
                    acc.totalIncome += transaction.amount;
                } else {
                    acc.totalExpenses += transaction.amount;
                }
                acc.transactionCount++;
                return acc;
            }, {
                totalIncome: 0,
                totalExpenses: 0,
                transactionCount: 0,
                netAmount: 0
            });

            summary.netAmount = summary.totalIncome - summary.totalExpenses;

            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    summary,
                    dateRange: {
                        startDate: start,
                        endDate: end
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error filtering transactions by date:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while filtering transactions'
        });
    }
}

/**
 * Delete a transaction
 */
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid transaction ID format'
            });
            return;
        }

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
            return;
        }

        // Check permissions
        // if (req.user?.businessId !== transaction.businessId.toString() && req.user?.role !== 'admin') {
        //     res.status(403).json({
        //         success: false,
        //         message: 'Unauthorized to delete this transaction'
        //     });
        //     return;
        // }

        // await Transaction.findByIdAndDelete(id);

        // // Log the action
        // await AuditLog.create({
        //     action: 'DELETE_TRANSACTION',
        //     performedBy: req.user?.id,
        //     affectedCollection: 'transactions',
        //     timestamp: new Date(),
        //     details: {
        //         deletedTransactionId: id,
        //         type: transaction.type,
        //         amount: transaction.amount,
        //         businessId: transaction.businessId
        //     }
        // });

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting transaction'
        });
    }
}

/**
 * Update a transaction
 */
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid transaction ID format'
            });
            return;
        }

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
            return;
        }

        // Check permissions
        // if (req.user?.businessId !== transaction.businessId.toString() && req.user?.role !== 'admin') {
        //     res.status(403).json({
        //         success: false,
        //         message: 'Unauthorized to update this transaction'
        //     });
        //     return;
        // }

        // Validate updates
        const allowedUpdates = ['type', 'amount', 'date'];
        const updateKeys = Object.keys(updates);
        const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));

        if (!isValidUpdate) {
            res.status(400).json({
                success: false,
                message: 'Invalid update fields'
            });
            return;
        }

        // Validate specific fields if they're being updated
        if (updates.type && !['income', 'expense'].includes(updates.type)) {
            res.status(400).json({
                success: false,
                message: 'Transaction type must be either "income" or "expense"'
            });
            return;
        }

        if (updates.amount && (typeof updates.amount !== 'number' || updates.amount <= 0)) {
            res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
            return;
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('productId', 'name');

        // Log the action
        // await AuditLog.create({
        //     action: 'UPDATE_TRANSACTION',
        //     performedBy: req.user?.id,
        //     affectedCollection: 'transactions',
        //     timestamp: new Date(),
        //     details: {
        //         transactionId: id,
        //         updates,
        //         businessId: transaction.businessId
        //     }
        // });

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: updatedTransaction
        });

    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating transaction'
        });
    }
}
