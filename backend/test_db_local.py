import asyncio
import libsql_client

async def main():
    print("Testing local SQLite client with libsql-client...")
    try:
        async with libsql_client.create_client("file:local.db") as client:
            await client.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, val TEXT)")
            await client.execute("INSERT INTO test (val) VALUES ('hello')")
            res = await client.execute("SELECT * FROM test")
            print("Rows:", res.rows)
    except Exception as e:
        print("Local SQLite failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
