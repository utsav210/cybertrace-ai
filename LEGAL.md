# Legal & Regulatory Compliance Architecture (DPDP Act 2023, DPDP Rules 2025 & GDPR)

## 1. Statutory Mandate & Scope
CyberTrace AI's Open-Source Intelligence (OSINT) Gathering module is engineered exclusively for authorized law enforcement agencies (LEAs), judicial officers, and designated cybercrime investigation bodies operating under:
- **Digital Personal Data Protection Act, 2023 (DPDP Act, 2023) - India**
- **Draft Digital Personal Data Protection Rules, 2025 (DPDP Rules, 2025) - India**
- **Information Technology Act, 2000 & IT Rules, 2011**
- **General Data Protection Regulation (GDPR - EU) / International Privacy Frameworks**

---

## 2. Mandatory Authorized-Use Gate & Attestation Logging
To prevent unauthorized surveillance, mass scraping, or privacy infringements:
1. **Pre-Query Attestation**: Every OSINT query (whether phone number, email address, UPI handle, IP network, username, or forensic image) requires the investigating officer to explicitly check and certify the **Authorized-Use Attestation** gate prior to task submission.
2. **Immutable Audit Trail (`osint_audit_logs`)**: Each scan logs a permanent, cryptographically verifiable record containing:
   - `Audit ID` and `Timestamp (UTC/IST)`
   - `Officer User ID`, `Badge Number`, and `Role`
   - `Client IP Address`
   - `Target Identifier SHA-256 Hash` (to protect plaintext identifiers in audit indices while enabling subpoena verification)
   - `Signed Attestation Statement & Case Reference`

---

## 3. Data Minimization & Storage Limitation (Section 8(7) DPDP Act 2023)
In strict alignment with the data minimization and storage limitation principles of DPDP Act 2023 & DPDP Rules 2025:
- **Automatic 30-Day Expiration**: Raw and normalized OSINT scan results (`osint_results`) are automatically purged from the database after 30 days unless formally attached to an active Case file (`cases` table) under judicial order.
- **Right to Erasure / Immediate Redaction**: Officers and Administrators can trigger immediate redaction (`DELETE /api/osint/jobs/<jobId>`), which deletes the raw JSON output and overwrites the target string with `[PURGED_BY_USER]` (`osint_scans.status = 'purged'`).

---

## 4. Ethical Open-Source Collection (Zero ToS Violations)
The system strictly enforces ethical data gathering boundaries:
- **No Paywall / Login-Wall Scraping**: Probing (`Sherlock/Maigret`) is limited strictly to public HTTP status headers (`200 OK` / `404 Not Found`) across publicly accessible endpoints.
- **No Combo-Lists or Dark Web Dumps**: Email and breach verification relies strictly on official, licensed APIs (`Have I Been Pwned API v3`) or live DNS MX record checks (`email-validator`).
- **No Unlicensed Facial Recognition**: Image forensics analyzes local metadata (`EXIF`), sensor noise (`PRNU/DCT`), and surfaces human-in-the-loop clickable external buttons (`Google Lens`, `TinEye`) so investigators perform reverse searches directly inside their browser without violating automated scraping Terms of Service.
- **Privacy-Preserving UPI Mapping**: UPI ID verification resolves banking PSP nodal gateways (`@oksbi`, `@okhdfcbank`, `@paytm`) without exposing unmasked private bank account numbers unless exact judicial subpoena matches exist.

---

## 5. Subpoena Admissibility & Chain of Custody
All generated reports export complete JSON/CSV data structures with cryptographic SHA-256 hashes (`compute_sha256`) ensuring complete admissibility in courts of law and jurisdiction under Section 65B of the Indian Evidence Act / Bharatiya Sakshya Adhiniyam (BSA).
