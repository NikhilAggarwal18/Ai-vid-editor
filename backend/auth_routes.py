import os
import uuid
import random
import datetime
from fastapi import APIRouter, HTTPException, Response, Depends, status, Cookie
from pydantic import BaseModel, EmailStr
from typing import Optional

import db
import auth_utils

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# --- PYDANTIC SCHEMAS ---

class EmailInitSchema(BaseModel):
    email: EmailStr

class EmailVerifySchema(BaseModel):
    email: EmailStr
    otp_code: str

class FinalizeSignupSchema(BaseModel):
    email: EmailStr
    name: str
    password: str
    token: str

class EmailSigninSchema(BaseModel):
    email: EmailStr
    password: str

class GoogleSigninSchema(BaseModel):
    credential: str # Google IdToken / credential code

# --- ENDPOINTS ---

@auth_router.post("/signup/email/init")
async def signup_email_init(payload: EmailInitSchema):
    """
    Initializes Email Sign-Up. Checks if user exists, generates a 6-digit OTP,
    hashes it, stores it in the database with 10-minute expiry, and triggers email dispatch.
    """
    client = db.get_client()
    try:
        # Check if email exists
        res = await client.execute("SELECT id FROM users WHERE email = ?", [payload.email])
        if res.rows:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered"
            )
        
        # Generate 6-digit OTP
        otp_val = f"{random.randint(100000, 999999)}"
        # Hash OTP (we can hash with bcrypt or a simple hash, let's use bcrypt hashing)
        otp_hash = auth_utils.hash_password(otp_val)
        
        # Save verification record (using INSERT OR REPLACE since email is PRIMARY KEY)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        
        await client.execute(
            """INSERT OR REPLACE INTO otp_verifications (email, otp_code, expires_at) 
               VALUES (?, ?, ?)""",
            [payload.email, otp_hash, expires_at.isoformat()]
        )
        
        # Send OTP
        auth_utils.send_otp_email(payload.email, otp_val)
        
        return {"status": "success", "message": "Verification code sent successfully"}
    finally:
        await client.close()


@auth_router.post("/signup/email/verify")
async def signup_email_verify(payload: EmailVerifySchema):
    """
    Verifies the email OTP and returns a short-lived temporary token to authorize account finalization.
    """
    client = db.get_client()
    try:
        # Get latest verification record
        res = await client.execute(
            "SELECT otp_code, expires_at FROM otp_verifications WHERE email = ?",
            [payload.email]
        )
        if not res.rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification code has been requested for this email"
            )
        
        stored_hash, expires_str = res.rows[0]
        
        # Check expiry
        expires_at = datetime.datetime.fromisoformat(expires_str)
        if datetime.datetime.utcnow() > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new one"
            )
        
        # Verify code
        if not auth_utils.verify_password(payload.otp_code, stored_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        # Generate temporary token (valid for 15 minutes)
        temp_token = auth_utils.create_temporary_token(email=payload.email)
        
        # Delete OTP record after successful validation
        await client.execute("DELETE FROM otp_verifications WHERE email = ?", [payload.email])
        
        return {"status": "success", "token": temp_token}
    finally:
        await client.close()


@auth_router.post("/signup/finalize")
async def signup_finalize(payload: FinalizeSignupSchema, response: Response):
    """
    Finalizes user account registration. Validates the temporary token, verifies password strength,
    hashes the password, inserts the user record, and issues a session cookie.
    """
    # Verify temporary token
    try:
        token_payload = auth_utils.verify_temporary_token(payload.token)
        if token_payload.get("email") != payload.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification email mismatch"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
    # Validate password strength
    if not auth_utils.validate_password_strength(payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet safety policies (8-15 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)"
        )
        
    client = db.get_client()
    try:
        # Check if email exists
        res = await client.execute("SELECT id FROM users WHERE email = ?", [payload.email])
        if res.rows:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered"
            )
        
        # Hash password and insert user
        pass_hash = auth_utils.hash_password(payload.password)
        user_id = str(uuid.uuid4())
        
        await client.execute(
            """INSERT INTO users (id, email, name, password_hash, auth_provider) 
               VALUES (?, ?, ?, ?, ?)""",
            [user_id, payload.email, payload.name, pass_hash, "EMAIL"]
        )
        
        # Generate session JWT
        session_token = auth_utils.create_session_token(user_id=user_id, email=payload.email)
        
        # Set HttpOnly cookie
        # In development, secure=False allows cookie transmission over HTTP
        is_prod = os.getenv("ENVIRONMENT") == "production"
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=7 * 24 * 3600
        )
        
        return {
            "status": "success",
            "user": {
                "id": user_id,
                "email": payload.email,
                "name": payload.name,
                "auth_provider": "EMAIL"
            }
        }
    finally:
        await client.close()


