# Meal Management System

A modern, full-stack **Meal Management System** built with **React**, **Vite**, **Tailwind CSS**, and **Google Firebase Cloud Firestore**. Designed for mess groups, hostels, bachelor apartments, and shared dining communities in Bangladesh to manage daily meals, grocery bazaar expenditures, advance member deposits, and instant calculation of meal rates and member balances in **Bangladeshi Taka (৳)**.

---

## 🌐 Live Application
- **Live Demo & Deployment**: [https://khadok-meal.web.app](https://khadok-meal.web.app)
- **Source Code**: [https://github.com/Ayatulpathan/meal-management-system](https://github.com/Ayatulpathan/meal-management-system)

---

## 📖 About The Project

Managing group dining calculations in shared messes and student hostels is often prone to accounting discrepancies, manual calculation errors, and transparency issues. 

The **Meal Management System** solves these challenges by providing an audited, automated, and real-time collaborative platform where:
- **Administrators & Mess Managers** have complete administrative control to record daily meals across a full 31-day spreadsheet grid, log bazaar expenses, manage member accounts, collect advance deposits, and generate audited financial statements.
- **Mess Members** have dedicated self-service portals to monitor their daily meals, check their running personal balances (surplus or dues), review all grocery expenditures with purchaser attribution and creation timestamps, and verify their advance deposit history in read-only mode.
- **All Community Members** can chat and communicate in real time through an integrated cloud-synchronized mess community chat.

---

## 🌟 Key Features

- **31-Day Spreadsheet Meal Grid**:
  - Full 31-day dynamic meal entry grid with instant click-to-cycle values (from `0` up to `10` meals per day).
  - Role-protected access: Admins can update meal records; Members have complete transparency with protected read-only view.

- **Market & Grocery Expense Ledger**:
  - Record daily bazaar expenses with description, item cost, and purchaser name attribution.
  - Automatically captures and displays the exact date and real creation time (e.g. `10:45 PM`) for every expense.

- **Member Deposits & Advance Ledger**:
  - Track advance payments and mess funds collected by the manager.
  - Automatic reconciliation between total member deposits and total expenditures.

- **Automated Financial Accounting Engine**:
  - Instant calculation of **Total Market Cost**, **Total Meals**, and **Cost Per Meal (Meal Rate)**.
  - Individual calculation of each member's **Meal Cost** and **Net Balance** (`+ Surplus` or `- Due`).
  - Zero-division prevention and audited precision down to the exact Taka.

- **Real-Time Mess Community Chat**:
  - Built-in real-time group chat for instant communication between members and managers.
  - Live Firestore cloud synchronization, read receipts, sender role badges (`Admin` vs `Member`), and message timestamps.

- **Audited Financial Statements & Reports**:
  - Complete monthly accounting balance sheets, member-wise breakdowns, and exportable CSV / printable statements.

- **Multi-Month Accounting & Archive Locking**:
  - Seamlessly manage multiple monthly accounting cycles (`YYYY-MM`).
  - Lock closed months into read-only archive mode to prevent retrospective modifications.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React Icons
- **Backend & Cloud Database**: Google Firebase Cloud Firestore (Real-time modular SDK)
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting
- **Currency**: Bangladeshi Taka (`৳` / BDT)

---

## 👤 Author & Copyright

**Developed by Ayatul Khan Pathan**  
© 2026 Ayatul Khan Pathan. All rights reserved.
