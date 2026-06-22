# InventoryEye: AI-Powered Inventory Forecasting and Smart Replenishment System

![InventoryEye Logo](https://via.placeholder.com/1000x300.png?text=InventoryEye+Enterprise+Dashboard)

## 📌 Project Overview
InventoryEye is a comprehensive, enterprise-grade, full-stack application designed specifically for supermarkets and retail chains. It replaces legacy, spreadsheet-based inventory tracking with a smart, automated, predictive platform. 

By combining real-time inventory tracking with **Machine Learning-inspired Demand Forecasting**, InventoryEye actively prevents stockouts, minimizes overstock waste, and generates actionable, AI-driven purchasing recommendations.

---

## 🚀 Key Modules & Features

### 1. 📦 Core Inventory & Stock Management
- **Real-Time Tracking**: Maintain an accurate ledger of all products, SKUs, pricing, and category assignments.
- **Stock Movements**: Record IN/OUT transactions securely.
- **Threshold Alerts**: Define minimum reorder points per product to trigger automated warnings.

### 2. 🧠 AI Demand Forecasting Engine
- **Predictive Analytics**: Analyzes historical sales data (SalesHistory) to calculate Moving Averages and compute dynamic trend trajectories (Up/Down/Stable).
- **Confidence Scoring**: Assigns an accuracy confidence percentage to each forecast.
- **Visual Dashboards**: Compare historical actuals vs predicted demand through interactive Recharts area graphs.

### 3. 🤖 Automated Reorder Recommendation System
- **Smart Logic**: Automatically cross-references current stock against AI Forecasts to determine exactly *when* a product will run out (Days Remaining).
- **Priority Triage**: Dynamically categorizes reorders into Critical, High, Medium, and Low priorities.
- **Automated Purchase Orders**: Generates downloadable PDF Purchase Orders (via `jsPDF`) with pre-calculated optimum reorder quantities (incorporating a 20% safety buffer).

### 4. 📊 Reports & Analytics Center
- **Executive Summary**: A unified 4-tab dashboard offering high-level KPIs like the global *Inventory Health Score*.
- **Data Exporting**: 1-click exporting of raw data to CSV.
- **Enterprise Reporting**: 1-click dynamic generation of professional, structured PDF reports using `jspdf-autotable`.

---

## 🛠 Technology Stack

### Frontend (Client-Side)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS 3
- **Routing**: React Router DOM v6
- **Data Visualization**: Recharts (Pie, Bar, Line, Area charts)
- **Icons**: Lucide React
- **Document Generation**: jsPDF & jsPDF-Autotable

### Backend (Server-Side)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ORM)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt.js
- **Middleware**: CORS, Express JSON parser

---

## ⚙️ Installation & Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/InventoryEye.git
cd InventoryEye
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventoryeye
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```
Start the backend server:
```bash
npm run dev
```
*(Note: On first boot with an empty database, `server.js` will automatically seed synthetic demo data to initialize the Forecasting models!)*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

---

## 📡 API Overview
InventoryEye operates via a RESTful architecture. Key endpoints include:

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`
- **Inventory**: `GET /api/inventory`, `POST /api/inventory/transaction`
- **Forecasts**: `GET /api/forecasts`, `POST /api/forecasts/generate`
- **Recommendations**: `GET /api/recommendations`, `POST /api/recommendations/generate`
- **Reports**: `GET /api/reports/summary`, `GET /api/reports/inventory`

---

## 🔮 Future Enhancements
- **Multi-Store Support**: Scale the database architecture to handle multiple warehouse locations.
- **Supplier Integration**: Automate the email transmission of generated Purchase Order PDFs directly to vendor APIs.
- **Advanced ML Models**: Replace statistical moving averages with an integrated Python microservice running ARIMA or Prophet models.

---

## 👨‍💻 Author
Built with ❤️ for modern retail management.