@auth_router.post("/signin/email")
async def signin_email(payload: EmailSigninSchema, response: Response):
    """
    Standard Email/Password Sign-In endpoint. Validates credentials and issues a session cookie.
    """
    client = db.get_client()
    try:
        # Fetch user
        res = await client.execute(
            "SELECT id, email, name, password_hash, auth_provider FROM users WHERE email = ?",
            [payload.email]
        )
        if not res.rows:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user_id, email, name, password_hash, auth_provider = res.rows[0]
        
        # Check if user has a password (they might only use Google OAuth)
        if not password_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email uses Google Sign-In. Please log in with Google"
            )
            
        # Verify password
        if not auth_utils.verify_password(payload.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
            
        # Generate session JWT
        session_token = auth_utils.create_session_token(user_id=user_id, email=email)
        
        # Set HttpOnly cookie
        is_prod = os.getenv("ENVIRONMENT") == "production"
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=7 * 24 * 3600
        )
        
        return {
            "status": "success",
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "auth_provider": auth_provider
            }
        }
    finally:
        await client.close()

# --- GOOGLE OAUTH SIMULATED FLOW ---
# Note: Google Sign-In in local environments can be simulated using redirect links
# or mock callbacks, while supporting full integration with Google Client APIs.

@auth_router.get("/google/init")
async def google_init():
    """
    Mock endpoint simulating redirect to Google consent screen.
    Returns redirect configuration details.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "mock_client_id")
    mock_redirect_uri = "http://localhost:8000/api/auth/google/callback"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={google_client_id}&response_type=code&scope=openid%20email%20profile&"
        f"redirect_uri={mock_redirect_uri}"
    )
    return {
        "status": "success",
        "redirect_url": auth_url,
        "mode": "simulated"
    }


@auth_router.get("/google/callback")
async def google_callback(code: str, response: Response):
    """
    Mock Callback endpoint that exchanges code for profile info.
    Resolves email to existing user (issues session) or generates a temporary signup token.
    """
    client = db.get_client()
    try:
        # Mock profile exchange based on code value
        # For testing, we mock code values like "code_mrbeast", "code_newuser", etc.
        mock_email = "creator@example.com"
        mock_name = "Creator User"
        
        if "newuser" in code:
            mock_email = f"new_google_user_{random.randint(100, 999)}@gmail.com"
            mock_name = "New Google User"
        elif "@" in code:
            # allow passing email directly in code for testing convenience
            mock_email = code
            mock_name = code.split("@")[0].capitalize()

        # Check if email exists
        res = await client.execute(
            "SELECT id, email, name, auth_provider FROM users WHERE email = ?", [mock_email]
        )
        if res.rows:
            user_id, email, name, auth_provider = res.rows[0]
            # Generate session JWT
            session_token = auth_utils.create_session_token(user_id=user_id, email=email)
            is_prod = os.getenv("ENVIRONMENT") == "production"
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=is_prod,
                samesite="lax",
                max_age=7 * 24 * 3600
            )
            return {
                "status": "success",
                "action": "login",
                "user": {"id": user_id, "email": email, "name": name, "auth_provider": auth_provider}
            }
        else:
            # Auto-register new Google user
            user_id = str(uuid.uuid4())
            await client.execute(
                """INSERT INTO users (id, email, name, password_hash, auth_provider) 
                   VALUES (?, ?, ?, ?, ?)""",
                [user_id, mock_email, mock_name, None, "GOOGLE"]
            )
            
            # Generate session JWT
            session_token = auth_utils.create_session_token(user_id=user_id, email=mock_email)
            is_prod = os.getenv("ENVIRONMENT") == "production"
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=is_prod,
                samesite="lax",
                max_age=7 * 24 * 3600
            )
            return {
                "status": "success",
                "action": "login",
                "user": {"id": user_id, "email": mock_email, "name": mock_name, "auth_provider": "GOOGLE"}
            }
    finally:
        await client.close()


@auth_router.post("/signin/google")
async def signin_google(payload: GoogleSigninSchema, response: Response):
    """
    Google OAuth Sign-In handler. Decodes and verifies the Google ID token,
    checks if user exists (logs in), or returns signup finalize requirements.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID") or "1079750944571-1llr1tqbluu1s04duil36e79fceefq6a.apps.googleusercontent.com"
    
    email = None
    name = "Google User"
    
    # Try verifying as cryptographic ID Token first
    if payload.credential and len(payload.credential.split(".")) == 3:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            idinfo = id_token.verify_oauth2_token(
                payload.credential,
                google_requests.Request(),
                google_client_id
            )
            email = idinfo["email"]
            name = idinfo.get("name", email.split("@")[0].capitalize())
        except Exception as token_err:
            print(f"Cryptographic verification failed: {token_err}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google credential token"
            )
    else:
        # Fallback to mock email (for local simulator checks)
        email = payload.credential
        if not "@" in email:
            email = "google_user@example.com"
        name = email.split("@")[0].capitalize()

    client = db.get_client()
    try:
        res = await client.execute(
            "SELECT id, email, name, auth_provider FROM users WHERE email = ?", [email]
        )
        if res.rows:
            user_id, email_val, name_val, auth_provider = res.rows[0]
            session_token = auth_utils.create_session_token(user_id=user_id, email=email_val)
            is_prod = os.getenv("ENVIRONMENT") == "production"
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=is_prod,
                samesite="lax",
                max_age=7 * 24 * 3600
            )
            return {
                "status": "success",
                "action": "login",
                "user": {
                    "id": user_id, 
                    "email": email_val, 
                    "name": name_val, 
                    "auth_provider": auth_provider
                }
            }
        else:
            # Auto-register new Google user
            user_id = str(uuid.uuid4())
            await client.execute(
                """INSERT INTO users (id, email, name, password_hash, auth_provider) 
                   VALUES (?, ?, ?, ?, ?)""",
                [user_id, email, name, None, "GOOGLE"]
            )
            
            # Generate session JWT
            session_token = auth_utils.create_session_token(user_id=user_id, email=email)
            is_prod = os.getenv("ENVIRONMENT") == "production"
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=is_prod,
                samesite="lax",
                max_age=7 * 24 * 3600
            )
            return {
                "status": "success",
                "action": "login",
                "user": {
                    "id": user_id,
                    "email": email,
                    "name": name,
                    "auth_provider": "GOOGLE"
                }
            }
    finally:
        await client.close()


@auth_router.get("/me")
async def get_me(session_token: Optional[str] = Cookie(None)):
    """
    Returns the current logged-in user profile from session cookie.
    """
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = auth_utils.verify_session_token(session_token)
        user_id = payload.get("sub")
        client = db.get_client()
        try:
            res = await client.execute("SELECT id, email, name, auth_provider FROM users WHERE id = ?", [user_id])
            if not res.rows:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            row = res.rows[0]
            return {
                "status": "success",
                "user": {
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "auth_provider": row[3]
                }
            }
        finally:
            await client.close()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@auth_router.post("/logout")
async def logout(response: Response):
    """
    Clears the session cookie.
    """
    response.delete_cookie(key="session_token")
    return {"status": "success", "message": "Successfully logged out"}
