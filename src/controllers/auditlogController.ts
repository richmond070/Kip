import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import AuditLog from '../models/auditLog.model';
import Business from '../models/business.model';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        businessId: string;
        role: string;
    };
}

class AuditLogController {

    /**
     * Get audit logs with filtering and pagination
     */
    async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 20,
                action,
                affectedCollection,
                businessId,
                startDate,
                endDate,
                performedBy,
                sortOrder = 'desc'
            } = req.query;

            // Only admins can view all audit logs, regular users can only see their business logs
            if (req.user?.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized. Only administrators can view audit logs.'
                });
                return;
            }

            // Build query filter
            const filter: any = {};

            if (action) {
                filter.action = action;
            }

            if (affectedCollection) {
                filter.affectedCollection = affectedCollection;
            }

            if (businessId) {
                if (!ObjectId.isValid(businessId as string)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid business ID format'
                    });
                    return;
                }
                filter.businessId = new ObjectId(businessId as string);
            }

            if (performedBy) {
                if (!ObjectId.isValid(performedBy as string)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid user ID format'
                    });
                    return;
                }
                filter.performedBy = new ObjectId(performedBy as string);
            }

            // Date range filter
            if (startDate || endDate) {
                filter.timestamp = {};
                if (startDate) {
                    const start = new Date(startDate as string);
                    if (!isNaN(start.getTime())) {
                        filter.timestamp.$gte = start;
                    }
                }
                if (endDate) {
                    const end = new Date(endDate as string);
                    if (!isNaN(end.getTime())) {
                        filter.timestamp.$lte = end;
                    }
                }
            }

            // Pagination
            const pageNum = Math.max(1, parseInt(page as string) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
            const skip = (pageNum - 1) * limitNum;

            // Sorting
            const sort = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const [logs, totalCount] = await Promise.all([
                AuditLog.find(filter)
                    .populate('performedBy', 'name email')
                    .populate('businessId', 'name')
                    .sort({ timestamp: sort })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                AuditLog.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(totalCount / limitNum);

            res.status(200).json({
                success: true,
                data: {
                    logs,
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
            console.error('Error fetching audit logs:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching audit logs'
            });
        }
    }

    /**
     * Get audit logs for a specific business
     */
    async getBusinessAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { businessId } = req.params;
            const {
                page = 1,
                limit = 20,
                action,
                affectedCollection,
                startDate,
                endDate,
                sortOrder = 'desc'
            } = req.query;

            if (!ObjectId.isValid(businessId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid business ID format'
                });
                return;
            }

            // Check if user has permission to view this business's logs
            if (req.user?.businessId !== businessId && req.user?.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to view audit logs for this business'
                });
                return;
            }

            // Verify business exists
            const business = await Business.findById(businessId);
            if (!business) {
                res.status(404).json({
                    success: false,
                    message: 'Business not found'
                });
                return;
            }

            // Build query filter
            const filter: any = {
                businessId: new ObjectId(businessId)
            };

            if (action) {
                filter.action = action;
            }

            if (affectedCollection) {
                filter.affectedCollection = affectedCollection;
            }

            // Date range filter
            if (startDate || endDate) {
                filter.timestamp = {};
                if (startDate) {
                    const start = new Date(startDate as string);
                    if (!isNaN(start.getTime())) {
                        filter.timestamp.$gte = start;
                    }
                }
                if (endDate) {
                    const end = new Date(endDate as string);
                    if (!isNaN(end.getTime())) {
                        filter.timestamp.$lte = end;
                    }
                }
            }

            // Pagination
            const pageNum = Math.max(1, parseInt(page as string) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
            const skip = (pageNum - 1) * limitNum;

            // Sorting
            const sort = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const [logs, totalCount] = await Promise.all([
                AuditLog.find(filter)
                    .populate('performedBy', 'name email')
                    .sort({ timestamp: sort })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                AuditLog.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(totalCount / limitNum);

            res.status(200).json({
                success: true,
                data: {
                    logs,
                    business: {
                        id: business._id,
                        name: business.name
                    },
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
            console.error('Error fetching business audit logs:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching business audit logs'
            });
        }
    }

    /**
     * Get audit logs for a specific user's actions
     */
    async getUserAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const {
                page = 1,
                limit = 20,
                action,
                affectedCollection,
                startDate,
                endDate,
                sortOrder = 'desc'
            } = req.query;

            if (!ObjectId.isValid(userId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
                return;
            }

            // Users can only view their own logs unless they're admin
            if (req.user?.id !== userId && req.user?.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to view audit logs for this user'
                });
                return;
            }

            // Build query filter
            const filter: any = {
                performedBy: new ObjectId(userId)
            };

            if (action) {
                filter.action = action;
            }

            if (affectedCollection) {
                filter.affectedCollection = affectedCollection;
            }

            // Date range filter
            if (startDate || endDate) {
                filter.timestamp = {};
                if (startDate) {
                    const start = new Date(startDate as string);
                    if (!isNaN(start.getTime())) {
                        filter.timestamp.$gte = start;
                    }
                }
                if (endDate) {
                    const end = new Date(endDate as string);
                    if (!isNaN(end.getTime())) {
                        filter.timestamp.$lte = end;
                    }
                }
            }

            // Pagination
            const pageNum = Math.max(1, parseInt(page as string) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
            const skip = (pageNum - 1) * limitNum;

            // Sorting
            const sort = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const [logs, totalCount] = await Promise.all([
                AuditLog.find(filter)
                    .populate('businessId', 'name')
                    .sort({ timestamp: sort })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                AuditLog.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(totalCount / limitNum);

            res.status(200).json({
                success: true,
                data: {
                    logs,
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
            console.error('Error fetching user audit logs:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user audit logs'
            });
        }
    }

    /**
     * Create an audit log entry (typically called by other controllers)
     */
    static async createLog(logData: {
        action: string;
        performedBy: string;
        affectedCollection: string;
        details: Record<string, any>;
        businessId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void> {
        try {
            await AuditLog.create({
                action: logData.action,
                performedBy: new ObjectId(logData.performedBy),
                affectedCollection: logData.affectedCollection,
                timestamp: new Date(),
                details: logData.details,
                businessId: logData.businessId ? new ObjectId(logData.businessId) : undefined,
                ipAddress: logData.ipAddress,
                userAgent: logData.userAgent
            });
        } catch (error) {
            console.error('Error creating audit log:', error);
            // Don't throw error to avoid breaking the main operation
        }
    }

    /**
     * Get audit log statistics
     */
    async getAuditLogStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Only admins can view audit log statistics
            if (req.user?.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized. Only administrators can view audit log statistics.'
                });
                return;
            }

            const { businessId, startDate, endDate } = req.query;

            // Build date filter
            const dateFilter: any = {};
            if (startDate || endDate) {
                dateFilter.timestamp = {};
                if (startDate) {
                    const start = new Date(startDate as string);
                    if (!isNaN(start.getTime())) {
                        dateFilter.timestamp.$gte = start;
                    }
                }
                if (endDate) {
                    const end = new Date(endDate as string);
                    if (!isNaN(end.getTime())) {
                        dateFilter.timestamp.$lte = end;
                    }
                }
            }

            // Build business filter
            const businessFilter: any = {};
            if (businessId) {
                if (!ObjectId.isValid(businessId as string)) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid business ID format'
                    });
                    return;
                }
                businessFilter.businessId = new ObjectId(businessId as string);
            }

            const matchFilter = { ...dateFilter, ...businessFilter };

            const [actionStats, collectionStats, totalLogs] = await Promise.all([
                // Action statistics
                AuditLog.aggregate([
                    { $match: matchFilter },
                    { $group: { _id: '$action', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),

                // Collection statistics
                AuditLog.aggregate([
                    { $match: matchFilter },
                    { $group: { _id: '$affectedCollection', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),

                // Total logs count
                AuditLog.countDocuments(matchFilter)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    totalLogs,
                    actionStats,
                    collectionStats,
                    dateRange: {
                        startDate: startDate || null,
                        endDate: endDate || null
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching audit log statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching audit log statistics'
            });
        }
    }
}

export default new AuditLogController();