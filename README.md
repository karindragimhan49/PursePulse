# **Finance Tracker Backend**

## **Overview**
The Finance Tracker Backend is the core API service for managing user authentication, financial transactions, budgets, goals, and reports. This backend is built using **Node.js, Express.js, and MongoDB**, ensuring efficient financial data management.

---
## **Features**
- **User Authentication:** Secure JWT-based authentication for user sign-up and login.
- **Transaction Management:** Create, update, delete, and view financial transactions.
- **Budget Management:** Automatically renews budgets and processes recurring transactions.
- **Goal Tracking:** Allows users to set financial goals and track progress.
- **Notifications:** Email alerts for upcoming and missed transactions.
- **Reports:** Generate reports for financial activities.

---
## **Technologies Used**
- **Node.js:** Backend framework for API development.
- **Express.js:** Web framework for handling routes and requests.
- **MongoDB:** NoSQL database for storing user financial data.
- **Mongoose:** ODM for MongoDB interactions.
- **JWT (JSON Web Token):** Token-based authentication for secure API access.
- **Node-Cron:** Automated task scheduler for running periodic background jobs.
- **Nodemailer:** Sends email notifications.
- **Helmet:** Secures HTTP headers.
- **CORS:** Manages Cross-Origin Resource Sharing.
- **dotenv:** Handles environment variables.

---
## **Installation**

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/finance-tracker-backend.git
cd finance-tracker-backend
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
Create a `.env` file in the root directory and add the following variables:
```env
PORT=5000
MONGO_URI=<your_mongo_db_connection_string>
JWT_SECRET=your_jwt_secret
```

### **4. Run the Application**
```bash
npm start
```
The server will start on **http://localhost:5000**.

---
## **API Documentation**

### **Authentication**
#### **Register a User**
```http
POST /api/v1/auth/register
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### **User Login**
```http
POST /api/v1/auth/login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### **Transactions**
#### **Create a Transaction**
```http
POST /api/v1/transaction
```
**Request Body:**
```json
{
  "amount": 100,
  "category": "Food",
  "date": "2025-03-01",
  "description": "Lunch"
}
```

#### **Get All Transactions**
```http
GET /api/v1/transaction
```

#### **Get a Transaction by ID**
```http
GET /api/v1/transaction/:id
```

#### **Update a Transaction**
```http
PUT /api/v1/transaction/:id
```
**Request Body:**
```json
{
  "amount": 200,
  "category": "Entertainment",
  "date": "2025-03-01",
  "description": "Movie"
}
```

#### **Delete a Transaction**
```http
DELETE /api/v1/transaction/:id
```

### **Budgets**
#### **Get All Budgets**
```http
GET /api/v1/budget
```

#### **Create a Budget**
```http
POST /api/v1/budget
```
**Request Body:**
```json
{
  "category": "Food",
  "limit": 500
}
```

#### **Update a Budget**
```http
PUT /api/v1/budget/:id
```

#### **Delete a Budget**
```http
DELETE /api/v1/budget/:id
```

### **Goals**
#### **Get All Financial Goals**
```http
GET /api/v1/goal
```

#### **Create a Goal**
```http
POST /api/v1/goal
```
**Request Body:**
```json
{
  "goalName": "Save for a vacation",
  "amount": 2000,
  "targetDate": "2025-12-31"
}
```

#### **Update a Goal**
```http
PUT /api/v1/goal/:id
```

#### **Delete a Goal**
```http
DELETE /api/v1/goal/:id
```

### **Reports**
#### **Generate a Report**
```http
GET /api/v1/report
```
**Optional Request Parameters:**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

---
## **Cron Jobs**
This backend includes scheduled tasks that run automatically:

1. **Budget Renewal**  
   - Runs **daily at midnight** to renew budgets.
2. **Recurring Transactions Processing**  
   - Runs **daily at 12:05 AM** to process recurring transactions.
3. **Upcoming Transaction Notifications**  
   - Runs **daily at 9:00 AM** to notify users of upcoming transactions.
4. **Missed Transaction Notifications**  
   - Runs **daily at 10:00 AM** to remind users of missed transactions.

---
## **Contributing**
Want to contribute? Follow these steps:
1. **Fork the repository**.
2. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Make changes and commit**:
   ```bash
   git commit -m "Add some feature"
   ```
4. **Push your branch**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a pull request**.

---
## **License**
This project is licensed under the **ISC License**. See the LICENSE file for details.

