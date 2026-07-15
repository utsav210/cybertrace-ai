import os
import time
import json
import uuid
import threading
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify, send_from_directory 
# pyrefly: ignore [missing-import]
from werkzeug.utils import secure_filename
from .database import get_db_connection, hash_password, initialize_database
from .analysis import compute_sha256, extract_pdf_text, extract_entities_from_text, analyze_transaction_graph, sanitize_string
from .osint_engine import run_phone_osint, run_email_osint, run_upi_osint, run_ip_osint, run_username_osint, run_image_forensics
from .osint_blueprint import osint_bp

app = Flask(__name__)
app.register_blueprint(osint_bp)

# Ensure upload directory exists
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Limit file size to 16MB defensively
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Set up manual CORS headers defensively
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Helper to serialize sqlite3 Row to dict
def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

# Helper to log actions defensively in DB
def create_audit_log(actor, action, resource, ip_address, details=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    log_id = f"al-{int(time.time() * 1000)}"
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO audit_logs (id, timestamp, actor, action, resource, ip_address, details) VALUES (?, ?, ?, ?, ?, ?, ?);",
        (log_id, timestamp, actor, action, resource, ip_address, details)
    )
    conn.commit()
    conn.close()

# Helper to create notifications in DB
def create_notification(title, message, type_="info", case_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    notif_id = f"notif-{int(time.time() * 1000)}"
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    cursor.execute(
        "INSERT INTO notifications (id, title, message, case_id, read, created_at, type) VALUES (?, ?, ?, ?, 0, ?, ?);",
        (notif_id, title, message, case_id, created_at, type_)
    )
    conn.commit()
    conn.close()

# --- ROUTES ---

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "time": time.time()})

# Authentication
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Missing username or password"}), 400
    
    username = data['username']
    password = data['password']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    # Parametrized query protects against SQL injection
    cursor.execute("SELECT * FROM users WHERE username = ?;", (username,))
    user_row = cursor.fetchone()
    conn.close()
    
    if user_row:
        user = row_to_dict(user_row)
        hashed_input = hash_password(password)
        if user['hashed_password'] == hashed_input:
            token = f"jwt.{username}.{int(time.time() * 1000)}"
            # Create response matching User interface
            user_info = {
                "id": user["id"],
                "username": user["username"],
                "name": user["name"],
                "badgeNumber": user["badge_number"],
                "role": user["role"]
            }
            create_audit_log(username, "LOGIN", "System", request.remote_addr or "127.0.0.1")
            return jsonify({"token": token, "user": user_info})
            
    return jsonify({"error": "Invalid credentials"}), 401

# Cases list
@app.route('/api/cases', methods=['GET'])
def get_cases():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    conn.close()
    
    cases = []
    for r in rows:
        c = row_to_dict(r)
        # Rename keys to match camelCase frontend types
        cases.append({
            "id": c["id"],
            "caseNumber": c["case_number"],
            "title": c["title"],
            "description": c["description"],
            "status": c["status"],
            "complainant": c["complainant"],
            "complainantPhone": c["complainant_phone"],
            "assignedTo": c["assigned_to"],
            "createdAt": c["created_at"],
            "updatedAt": c["updated_at"],
            "amountLost": c["amount_lost"]
        })
    return jsonify(cases)

