import os
import uuid
import datetime
import urllib.parse
import requests
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Cookie, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

import db
import auth_utils
import crypto_utils

# googleapiclient
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

social_router = APIRouter(prefix="/api/social-network", tags=["Social Network & YouTube"])

# --- PYDANTIC SCHEMAS ---

class NewCreatorOnboardingSchema(BaseModel):
    expected_audience_age: str = Field(..., description="Target age demographic")
    content_genre: str = Field(..., description="Main content category/genre")
    content_format: str = Field(..., description="Format of videos (LONG_FORM, SHORT_FORM, BOTH)")

# --- AUTHENTICATION DEPENDENCY ---

async def get_current_user_id(session_token: Optional[str] = Cookie(None), state: Optional[str] = Query(None)) -> str:
    """
    Dependency to authenticate request and return the active user ID.
    Supports either session_token cookie or state query parameter (as callback fallback).
    """
    token = session_token
    if not token and state:
        token = state  # Fallback to state if session cookie is not set/forwarded
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session token is missing"
        )
    try:
        # Check if token is a session token
        payload = auth_utils.verify_session_token(token)
        return payload.get("sub")
    except Exception:
        # Check if it was passed as user_id directly or other payload
        try:
            payload = auth_utils.verify_temporary_token(token)
            return payload.get("sub") or payload.get("email") # fallback
        except Exception:
            # Let's see if the token is just a raw UUID (useful for mock testing)
            try:
                uuid.UUID(token)
                return token
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session token"
                )

# --- ENDPOINTS ---

@social_router.get("/youtube/auth-url")
async def get_youtube_auth_url(user_id: str = Depends(get_current_user_id)):
    """
    Flow A.1: Generates the Google consent URL with offline access and prompt consent.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "mock_client_id")
    google_redirect_uri = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/social-network/youtube/callback"
    )
    
    scopes = [
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly"
    ]
    
    # We pass the user_id (or state) in the state parameter to verify/re-authenticate on callback
    # For extra safety, we can use the user's ID
    state = user_id
    
    params = {
        "client_id": google_client_id,
        "redirect_uri": google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": state
    }
    
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    
    return {
        "status": "success",
        "auth_url": auth_url
    }


@social_router.get("/youtube/callback")
async def youtube_callback(
    code: str,
    state: Optional[str] = None,
    redirect: Optional[str] = "true",
    session_token: Optional[str] = Cookie(None)
):
    """
    Flow A.2: Google OAuth callback. Exchanges auth code, calls channels API to get ID,
    encrypts tokens and saves the profile to the database.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    try:
        # Authenticate the user. We try session cookie first, then fall back to state.
        user_id = None
        if session_token:
            try:
                payload = auth_utils.verify_session_token(session_token)
                user_id = payload.get("sub")
            except Exception:
                pass
                
        if not user_id and state:
            # state parameter has user_id or token
            try:
                uuid.UUID(state)
                user_id = state
            except ValueError:
                # Maybe it is a session token passed as state
                try:
                    payload = auth_utils.verify_session_token(state)
                    user_id = payload.get("sub")
                except Exception:
                    pass
                    
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cannot identify user session from cookie or state"
            )
            
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        google_redirect_uri = os.getenv(
            "GOOGLE_REDIRECT_URI",
            "http://localhost:8000/api/social-network/youtube/callback"
        )

        # Mock support for testing
        if code.startswith("mock_code_"):
            access_token = f"mock_access_{code}"
            refresh_token = f"mock_refresh_{code}"
            youtube_channel_id = f"UCmock_channel_{code[10:]}"
        else:
            if not google_client_id or not google_client_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Google OAuth client ID/Secret is not configured"
                )
                
            # Exchange code for tokens
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": google_client_id,
                "client_secret": google_client_secret,
                "redirect_uri": google_redirect_uri,
                "grant_type": "authorization_code"
            }
            
            token_res = requests.post(token_url, data=data)
            if token_res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Token exchange failed: {token_res.text}"
                )
                
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            
            if not refresh_token:
                # In OAuth flow, refresh token is only sent on first prompt or if consent requested.
                # However, we set prompt=consent. If it is still missing, we raise an exception.
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google did not return a refresh token. Revoke access and try again."
                )

            # Call youtube.channels.list to get channel ID
            headers = {"Authorization": f"Bearer {access_token}"}
            channel_res = requests.get(
                "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
                headers=headers
            )
            if channel_res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to retrieve YouTube channel metadata from Google"
                )
                
            channel_data = channel_res.json()
            items = channel_data.get("items", [])
            if not items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No YouTube channel associated with this Google account"
                )
            youtube_channel_id = items[0]["id"]

        # Encrypt tokens
        encrypted_refresh = crypto_utils.encrypt(refresh_token)
        encrypted_access = crypto_utils.encrypt(access_token)
        
        # Save/upsert into DB
        client = db.get_client()
        try:
            profile_id = str(uuid.uuid4())
            await client.execute(
                """
                INSERT INTO youtube_creator_profiles (
                    id, user_id, is_established_creator, youtube_channel_id, 
                    youtube_refresh_token, youtube_access_token, 
                    expected_audience_age, content_genre, content_format
                )
                VALUES (?, ?, 1, ?, ?, ?, NULL, NULL, NULL)
                ON CONFLICT(user_id) DO UPDATE SET
                    is_established_creator = 1,
                    youtube_channel_id = excluded.youtube_channel_id,
                    youtube_refresh_token = excluded.youtube_refresh_token,
                    youtube_access_token = excluded.youtube_access_token,
                    expected_audience_age = NULL,
                    content_genre = NULL,
                    content_format = NULL,
                    updated_at = CURRENT_TIMESTAMP
                """,
                [profile_id, user_id, youtube_channel_id, encrypted_refresh, encrypted_access]
            )
        finally:
            await client.close()

        if redirect == "false":
            return {
                "status": "success",
                "message": "YouTube account linked successfully",
                "youtube_channel_id": youtube_channel_id
            }
        else:
            return RedirectResponse(
                url=f"{frontend_url}/?youtube_status=success&channel_id={youtube_channel_id}"
            )
    except Exception as e:
        if redirect == "false":
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=str(e))
        else:
            detail_msg = e.detail if isinstance(e, HTTPException) else str(e)
            return RedirectResponse(
                url=f"{frontend_url}/?youtube_status=error&detail={urllib.parse.quote(detail_msg)}"
            )


