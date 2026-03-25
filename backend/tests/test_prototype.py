import requests
import os
import sys

# 1. Path Setup
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

BASE_URL = "http://localhost:8000/api/v1"
TEST_IMAGE = os.path.join(CURRENT_DIR, "test_pothole.jpg")

def run_test(name, func):
    print(f"🔍 Testing {name}...")
    try:
        result = func()
        print(f"✅ {name} PASSED")
        return result
    except Exception as e:
        print(f"❌ {name} FAILED: {str(e)}")
        print("-" * 40)
        return None

# --- THE CORE WORKFLOW ---

def test_fetch_worker():
    """Step 1: Ensure we have a worker to assign the task to."""
    r = requests.get(f"{BASE_URL}/dispatch/workers")
    workers = r.json()
    if not workers:
        raise Exception("No workers found. Did you seed the database?")
    return workers[0]["worker_id"]

def test_web_ingest():
    """Step 2: Upload a complaint and get the Ticket ID + AI Analysis."""
    if not os.path.exists(TEST_IMAGE):
        raise Exception(f"Missing test image at {TEST_IMAGE}")
    
    with open(TEST_IMAGE, "rb") as img:
        files = {"file": ("pothole.jpg", img, "image/jpeg")}
        data = {
            "description": "Large pothole blocking traffic",
            "latitude": "17.4483",
            "longitude": "78.3915"
        }
        r = requests.post(f"{BASE_URL}/ingest/submit", data=data, files=files)
    
    if r.status_code != 200:
        raise Exception(f"Ingest Error: {r.text}")
    
    res = r.json()
    print(f"   AI Result: {res['ai_analysis']['department']} | Severity: {res['ai_analysis']['severity_score']}")
    return res["ticket_id"]

def test_dispatch(ticket_id, worker_id):
    """Step 3: Assign the ticket to the worker."""
    url = f"{BASE_URL}/dispatch/{ticket_id}/assign"
    # Using the Pydantic schema format: {"worker_id": "string"}
    payload = {"worker_id": worker_id}
    r = requests.post(url, json=payload)
    
    if r.status_code != 200:
        raise Exception(f"Dispatch Error: {r.text}")
    print(f"   Success: {r.json()['message']}")

def test_resolution(ticket_id):
    """Step 4: Simulate the worker finishing and triggering the AI Fraud Audit."""
    url = f"{BASE_URL}/dispatch/{ticket_id}/resolve"
    
    with open(TEST_IMAGE, "rb") as img:
        files = {"file": ("fixed.jpg", img, "image/jpeg")}
        data = {
            "claimed_length_meters": "1.2",
            "claimed_width_meters": "0.8",
            "claimed_depth_meters": "0.15"
        }
        r = requests.post(url, data=data, files=files)
    
    if r.status_code != 200:
        raise Exception(f"Resolution Error: {r.text}")
    
    print(f"   AI Auditor Note: {r.json().get('audit_notes')}")

# --- EXECUTION ---

if __name__ == "__main__":
    print("\n🚀 CIVICFIX INDIA: CORE LIFECYCLE TEST\n")
    
    # 1. Prep
    worker_id = run_test("Worker Availability", test_fetch_worker)
    
    # 2. Ingest
    ticket_id = run_test("Citizen Upload & AI Triage", test_web_ingest)
    
    # 3. Dispatch & Resolve
    if ticket_id and worker_id:
        run_test("Admin Dispatch (Assigning)", lambda: test_dispatch(ticket_id, worker_id))
        run_test("Worker Resolution (AI Audit)", lambda: test_resolution(ticket_id))
        
        print(f"\n✨ FULL FLOW COMPLETE: Ticket #{ticket_id} moved from Reported to Resolved.")
    else:
        print("\n🚨 TEST HALTED: Could not complete flow due to earlier failures.")