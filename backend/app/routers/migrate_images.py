import asyncpg
import aiohttp
import os
from pathlib import Path
import logging
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

async def download_image(url, filename):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    upload_dir = Path("uploads/images")
                    upload_dir.mkdir(parents=True, exist_ok=True)
                    file_path = upload_dir / filename
                    with file_path.open("wb") as f:
                        f.write(await response.read())
                    logging.info(f"Downloaded image {url} to {file_path}")
                    return f"/uploads/images/{filename}"
                else:
                    logging.warning(f"Failed to download {url}: Status {response.status}. Skipping this URL.")
                    return None
    except Exception as e:
        logging.warning(f"Error downloading {url}: {e}. Skipping this URL.")
        return None

async def migrate_images():
    try:
        conn = await asyncpg.connect("postgresql://postgres:1234@localhost:5432/Coala")
        logging.info("Connected to database")
        for table, id_column in [("study_materials", "material_id"), ("study_example", "example_id")]:
            logging.info(f"Processing table: {table}")
            rows = await conn.fetch(f"SELECT {id_column}, sections FROM {table} WHERE sections @> '[{{ \"type\": \"image\" }}]'::jsonb")
            for row in rows:
                sections = row["sections"]
                # sections가 문자열인 경우 JSON 파싱
                if isinstance(sections, str):
                    try:
                        sections = json.loads(sections)
                    except json.JSONDecodeError as e:
                        logging.error(f"Failed to parse sections for {table} ID {row[id_column]}: {e}")
                        continue
                # sections가 리스트인지 확인
                if not isinstance(sections, list):
                    logging.error(f"Sections is not a list for {table} ID {row[id_column]}: {sections}")
                    continue
                updated = False
                for i, section in enumerate(sections):
                    if not isinstance(section, dict):
                        logging.error(f"Invalid section format at index {i} for {table} ID {row[id_column]}: {section}")
                        continue
                    if section.get("type") == "image" and section.get("content", "").startswith("http"):
                        filename = f"image_{row[id_column]}_{i}.png"
                        new_path = await download_image(section["content"], filename)
                        if new_path:
                            sections[i]["content"] = new_path
                            updated = True
                if updated:
                    # sections를 JSON 문자열로 변환 후 JSONB로 캐스팅
                    await conn.execute(
                        f"UPDATE {table} SET sections = $1::jsonb WHERE {id_column} = $2",
                        json.dumps(sections), row[id_column]
                    )
                    logging.info(f"Updated {table} with ID {row[id_column]}")
                else:
                    logging.info(f"No valid images to update for {table} ID {row[id_column]}")
        await conn.close()
        logging.info("Database connection closed")
    except Exception as e:
        logging.error(f"Database error: {e}")

if __name__ == "__main__":
    import asyncio
    if os.name == "nt":  # Windows
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(migrate_images())