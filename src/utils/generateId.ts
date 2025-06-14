// Invocie number generator
export function generateInvoiceNumber() {
    return 'INV-' + Math.floor(Math.random() * 1e9);
}

// Transaction Id generator
export function generateTransactionId() {
    return 'TXN-' + Math.floor(Math.random().toString(36).substring(2, 9));
}