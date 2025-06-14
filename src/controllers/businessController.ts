import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Business from '../models/business.model';
import AuditLogController from './auditlogController';

interface BusinessRequest {
    name: string;
    industry: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    phone;
    email;
}

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        businessId: string;
        role: string;
        email: string;
    };
}

class BusinessController {

    /**
     * Create a new business
     */
    async createBusiness(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {
                name,
                industry,
                address,
                phone,
                email,
            }: BusinessRequest = req.body;

            // Input validation
            if (!name || !industry || !address) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, industry, and address are required'
                });
                return;
            }

            // Validate address structure
            if (!address.street || !address.city || !address.state || !address.country) {
                res.status(400).json({
                    success: false,
                    message: 'Address must include street, city, state, and country'
                });
                return;
            }

            // Validate email format if provided
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid email format'
                    });
                    return;
                }
            }

            // Validate website URL if provided
            if (website) {
                try {
                    new URL(website);
                } catch {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid website URL format'
                    });
                    return;
                }
            }

            // Check if business name already exists for this user
            const existingBusiness = await Business.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                createdBy: new ObjectId(req.user!.id)
            });

            if (existingBusiness) {
                res.status(409).json({
                    success: false,
                    message: 'A business with this name already exists for your account'
                });
                return;
            }

            // Create the business
            const business = new Business({
                name: name.trim(),
                industry: industry.trim(),
                address: {
                    street: address.street.trim(),
                    city: address.city.trim(),
                    state: address.state.trim(),
                    zipCode: address.zipCode?.trim(),
                    country: address.country.trim()
                },
                phone: phone?.trim(),
                email: email?.trim().toLowerCase(),
                taxId: taxId?.trim(),
                website: website?.trim(),
                createdBy: new ObjectId(req.user!.id),
                createdAt: new Date()
            });

            const savedBusiness = await business.save();

            // Create audit log
            await AuditLogController.createLog({
                action: 'CREATE_BUSINESS',
                performedBy: req.user!.id,
                affectedCollection: 'businesses',
                details: {
                    businessId: savedBusiness._id,
                    businessName: savedBusiness.name,
                    industry: savedBusiness.industry
                },
                businessId: savedBusiness._id.toString(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.status(201).json({
                success: true,
                message: 'Business created successfully',
                data: savedBusiness
            });

        } catch (error) {
            console.error('Error creating business:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while creating business'
            });
        }
    }

    /**
     * Get business by ID
     */
    async getBusinessById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid business ID format'
                });
                return;
            }

            const business = await Business.findById(id);
            if (!business) {
                res.status(404).json({
                    success: false,
                    message: 'Business not found'
                });
                return;
            }

            // Check permissions
            if (business.createdBy.toString() !== req.user!.id && req.user!.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to delete this business'
                });
                return;
            }

            // Require confirmation for deletion
            const { confirmDelete } = req.body;
            if (!confirmDelete) {
                res.status(400).json({
                    success: false,
                    message: 'Please confirm deletion by setting confirmDelete to true. WARNING: This will delete all associated data including products, transactions, and invoices.'
                });
                return;
            }

            // TODO: In a production system, you might want to:
            // 1. Check for dependent records (products, transactions, invoices)
            // 2. Either prevent deletion or cascade delete
            // 3. Implement soft delete instead of hard delete

            await Business.findByIdAndDelete(id);

            // Create audit log
            await AuditLogController.createLog({
                action: 'DELETE_BUSINESS',
                performedBy: req.user!.id,
                affectedCollection: 'businesses',
                details: {
                    deletedBusinessId: id,
                    businessName: business.name,
                    industry: business.industry
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.status(200).json({
                success: true,
                message: 'Business deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting business:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting business'
            });
        }
    }

    /**
     * Get business statistics
     */
    async getBusinessStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid business ID format'
                });
                return;
            }

            const business = await Business.findById(id);
            if (!business) {
                res.status(404).json({
                    success: false,
                    message: 'Business not found'
                });
                return;
            }

            // Check permissions
            if (business.createdBy.toString() !== req.user!.id && req.user!.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to access this business'
                });
                return;
            }

            // Get statistics (these would require the other models to be imported)
            // For now, return basic business info with placeholders for stats
            const stats = {
                business: {
                    id: business._id,
                    name: business.name,
                    industry: business.industry,
                    createdAt: business.createdAt
                },
                // TODO: Implement these when other models are available
                totalProducts: 0,
                totalTransactions: 0,
                totalInvoices: 0,
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0
            };

            res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error fetching business statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching business statistics'
            });
        }
    }
}

