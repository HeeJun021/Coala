from typing import List, Dict, Any, Optional
from app.services.notion_client import NotionClient

def fetch_all_children(notion: NotionClient, block_id: str) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    start: Optional[str] = None
    while True:
        resp = notion.list_children(block_id, start_cursor=start, page_size=100)
        for b in resp.get("results", []):
            if b.get("has_children"):
                b["children"] = fetch_all_children(notion, b["id"])
            results.append(b)
        if not resp.get("has_more"):
            break
        start = resp.get("next_cursor")
    return results
