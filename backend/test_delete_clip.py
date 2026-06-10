import asyncio
import db

async def test_delete(clip_id):
    client = db.get_client()
    try:
        # Check if the clip exists and retrieve details
        res = await client.execute("SELECT video_url FROM clips WHERE id = ?", [clip_id])
        print("Rows found:", len(res.rows))
        if res.rows:
            print("Video URL:", res.rows[0][0])
            
        await client.execute(
            "UPDATE clips SET status = 'pending', video_url = NULL WHERE id = ?",
            [clip_id]
        )
        print("Successfully updated database!")
    except Exception as e:
        print("Exception:", e)
        import traceback
        traceback.print_exc()
    finally:
        await client.close()

asyncio.run(test_delete("46fccfc2-8e0b-40a6-a80b-a9d37ba67a22"))
