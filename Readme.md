# KIP

A book-keeping system to track financial activity, inventory, and business operations.

## 1. DATABASE DESIGN (MongoDB Schema Concepts)

### Users:

- name, email, passwordHash
- role (customer, vendor)
- businessId (reference)

### Businesses:

- name,
- industry,
- address

### Orders:

- name,
- description,
- price,
- quantity,
- businessId

### Transactions:

- type: income, expense
- amount,
- date,
- category,
- description,
- productName,
- businessId

### Invoices:

- invoiceNumber,
- customerId,
- transactionIds[],
- status,
- dueDate,
- businessId

### Audit Logs:

- action,
- performedBy,
- affectedCollection,
- timestamp,
- details

## 2. SERVICES

    Service folder contains all the business logic, all class based.
    - `businessService` contains details of the business like 'name', 'phone', 'address' and also contains the login logic for business accounts.
    - `customerService` handles logic on creating a new user when ever a new order is being recorded.
    - `orderService` which is the main logic handles orders of both customers and vendors.
    - `transactionService` is called after an order has been created.
    - `invoiceService` is tied to both the `orderService` and `transactionService, handles logic to generate an invoice after each transaction and order has been recorded.

## 3. ROUTES (ENDPOINT STRUCTURE)

`/api/auth/register` - POST - Register a a business
`/api/auth/login` - POST - Login a business
`/api/business` - POST/GET - Create and list businesses
`/api/orders` - GET/POST - View and add orders
`/api/orders/:id` - PUT/DELETE - Update or delete product
`/api/transactions` - GET/POST - View or create transactions
`/api/transactions/:id` - DELETE - Remove transaction
`/api/invoices` - GET/POST - Generate and retrieve invoices
`/api/customer/:id` - GET - View customer details
`/api/logs` - GET - View audit logs

## 4. REASONS FOR TABLES

- Separation of concerns: Business, product, and finance logic are isolated.
- Multi-tenancy: Each table has businessId to support multiple businesses.
- Scalability: Easily supports analytics, reporting, and permissions later.
- Flexibility: Allows tracking both income and expenses, detailed financial, and customer/vendor profiles.
