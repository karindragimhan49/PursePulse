# 📌 Finance Tracker Backend

Welcome to the **Finance Tracker Backend**! 🎯 This backend powers a Finance Tracker application, providing robust API endpoints to manage **user authentication, transactions, goals, budgets, and more**. The backend leverages **MongoDB, Node.js, Express**, and other tools to help users efficiently manage their financial data. 💰📊

---

## ✨ Features
✅ **User Authentication**: Register and login using JWT authentication. 🔐  
✅ **Transaction Management**: Add, update, delete, and view financial transactions. 💸  
✅ **Budget Management**: Renew budgets daily and process recurring transactions. 🏦  
✅ **Goal Management**: Set financial goals and track progress. 🎯  
✅ **Notifications**: Email alerts for upcoming and missed transactions. 📩  
✅ **Reports**: Generate reports on financial activities. 📈  

---

## 🛠️ Technologies Used
🚀 **Node.js** - Backend framework for building the API  
🚀 **Express.js** - Web framework for routing and handling requests  
🚀 **MongoDB** - Database for storing transactions, users, goals, etc.  
🚀 **Mongoose** - ODM for interacting with MongoDB  
🚀 **JWT** - Secure token-based authentication 🔐  
🚀 **Node-Cron** - Automates recurring tasks ⏰  
🚀 **Nodemailer** - Sends email notifications 📧  
🚀 **Helmet** - Secures HTTP headers 🔒  
🚀 **CORS** - Enables Cross-Origin Resource Sharing  
🚀 **dotenv** - Manages environment variables  

---

## ⚙️ Installation

### 1️⃣ Clone the Repository
```bash
$ git clone https://github.com/yourusername/finance-tracker-backend.git
$ cd finance-tracker-backend
```

### 2️⃣ Install Dependencies
```bash
$ npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the root directory and configure it:
```env
PORT=5000
MONGO_URI=<your_mongo_db_connection_string>
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Run the Application
Start the server using:
```bash
$ npm start
```
This will run the server on **http://localhost:5000** 🚀

---

## 📡 API Documentation
### 🔐 Authentication
- **POST /api/v1/auth/register** - Register a new user  
  **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **POST /api/v1/auth/login** - Login user & get a JWT token  
  **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### 💰 Transactions
- **POST /api/v1/transaction** - Create a new transaction  
  **Request Body:**
  ```json
  {
    "amount": 100,
    "category": "Food",
    "date": "2025-03-01",
    "description": "Lunch"
  }
  ```
- **GET /api/v1/transaction** - Get all transactions  
- **GET /api/v1/transaction/:id** - Get a transaction by ID  
- **PUT /api/v1/transaction/:id** - Update a transaction  
- **DELETE /api/v1/transaction/:id** - Delete a transaction  

### 🎯 Goals
- **POST /api/v1/goal** - Create a new financial goal  
  **Request Body:**
  ```json
  {
    "goalName": "Save for a vacation",
    "amount": 2000,
    "targetDate": "2025-12-31"
  }
  ```
- **GET /api/v1/goal** - Get all financial goals  
- **PUT /api/v1/goal/:id** - Update a goal  
- **DELETE /api/v1/goal/:id** - Delete a goal  

### 📊 Reports
- **GET /api/v1/report** - Generate financial reports  
  **Optional Parameters:**
  ```json
  {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }
  ```

---

## ⏰ Cron Jobs
This backend includes scheduled jobs for automation:

🕛 **Budget Renewal Task** - Runs **daily at midnight** 🏦  
🕐 **Recurring Transactions** - Runs **daily at 12:05 AM** 🔄  
🕘 **Upcoming Transaction Notifications** - Runs **daily at 9:00 AM** 📩  
🕙 **Missed Transaction Notifications** - Runs **daily at 10:00 AM** ❗  

---

## 🤝 Contributing
1️⃣ **Fork** the repository  
2️⃣ Create a **new branch** (`git checkout -b feature/your-feature`)  
3️⃣ **Commit** your changes (`git commit -m 'Add some feature'`)  
4️⃣ **Push** to the branch (`git push origin feature/your-feature`)  
5️⃣ Open a **Pull Request** 🚀  

---

## 📜 License
This project is licensed under the **ISC License**. See the `LICENSE` file for details. 📄



