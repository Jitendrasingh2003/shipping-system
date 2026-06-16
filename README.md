# SmartShip — Role-Based Shipping & Logistics Management System

SmartShip is an enterprise-grade, role-based logistics management platform built to handle end-to-end booking, payment processing, estimated transit duration calculations, and real-time package tracking.

Designed with a clean, e-commerce style **Light Mode** user interface, it provides dedicated portals for **Administrators**, **Staff Operators**, and **Customers**.

---

## 🚀 Key Features

### 👤 Role-Based Access Control (RBAC)
- **Customer Portal**: Book shipments, calculate shipping rates, manage a personal address book, submit support tickets, download PDF invoices, and monitor active orders with a real-time tracking timeline.
- **Staff Portal**: View assigned pickup/delivery tasks, manage active route progressions, and update shipment hubs using an interactive visual stepper.
- **Admin Portal**: Executive overview with analytics charts, staff management (registration & listing), registry control (assign shipments to staff), finance ledger logs, and system health status.

### 🗓️ Transit Duration Estimator
- Local, deterministic calculations to estimate transit duration based on origin, destination, parcel weight, and shipping service type.

### 💳 Payment & Invoices
- Integrates a mock **Razorpay checkout** simulating transactions and signature verification.
- Generates professional PDF invoices on-the-fly via **PDFKit** to let clients download billing ledgers immediately.

### 📡 WebSockets Live Timeline
- Incorporates real-time tracking updates utilizing **Socket.io**.
- Instantly notifies customers of location or status changes triggered by staff carriers.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Recharts (Data Visualization), Socket.io-client, Lucide Icons, React Hot Toast
- **Backend**: Node.js, Express.js, Socket.io (Real-time Communication), JWT Authentication, Helmet, Morgan
- **Database**: 
  - **MongoDB (Mongoose)**: Shipments, Invoices, Notifications, Tickets, Saved Addresses
  - **MySQL (mysql2)**: High-speed relational user accounts storage with an **automatic fallback** to MongoDB if MySQL is offline.

---

## 📂 Directory Structure

```text
├── client/              # React (Vite + Tailwind) Frontend
│   ├── src/
│   │   ├── components/  # Router guards
│   │   ├── context/     # Auth & WebSockets Contexts
│   │   ├── pages/       # Dashboard and Portal selectors
│   │   └── index.css    # Global premium theme styling
├── server/              # Express.js REST API & Socket.io server
│   ├── config/          # DB connections (Mongo & MySQL)
│   ├── controllers/     # Business logic modules
│   ├── models/          # Mongoose collections
│   ├── routes/          # REST Endpoints
│   └── utils/           # Database Seeder script
├── run.ps1              # Unified PowerShell Launcher Script
└── README.md            # Project documentation
```

---

## ⚡ Quick Start

### Prerequisites
Make sure you have node.js (v16+) and MongoDB running locally.

### Automated Setup & Execution
The repository includes a single unified launcher script. Open a PowerShell terminal in the workspace root and run:
```powershell
.\run.ps1
```
This script will:
1. Install frontend and backend npm dependencies.
2. Spin up services concurrently in terminal windows.

---

### Manual Setup

If you prefer running services individually:

1. **Backend Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:5000`*

2. **Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:5173`*

---

## 🔑 Seeded Demo Credentials
The server automatically seeds demo users if your database is empty. You can log in with:

| Portal Role | Email ID | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@shiptrack.com` | `Admin@123` |
| **Staff Operator** | `staff1@shiptrack.com` | `Staff@123` |
| **Customer** | `customer1@shiptrack.com` | `Customer@123` |

---

## 🤝 Support
For any queries or setup assistance, feel free to open a ticket in the Customer Support portal. Happy shipping!
