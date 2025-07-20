    // Helper methods for consistent response formatting
    private toOrderResponse(order: OrderDocument) {
    return {
        ...order.toObject(),
        _id: order._id.toString(),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt?.toISOString()
    };
}

    private toTransactionResponse(transaction: TransactionDocument) {
    return {
        ...transaction.toObject(),
        _id: transaction._id.toString(),
        orderId: transaction.orderId.toString(),
        date: transaction.date.toISOString()
    };
}
