import os
import asyncio
import libsql_client
from dotenv import load_dotenv

# Load env variables
load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

# Global state to keep track of active connection settings
_USE_FALLBACK = False

async def test_turso_connection() -> bool:
    """
    Tests if we can successfully query the Turso cloud database.
    Returns True if connection succeeds, False otherwise.
    """
    if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
        return False
    try:
        # Try a quick query
        async with libsql_client.create_client(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN) as client:
            await client.execute("SELECT 1")
            return True
    except Exception as e:
        print(f"Warning: Turso cloud connection test failed: {e}")
        return False

def get_client():
    """
    Creates and returns a Turso or Local DB client based on connection health.
    Note: Must be used within an async context.
    """
    global _USE_FALLBACK
    if _USE_FALLBACK or not TURSO_DATABASE_URL:
        return libsql_client.create_client(url="file:local.db")
    else:
        return libsql_client.create_client(
            url=TURSO_DATABASE_URL,
            auth_token=TURSO_AUTH_TOKEN
        )

async def init_db():
    """
    Initializes the database schema by creating required tables if they don't exist
    and seeding sample music catalog data. Falls back to local SQLite if Turso fails.
    """
    global _USE_FALLBACK
    
    print("Testing Turso DB connection...")
    connection_ok = await test_turso_connection()
    if not connection_ok:
        print(">>> ALERT: Unable to connect to Turso Cloud DB (Network/Auth issue).")
        print(">>> FALLBACK: Initializing local SQLite database (backend/local.db) instead.")
        _USE_FALLBACK = True
    else:
        print(">>> SUCCESS: Connected to Turso Cloud DB!")
        _USE_FALLBACK = False

    try:
        print("Initializing database tables...")
        async with get_client() as client:
            # Create users table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT,
                    auth_provider TEXT NOT NULL CHECK(auth_provider IN ('EMAIL', 'GOOGLE')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await client.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")

            # Create otp_verifications table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS otp_verifications (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    otp_code TEXT NOT NULL,
                    expires_at DATETIME NOT NULL
                )
            """)
            await client.execute("CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email)")

            # Create channels table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS channels (
                    id TEXT PRIMARY KEY,
                    handle TEXT NOT NULL,
                    title TEXT NOT NULL,
                    avatar_url TEXT,
                    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create style_presets table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS style_presets (
                    id TEXT PRIMARY KEY,
                    channel_id TEXT REFERENCES channels(id),
                    font_family TEXT DEFAULT 'Impact',
                    font_size INTEGER DEFAULT 48,
                    primary_color TEXT DEFAULT '#FFFF00',
                    secondary_color TEXT DEFAULT '#FFFFFF',
                    stroke_color TEXT DEFAULT '#000000',
                    stroke_width INTEGER DEFAULT 4,
                    caption_position TEXT DEFAULT 'center',
                    animation_style TEXT DEFAULT 'pop',
                    b_roll_frequency TEXT DEFAULT 'high'
                )
            """)
            
            # Create projects table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    genre TEXT DEFAULT 'Cinematic',
                    music_track_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create project_videos table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS project_videos (
                    id TEXT PRIMARY KEY,
                    project_id TEXT REFERENCES projects(id),
                    label TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    duration INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create clips table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS clips (
                    id TEXT PRIMARY KEY,
                    project_id TEXT REFERENCES projects(id),
                    title TEXT,
                    start_time REAL,
                    end_time REAL,
                    hook_score INTEGER,
                    transcript TEXT,
                    video_url TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create music_tracks table
            await client.execute("""
                CREATE TABLE IF NOT EXISTS music_tracks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    genre TEXT NOT NULL,
                    duration INTEGER,
                    audio_url TEXT NOT NULL
                )
            """)
            
            print("Tables created. Seeding sample music tracks...")
            
            # Insert sample music tracks if catalog is empty
            res = await client.execute("SELECT COUNT(*) as cnt FROM music_tracks")
            if res.rows[0][0] == 0:
                tracks = [
                    ("m1", "Epic Horizon", "Aether", "Cinematic", 120, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"),
                    ("m2", "Cyberpunk Chase", "Glitch Theory", "Hype/High-Energy", 95, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"),
                    ("m3", "Midnight Breeze", "Chill Hop Collective", "Lo-Fi", 150, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"),
                    ("m4", "Deep Shadow", "Dark Synth", "Suspense", 110, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"),
                    ("m5", "Inspiring Growth", "Corporate Beats", "Corporate", 140, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3")
                ]
                for track in tracks:
                    await client.execute(
                        "INSERT INTO music_tracks (id, title, artist, genre, duration, audio_url) VALUES (?, ?, ?, ?, ?, ?)",
                        list(track)
                    )
                print("Music catalog seeded successfully!")
            else:
                print("Music catalog already seeded.")
                
            print("Database initialization complete!")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise e

# Auto-detect fallback on startup if imported
async def check_on_load():
    global _USE_FALLBACK
    if not await test_turso_connection():
        _USE_FALLBACK = True

if __name__ == "__main__":
    asyncio.run(init_db())
