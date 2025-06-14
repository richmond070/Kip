# KIP

A book-keeping system to track financial activity, inventory, and business operations. 

## 1. DATABASE DESIGN (MongoDB Schema Concepts) 

### Users: 
name, email, passwordHash 
role (customer, vendor) 
businessId (reference) 

### Businesses: 
name, 
industry, 
address 

### Products: 
name, 
description, 
price, 
quantity, 
businessId 

### Transactions: 
type: income, expense 
amount, 
date, 
category, 
description, 
productName, 
businessId 

### Invoices: 
invoiceNumber,
customerId, 
transactionIds[], 
status, 
dueDate, 
businessId 
### Audit Logs: 
action, 
performedBy,
affectedCollection, 
timestamp, 
details 

## 2. CONTROLLERS 

### businessController.ts:
createBusiness(), 
getBusinessById(), 
updateBusiness(), 
deleteBusiness() 

### productController.ts: 
createProduct(), 
listProducts(), 
updateProduct(), 
deleteProduct() 

### transactionController.ts: 
createTransaction(),
getTransactionsByBusiness(), 
filterTransactionsByDate(),
deleteTransaction() 

### invoiceController.ts: 
generateInvoice(), 
markAsPaid(), 
getInvoicesByCustomer() 

### authController.ts: 
registerUser(), 
loginUser(), 
logoutUser(), 
getCurrentUser() 

## 3. ROUTES (ENDPOINT STRUCTURE) 
`/api/auth/register` - POST - Register a user 
`/api/auth/login` - POST - Login 
`/api/business` - POST/GET - Create and list businesses 
`/api/products` - GET/POST - View and add products 
`/api/products/:id` - PUT/DELETE - Update or delete product 
`/api/transactions` - GET/POST - View or create transactions 
`/api/transactions/:id` - DELETE - Remove transaction 
`/api/invoices` - GET/POST - Generate and retrieve invoices 
`/api/users/:id` - GET - View user details 
`/api/logs` - GET - View audit logs 

## 4. REASONS FOR TABLES 
- Separation of concerns: Business, product, and finance logic are isolated. 
- Multi-tenancy: Each table has businessId to support multiple businesses.
- Scalability: Easily supports analytics, reporting, and permissions later. 
- Flexibility: Allows tracking both income and expenses, detailed financials, and customer/vendor profiles.
