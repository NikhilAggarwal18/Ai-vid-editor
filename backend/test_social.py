import asyncio
import os
import json
from fastapi.testclient import TestClient
import db
import crypto_utils
from main import app

client = TestClient(app)

import auth_utils
TEST_USER_ID = "12345678-1234-5678-1234-567812345678"
TEST_SESSION_TOKEN = auth_utils.create_session_token(user_id=TEST_USER_ID, email="testcreator@example.com")
TEST_COOKIE = {"session_token": TEST_SESSION_TOKEN}

async def cleanup_test_records():
    """Cleans up test records to make tests idempotent."""
    db_client = db.get_client()
    try:
        await db_client.execute("DELETE FROM youtube_creator_profiles WHERE user_id = ?", [TEST_USER_ID])
        await db_client.execute("DELETE FROM users WHERE id = ?", [TEST_USER_ID])
        print("🧹 Cleaned up test database records.")
    finally:
        await db_client.close()

async def setup_test_user():
    """Inserts a test user into the database to satisfy foreign keys."""
    db_client = db.get_client()
    try:
        await db_client.execute(
            "INSERT OR REPLACE INTO users (id, email, name, auth_provider) VALUES (?, ?, ?, ?)",
            [TEST_USER_ID, "testcreator@example.com", "Test Creator", "EMAIL"]
        )
        print("👤 Inserted test user.")
    finally:
        await db_client.close()

def run_db_setup():
    asyncio.run(cleanup_test_records())
    asyncio.run(setup_test_user())

def run_db_cleanup():
    asyncio.run(cleanup_test_records())

def test_crypto_utility():
    print("Testing crypto utility (AES-256-GCM)...")
    plaintext = "super-secret-youtube-token-123"
    
    # 1. Encryption
    encrypted = crypto_utils.encrypt(plaintext)
    assert encrypted != plaintext
    
    payload = json.loads(encrypted)
    assert "iv" in payload
    assert "encryptedData" in payload
    assert "authTag" in payload
    
    # 2. Decryption
    decrypted = crypto_utils.decrypt(encrypted)
    assert decrypted == plaintext
    
    # 3. Integrity verification failure
    tampered_payload = payload.copy()
    # Change last character of ciphertext
    tampered_payload["encryptedData"] = tampered_payload["encryptedData"][:-1] + "A"
    tampered_payload_str = json.dumps(tampered_payload)
    
    try:
        crypto_utils.decrypt(tampered_payload_str)
        assert False, "Should raise ValueError for tampered data"
    except ValueError:
        pass
        
    print("✅ Crypto utility tests passed.")

def test_youtube_auth_url():
    print("Testing /youtube/auth-url endpoint...")
    
    # Set the state/cookie parameter as the test user ID (mock authentication)
    res = client.get("/api/social-network/youtube/auth-url", cookies=TEST_COOKIE)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    auth_url = data["auth_url"]
    
    assert "access_type=offline" in auth_url
    assert "prompt=consent" in auth_url
    assert f"state={TEST_USER_ID}" in auth_url
    print("✅ YouTube auth URL generation endpoint passed.")

