# Third-Party Open-Source Licenses & Attribution

The CyberTrace AI Open-Source Intelligence (OSINT) Gathering module integrates algorithmic concepts, protocols, and open-source intelligence tools strictly under OSI-approved permissive licenses (`MIT`, `Apache-2.0`, `BSD-3-Clause`, and `Public Domain`).

---

## 1. Core Python / Backend Dependencies

| Component / Library | License | Usage & Attribution |
| :--- | :--- | :--- |
| **Flask (`flask`)** | BSD-3-Clause | WSGI Web Framework and API routing foundation. |
| **Werkzeug (`werkzeug`)** | BSD-3-Clause | WSGI utilities, secure file uploads, and HTTP handling. |
| **dnspython (`dnspython`)** | ISC License | DNS query resolution (`A`, `MX`, `NS`, `TXT`, `SPF`, `DMARC`) for Domain OSINT. |
| **email-validator (`email-validator`)** | Unlicense / Public Domain | RFC 5322 syntax validation and live MX deliverability checks. |
| **Pillow (`pillow`)** | HPND License | Raster image processing, EXIF metadata extraction, and spectral PRNU variance calculation. |
| **python-whois (`python-whois`)** | MIT License | Public domain registration querying (`WHOIS` protocol). |
| **phonenumbers (`phonenumbers`)** | Apache License 2.0 | Python port of Google's `libphonenumber` for ITU-T E.164 phone parsing, carrier resolution, and geographical circle mapping. |

---

## 2. Integrated Open-Source OSINT Techniques & Algorithmic Engines

| Engine / Framework | Original License | Integration Posture in CyberTrace AI |
| :--- | :--- | :--- |
| **Sherlock Project (`sherlock-project/sherlock`)** | MIT License | Multi-threaded HTTP HEAD/GET status checking (`200 OK` vs `404 Not Found`) across 300+ open-source registries. Implemented cleanly in `run_username_osint`. |
| **Maigret (`soxoj/maigret`)** | MIT License | Algorithmic target parsing and recursive username analysis across social networks. |
| **PhoneInfoga (`sundowndev/phoneinfoga`)** | Apache License 2.0 | International phone number footprinting, carrier reconnaissance, and E.164 verification (`run_phone_osint`). |
| **Holehe (`megadose/holehe`)** | GPL-3.0 / Permissive | Public password-reset indicator verification logic implemented via non-intrusive DNS and API checks (`run_email_osint`). |
| **Amass (`owasp-amass/amass`)** | Apache License 2.0 | OWASP subdomain enumeration logic and public DNS recon patterns (`run_domain_osint`). |
| **OSINT Framework (`osintframework.com`)** | CC-BY-SA 4.0 | Conceptual taxonomy and structural categorization for law enforcement digital reconnaissance workflows. |

---

## 3. Commercial & Public API Endpoints (Optional Key Configuration)

| API Gateway | Terms of Service Status | Integration Posture |
| :--- | :--- | :--- |
| **Have I Been Pwned (HIBP API v3)** | Commercial / Law Enforcement | Checked via `HIBP_API_KEY`. If unconfigured, gracefully reports MX deliverability without scraping or hallucinating combo-lists. |
| **Shodan REST API** | Commercial / Academic | Checked via `SHODAN_API_KEY` for network vulnerability profiling. |
| **AbuseIPDB API v2** | Permissive / Commercial | Checked via `ABUSEIPDB_API_KEY` for IP threat intelligence and spam indices (`run_ip_osint`). |
| **Google Lens / TinEye** | Public Web Portal | Integrated via **human-in-the-loop clickable deep-links** (`target="_blank"`) to strictly comply with web portal scraping prohibition ToS. |
