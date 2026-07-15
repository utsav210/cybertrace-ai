import time
import json
import uuid
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
from .database import get_db_connection

# Global thread pool for non-blocking async OSINT job execution
_osint_executor = ThreadPoolExecutor(max_workers=6, thread_name_prefix="osint_worker")

def submit_osint_job(scan_id: str, module: str, target: str, user_id: str, ip_address: str, attestation_text: str):
    """Enqueues an OSINT scan job into the async background executor.

    Updates scan status to 'pending' -> 'running' -> 'completed'/'error' cleanly.
    """
    _osint_executor.submit(_execute_osint_task, scan_id, module, target, user_id, ip_address, attestation_text)

def _execute_osint_task(scan_id: str, module: str, target: str, user_id: str, ip_address: str, attestation_text: str):
    """Internal worker function executed in background thread."""
    from .osint_engine import (
        run_username_osint,
        run_email_osint,
        run_phone_osint,
        run_ip_osint,
        run_domain_osint,
        run_image_forensics
    )

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Mark running
        cursor.execute("UPDATE osint_scans SET status = 'running' WHERE id = ?;", (scan_id,))
        conn.commit()

        # Dispatch to appropriate engine
        if module == 'username':
            normalized = run_username_osint(target)
        elif module == 'email':
            normalized = run_email_osint(target)
        elif module == 'phone':
            normalized = run_phone_osint(target)
        elif module == 'ip':
            normalized = run_ip_osint(target)
        elif module == 'domain':
            normalized = run_domain_osint(target)
        elif module == 'image':
            # Target can be URL or storage identifier
            normalized = run_image_forensics(image_url_query=target)
        else:
            raise ValueError(f"Unknown OSINT module: {module}")

        result_id = f"res-{uuid.uuid4().hex[:12]}"
        created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        raw_json = json.dumps(normalized)
        norm_json = json.dumps(normalized)

        cursor.execute(
            "INSERT INTO osint_results (id, scan_id, source, raw_json, normalized_json, created_at) VALUES (?, ?, ?, ?, ?, ?);",
            (result_id, scan_id, module, raw_json, norm_json, created_at)
        )
        cursor.execute(
            "UPDATE osint_scans SET status = 'completed', completed_at = ? WHERE id = ?;",
            (created_at, scan_id)
        )
        conn.commit()

    except Exception as e:
        error_msg = str(e)
        cursor.execute(
            "UPDATE osint_scans SET status = 'error', error_message = ? WHERE id = ?;",
            (error_msg, scan_id)
        )
        conn.commit()
    finally:
        conn.close()

def get_job_status(scan_id: str):
    """Retrieves current job status and results from DB."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM osint_scans WHERE id = ?;", (scan_id,))
    scan_row = cursor.fetchone()
    if not scan_row:
        conn.close()
        return None

    scan_data = dict(scan_row)
    result_data = None
    if scan_data['status'] == 'completed':
        cursor.execute("SELECT * FROM osint_results WHERE scan_id = ?;", (scan_id,))
        res_row = cursor.fetchone()
        if res_row:
            result_data = json.loads(res_row['normalized_json'])

    conn.close()
    return {
        "jobId": scan_data['id'],
        "module": scan_data['module'],
        "target": scan_data['target'],
        "status": scan_data['status'],
        "createdAt": scan_data['created_at'],
        "completedAt": scan_data['completed_at'],
        "errorMessage": scan_data['error_message'],
        "result": result_data
    }

def purge_scan_result(scan_id: str, user_id: str, is_admin: bool = False):
    """Purges raw and normalized result data from database (Right to Erasure / DPDP Act 2023 & 2025)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM osint_scans WHERE id = ?;", (scan_id,))
    scan_row = cursor.fetchone()
    if not scan_row:
        conn.close()
        return False, "Scan job not found."

    if scan_row['user_id'] != user_id and not is_admin:
        conn.close()
        return False, "Unauthorized to purge this scan record."

    cursor.execute("DELETE FROM osint_results WHERE scan_id = ?;", (scan_id,))
    cursor.execute("UPDATE osint_scans SET status = 'purged', target = '[PURGED_BY_USER]' WHERE id = ?;", (scan_id,))
    conn.commit()
    conn.close()
    return True, "Scan record purged successfully."

def run_retention_cleanup(days: int = 30):
    """Auto-purges raw scan results older than configured retention threshold."""
    cutoff_time = time.time() - (days * 86400)
    cutoff_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(cutoff_time))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM osint_results WHERE created_at < ? AND scan_id IN (SELECT id FROM osint_scans WHERE status = 'completed');",
        (cutoff_str,)
    )
    cursor.execute(
        "UPDATE osint_scans SET status = 'purged', target = '[PURGED_RETENTION]' WHERE created_at < ? AND status = 'completed';",
        (cutoff_str,)
    )
    conn.commit()
    conn.close()