def test_new_creator_onboarding():
    print("Testing new creator onboarding flow...")
    
    # 1. Invalid demographic validation
    res = client.post(
        "/api/social-network/onboarding/new-creator",
        json={
            "expected_audience_age": "INVALID_AGE",
            "content_genre": "Gaming",
            "content_format": "SHORT_FORM"
        },
        cookies=TEST_COOKIE
    )
    assert res.status_code == 400
    assert "expected_audience_age must be one of" in res.json()["detail"]
    
    res = client.post(
        "/api/social-network/onboarding/new-creator",
        json={
            "expected_audience_age": "18_22",
            "content_genre": "Gaming",
            "content_format": "INVALID_FORMAT"
        },
        cookies=TEST_COOKIE
    )
    assert res.status_code == 400
    assert "content_format must be one of" in res.json()["detail"]
    
    # 2. Valid onboarding payload
    res = client.post(
        "/api/social-network/onboarding/new-creator",
        json={
            "expected_audience_age": "18_22",
            "content_genre": "Gaming",
            "content_format": "SHORT_FORM"
        },
        cookies=TEST_COOKIE
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    
    # Verify in DB
    async def get_profile():
        db_client = db.get_client()
        try:
            r = await db_client.execute(
                "SELECT is_established_creator, expected_audience_age, content_genre, content_format FROM youtube_creator_profiles WHERE user_id = ?",
                [TEST_USER_ID]
            )
            return r.rows[0]
        finally:
            await db_client.close()
            
    row = asyncio.run(get_profile())
    assert row[0] == 0 # is_established_creator = false
    assert row[1] == "18_22"
    assert row[2] == "Gaming"
    assert row[3] == "SHORT_FORM"
    
    print("✅ New creator onboarding flow passed.")

def test_youtube_callback_simulation():
    print("Testing YouTube OAuth callback simulation...")
    
    # Simulate callback from Google using mock code
    res = client.get(
        "/api/social-network/youtube/callback",
        params={"code": "mock_code_user123", "state": TEST_USER_ID, "redirect": "false"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "youtube_channel_id" in data
    assert data["youtube_channel_id"] == "UCmock_channel_user123"
    
    # Verify DB records have been updated and tokens are encrypted
    async def get_profile():
        db_client = db.get_client()
        try:
            r = await db_client.execute(
                "SELECT is_established_creator, youtube_refresh_token, youtube_access_token, expected_audience_age FROM youtube_creator_profiles WHERE user_id = ?",
                [TEST_USER_ID]
            )
            return r.rows[0]
        finally:
            await db_client.close()
            
    is_established, encrypted_refresh, encrypted_access, age = asyncio.run(get_profile())
    assert is_established == 1
    assert age is None # new creator fields set to NULL
    
    # Verify we can decrypt tokens
    assert crypto_utils.decrypt(encrypted_refresh) == "mock_refresh_mock_code_user123"
    assert crypto_utils.decrypt(encrypted_access) == "mock_access_mock_code_user123"
    
    print("✅ YouTube callback simulation endpoint passed.")

def test_youtube_analytics_pull():
    print("Testing YouTube analytics pull endpoint...")
    
    # 1. Fetch analytics (should return the mock analytics since refresh token is mock)
    res = client.get(
        "/api/social-network/youtube/analytics",
        cookies=TEST_COOKIE
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["source"] == "mock"
    assert len(data["analytics"]) == 30
    
    # Check fields in first analytics item
    first_item = data["analytics"][0]
    assert "day" in first_item
    assert "views" in first_item
    assert "likes" in first_item
    assert "comments" in first_item
    assert "subscribersGained" in first_item
    
    # 2. Check failure when profile is missing or new creator
    # Let's set the profile back to a new creator profile and query analytics
    res_onboard = client.post(
        "/api/social-network/onboarding/new-creator",
        json={
            "expected_audience_age": "22_30",
            "content_genre": "Vlog",
            "content_format": "BOTH"
        },
        cookies=TEST_COOKIE
    )
    assert res_onboard.status_code == 200
    
    res_analytics = client.get(
        "/api/social-network/youtube/analytics",
        cookies=TEST_COOKIE
    )
    assert res_analytics.status_code == 400
    assert "User is registered as a new creator" in res_analytics.json()["detail"]
    
    print("✅ YouTube analytics pull endpoint passed.")

if __name__ == "__main__":
    print("=== STARTING SOCIAL NETWORK & YOUTUBE INTEGRATION TESTS ===\n")
    
    # Setup test user and database
    run_db_setup()
    
    try:
        test_crypto_utility()
        print("")
        test_youtube_auth_url()
        print("")
        test_new_creator_onboarding()
        print("")
        test_youtube_callback_simulation()
        print("")
        test_youtube_analytics_pull()
        print("\n=== ALL SOCIAL INTEGRATION TESTS PASSED SUCCESSFULLY ===")
    finally:
        # Cleanup test records
        run_db_cleanup()