@social_router.post("/onboarding/new-creator")
async def onboard_new_creator(
    payload: NewCreatorOnboardingSchema,
    user_id: str = Depends(get_current_user_id)
):
    """
    Flow B: Onboards a new creator by validating demographics and content preferences.
    Saves/upserts the profile under the user ID with is_established_creator = 0.
    """
    # Validation
    valid_ages = {'BELOW_15', '15_18', '18_22', '22_30', '30_40', '40_PLUS'}
    valid_formats = {'LONG_FORM', 'SHORT_FORM', 'BOTH'}
    
    if payload.expected_audience_age not in valid_ages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"expected_audience_age must be one of {valid_ages}"
        )
    if payload.content_format not in valid_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"content_format must be one of {valid_formats}"
        )
        
    client = db.get_client()
    try:
        profile_id = str(uuid.uuid4())
        await client.execute(
            """
            INSERT INTO youtube_creator_profiles (
                id, user_id, is_established_creator, youtube_channel_id,
                youtube_refresh_token, youtube_access_token,
                expected_audience_age, content_genre, content_format
            )
            VALUES (?, ?, 0, NULL, NULL, NULL, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                is_established_creator = 0,
                youtube_channel_id = NULL,
                youtube_refresh_token = NULL,
                youtube_access_token = NULL,
                expected_audience_age = excluded.expected_audience_age,
                content_genre = excluded.content_genre,
                content_format = excluded.content_format,
                updated_at = CURRENT_TIMESTAMP
            """,
            [
                profile_id, 
                user_id, 
                payload.expected_audience_age, 
                payload.content_genre, 
                payload.content_format
            ]
        )
    finally:
        await client.close()
        
    return {
        "status": "success",
        "message": "New creator profile created successfully"
    }


@social_router.get("/youtube/analytics")
async def get_youtube_analytics(user_id: str = Depends(get_current_user_id)):
    """
    Flow C: Retrieves the encrypted refresh token, decrypts it, exchanges for a
    fresh access token, and queries YouTube Analytics reports.
    """
    client = db.get_client()
    try:
        res = await client.execute(
            """
            SELECT is_established_creator, youtube_refresh_token, youtube_channel_id 
            FROM youtube_creator_profiles 
            WHERE user_id = ?
            """,
            [user_id]
        )
        if not res.rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="YouTube Creator profile not found. Complete onboarding first."
            )
            
        is_established, encrypted_refresh, channel_id = res.rows[0]
        
        if not is_established or not encrypted_refresh:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is registered as a new creator or YouTube account is not linked"
            )
            
        # Decrypt refresh token
        try:
            refresh_token = crypto_utils.decrypt(encrypted_refresh)
        except Exception as decrypt_err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Token decryption failed: {str(decrypt_err)}"
            )
            
        # Support mock analytics for local/mock credentials
        if refresh_token.startswith("mock_refresh_"):
            mock_data = []
            today = datetime.date.today()
            for i in range(30):
                day = (today - datetime.timedelta(days=30-i)).isoformat()
                mock_data.append({
                    "day": day,
                    "views": 1000 + i * 50,
                    "likes": 100 + i * 5,
                    "comments": 10 + i,
                    "subscribersGained": 5 + (i // 5)
                })
            return {
                "status": "success",
                "source": "mock",
                "channel_id": channel_id,
                "analytics": mock_data
            }
            
        # Real Google API Client integration
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        if not google_client_id or not google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth credentials are not configured"
            )
            
        try:
            # Exchange refresh token for fresh access token using Credentials object
            creds = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=google_client_id,
                client_secret=google_client_secret
            )
            
            # Query YouTube Analytics API
            analytics_service = build("youtubeAnalytics", "v2", credentials=creds)
            
            end_date = datetime.date.today().isoformat()
            start_date = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
            
            # Execute reports query
            # API documentation: https://developers.google.com/youtube/analytics/reference/reports/query
            report_response = analytics_service.reports().query(
                ids="channel==MINE",
                startDate=start_date,
                endDate=end_date,
                metrics="views,likes,comments,subscribersGained",
                dimensions="day"
            ).execute()
            
            # Format report response
            headers = [header["name"] for header in report_response.get("columnHeaders", [])]
            rows = report_response.get("rows", [])
            
            formatted_data = []
            for row in rows:
                row_dict = dict(zip(headers, row))
                formatted_data.append(row_dict)
                
            return {
                "status": "success",
                "source": "youtube_analytics_api",
                "channel_id": channel_id,
                "analytics": formatted_data
            }
            
        except Exception as api_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"YouTube Analytics API request failed: {str(api_err)}"
            )
            
    finally:
        await client.close()
