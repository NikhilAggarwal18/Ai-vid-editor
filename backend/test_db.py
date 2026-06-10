import os
import asyncio
import libsql_client
from dotenv import load_dotenv

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

async def test_conn(url):
    print(f"Testing URL: {url}")
    try:
        async with libsql_client.create_client(url=url, auth_token=TURSO_AUTH_TOKEN) as client:
            res = await client.execute("SELECT 1")
            print(f"Success for {url}: {res.rows}")
    except Exception as e:
        print(f"Failed for {url}: {e}")

async def main():
    # Try different protocols
    urls = [
        TURSO_DATABASE_URL,
        TURSO_DATABASE_URL.replace("libsql://", "https://"),
        TURSO_DATABASE_URL.replace("libsql://", "http://"),
    ]
    for url in urls:
        await test_conn(url)

if __name__ == "__main__":
    asyncio.run(main())
