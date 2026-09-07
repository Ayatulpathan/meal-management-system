# Meal Management System (React + Firebase)

A modern, production-grade **Meal Management System** built with **React**, **Vite**, **Firebase Cloud Firestore**, and **Firebase Authentication**. Designed for mess groups, shared flats, and hostel dining communities to seamlessly track daily member meals, grocery expenses, advance deposits, and automatically compute accurate cost-per-meal and individual financial balances in **Bangladeshi Taka (৳)**.

---

## 🌟 Features

- **MVC-Inspired Architecture**: Strict separation of View (UI), Controller (Custom Hooks), Service (Firebase Firestore SDK), Model (Schemas/Sanitizers), and Calculation Engine.
- **Spreadsheet Meal Grid**: Dynamic day columns (28–31 days based on month), instant toggle buttons for `0`, `1`, or `2` meals per member per day, sticky member names, and real-time total updates.
- **Automated Calculation Engine**:
  - Total Market Cost = $\sum \text{Market Expenses}$
  - Total Meals = $\sum \text{Member Total Meals}$
  - Cost Per Meal = $\frac{\text{Total Market Cost}}{\text{Total Meals}}$ (with zero-division prevention)
  - Member Meal Cost = $\text{Member Meals} \times \text{Cost Per Meal}$
  - Member Balance = $\text{Total Deposit} - \text{Member Meal Cost}$
  - Exact accounting reconciliation: $\sum \text{Member Meal Costs} \approx \text{Total Market Cost}$
- **Member Management**: Add, edit, and deactivate members (soft deactivation preserves historical data).
- **Multi-Month & Historical Records**: Select any month (`YYYY-MM`) with automatic schema initialization and historical data preservation.
- **Monthly Closing & Read-Only Lock**: Lock finished months (`status: "closed"`) to prevent edits to meals, costs, or deposits while keeping reports accessible forever.
- **Audited Financial Statements**: Printable and exportable (CSV) monthly reports and member ledgers with clear positive/negative balance indicators.
- **Cloud Firestore Security Rules**: Robust server-side authorization enforcing authentication and field constraints.

---

## 🏗️ Architecture & Directory Structure

```text
src/
├── assets/
├── components/
│   ├── common/             # Reusable UI primitives (Button, Input, Select, Modal, ConfirmDialog, Loader, SummaryCard)
│   ├── layout/             # Application layout, Header with Month Selector, Sidebar, and Mobile Nav
│   ├── dashboard/          # Dashboard metrics, Today's Meals snapshot, and Recent activity
│   ├── members/            # Member table, creation/edit modal, and member details breakdown
│   ├── meals/              # Spreadsheet meal grid with sticky headers and fast meal counters
│   ├── market/             # Market cost table and expense recording modal
│   ├── deposits/           # Member deposit ledger and advance money recording modal
│   └── reports/            # Monthly report, Member balance sheet, and printable statements
├── pages/                  # Route views (Login, Dashboard, Members, Meals, MarketCosts, Deposits, Reports, Settings)
├── models/                 # Data schemas & sanitizers (memberModel, mealModel, marketCostModel, depositModel, monthlyModel)
├── services/               # Firebase & Firestore modular abstractions (firebase, authService, memberService, mealService, etc.)
├── controllers/            # Controller hooks (useAuth, useMembers, useMeals, useMarketCosts, useDeposits, useMonthlySummary)
├── context/                # Global contexts (AuthContext, MonthContext)
├── routes/                 # AppRoutes and ProtectedRoute
├── utils/                  # Centralized calculations, BDT currency formatter, date & validation utils
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router DOM v6, Lucide React icons, Tailwind CSS
- **Backend / Database**: Google Firebase Authentication, Cloud Firestore (v11 Modular SDK)
- **Currency**: Bangladeshi Taka (`৳` / BDT)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
```bash
# Clone or navigate into the repository
cd meal-management-system

# Install dependencies
npm install
```

### 3. Firebase Configuration
Create a `.env` file in the root directory (based on `.env.example`):

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note**: The application includes an instant local storage sync fallback. You can run and test all features immediately before configuring your Firebase credentials!

### 4. Firestore Database Structure
The application uses the following Firestore document hierarchy:

```text
members/
    {memberId}

months/
    {monthId}                # e.g., "2026-09"
        meals/
            {memberId}       # { meals: { "1": 2, "2": 1 }, totalMeal: 45 }
        marketCosts/
            {costId}         # { date: "2026-09-01", amount: 2500, description: "Grocery" }
        deposits/
            {depositId}      # { memberId: "member_001", amount: 5000, date: "2026-09-05" }

users/
    {userId}

settings/
    {settingId}
```

### 5. Deploying Firestore Security Rules
Deploy `firestore.rules` using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## 💻 Available Scripts

- `npm run dev`: Start local development server (default port `3000`).
- `npm test`: Run calculation engine audit and validation suite.
- `npm run build`: Compile production-ready bundle into `dist/`.
- `npm run preview`: Locally preview the production build.

---

## 🔒 Security & Best Practices

- **Authentication Guard**: All operational routes (`/dashboard`, `/members`, `/meals`, `/market-costs`, `/deposits`, `/reports`, `/settings`) are strictly protected via `ProtectedRoute`.
- **Protected Firestore Rules**: Denies unauthenticated access and enforces schema constraints on cost amounts ($> 0$), deposit amounts ($> 0$), and member fields.
- **Centralized Money Precision**: Uniform currency decimal rounding prevents accumulation of rounding errors across members.

---

## 📄 License
MIT License. Built for dining communities and mess administrations.
