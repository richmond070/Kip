import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;
    performedBy: mongoose.Types.ObjectId;
    affectedCollection: string;
    timestamp: Date;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    businessId?: mongoose.Types.ObjectId;
}

const auditLogSchema = new Schema<IAuditLog>({
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE_USER',
            'UPDATE_USER',
            'DELETE_USER',
            'LOGIN',
            'LOGOUT',
            'CREATE_BUSINESS',
            'UPDATE_BUSINESS',
            'DELETE_BUSINESS',
            'CREATE_PRODUCT',
            'UPDATE_PRODUCT',
            'DELETE_PRODUCT',
            'CREATE_TRANSACTION',
            'UPDATE_TRANSACTION',
            'DELETE_TRANSACTION',
            'CREATE_INVOICE',
            'UPDATE_INVOICE',
            'DELETE_INVOICE',
            'MARK_INVOICE_PAID',
            'CREATE_CUSTOMER',
            'UPDATE_CUSTOMER',
            'DELETE_CUSTOMER'
        ]
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    affectedCollection: {
        type: String,
        required: true,
        enum: ['users', 'businesses', 'products', 'transactions', 'invoices', 'customers', 'vendors']
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    details: {
        type: Schema.Types.Mixed,
        required: true
    },
    ipAddress: {
        type: String,
        validate: {
            validator: function (v: string) {
                // Basic IP validation (IPv4 and IPv6)
                const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
                return ipv4Regex.test(v) || ipv6Regex.test(v);
            },
            message: 'Invalid IP address format'
        }
    },
    userAgent: {
        type: String,
        maxlength: 500
    },
    businessId: {
        type: Schema.Types.ObjectId,
        ref: 'Business'
    }
}, {
    timestamps: true,
    collection: 'auditlogs'
});

// Indexes for better query performance
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ affectedCollection: 1, timestamp: -1 });
auditLogSchema.index({ businessId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs after 2 years (optional)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;