export default new BusinessController().json({
    success: false,
    message: 'Invalid business ID format'
});
return;


const { id } = req.params;
const fetchedBusiness = await Business.findById(id);
    .populate('createdBy', 'name email')
    .lean();

if (!fetchedBusiness) {
    res.status(404).json({
        success: false,
        message: 'Business not found'
    });
    return;
}

// Check if user has permission to view this business
if (business.createdBy._id.toString() !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
        success: false,
        message: 'Unauthorized to access this business'
    });
    return;
}

res.status(200).json({
    success: true,
    data: business
});

    } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error while fetching business'
    });
}
  }

  /**
   * Get all businesses for current user or all businesses for admin
   */
  async getBusinesses(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const {
            page = 1,
            limit = 10,
            industry,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query filter
        const filter: any = {};

        // For non-admin users, only show their businesses
        if(req.user!.role !== 'admin') {
    filter.createdBy = new ObjectId(req.user!.id);
}

// Industry filter
if (industry) {
    filter.industry = { $regex: industry, $options: 'i' };
}

// Search filter (name, industry, or address city)
if (search) {
    filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
    ];
}

// Pagination
const pageNum = Math.max(1, parseInt(page as string) || 1);
const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
const skip = (pageNum - 1) * limitNum;

// Sorting
const sortOptions: any = {};
const validSortFields = ['name', 'industry', 'createdAt', 'updatedAt'];
const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
const order = sortOrder === 'asc' ? 1 : -1;
sortOptions[sortField as string] = order;

// Execute query
const [businesses, totalCount] = await Promise.all([
    Business.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    Business.countDocuments(filter)
]);

const totalPages = Math.ceil(totalCount / limitNum);

res.status(200).json({
    success: true,
    data: {
        businesses,
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
    console.error('Error fetching businesses:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error while fetching businesses'
    });
}
  }

  /**
   * Update business
   */
  async updateBusiness(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const { id } = req.params;
        const updates = req.body;

        if(!ObjectId.isValid(id)) {
    res.status(400).json({
        success: false,
        message: 'Invalid business ID format'
    });
    return;
}

const business = await Business.findById(id);
if (!business) {
    res.status(404).json({
        success: false,
        message: 'Business not found'
    });
    return;
}

// Check permissions
if (business.createdBy.toString() !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
        success: false,
        message: 'Unauthorized to update this business'
    });
    return;
}

// Validate allowed update fields
const allowedUpdates = ['name', 'industry', 'address', 'phone', 'email', 'taxId', 'website'];
const updateKeys = Object.keys(updates);
const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));

if (!isValidUpdate) {
    res.status(400).json({
        success: false,
        message: 'Invalid update fields'
    });
    return;
}

// Validate email format if being updated
if (updates.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email)) {
        res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
        return;
    }
    updates.email = updates.email.toLowerCase();
}

// Validate website URL if being updated
if (updates.website) {
    try {
        new URL(updates.website);
    } catch {
        res.status(400).json({
            success: false,
            message: 'Invalid website URL format'
        });
        return;
    }
}

// Check for duplicate business name if name is being updated
if (updates.name && updates.name !== business.name) {
    const existingBusiness = await Business.findOne({
        name: { $regex: new RegExp(`^${updates.name}$`, 'i') },
        createdBy: business.createdBy,
        _id: { $ne: id }
    });

    if (existingBusiness) {
        res.status(409).json({
            success: false,
            message: 'A business with this name already exists for your account'
        });
        return;
    }
}

const updatedBusiness = await Business.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
).populate('createdBy', 'name email');

// Create audit log
await AuditLogController.createLog({
    action: 'UPDATE_BUSINESS',
    performedBy: req.user!.id,
    affectedCollection: 'businesses',
    details: {
        businessId: id,
        updates,
        businessName: updatedBusiness?.name
    },
    businessId: id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
});

res.status(200).json({
    success: true,
    message: 'Business updated successfully',
    data: updatedBusiness
});

    } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error while updating business'
    });
}
  }

  /**
   * Delete business
   */
async deleteBusiness(req: AuthenticatedRequest, res: Response): Promise < void> {
    try {
        const { id } = req.params;
        const { confirmDelete } = req.body;

        if(!ObjectId.isValid(id)) {
    res.status(400