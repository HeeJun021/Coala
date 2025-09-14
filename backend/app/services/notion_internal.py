import os
from app.services.notion_client import NotionClient

def get_internal_notion() -> NotionClient:
    token = os.getenv("NOTION_INTERNAL_TOKEN")
    if not token:
        raise RuntimeError("NOTION_INTERNAL_TOKEN is not set")
    return NotionClient(token)
