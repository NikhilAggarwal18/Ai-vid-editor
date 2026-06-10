import asyncio
import db

async def check_clips():
    client = db.get_client()
    try:
        res = await client.execute("SELECT id, title, video_url, status FROM clips")
        print("Clips in DB:")
        for row in res.rows:
            print(f"ID: {row[0]}, Title: {row[1]}, URL: {row[2]}, Status: {row[3]}")
    except Exception as e:
        print("Error:", e)
    finally:
        await client.close()

asyncio.run(check_clips())