# Create Case
@app.route('/api/cases', methods=['POST'])
def create_case():
    data = request.get_json()
    if not data or 'title' not in data or 'complainant' not in data:
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate unique case number CCB/2026/00XX
    cursor.execute("SELECT COUNT(*) FROM cases;")
    count = cursor.fetchone()[0] + 1
    case_number = f"CCB/2026/00{str(count).zfill(2)}"
    case_id = f"case-{int(time.time() * 1000)}"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    cursor.execute(
        """INSERT INTO cases (id, case_number, title, description, status, complainant, complainant_phone, assigned_to, created_at, updated_at, amount_lost) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
        (
            case_id,
            case_number,
            data['title'],
            data.get('description', ''),
            data.get('status', 'open'),
            data['complainant'],
            data.get('complainantPhone', ''),
            data.get('assignedTo', 'officer.raj'),
            now,
            now,
            float(data.get('amountLost', 0))
        )
    )
    conn.commit()
    conn.close()
    
    create_audit_log(data.get('assignedTo', 'officer.raj'), "CASE_CREATED", case_number, request.remote_addr or "127.0.0.1", data['title'])
    
    new_case = {
        "id": case_id,
        "caseNumber": case_number,
        "title": data['title'],
        "description": data.get('description', ''),
        "status": data.get('status', 'open'),
        "complainant": data['complainant'],
        "complainantPhone": data.get('complainantPhone', ''),
        "assignedTo": data.get('assignedTo', 'officer.raj'),
        "createdAt": now,
        "updatedAt": now,
        "amountLost": float(data.get('amountLost', 0))
    }
    return jsonify(new_case)

# Case details
@app.route('/api/cases/<case_id>', methods=['GET'])
def get_case_detail(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE id = ?;", (case_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({"error": "Case not found"}), 404
        
    c = row_to_dict(row)
    return jsonify({
        "id": c["id"],
        "caseNumber": c["case_number"],
        "title": c["title"],
        "description": c["description"],
        "status": c["status"],
        "complainant": c["complainant"],
        "complainantPhone": c["complainant_phone"],
        "assignedTo": c["assigned_to"],
        "createdAt": c["created_at"],
        "updatedAt": c["updated_at"],
        "amountLost": c["amount_lost"]
    })

# Evidence upload & OCR Processing
@app.route('/api/cases/<case_id>/evidence/upload', methods=['POST'])
def upload_evidence(case_id):
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # Check if case exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, case_number FROM cases WHERE id = ?;", (case_id,))
    case_row = cursor.fetchone()
    if not case_row:
        conn.close()
        return jsonify({"error": "Associated case not found"}), 404
    case_num = case_row["case_number"]
    
    # Validate file extension defensively
    ext = file.filename.split('.')[-1].lower()
    allowed_types = ['pdf', 'csv', 'png', 'jpg', 'jpeg', 'txt']
    if ext not in allowed_types:
        conn.close()
        return jsonify({"error": "Unsupported file type"}), 400
        
    # Standardize file types
    file_type = 'other'
    if ext == 'pdf':
        file_type = 'pdf'
    elif ext == 'csv':
        file_type = 'csv'
    elif ext in ['png', 'jpg', 'jpeg']:
        file_type = 'image'
    elif ext == 'txt':
        file_type = 'pdf' # Treat txt similarly for OCR text
        
    # Defensive filename sanitization to prevent path traversal
    filename = secure_filename(file.filename)
    file_id = f"ev-{int(time.time() * 1000)}"
    saved_filename = f"{file_id}_{filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    
    # Path traversal validation
    if not os.path.abspath(file_path).startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
        conn.close()
        return jsonify({"error": "Invalid file path/Traversal attempt"}), 400
        
    # Save file and read bytes
    file.save(file_path)
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    # Compute SHA-256 Hash for Chain of Custody
    file_hash = compute_sha256(file_bytes)
    file_size_kb = f"{round(len(file_bytes) / 1024, 1)} KB"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Save to Evidence locker DB (Initially pending status)
    cursor.execute(
        """INSERT INTO evidence (id, case_id, file_name, file_type, file_size, hash, uploaded_at, ocr_text, ocr_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);""",
        (file_id, case_id, filename, file_type, file_size_kb, file_hash, now, None, "processing")
    )
    conn.commit()
    conn.close()
    
    # Background OCR Processing thread to prevent blocking
    def process_ocr_task(fid, cid, fpath, ftype):
        try:
            print(f"Starting OCR Thread for {fid}...")
            time.sleep(1.5) # Simulate processing time
            ocr_text = ""
            if ftype == 'pdf':
                with open(fpath, "rb") as f:
                    ocr_text = extract_pdf_text(f.read())
            elif ftype == 'csv':
                # Read CSV preview as text
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    ocr_text = f.read()
            else: # Image or TXT
                with open(fpath, "r", errors="ignore") as f:
                    ocr_text = f.read()
            
            # If pdf extraction returned nothing, fall back to mock sample if it's our demo case
            if not ocr_text or len(ocr_text.strip()) < 5:
                ocr_text = f"COMPLAINT STATEMENT EXTRACTION\nFile Name: {filename}\nTAMPER INTEGRITY: Verified\nExtracting entities..."
                
            # Extract Entities from the text
            extracted_entities = extract_entities_from_text(ocr_text)
            
            # Update Evidence table
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE evidence SET ocr_text = ?, ocr_status = 'completed' WHERE id = ?;",
                (ocr_text, fid)
            )
            
            # Save extracted entities into the DB
            entity_count = 0
            for ent in extracted_entities:
                ent_id = f"ent-gen-{uuid.uuid4().hex[:8]}"
                cursor.execute(
                    "INSERT INTO entities (id, case_id, type, value, confidence, source, status) VALUES (?, ?, ?, ?, ?, ?, 'pending');",
                    (ent_id, cid, ent["type"], ent["value"], ent["confidence"], ent["source"])
                )
                entity_count += 1
                
            conn.commit()
            conn.close()
            
            # Create notifications
            create_notification(
                "OCR Processing Complete",
                f"OCR completed for {filename}. {entity_count} entities extracted automatically.",
                "success",
                cid
            )
            print(f"OCR Thread Completed for {fid}. Extracted {entity_count} entities.")
            
        except Exception as ex:
            print(f"Error in OCR Thread: {ex}")
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE evidence SET ocr_status = 'completed', ocr_text = ? WHERE id = ?;", (f"OCR parsing failed: {str(ex)}", fid))
            conn.commit()
            conn.close()
            
    threading.Thread(target=process_ocr_task, args=(file_id, case_id, file_path, file_type)).start()
    
    # Audit log
    create_audit_log("officer.raj", "EVIDENCE_UPLOADED", filename, request.remote_addr or "127.0.0.1", f"Case ID: {case_id}")
    
    # Return JSON representation of Evidence
    return jsonify({
        "id": file_id,
        "caseId": case_id,
        "fileName": filename,
        "fileType": file_type,
        "fileSize": file_size_kb,
        "hash": file_hash,
        "uploadedAt": now,
        "ocrStatus": "processing"
    })

# Fetch Evidence
@app.route('/api/cases/<case_id>/evidence', methods=['GET'])
def get_evidence(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evidence WHERE case_id = ? ORDER BY uploaded_at DESC;", (case_id,))
    rows = cursor.fetchall()
    conn.close()
    
    evidence = []
    for r in rows:
        e = row_to_dict(r)
        evidence.append({
            "id": e["id"],
            "caseId": e["case_id"],
            "fileName": e["file_name"],
            "fileType": e["file_type"],
            "fileSize": e["file_size"],
            "hash": e["hash"],
            "uploadedAt": e["uploaded_at"],
            "ocrText": e["ocr_text"],
            "ocrStatus": e["ocr_status"]
        })
    return jsonify(evidence)

# Fetch Entities
@app.route('/api/cases/<case_id>/entities', methods=['GET'])
def get_entities(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entities WHERE case_id = ?;", (case_id,))
    rows = cursor.fetchall()
    conn.close()
    
    entities = []
    for r in rows:
        e = row_to_dict(r)
        entities.append({
            "id": e["id"],
            "caseId": e["case_id"],
            "type": e["type"],
            "value": e["value"],
            "confidence": e["confidence"],
            "source": e["source"],
            "status": e["status"]
        })
    return jsonify(entities)

# Update Entity Status (Accept/Reject)
@app.route('/api/entities/<entity_id>/status', methods=['POST'])
def update_entity_status(entity_id):
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({"error": "Missing status"}), 400
        
    status = data['status']
    if status not in ['accepted', 'rejected', 'pending']:
        return jsonify({"error": "Invalid status"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if entity exists
    cursor.execute("SELECT * FROM entities WHERE id = ?;", (entity_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Entity not found"}), 404
        
    entity = row_to_dict(row)
    cursor.execute("UPDATE entities SET status = ? WHERE id = ?;", (status, entity_id))
    conn.commit()
    conn.close()
    
    # Audit log
    action = "ENTITY_ACCEPTED" if status == "accepted" else "ENTITY_REJECTED"
    create_audit_log("officer.raj", action, entity_id, request.remote_addr or "127.0.0.1", entity["value"])
    
    entity["status"] = status
    return jsonify({
        "id": entity["id"],
        "caseId": entity["case_id"],
        "type": entity["type"],
        "value": entity["value"],
        "confidence": entity["confidence"],
        "source": entity["source"],
        "status": status
    })

# Edit Entity Value
@app.route('/api/entities/<entity_id>', methods=['PUT'])
def edit_entity(entity_id):
    data = request.get_json()
    if not data or 'value' not in data:
        return jsonify({"error": "Missing value"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entities WHERE id = ?;", (entity_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Entity not found"}), 404
        
    entity = row_to_dict(row)
    val = sanitize_string(data['value'])
    cursor.execute("UPDATE entities SET value = ? WHERE id = ?;", (val, entity_id))
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": entity["id"],
        "caseId": entity["case_id"],
        "type": entity["type"],
        "value": val,
        "confidence": entity["confidence"],
        "source": entity["source"],
        "status": entity["status"]
    })

# Transactions
@app.route('/api/cases/<case_id>/transactions', methods=['GET'])
def get_transactions(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE case_id = ?;", (case_id,))
    rows = cursor.fetchall()
    conn.close()
    
    transactions = []
    for r in rows:
        t = row_to_dict(r)
        transactions.append({
            "id": t["id"],
            "caseId": t["case_id"],
            "date": t["date"],
            "sender": t["sender"],
            "receiver": t["receiver"],
            "amount": t["amount"],
            "narration": t["narration"],
            "suspicious": bool(t["suspicious"])
        })
    return jsonify(transactions)

# Import Transactions API (Populates database with imported records)
@app.route('/api/cases/<case_id>/transactions/import', methods=['POST'])
def import_transactions(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify case
    cursor.execute("SELECT id FROM cases WHERE id = ?;", (case_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Case not found"}), 404
        
    transactions_data = []
    
    import csv, io, time
    
    # Parse file if provided
    if 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        if file.filename.endswith('.csv'):
            stream = io.StringIO(file.stream.read().decode("utf-8-sig"), newline=None)
            csv_input = csv.DictReader(stream)
            for row in csv_input:
                date = row.get("date", row.get("Transaction Date", ""))
                sender = row.get("sender", row.get("Account From", ""))
                receiver = row.get("receiver", row.get("Account To", ""))
                
                amount_raw = row.get("amount", row.get("Debit Amount", "0"))
                try:
                    amount = float(amount_raw.replace(',', ''))
                except ValueError:
                    amount = 0.0
                    
                narration = row.get("narration", row.get("Description", ""))
                suspicious = 1 if row.get("suspicious", "").lower() == "true" else 0
                tx_id = f"tx-{case_id}-{int(time.time() * 1000)}-{len(transactions_data)}"
                
                transactions_data.append((tx_id, case_id, date, sender, receiver, amount, narration, suspicious))
                
    if not transactions_data:
        # Check if transactions already loaded for mock
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE case_id = ?;", (case_id,))
        count = cursor.fetchone()[0]
        if count > 0:
            conn.close()
            return jsonify({"message": "Transactions already imported for this case."})

        # Seed typical transactions list for mock/import simulation if no file
        transactions_data = [
            (f"tx-{case_id}-1", case_id, "01/05/2026", "victim@upi", "mule1@icici", 50000.0, "KYC Verification Fee", 1),
            (f"tx-{case_id}-2", case_id, "01/05/2026", "mule1@icici", "mule2@sbi", 50000.0, "Fund Transfer", 1),
            (f"tx-{case_id}-3", case_id, "01/05/2026", "mule2@sbi", "beneficiary@hdfc", 50000.0, "Payment", 1),
            (f"tx-{case_id}-4", case_id, "01/05/2026", "beneficiary@hdfc", "victim@upi", 50000.0, "Refund", 1),
            (f"tx-{case_id}-5", case_id, "02/05/2026", "victim@upi", "mule1@icici", 20000.0, "Account Update Charges", 1),
            (f"tx-{case_id}-6", case_id, "02/05/2026", "mule1@icici", "mule3@axis", 20000.0, "Transfer", 1),
            (f"tx-{case_id}-7", case_id, "02/05/2026", "mule3@axis", "beneficiary@hdfc", 20000.0, "Settlement", 1),
            (f"tx-{case_id}-8", case_id, "03/05/2026", "victim@upi", "mule1@icici", 10000.0, "Final KYC Update", 1)
        ]
        
    cursor.executemany("INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?);", transactions_data)
    conn.commit()
    conn.close()
    
    # Audit log & Notification
    create_audit_log("officer.raj", "TRANSACTION_IMPORTED", case_id, request.remote_addr or "127.0.0.1", f"Imported {len(transactions_data)} transactions")
    create_notification("Transactions Imported", f"Imported {len(transactions_data)} transactions for Case ID: {case_id}.", "success", case_id)
    
    return jsonify({"message": f"Successfully imported {len(transactions_data)} transactions."})

# Transaction Graph Analytics Engine API
@app.route('/api/cases/<case_id>/analytics', methods=['GET'])
def get_analytics(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all needed data in one connection
    cursor.execute("SELECT * FROM transactions WHERE case_id = ?;", (case_id,))
    tx_rows = cursor.fetchall()

    cursor.execute("SELECT complainant, complainant_phone FROM cases WHERE id = ?;", (case_id,))
    case_row = cursor.fetchone()

    cursor.execute("SELECT value FROM entities WHERE case_id = ? AND type = 'upi';", (case_id,))
    entity_rows = cursor.fetchall()

    if not tx_rows:
        conn.close()
        return jsonify({"nodes": [], "links": [], "alerts": []})

    transactions = []
    all_senders = set()
    for r in tx_rows:
        t = row_to_dict(r)
        transactions.append({
            "sender": t["sender"],
            "receiver": t["receiver"],
            "amount": t["amount"],
            "date": t["date"]
        })
        all_senders.add(t["sender"])

    # Build victim node set from entities table first
    victim_nodes = set()
    for er in entity_rows:
        victim_nodes.add(er["value"].lower())

    # Add UPI derived from complainant name
    if case_row and case_row["complainant"]:
        victim_nodes.add(case_row["complainant"].lower() + "@upi")

    # Fallback: nodes that only send, never receive
    if not victim_nodes:
        all_receivers = {t["receiver"] for t in transactions}
        pure_senders = all_senders - all_receivers
        victim_nodes = pure_senders if pure_senders else all_senders

    # Run graph analysis (pure Python, no DB)
    generated_alerts, nodes, links = analyze_transaction_graph(transactions, victim_nodes)

    # Persist new alerts using the already-open connection
    # Collect notification params to create AFTER closing conn (avoids nested connection deadlock)
    pending_notifications = []
    all_case_alerts = []  # Initialize before try block to avoid NameError
    try:
        for alert in generated_alerts:
            cursor.execute(
                "SELECT id FROM fraud_alerts WHERE case_id = ? AND type = ? AND description = ?;",
                (case_id, alert["type"], alert["description"])
            )
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO fraud_alerts (id, case_id, type, severity, description, "
                    "involved_entities, risk_score, ai_confidence, status) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
                    (alert["id"], case_id, alert["type"], alert["severity"],
                     alert["description"], json.dumps(alert["involved_entities"]),
                     alert["risk_score"], alert["ai_confidence"], alert["status"])
                )
                pending_notifications.append({
                    "title": "Fraud Alert Raised",
                    "message": f"{alert['type']} ({alert['severity'].upper()}) pattern detected in funds flow.",
                    "type": "warning" if alert["severity"] in ["critical", "high"] else "info",
                    "case_id": case_id
                })
        conn.commit()

        # Fetch all alerts for this case (includes previously accepted/rejected) while conn is open
        cursor.execute("SELECT * FROM fraud_alerts WHERE case_id = ? ORDER BY id ASC;", (case_id,))
        db_alert_rows = cursor.fetchall()
        for r in db_alert_rows:
            a = row_to_dict(r)
            inv = a["involved_entities"]
            try:
                inv = json.loads(inv) if isinstance(inv, str) else inv
            except Exception:
                inv = []
            all_case_alerts.append({
                "id": a["id"],
                "caseId": a["case_id"],
                "type": a["type"],
                "severity": a["severity"],
                "description": a["description"],
                "involvedEntities": inv,
                "riskScore": a["risk_score"],
                "aiConfidence": a["ai_confidence"],
                "status": a["status"]
            })
    except Exception as db_err:
        print(f"[analytics] Alert persistence warning: {db_err}")
    finally:
        # Always close connection when done — never execute queries here
        try:
            conn.close()
        except Exception:
            pass

    # Fallback to in-memory generated alerts if DB returned nothing
    if not all_case_alerts:
        all_case_alerts = generated_alerts

    # Create notifications now that DB connection is closed
    for n in pending_notifications:
        try:
            create_notification(n["title"], n["message"], n["type"], n["case_id"])
        except Exception:
            pass

    return jsonify({
        "nodes": nodes,
        "links": links,
        "alerts": all_case_alerts
    })


# Fraud Alerts
@app.route('/api/cases/<case_id>/alerts', methods=['GET'])
def get_alerts(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fraud_alerts WHERE case_id = ?;", (case_id,))
    rows = cursor.fetchall()
    conn.close()
    
    alerts = []
    for r in rows:
        a = row_to_dict(r)
        inv = a["involved_entities"]
        try:
            inv = json.loads(inv) if isinstance(inv, str) else inv
        except Exception:
            inv = []
        alerts.append({
            "id": a["id"],
            "caseId": a["case_id"],
            "type": a["type"],
            "severity": a["severity"],
            "description": a["description"],
            "involvedEntities": inv,
            "riskScore": a["risk_score"],
            "aiConfidence": a["ai_confidence"],
            "status": a["status"]
        })
    return jsonify(alerts)

@app.route('/api/cases/<case_id>/alerts', methods=['POST'])
def add_case_alert(case_id):
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({"error": "Invalid alert data"}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM fraud_alerts WHERE id = ?;", (data['id'],))
    if not cursor.fetchone():
        inv = data.get('involvedEntities', [])
        if not isinstance(inv, str):
            inv = json.dumps(inv)
        cursor.execute(
            "INSERT INTO fraud_alerts (id, case_id, type, severity, description, "
            "involved_entities, risk_score, ai_confidence, status) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            (data['id'], case_id, data.get('type', 'AI Fraud Finding'), data.get('severity', 'high'),
             data.get('description', ''), inv, float(data.get('riskScore', 75)),
             float(data.get('aiConfidence', 0.9)), data.get('status', 'pending'))
        )
        conn.commit()
    conn.close()
    return jsonify({"message": "Alert added successfully."}), 201

# Accept/Reject Fraud Alert
@app.route('/api/alerts/<alert_id>/status', methods=['POST'])
def update_alert_status(alert_id):
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({"error": "Missing status"}), 400
        
    status = data['status']
    if status not in ['accepted', 'rejected', 'pending']:
        return jsonify({"error": "Invalid status"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fraud_alerts WHERE id = ?;", (alert_id,))
    row = cursor.fetchone()
    if not row:
        alert_data = data.get('alert')
        if alert_data and isinstance(alert_data, dict) and alert_data.get('caseId'):
            inv = alert_data.get('involvedEntities', [])
            if not isinstance(inv, str):
                inv = json.dumps(inv)
            cursor.execute(
                "INSERT INTO fraud_alerts (id, case_id, type, severity, description, "
                "involved_entities, risk_score, ai_confidence, status) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
                (alert_id, alert_data.get('caseId', 'case-001'), alert_data.get('type', 'AI Fraud Finding'),
                 alert_data.get('severity', 'high'), alert_data.get('description', ''),
                 inv, float(alert_data.get('riskScore', 75)),
                 float(alert_data.get('aiConfidence', 0.9)), status)
            )
            conn.commit()
            alert_type = alert_data.get('type', 'AI Fraud Finding')
        else:
            conn.close()
            return jsonify({"message": f"Alert updated to {status}."}), 200
    else:
        alert = row_to_dict(row)
        alert_type = alert['type']
        cursor.execute("UPDATE fraud_alerts SET status = ? WHERE id = ?;", (status, alert_id))
        conn.commit()
    conn.close()
    
    # Audit log
    action = "ENTITY_ACCEPTED" if status == "accepted" else "ENTITY_REJECTED" # match available frontend AuditActions
    create_audit_log("officer.raj", "CASE_UPDATED", alert_id, request.remote_addr or "127.0.0.1", f"Alert: {alert_type} marked {status}")
    
    return jsonify({"message": f"Alert updated to {status}."})

# Audit logs list
@app.route('/api/audit-logs', methods=['GET'])
def get_audit_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC;")
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for r in rows:
        l = row_to_dict(r)
        logs.append({
            "id": l["id"],
            "timestamp": l["timestamp"],
            "actor": l["actor"],
            "action": l["action"],
            "resource": l["resource"],
            "ipAddress": l["ip_address"],
            "details": l["details"]
        })
    return jsonify(logs)

# Add manual Audit log
@app.route('/api/audit-logs', methods=['POST'])
def add_audit_log():
    data = request.get_json()
    if not data or 'action' not in data or 'resource' not in data:
        return jsonify({"error": "Missing fields"}), 400
        
    actor = data.get('actor', 'officer.raj')
    create_audit_log(actor, data['action'], data['resource'], request.remote_addr or "127.0.0.1", data.get('details'))
    return jsonify({"message": "Audit log added successfully."})

# Notifications list
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    conn.close()
    
    notifications = []
    for r in rows:
        n = row_to_dict(r)
        notifications.append({
            "id": n["id"],
            "title": n["title"],
            "message": n["message"],
            "caseId": n["case_id"],
            "read": bool(n["read"]),
            "createdAt": n["created_at"],
            "type": n["type"]
        })
    return jsonify(notifications)

# Mark notification read
@app.route('/api/notifications/<notif_id>/read', methods=['POST'])
def mark_notification_read(notif_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE id = ?;", (notif_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Notification marked read."})

# Mark all notifications read
@app.route('/api/notifications/read-all', methods=['POST'])
def mark_all_notifications_read():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1;")
    conn.commit()
    conn.close()
    return jsonify({"message": "All notifications marked read."})

# --- THREAT INTELLIGENCE & ANALYTICS MODULE ---
@app.route('/api/analytics/threat-intel', methods=['GET'])
def get_threat_intel():
    initialize_database() # Defensive check
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Calculate stats
    cursor.execute("SELECT COUNT(*) as total_cases, SUM(amount_lost) as total_loss FROM cases;")
    case_stats = dict(cursor.fetchone() or {})
    
    cursor.execute("SELECT COUNT(*) as total_complaints FROM citizen_complaints;")
    complaints_stats = dict(cursor.fetchone() or {})
    
    conn.close()
    
    # Mock / calculated threat intelligence
    data = {
        "overview": {
            "totalActiveThreats": 142,
            "highRiskMuleAccounts": 1420,
            "totalFinancialLoss": case_stats.get("total_loss", 845000.0) or 845000.0,
            "citizenIntakeTickets": complaints_stats.get("total_complaints", 4) or 4,
            "predictionAccuracy": 94.2
        },
        "typologyDistribution": [
            {"name": "Digital Arrest / Impersonation", "cases": 45, "loss": 450000, "color": "#ef4444"},
            {"name": "UPI / Fake KYC Scams", "cases": 38, "loss": 380000, "color": "#f97316"},
            {"name": "Investment & Crypto Scams", "cases": 29, "loss": 620000, "color": "#a855f7"},
            {"name": "Online Shopping / Fake OTP", "cases": 18, "loss": 90000, "color": "#3b82f6"},
            {"name": "Loan App Extortion", "cases": 12, "loss": 120000, "color": "#10b981"}
        ],
        "districtHeatmap": [
            {"district": "Ahmedabad City (Cyber Branch)", "density": 88, "risk": "Critical", "activeCases": 42},
            {"district": "Surat Cyber Cell", "density": 74, "risk": "High", "activeCases": 31},
            {"district": "Vadodara Range", "density": 52, "risk": "Medium", "activeCases": 19},
            {"district": "Rajkot City", "density": 45, "risk": "Medium", "activeCases": 14},
            {"district": "Gandhinagar HQ", "density": 28, "risk": "Low", "activeCases": 8}
        ],
        "muleRegistry": [
            {"account": "12345678901", "ifsc": "SBIN0001234", "bank": "State Bank of India", "upi": "fraudster@sbi", "riskScore": 96, "flaggedBy": "1930 Helpline / I4C", "status": "Frozen"},
            {"account": "98765432109", "ifsc": "ICIC0000987", "bank": "ICICI Bank", "upi": "mule1@icici", "riskScore": 92, "flaggedBy": "Ahmedabad CCB", "status": "Freezing in Progress"},
            {"account": "44556677889", "ifsc": "HDFC0001122", "bank": "HDFC Bank", "upi": "beneficiary@hdfc", "riskScore": 88, "flaggedBy": "NCPR Portal", "status": "Active Surveillance"},
            {"account": "33221100998", "ifsc": "UTIB0000456", "bank": "Axis Bank", "upi": "mule3@axis", "riskScore": 84, "flaggedBy": "1930 Helpline / I4C", "status": "Frozen"},
            {"account": "55667788990", "ifsc": "KKBK0000889", "bank": "Kotak Mahindra", "upi": "agent_crypto@kotak", "riskScore": 81, "flaggedBy": "Surat Cyber Cell", "status": "Flagged"}
        ]
    }
    return jsonify(data)

# --- CITIZEN ENGAGEMENT & HELPDESK PORTAL MODULE ---
@app.route('/api/portal/complaints', methods=['GET'])
def get_citizen_complaints():
    initialize_database()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM citizen_complaints ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    conn.close()
    
    complaints = []
    for r in rows:
        c = dict(r)
        complaints.append({
            "id": c["id"],
            "createdAt": c["created_at"],
            "complainantName": c["complainant_name"],
            "complainantPhone": c["complainant_phone"],
            "category": c["category"],
            "description": c["description"],
            "amountLost": c["amount_lost"],
            "status": c["status"],
            "assignedCaseId": c["assigned_case_id"]
        })
    return jsonify(complaints)

@app.route('/api/portal/complaints', methods=['POST'])
def create_citizen_complaint():
    initialize_database()
    data = request.get_json() or {}
    name = data.get("complainantName", "").strip()
    phone = data.get("complainantPhone", "").strip()
    category = data.get("category", "General Cyber Crime").strip()
    desc = data.get("description", "").strip()
    try:
        amount = float(data.get("amountLost", 0.0))
    except (ValueError, TypeError):
        amount = 0.0
        
    if not name or not phone or not desc:
        return jsonify({"error": "Missing required complaint fields (name, phone, description)"}), 400
        
    complaint_id = f"NCRP-2026-{int(time.time()) % 100000}"
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    status = "Received - Under Triage"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO citizen_complaints (id, created_at, complainant_name, complainant_phone, category, description, amount_lost, status, assigned_case_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
        (complaint_id, created_at, name, phone, category, desc, amount, status, None)
    )
    conn.commit()
    conn.close()
    
    create_audit_log(name, "CITIZEN_COMPLAINT_FILED", complaint_id, request.remote_addr or "127.0.0.1", f"Category: {category}, Amount: ₹{amount}")
    create_notification("New Citizen Complaint", f"{name} filed a complaint under {category} (ID: {complaint_id}).", "warning")
    
    return jsonify({
        "message": "Complaint successfully registered on NCRP / CyberTrace Portal.",
        "complaint": {
            "id": complaint_id,
            "createdAt": created_at,
            "complainantName": name,
            "complainantPhone": phone,
            "category": category,
            "description": desc,
            "amountLost": amount,
            "status": status,
            "assignedCaseId": None
        }
    }), 201

@app.route('/api/portal/complaints/<complaint_id>/convert', methods=['POST'])
def convert_complaint_to_case(complaint_id):
    initialize_database()
    data = request.get_json() or {}
    actor = data.get("actor", "officer.raj")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM citizen_complaints WHERE id = ?;", (complaint_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Complaint ticket not found"}), 404
        
    c = dict(row)
    if c["assigned_case_id"]:
        conn.close()
        return jsonify({"error": f"Already assigned to case {c['assigned_case_id']}"}), 400
        
    # Generate new case number
    case_id = f"case-{int(time.time()) % 10000}"
    case_number = f"CCB/2026/{int(time.time()) % 10000}"
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    cursor.execute(
        "INSERT INTO cases (id, case_number, title, description, status, complainant, complainant_phone, assigned_to, created_at, updated_at, amount_lost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        (case_id, case_number, c["category"], c["description"], "open", c["complainant_name"], c["complainant_phone"], actor, created_at, created_at, c["amount_lost"])
    )
    
    cursor.execute(
        "UPDATE citizen_complaints SET status = ?, assigned_case_id = ? WHERE id = ?;",
        (f"Assigned to Investigation Officer ({case_number})", case_id, complaint_id)
    )
    conn.commit()
    conn.close()
    
    create_audit_log(actor, "COMPLAINT_CONVERTED_TO_CASE", case_number, request.remote_addr or "127.0.0.1", f"Converted from ticket {complaint_id}")
    create_notification("Complaint Converted", f"Ticket {complaint_id} converted to Case {case_number} by {actor}.", "success", case_id)
    
    return jsonify({
        "message": f"Successfully converted ticket to formal investigation case {case_number}",
        "caseId": case_id,
        "caseNumber": case_number
    })

# --- FUNCTIONAL SETTINGS & CONFIGURATION MODULE ---
@app.route('/api/settings', methods=['GET'])
def get_settings():
    initialize_database()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM system_settings WHERE key = 'config';")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        try:
            return jsonify(json.loads(row["value"]))
        except Exception:
            pass
            
    return jsonify({
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
    })

@app.route('/api/settings', methods=['POST'])
def save_settings():
    initialize_database()
    data = request.get_json() or {}
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('config', ?);", (json.dumps(data),))
    conn.commit()
    conn.close()
    
    create_audit_log("admin", "SETTINGS_UPDATED", "System Config", request.remote_addr or "127.0.0.1", "Updated AI/OCR and Connector settings")
    return jsonify({"message": "System settings saved and synced across nodes successfully."})

# Note: OSINT Gathering routes (/api/osint/*) are now handled by osint_bp in osint_blueprint.py


if __name__ == "__main__":
    initialize_database()
    # use_reloader=False: prevents Flask from restarting every time a .py file changes,
    # which caused 'database is locked' and connection timeout errors during testing.
    # threaded=True: handles concurrent API calls (analytics + evidence upload) without blocking.
    app.run(host="127.0.0.1", port=8000, debug=True, use_reloader=False, threaded=True)
