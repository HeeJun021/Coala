import os, requests
from typing import Any, Dict, List, Optional

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_API_VERSION = os.getenv("NOTION_API_VERSION", "2022-06-28")

class NotionClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Notion-Version": NOTION_API_VERSION,
            "Content-Type": "application/json",
        }

    # ---- internal ----
    def _get(self, path: str, params: Optional[Dict[str, Any]] = None):
        r = requests.get(f"{NOTION_API_BASE}{path}", headers=self.headers, params=params, timeout=20)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, json: Dict[str, Any]):
        r = requests.post(f"{NOTION_API_BASE}{path}", headers=self.headers, json=json, timeout=30)
        r.raise_for_status()
        return r.json()

    # ---- search ----
    def search(self, query: str = "", filter_object: Optional[str] = None, start_cursor: Optional[str] = None, page_size: int = 20):
        payload: Dict[str, Any] = {"query": query, "page_size": page_size}
        if filter_object in ("page", "database"):
            payload["filter"] = {"property": "object", "value": filter_object}
        if start_cursor:
            payload["start_cursor"] = start_cursor
        return self._post("/search", payload)

    # ---- pages ----
    def retrieve_page(self, page_id: str):
        return self._get(f"/pages/{page_id}")

    def create_page(self, parent: Dict[str, Any], properties: Dict[str, Any], children: Optional[List[Dict[str, Any]]] = None):
        payload: Dict[str, Any] = {"parent": parent, "properties": properties}
        if children:
            payload["children"] = children
        return self._post("/pages", payload)

    def update_page_properties(self, page_id: str, properties: Dict[str, Any]):
        return self._post(f"/pages/{page_id}", {"properties": properties})

    # ---- blocks ----
    def list_children(self, block_id: str, start_cursor: Optional[str] = None, page_size: int = 100):
        params: Dict[str, Any] = {"page_size": page_size}
        if start_cursor:
            params["start_cursor"] = start_cursor
        return self._get(f"/blocks/{block_id}/children", params)

    def append_children(self, block_id: str, children: List[Dict[str, Any]]):
        return self._post(f"/blocks/{block_id}/children", {"children": children})

    # ---- databases ----
    def retrieve_database(self, database_id: str):
        return self._get(f"/databases/{database_id}")

    def query_database(self, database_id: str, filter: Optional[Dict[str, Any]] = None, sorts: Optional[List[Dict[str, Any]]] = None, start_cursor: Optional[str] = None, page_size: int = 25):
        payload: Dict[str, Any] = {"page_size": page_size}
        if filter: payload["filter"] = filter
        if sorts: payload["sorts"] = sorts
        if start_cursor: payload["start_cursor"] = start_cursor
        return self._post(f"/databases/{database_id}/query", payload)
