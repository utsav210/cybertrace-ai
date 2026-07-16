import sqlite3
import os
import hashlib
import json

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cybertrace.db")

def get_db_connection():
    """Returns a parameterized sqlite3 connection with dict-like row access.
    Uses a 30-second lock timeout and WAL mode to prevent 'database is locked'
    errors when multiple Flask workers or seed scripts access the DB simultaneously.
    """
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for better concurrency (readers don't block writers)
    conn.execute("PRAGMA journal_mode=WAL;")
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def hash_password(password: str) -> str:
    """Securely hashes passwords using SHA-256 with a salt to prevent cleartext exposure."""
    salt = "cybertrace_super_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def initialize_database():
    """Initializes the database schema defensively using parametrized commands."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        badge_number TEXT NOT NULL,
        role TEXT NOT NULL,
        hashed_password TEXT NOT NULL
    );
    """)

    # 2. Create Cases Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        case_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('open', 'active', 'closed')),
        complainant TEXT NOT NULL,
        complainant_phone TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        amount_lost REAL DEFAULT 0.0,
        category TEXT DEFAULT '',
        subcategory TEXT DEFAULT '',
        incident_date TEXT DEFAULT '',
        incident_time TEXT DEFAULT '',
        delay_reason TEXT DEFAULT '',
        platform TEXT DEFAULT '',
        suspect_details TEXT DEFAULT '',
        complainant_email TEXT DEFAULT '',
        complainant_address TEXT DEFAULT '',
        state TEXT DEFAULT '',
        district TEXT DEFAULT '',
        police_station TEXT DEFAULT '',
        pincode TEXT DEFAULT '',
        national_id_type TEXT DEFAULT '',
        national_id_number TEXT DEFAULT '',
        payment_method TEXT DEFAULT '',
        bank_account TEXT DEFAULT '',
        ifsc_code TEXT DEFAULT '',
        utr_number TEXT DEFAULT ''
    );
    """)

    # 3. Create Evidence Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'image', 'csv', 'other')),
        file_size TEXT NOT NULL,
        hash TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        ocr_text TEXT,
        ocr_status TEXT NOT NULL CHECK(ocr_status IN ('pending', 'processing', 'completed')),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
    """)

    # 4. Create Entities Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
    """)

    # 5. Create Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        date TEXT NOT NULL,
        sender TEXT NOT NULL,
        receiver TEXT NOT NULL,
        amount REAL NOT NULL,
        narration TEXT NOT NULL,
        suspicious INTEGER DEFAULT 0, -- Boolean 0 or 1
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
    """)

    # 6. Create Fraud Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fraud_alerts (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
        description TEXT NOT NULL,
        involved_entities TEXT NOT NULL, -- JSON serialized string
        risk_score REAL NOT NULL,
        ai_confidence REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
    """)

    # 7. Create Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        details TEXT
    );
    """)

    # 8. Create Notifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        case_id TEXT,
        read INTEGER DEFAULT 0, -- Boolean 0 or 1
        created_at TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'error'))
    );
    """)

    # 9. Create Citizen Complaints Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_complaints (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        complainant_name TEXT NOT NULL,
        complainant_phone TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount_lost REAL DEFAULT 0.0,
        status TEXT NOT NULL,
        assigned_case_id TEXT,
        subcategory TEXT DEFAULT '',
        incident_date TEXT DEFAULT '',
        incident_time TEXT DEFAULT '',
        delay_reason TEXT DEFAULT '',
        platform TEXT DEFAULT '',
        suspect_details TEXT DEFAULT '',
        complainant_email TEXT DEFAULT '',
        complainant_address TEXT DEFAULT '',
        state TEXT DEFAULT '',
        district TEXT DEFAULT '',
        police_station TEXT DEFAULT '',
        pincode TEXT DEFAULT '',
        national_id_type TEXT DEFAULT '',
        national_id_number TEXT DEFAULT '',
        payment_method TEXT DEFAULT '',
        bank_account TEXT DEFAULT '',
        ifsc_code TEXT DEFAULT '',
        utr_number TEXT DEFAULT ''
    );
    """)

    # 10. Create System Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    conn.commit()

    # Defensive automatic migration: add NCRP columns to existing cases table safely
    ncrp_columns = [
        ("category", "TEXT DEFAULT ''"),
        ("subcategory", "TEXT DEFAULT ''"),
        ("incident_date", "TEXT DEFAULT ''"),
        ("incident_time", "TEXT DEFAULT ''"),
        ("delay_reason", "TEXT DEFAULT ''"),
        ("platform", "TEXT DEFAULT ''"),
        ("suspect_details", "TEXT DEFAULT ''"),
        ("complainant_email", "TEXT DEFAULT ''"),
        ("complainant_address", "TEXT DEFAULT ''"),
        ("state", "TEXT DEFAULT ''"),
        ("district", "TEXT DEFAULT ''"),
        ("police_station", "TEXT DEFAULT ''"),
        ("pincode", "TEXT DEFAULT ''"),
        ("national_id_type", "TEXT DEFAULT ''"),
        ("national_id_number", "TEXT DEFAULT ''"),
        ("payment_method", "TEXT DEFAULT ''"),
        ("bank_account", "TEXT DEFAULT ''"),
        ("ifsc_code", "TEXT DEFAULT ''"),
        ("utr_number", "TEXT DEFAULT ''")
    ]
    for col_name, col_def in ncrp_columns:
        try:
            cursor.execute(f"ALTER TABLE cases ADD COLUMN {col_name} {col_def};")
        except sqlite3.OperationalError:
            pass # Column already exists

    for col_name, col_def in ncrp_columns:
        if col_name == "category":
            continue # citizen_complaints already has category by default
        try:
            cursor.execute(f"ALTER TABLE citizen_complaints ADD COLUMN {col_name} {col_def};")
        except sqlite3.OperationalError:
            pass # Column already exists
    conn.commit()

    # Ensure settings default row exists
    cursor.execute("SELECT COUNT(*) FROM system_settings WHERE key = 'config';")
    if cursor.fetchone()[0] == 0:
        default_config = {
            "entityConfidence": 85,
            "autoTriage": True,
            "ocrSensitivity": "High",
            "defaultLanguage": "en",
            "connectors": {
                "i4c_1930": {"status": "Connected", "lastSync": "Today, 10:42 AM", "records": "1,420 Flagged Accounts"},
                "ncrp_portal": {"status": "Connected", "lastSync": "Today, 11:15 AM", "records": "890 Active Tickets"},
                "cctns_db": {"status": "Connected", "lastSync": "Yesterday, 04:30 PM", "records": "Linked to Crime Branch"},
                "npci_upi": {"status": "Connected", "lastSync": "Real-time Webhook", "records": "NCPR Nodal Gateway"}
            },
            "sessionTimeout": 30,
            "twoFactor": True
        }
        cursor.execute("INSERT INTO system_settings (key, value) VALUES ('config', ?);", (json.dumps(default_config),))
        conn.commit()

    # Ensure sample citizen complaints exist
    cursor.execute("SELECT COUNT(*) FROM citizen_complaints;")
    if cursor.fetchone()[0] == 0:
        sample_complaints = [
            ("NCRP-2026-88912", "2026-07-14T09:15:00Z", "Vikram Desai", "+91 98765 43210", "Financial Fraud / UPI Scam", "Received call from fake SBI officer asking for KYC update via SMS link. ₹2,50,000 debited.", 250000.0, "FIR Registered (CCB/2026/0001)", "case-001"),
            ("NCRP-2026-89104", "2026-07-14T10:30:00Z", "Meena Joshi", "+91 99887 76655", "Online Shopping / Fake OTP", "Tricked into sharing OTP for parcel delivery. ₹45,000 deducted.", 45000.0, "Assigned to Investigation Officer", "case-002"),
            ("NCRP-2026-89240", "2026-07-14T11:45:00Z", "Amit Shah", "+91 91234 56789", "Social Media Impersonation", "Relative's fake Facebook account created demanding emergency medical funds.", 30000.0, "Received - Under Triage", "case-003"),
            ("NCRP-2026-89551", "2026-07-14T12:20:00Z", "Neha Verma", "+91 94221 11223", "Investment / Crypto Scam", "Added to Telegram group promising 300% daily returns on Bitcoin cloud mining.", 120000.0, "Received - Under Triage", None)
        ]
        cursor.executemany("INSERT INTO citizen_complaints (id, created_at, complainant_name, complainant_phone, category, description, amount_lost, status, assigned_case_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", sample_complaints)
        conn.commit()

    # Seed initial data if table is empty
    cursor.execute("SELECT COUNT(*) FROM users;")
    if cursor.fetchone()[0] == 0:
        print("Seeding database with initial hackathon mockup data...")

        # Users
        users_data = [
            ("u1", "officer.raj", "Raj Patel", "GUJ/CCB/1042", "officer", hash_password("password123")),
            ("u2", "admin.sharma", "Priya Sharma", "GUJ/CCB/0001", "admin", hash_password("admin123")),
            ("u3", "supervisor.mehta", "Kiran Mehta", "GUJ/CCB/0021", "supervisor", hash_password("super123"))
        ]
        cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?);", users_data)

        # Cases
        cases_data = [
            ("case-001", "CCB/2026/0001", "UPI Fraud via Fake KYC", 
             "Victim received a call about KYC update, lost ₹2,50,000 through multiple UPI transfers over 2 days. Fraudster impersonated bank official.",
             "active", "Vikram Desai", "+91 98765 43210", "officer.raj", "2026-05-01T09:02:00", "2026-06-01T10:30:00", 250000.0),
            ("case-002", "CCB/2026/0002", "Online Shopping Fraud – Fake OTP",
             "Victim tricked into sharing OTP, ₹45,000 deducted via unauthorized transaction.",
             "open", "Meena Joshi", "+91 99887 76655", "officer.raj", "2026-05-03T11:15:00", "2026-05-03T11:15:00", 45000.0),
            ("case-003", "CCB/2026/0003", "Social Media Impersonation Scam",
             "Fraudster created fake Facebook profile of victim's relative, requested ₹30,000 emergency transfer.",
             "open", "Amit Shah", "+91 91234 56789", "officer.raj", "2026-05-05T14:20:00", "2026-05-05T14:20:00", 30000.0),
            ("case-004", "CCB/2026/0004", "Loan App Data Breach & Extortion",
             "Victim installed fake loan app, personal data stolen and used for extortion.",
             "closed", "Ravi Gupta", "+91 95566 44322", "officer.raj", "2026-04-10T08:30:00", "2026-05-20T16:00:00", 0.0),
            ("case-005", "CCB/2026/0005", "Crypto Investment Fraud",
             "Victim lured into fake crypto investment platform, lost ₹5,00,000.",
             "active", "Sunita Patel", "+91 98001 23456", "officer.raj", "2026-04-20T10:00:00", "2026-05-28T09:00:00", 500000.0),
            ("case-006", "CCB/2026/0006", "Job Offer Fraud via WhatsApp",
             "Victim paid registration fee for fake government job offer, lost ₹15,000.",
             "closed", "Deepak Verma", "+91 87654 32109", "officer.raj", "2026-04-15T13:00:00", "2026-05-10T11:00:00", 15000.0)
        ]
        cursor.executemany("INSERT INTO cases (id, case_number, title, description, status, complainant, complainant_phone, assigned_to, created_at, updated_at, amount_lost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", cases_data)

        # Evidence
        evidence_data = [
            ("ev-001", "case-001", "complaint_statement.pdf", "pdf", "2.4 MB",
             "sha256:a3f2c1b9d8e7f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", "2026-06-01T09:05:00",
             "शिकायत बयान - Complaint Statement\n\nदिनांक: 1 मई 2026 / Date: 1 May 2026\nथाना: साइबर क्राइम ब्रांच, अहमदाबाद / Police Station: Cyber Crime Branch, Ahmedabad\n\nशिकायतकर्ता का नाम: विक्रम देसाई / Complainant Name: Vikram Desai\nमोबाइल नंबर: +91 98765 43210\nईमेल: vikram@email.com\n\nविवरण / Description:\nदिनांक 01/05/2026 को सुबह लगभग 10 बजे मेरे मोबाइल पर एक अज्ञात व्यक्ति का फोन आया जिसने खुद को SBI बैंक का अधिकारी बताया।\n\nOn 01/05/2026, at approximately 10:00 AM, I received a call from an unknown person claiming to be an SBI Bank officer (Rajesh Kumar, employee ID SBI/2024/3421).\n\nउन्होंने कहा कि मेरे खाते का KYC अपडेट करना है। / He said my account KYC needs to be updated.\n\nUPI ID: victim@upi को निम्नलिखित लेनदेन हुए:\n1. ₹50,000 - fraudster@upi को / to fraudster@upi\n2. ₹20,000 - fraudster@upi को / to fraudster@upi  \n3. ₹10,000 - fraudster@upi को / to fraudster@upi\n\nखाता संख्या / Account Number: 12345678901\nIFSC Code: SBIN0001234\nBank: State Bank of India\n\nकुल नुकसान / Total Loss: ₹2,50,000\n\nहस्ताक्षर / Signature: Vikram Desai",
             "completed"),
            ("ev-002", "case-001", "bank_statement_May2026.csv", "csv", "156 KB",
             "sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4", "2026-06-01T09:08:00",
             "Date,Sender,Receiver,Amount,Narration\n01/05/2026,victim@upi,mule1@icici,50000,KYC Verification Fee\n01/05/2026,mule1@icici,mule2@sbi,50000,Fund Transfer\n01/05/2026,mule2@sbi,beneficiary@hdfc,50000,Payment\n01/05/2026,beneficiary@hdfc,victim@upi,50000,Refund\n02/05/2026,victim@upi,mule1@icici,20000,Account Update Charges\n02/05/2026,mule1@icici,mule3@axis,20000,Transfer\n02/05/2026,mule3@axis,beneficiary@hdfc,20000,Settlement\n03/05/2026,victim@upi,mule1@icici,10000,Final KYC Update",
             "completed")
        ]
        cursor.executemany("INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", evidence_data)

        # Entities
        entities_data = [
            ("ent-001", "case-001", "phone", "+91 98765 43210", 0.99, "Regex", "pending"),
            ("ent-002", "case-001", "email", "vikram@email.com", 0.98, "AI", "pending"),
            ("ent-003", "case-001", "upi", "victim@upi", 0.99, "AI", "pending"),
            ("ent-004", "case-001", "upi", "fraudster@upi", 0.93, "AI", "pending"),
            ("ent-005", "case-001", "ifsc", "SBIN0001234", 0.99, "Regex", "pending"),
            ("ent-006", "case-001", "account", "12345678901", 0.95, "AI", "pending"),
            ("ent-007", "case-001", "person", "Rajesh Kumar", 0.88, "AI", "pending")
        ]
        cursor.executemany("INSERT INTO entities VALUES (?, ?, ?, ?, ?, ?, ?);", entities_data)

        # Transactions
        transactions_data = [
            ("tx-001", "case-001", "01/05/2026", "victim@upi", "mule1@icici", 50000.0, "KYC Verification Fee", 1),
            ("tx-002", "case-001", "01/05/2026", "mule1@icici", "mule2@sbi", 50000.0, "Fund Transfer", 1),
            ("tx-003", "case-001", "01/05/2026", "mule2@sbi", "beneficiary@hdfc", 50000.0, "Payment", 1),
            ("tx-004", "case-001", "01/05/2026", "beneficiary@hdfc", "victim@upi", 50000.0, "Refund", 1),
            ("tx-005", "case-001", "02/05/2026", "victim@upi", "mule1@icici", 20000.0, "Account Update Charges", 1),
            ("tx-006", "case-001", "02/05/2026", "mule1@icici", "mule3@axis", 20000.0, "Transfer", 1),
            ("tx-007", "case-001", "02/05/2026", "mule3@axis", "beneficiary@hdfc", 20000.0, "Settlement", 1),
            ("tx-008", "case-001", "03/05/2026", "victim@upi", "mule1@icici", 10000.0, "Final KYC Update", 1)
        ]
        cursor.executemany("INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?);", transactions_data)

        # Fraud Alerts
        alerts_data = [
            ("fa-001", "case-001", "Mule Account Detected", "critical",
             "Account mule1@icici exhibits classic mule account behavior with high fan-in (3 senders) and fan-out (3 receivers) within 72 hours. Multiple rapid fund transfers detected.",
             json.dumps(["mule1@icici", "victim@upi", "mule2@sbi", "mule3@axis"]), 82.0, 0.94, "pending"),
            ("fa-002", "case-001", "Circular Transaction Pattern", "high",
             "Funds traced through a circular path: victim@upi -> mule1@icici -> mule2@sbi -> beneficiary@hdfc -> victim@upi. This pattern is indicative of money laundering to confuse investigators.",
             json.dumps(["victim@upi", "mule1@icici", "mule2@sbi", "beneficiary@hdfc"]), 75.0, 0.89, "pending"),
            ("fa-003", "case-001", "Layering Pattern (Fund Smurfing)", "high",
             "Funds layered through multiple accounts: victim@upi -> mule1@icici -> mule3@axis -> beneficiary@hdfc. Classic layering technique used in hawala-adjacent digital fraud.",
             json.dumps(["victim@upi", "mule1@icici", "mule3@axis", "beneficiary@hdfc"]), 68.0, 0.82, "pending")
        ]
        cursor.executemany("INSERT INTO fraud_alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", alerts_data)

        # Audit Logs
        audit_data = [
            ("al-001", "2026-06-01 09:00:12", "officer.raj", "LOGIN", "System", "192.168.1.25", None),
            ("al-002", "2026-06-01 09:02:34", "officer.raj", "CASE_CREATED", "CCB/2026/0001", "192.168.1.25", "UPI Fraud via Fake KYC"),
            ("al-003", "2026-06-01 09:05:18", "officer.raj", "EVIDENCE_UPLOADED", "complaint_statement.pdf", "192.168.1.25", "Case: CCB/2026/0001"),
            ("al-004", "2026-06-01 09:07:45", "officer.raj", "EVIDENCE_UPLOADED", "bank_statement_May2026.csv", "192.168.1.25", "Case: CCB/2026/0001"),
            ("al-005", "2026-06-01 09:10:22", "officer.raj", "TRANSACTION_IMPORTED", "CCB/2026/0001", "192.168.1.25", "8 transactions imported"),
            ("al-006", "2026-06-01 09:15:33", "officer.raj", "ENTITY_ACCEPTED", "ent-001", "192.168.1.25", "+91 98765 43210"),
            ("al-007", "2026-06-01 09:16:04", "officer.raj", "ENTITY_ACCEPTED", "ent-003", "192.168.1.25", "victim@upi"),
            ("al-008", "2026-06-01 09:22:11", "officer.raj", "REPORT_GENERATED", "CCB/2026/0001", "192.168.1.25", "Language: Hindi"),
            ("al-009", "2026-06-01 09:25:55", "officer.raj", "FIR_DRAFTED", "CCB/2026/0001", "192.168.1.25", None),
            ("al-010", "2026-06-01 10:00:00", "admin.sharma", "LOGIN", "System", "192.168.1.10", None),
            ("al-011", "2026-06-01 10:02:30", "admin.sharma", "CASE_UPDATED", "CCB/2026/0001", "192.168.1.10", "Status: active"),
            ("al-012", "2026-06-02 09:05:00", "officer.raj", "LOGIN", "System", "192.168.1.25", None),
            ("al-013", "2026-06-02 09:10:45", "officer.raj", "ENTITY_REJECTED", "ent-007", "192.168.1.25", "False positive: Rajesh Kumar"),
            ("al-014", "2026-06-02 11:30:00", "supervisor.mehta", "LOGIN", "System", "192.168.1.50", None),
            ("al-015", "2026-06-03 09:00:00", "officer.raj", "LOGIN", "System", "192.168.1.25", None)
        ]
        cursor.executemany("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?);", audit_data)

        # Notifications
        notifications_data = [
            ("notif-001", "OCR Processing Complete", "OCR completed for CCB/2026/0001 - complaint_statement.pdf. 7 entities extracted.", "case-001", 0, "2026-06-01T09:06:00", "success"),
            ("notif-002", "Fraud Patterns Detected", "Fraud patterns detected in CCB/2026/0001. 3 alerts generated: Mule Account (Critical), Circular Transaction (High), Layering (High).", "case-001", 0, "2026-06-01T09:12:00", "warning")
        ]
        cursor.executemany("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?);", notifications_data)

        conn.commit()
        print("Database seeded with mock data.")
    
    conn.close()

if __name__ == "__main__":
    initialize_database()
