# CyberTrace AI 🛡️

> **Advanced Financial Fraud & UPI Investigation Platform**
> A premium dashboard interface designed for security analysts, risk intelligence teams, and law enforcement agencies to track, investigate, and report digital financial crimes.

---

## 🚀 Key Features

- **📊 Intelligent Dashboard**: Unified workspace presenting high-level crime statistics, critical alerts, and active caseloads.
- **🕸️ Money Trail Visualization**: Interactive force-directed network graphs visualizing funds flow across banks, wallets, and UPI handles.
- **📄 Evidence Locker**: Document upload interface with OCR analysis simulation, file hash generation, and tamper-detection mechanisms.
- **🔍 Fraud Connections & Risk Profiling**: Automated correlation maps flagging mule accounts, device footprints, IP geolocation, and transaction velocities.
- **📝 Automatic Case Reporting**: Standardized, print-ready PDF/reports containing investigation logs, timelines, and legal-grade summaries.
- **🔐 Secure Audit Logs**: Tamper-proof trail logging analyst actions, searches, and data exports.
- **🌐 Multi-Language Support**: Complete localization in **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)**.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TypeScript
* **Styling & Motion**: Tailwind CSS, Framer Motion
* **State Management**: Zustand
* **Visualization**: React Force Graph 2D, Recharts, Lucide React
* **Localization**: i18next
* **File Upload**: React Dropzone

---

## 💻 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+) and **npm** installed.

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/utsav210/cybertrace-ai.git
   cd cybertrace-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Demo Access

For prototype testing, use the following local demo accounts:

* **Investigator Account**
  * **Username**: `officer.raj`
  * **Password**: `password123` <!-- ggignore -->
* **Admin Account**
  * **Username**: `admin.sharma`
  * **Password**: `admin123` <!-- ggignore -->

---

## 🛡️ Security & Compliance

* **Data Isolation**: This prototype uses client-side state management (Zustand) and simulated local storage.
* **No Real PII**: All transaction records, names, phone numbers, and evidence documents are generated synthetically for demonstration purposes.
* **Production Readiness**: When migrating to production, ensure that standard JWT verification, HTTPS, role-based backend authorization, and encryption at rest are configured.
