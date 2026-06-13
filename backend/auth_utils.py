import os
import re
import datetime
import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_key_change_me_in_production")
JWT_ALGORITHM = "HS256"

# Password Policy Regex
# 8-25 characters, at least 1 lowercase, 1 uppercase, 1 digit, 1 special character
PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$"
)

def validate_password_strength(password: str) -> bool:
    """
    Validates if a password meets the required policy.
    """
    return bool(PASSWORD_REGEX.match(password))

def hash_password(password: str) -> str:
    """
    Hashes a plain text password using bcrypt with salt rounds = 12.
    """
    # bcrypt salt rounds=12 is standard. bcrypt.gensalt(12) does 12 rounds.
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored bcrypt hash.
    """
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_temporary_token(email: str, name: str = None, expires_delta_minutes: int = 15) -> str:
    """
    Creates a short-lived temporary token to authorize account finalization.
    """
    payload = {
        "email": email,
        "name": name,
        "type": "temp_signup",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta_minutes),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_temporary_token(token: str) -> dict:
    """
    Verifies a temporary token and returns its decoded payload.
    Raises ValueError on expiration or invalid signature.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "temp_signup":
            raise ValueError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Verification token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid verification token")

def create_password_reset_token(email: str, expires_delta_minutes: int = 15) -> str:
    """
    Creates a short-lived temporary token to authorize password reset.
    """
    payload = {
        "email": email,
        "type": "password_reset",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta_minutes),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_password_reset_token(token: str) -> dict:
    """
    Verifies a password reset token and returns its decoded payload.
    Raises ValueError on expiration or invalid signature.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "password_reset":
            raise ValueError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Reset token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid reset token")

def create_session_token(user_id: str, email: str, expires_delta_days: int = 7) -> str:
    """
    Creates a long-lived session token to be stored in secure HttpOnly cookies.
    """
    payload = {
        "sub": user_id,
        "email": email,
        "type": "session",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=expires_delta_days),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_session_token(token: str) -> dict:
    """
    Verifies a session token and returns its decoded payload.
    Raises ValueError on expiration or invalid signature.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "session":
            raise ValueError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Session has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid session token")

def send_otp_email(email: str, otp_code: str):
    """
    Mocks sending an OTP code. Prints it clearly to stdout for local testing,
    and checks if email service credentials are set to route email dynamically.
    """
    print(f"\n==================================================")
    print(f"📧 EMAIL DISPATCH SYSTEM (MOCK)")
    print(f"Recipient: {email}")
    print(f"Subject: Your Platform Verification Code")
    print(f"Content: Your verification code is: {otp_code}")
    print(f"This code will expire in 10 minutes.")
    print(f"==================================================\n")
    
    # Optional production SMTP or SendGrid connection placeholder
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    if sendgrid_key:
        # Code to send real email using SendGrid SDK (if configured)
        pass
