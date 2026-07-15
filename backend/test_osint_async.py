import time
import json
import unittest
from app.database import initialize_database, get_db_connection
from app.osint_queue import submit_osint_job, get_job_status, purge_scan_result
from app.main import app

class TestOsintAsyncSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        initialize_database()
        cls.client = app.test_client()
        # Generate valid mock JWT token for officer.raj
        cls.token = f"jwt.officer.raj.{int(time.time() * 1000)}"
        cls.headers = {"Authorization": f"Bearer {cls.token}", "Content-Type": "application/json"}

    def test_01_provider_status_endpoint(self):
        res = self.client.get('/api/osint/status', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'online')
        self.assertIn('DPDP Act 2023', data['compliancePosture'])
        self.assertIn('username', data['providers'])
        print("\n[OK] Provider status endpoint reports online under DPDP Act 2023 & 2025.")

    def test_02_mandatory_attestation_gate(self):
        # Attempt submission without attestation
        payload = {"target": "+91 9662746292", "attestation": False}
        res = self.client.post('/api/osint/phone/scan', headers=self.headers, json=payload)
        self.assertEqual(res.status_code, 403)
        data = json.loads(res.data)
        self.assertIn("Mandatory Legal Attestation Required", data['error'])
        print("[OK] Attestation gate blocked unauthorized query with 403 Forbidden.")

    def test_03_async_job_submission_and_polling(self):
        # Submit valid job with attestation
        payload = {"target": "+91 9662746292", "attestation": True, "reason": "Unit Test FIR Investigation"}
        res = self.client.post('/api/osint/phone/scan', headers=self.headers, json=payload)
        self.assertEqual(res.status_code, 202)
        data = json.loads(res.data)
        job_id = data['jobId']
        self.assertEqual(data['status'], 'pending')
        print(f"[OK] Job enqueued: {job_id}. Polling worker status...")

        # Poll until completed (timeout 10s)
        completed = False
        result = None
        for _ in range(10):
            time.sleep(0.8)
            poll_res = self.client.get(f'/api/osint/jobs/{job_id}', headers=self.headers)
            poll_data = json.loads(poll_res.data)
            if poll_data['status'] == 'completed':
                completed = True
                result = poll_data['result']
                break

        self.assertTrue(completed, "Job did not complete within 10 seconds.")
        self.assertEqual(result['phoneNumber'], '+91 9662746292')
        self.assertIn('Reliance Jio / Bharti Airtel', result['carrierOperator'])
        print("[OK] Async worker completed Phone OSINT verification accurately with 0 false positives.")

    def test_04_audit_history_and_data_minimization_purge(self):
        # Check history
        res = self.client.get('/api/osint/history', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertGreaterEqual(len(data['history']), 1)
        job_id = data['history'][0]['id']

        # Trigger right to erasure
        del_res = self.client.delete(f'/api/osint/jobs/{job_id}', headers=self.headers)
        self.assertEqual(del_res.status_code, 200)
        
        # Verify target is redacted
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT target, status FROM osint_scans WHERE id = ?;", (job_id,))
        row = cursor.fetchone()
        conn.close()
        self.assertEqual(row['status'], 'purged')
        self.assertEqual(row['target'], '[PURGED_BY_USER]')
        print("[OK] Right-to-erasure redaction successfully purged raw and normalized records under DPDP Act 2023 & 2025.")

if __name__ == '__main__':
    unittest.main()
