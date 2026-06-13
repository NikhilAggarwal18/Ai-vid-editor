import os
import json
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def get_encryption_key() -> bytes:
    """
    Retrieves the 32-byte encryption key from environment variables.
    Handles hex, base64, or falls back to raw string padding/truncating.
    """
    key_str = os.getenv("ENCRYPTION_KEY")
    if not key_str:
        # Fall back to a default consistent key for local development
        key_str = "default_dev_encryption_key_32_bytes_long_!!"
        
    # Check if the key is hex-encoded (64 characters)
    try:
        if len(key_str) == 64:
            return bytes.fromhex(key_str)
    except Exception:
        pass
        
    # Check if key is base64-encoded
    try:
        decoded = base64.b64decode(key_str)
        if len(decoded) == 32:
            return decoded
    except Exception:
        pass
        
    # Fallback: treat as raw string and pad or truncate to 32 bytes
    key_bytes = key_str.encode("utf-8")
    if len(key_bytes) >= 32:
        return key_bytes[:32]
    else:
        return key_bytes.ljust(32, b"\0")

def encrypt(text: str) -> str:
    """
    Encrypts a plaintext string using AES-256-GCM.
    Returns a JSON string containing the base64-encoded:
      - 'iv' (initialization vector, 12 bytes)
      - 'encryptedData' (ciphertext)
      - 'authTag' (integrity tag, 16 bytes)
    """
    if not text:
        return ""
        
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    
    # Generate 12-byte random IV
    iv = os.urandom(12)
    
    # Encrypt (AESGCM returns ciphertext + 16-byte tag appended)
    ciphertext_with_tag = aesgcm.encrypt(iv, text.encode("utf-8"), None)
    
    # Separate ciphertext and tag
    ciphertext = ciphertext_with_tag[:-16]
    tag = ciphertext_with_tag[-16:]
    
    payload = {
        "iv": base64.b64encode(iv).decode("utf-8"),
        "encryptedData": base64.b64encode(ciphertext).decode("utf-8"),
        "authTag": base64.b64encode(tag).decode("utf-8")
    }
    
    return json.dumps(payload)

def decrypt(encrypted_payload: str) -> str:
    """
    Decrypts a JSON string payload produced by encrypt() back to plaintext.
    Verifies the integrity of the data using the authentication tag.
    """
    if not encrypted_payload:
        return ""
        
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    
    try:
        payload = json.loads(encrypted_payload)
        
        # Verify fields exist
        if not all(k in payload for k in ("iv", "encryptedData", "authTag")):
            raise ValueError("Invalid encrypted payload structure")
            
        iv = base64.b64decode(payload["iv"])
        ciphertext = base64.b64decode(payload["encryptedData"])
        tag = base64.b64decode(payload["authTag"])
        
        # Reconstruct ciphertext + tag
        ciphertext_with_tag = ciphertext + tag
        
        # Decrypt (automatically verifies integrity tag)
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext_with_tag, None)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")
