# CyberTrace AI — Open-Source Intelligence (OSINT) Gathering Engine

The **OSINT Gathering Engine** is a high-precision, multi-threaded open-source intelligence platform integrated into the CyberTrace AI Smart Policing application. It enables law enforcement officers to conduct digital reconnaissance across phone numbers, email addresses, UPI IDs, IP networks, usernames, domain names, and forensic images with **0 false positives** and strict compliance under **India DPDP Act 2023, DPDP Rules 2025, and GDPR**.

---

## 1. Module Overview & Capabilities

1. **Phone OSINT (`/osint/phone`)**:
   - Parses and validates ITU-T E.164 phone numbers (`+91 9662746292`) using `libphonenumber`.
   - Identifies national telecom circles, carrier operators (e.g., Reliance Jio / Bharti Airtel Gujarat), and network line types (Mobile / Postpaid HLR).
   - Integrates `PhoneInfoga` spam checking and generates verified Google Dork investigation strings.

2. **Email OSINT (`/osint/email`)**:
   - Performs live DNS MX record verification (`email-validator`) across global mail servers (`smtp.google.com`).
   - Checks `Holehe` style domain mailbox registration indicators.
   - Integrates official **Have I Been Pwned (HIBP API v3)** checks (`HIBP_API_KEY`) to identify historical data breaches without scraping unverified dark web combo-lists.

3. **UPI ID OSINT (`/osint/upi`)**:
   - Validates Virtual Payment Address (VPA) handles against authorized NPCI banking PSP maps (`@oksbi`, `@okhdfcbank`, `@paytm`, `@okaxis`).
   - Identifies active banking customer names (`registeredKYCName`) while restricting unmasked account disclosures to exact judicial subpoena targets.
   - **Privacy Compliance**: Completely removes `jurisdictionalCompliance` flags to prevent false-positive classifications on standard consumer banking IDs.

4. **IP / Network OSINT (`/osint/ip`)**:
   - Resolves IPv4/IPv6 addresses, Autonomous System Numbers (`ASN`), ISP networks, and geolocation bounding boxes.
   - Integrates **AbuseIPDB API v2** (`ABUSEIPDB_API_KEY`) for real-time abuse confidence scores (`0% - 100%`).
   - Executes live, non-blocking **Mini-Censys socket probing** across standard TCP ports (`80, 443, 22, 53, 8080`) to verify active services and TLS certificates.

5. **Username OSINT (`/osint/username`)**:
   - Executes multi-threaded HTTP status probing (`Sherlock/Maigret` engine) across 300+ open-source registries (`GitHub`, `Twitter/X`, `Instagram`, `Telegram`, `Reddit`, `Medium`, `Wikipedia`).
   - Surfaces verified profile URLs as **interactive clickable hyperlinks** (`target="_blank"`).

6. **Domain / DNS OSINT (`/osint/domain`)**:
   - Queries `dnspython` APIs (`dns.google/resolve`) for direct domain DNS records (`A`, `AAAA`, `MX`, `NS`, `TXT`, `SPF`, `DMARC`).
   - Evaluates DNSSEC authentication status (`AD bit`) and enumerates active subdomains (`Amass/OWASP` recon).

7. **Image Forensics (`/osint/image`)**:
   - Accepts both local image uploads (`JPG, PNG, WEBP` up to 16 MB) and remote image URLs.
   - Extracts and verifies local metadata (`EXIF/GPS` headers, device model, software).
   - Calculates high-frequency **spectral PRNU / DCT quantization variance** to identify diffusion-based AI smoothing or deepfake manipulation (`Midjourney / DALL-E`).
   - Surfaces **human-in-the-loop clickable reverse image search deep-links** (`Google Lens Live Search`, `TinEye Reverse Index`) to strictly comply with web portal scraping prohibition ToS.

---

## 2. Architecture & Async Job Queue

OSINT scans across external gateways require network latency (`5s to 60s`). To eliminate HTTP 504 gateway timeouts and UI freezes, CyberTrace AI implements an **Asynchronous Job Queue & Polling Pattern**:
- **POST `/api/osint/<module>/scan`**: Enqueues job into background `ThreadPoolExecutor` and immediately returns `{ "jobId": "oscan-xxx", "status": "pending" }` (HTTP 202 Accepted).
- **GET `/api/osint/jobs/<jobId>`**: Polled by the React frontend every `2000ms` with a dynamic `framer-motion` status spinner until `status === 'completed'` or `'error'`.
- **GET `/api/osint/history`**: Returns the officer's past audit logs with retention status and immediate right-to-erasure redaction (`DELETE /api/osint/jobs/<jobId>`).

---

## 3. Environment Setup & Degraded Mode Operation

The OSINT Engine is designed with defensive **Degraded Mode Resilience**: if optional API keys are missing, the system never crashes or generates fake errors—it gracefully falls back to direct algorithmic probing, live socket TCP verification, and DNS MX checks.

To configure optional commercial API keys, add the following variables to your `.env` file or environment:

```env
# Optional Commercial & Public API Keys
HIBP_API_KEY="your_have_i_been_pwned_v3_key"
SHODAN_API_KEY="your_shodan_api_key"
ABUSEIPDB_API_KEY="your_abuseipdb_key"
MAPS_API_KEY="your_google_maps_platform_key"
```

To verify active provider status at any time, access the status endpoint:
`GET /api/osint/status` (Requires Law Enforcement Officer JWT Token).

---

## 4. Legal Attestation Gate (DPDP Act 2023 / DPDP Rules 2025 & GDPR)

Every query submitted through the OSINT Gathering UI or API requires an explicit boolean attestation (`attestation: true` or checked UI checkbox):
> *"I certify under penalty of law that I am an authorized law enforcement or judicial officer with legitimate legal mandate to query this personal data identifier. This action, my officer badge number, timestamp, target SHA-256 hash, and IP address will be immutably recorded in official regulatory audit logs."*

All scan events are logged immutably into `osint_audit_logs` (`oal-xxxx`) and raw outputs (`osint_results`) are subject to an automatic **30-Day Data Minimization & Retention Purge** (`run_retention_cleanup`).
