import asyncio
from fastapi.testclient import TestClient
from main import app
import auth_utils
import db

client = TestClient(app)

# Test email address
TEST_EMAIL = "auth_tester@example.com"
TEST_NAME = "Auth Tester"
TEST_PASSWORD_VALID = "SecureP@ss12"
TEST_PASSWORD_INVALID = "weak"

async def cleanup_test_user():
    """
    Cleans up any test users and OTPs to make the tests idempotent.
    """
    db_client = db.get_client()
    try:
        await db_client.execute("DELETE FROM users WHERE email = ?", [TEST_EMAIL])
        await db_client.execute("DELETE FROM otp_verifications WHERE email = ?", [TEST_EMAIL])
        print("🧹 Cleaned up test database records.")
    finally:
        await db_client.close()

def run_db_cleanup():
    asyncio.run(cleanup_test_user())

def test_password_policy():
    print("Testing password strength validator...")
    
    # Valid passwords (8-15 characters, 1 upper, 1 lower, 1 digit, 1 special)
    assert auth_utils.validate_password_strength("P@ssword123") == True
    assert auth_utils.validate_password_strength("Aa1!bb22") == True
    assert auth_utils.validate_password_strength("S3cur1ty!Code") == True
    
    # Invalid passwords
    assert auth_utils.validate_password_strength("password") == False # no upper, number, special
    assert auth_utils.validate_password_strength("Pass1!") == False # too short
    assert auth_utils.validate_password_strength("Password123456789!@#") == False # too long
    assert auth_utils.validate_password_strength("PASSWORD123!") == False # no lowercase
    assert auth_utils.validate_password_strength("password123!") == False # no uppercase
    assert auth_utils.validate_password_strength("Password123") == False # no special character
    assert auth_utils.validate_password_strength("Password!@#") == False # no digit
    
    print("✅ Password policy tests passed.")

def test_bcrypt_hashing():
    print("Testing password hashing and verification...")
    password = "MySecr3tPassword!"
    
    hashed = auth_utils.hash_password(password)
    assert hashed != password
    assert hashed.startswith("$2b$") # bcrypt prefix
    
    assert auth_utils.verify_password(password, hashed) == True
    assert auth_utils.verify_password("wrong_password", hashed) == False
    
    print("✅ Bcrypt hashing tests passed.")

def test_jwt_generation_and_verification():
    print("Testing JWT encoding/decoding and validation...")
    
    # Temporary Token
    temp_token = auth_utils.create_temporary_token(TEST_EMAIL, TEST_NAME)
    decoded_temp = auth_utils.verify_temporary_token(temp_token)
    assert decoded_temp["email"] == TEST_EMAIL
    assert decoded_temp["name"] == TEST_NAME
    assert decoded_temp["type"] == "temp_signup"
    
    # Session Token
    session_token = auth_utils.create_session_token("usr_123", TEST_EMAIL)
    decoded_session = auth_utils.verify_session_token(session_token)
    assert decoded_session["sub"] == "usr_123"
    assert decoded_session["email"] == TEST_EMAIL
    assert decoded_session["type"] == "session"
    
    print("✅ JWT token manager tests passed.")

async def fetch_test_otp():
    """
    Fetches the generated OTP code directly from the DB to complete verification tests.
    """
    db_client = db.get_client()
    try:
        res = await db_client.execute(
            "SELECT otp_code FROM otp_verifications WHERE email = ? ORDER BY expires_at DESC LIMIT 1",
            [TEST_EMAIL]
        )
        if res.rows:
            return res.rows[0][0]
        return None
    finally:
        await db_client.close()

def test_api_sign_up_and_sign_in_flow():
    print("Testing complete authentication REST API flow...")
    
    # Ensure database is clean
    run_db_cleanup()

    # 1. Sign Up Init
    print("  -> Testing /signup/email/init...")
    res = client.post("/api/auth/signup/email/init", json={"email": TEST_EMAIL})
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Try signing up with same email before finalizing, should conflict
    # (Wait, init allows requesting multiple OTPs, finalize checks user existence)
    
    # 2. Get code from DB and verify
    # We must mock verification code lookup
    print("  -> Fetching generated OTP code from database...")
    # Since we use bcrypt for OTP hashing in database, we can't reverse-lookup the plain text code.
    # To test verify, we can override or query, but wait!
    # In auth_routes.py, line 53, we delete any old OTP verifications.
    # Let's verify by manually inserting a known hash in database to test verify endpoint!
    # This is a very robust integration testing practice.
    async def insert_known_otp():
        db_client = db.get_client()
        try:
            # Hash '123456'
            otp_hash = auth_utils.hash_password("123456")
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
            await db_client.execute(
                "INSERT OR REPLACE INTO otp_verifications (id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)",
                ["test_verify_id", TEST_EMAIL, otp_hash, expires_at.isoformat()]
            )
        finally:
            await db_client.close()
            
    import datetime
    asyncio.run(insert_known_otp())
    
    print("  -> Testing /signup/email/verify (Invalid code)...")
    res = client.post("/api/auth/signup/email/verify", json={"email": TEST_EMAIL, "otp_code": "000000"})
    assert res.status_code == 400
    assert "Invalid verification code" in res.json()["detail"]

    print("  -> Testing /signup/email/verify (Valid code)...")
    res = client.post("/api/auth/signup/email/verify", json={"email": TEST_EMAIL, "otp_code": "123456"})
    assert res.status_code == 200
    assert "token" in res.json()
    temp_token = res.json()["token"]

    # 3. Finalize Account
    print("  -> Testing /signup/finalize (Weak password)...")
    res = client.post("/api/auth/signup/finalize", json={
        "email": TEST_EMAIL,
        "name": TEST_NAME,
        "password": TEST_PASSWORD_INVALID,
        "token": temp_token
    })
    assert res.status_code == 400
    assert "Password does not meet safety policies" in res.json()["detail"]

    print("  -> Testing /signup/finalize (Valid credentials)...")
    res = client.post("/api/auth/signup/finalize", json={
        "email": TEST_EMAIL,
        "name": TEST_NAME,
        "password": TEST_PASSWORD_VALID,
        "token": temp_token
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert res.json()["user"]["email"] == TEST_EMAIL
    assert "session_token" in res.cookies # secure HttpOnly cookie set!

    # Try signing up with same email now that user exists
    print("  -> Testing /signup/email/init (Already exists)...")
    res = client.post("/api/auth/signup/email/init", json={"email": TEST_EMAIL})
    assert res.status_code == 409
    assert "Email is already registered" in res.json()["detail"]

    # 4. Sign In
    print("  -> Testing /signin/email (Invalid password)...")
    res = client.post("/api/auth/signin/email", json={"email": TEST_EMAIL, "password": "WrongPassword1!"})
    assert res.status_code == 401

    print("  -> Testing /signin/email (Valid credentials)...")
    res = client.post("/api/auth/signin/email", json={"email": TEST_EMAIL, "password": TEST_PASSWORD_VALID})
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert res.json()["user"]["name"] == TEST_NAME
    assert "session_token" in res.cookies

    # Cleanup at end
    run_db_cleanup()
    print("✅ API Sign-Up & Sign-In integration tests passed.")

if __name__ == "__main__":
    print("=== STARTING AUTHENTICATION MODULE TESTS ===\n")
    test_password_policy()
    print("")
    test_bcrypt_hashing()
    print("")
    test_jwt_generation_and_verification()
    print("")
    test_api_sign_up_and_sign_in_flow()
    print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")
