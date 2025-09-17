import os
import requests
from typing import Any, Dict, List, Optional

NOTION_API_BASE = "https://api.notion.com/v1"
# .env에서 설정된 버전을 우선 사용 (예: "2022-06-28" 또는 더 최신 지원 일자)
NOTION_API_VERSION = os.getenv("NOTION_API_VERSION", "2022-06-28")


class NotionClient:
    """
    Thin HTTP wrapper for the Notion REST API with a compatibility layer that mimics the official SDK shape.

    You can use either:
      - wrapper style: client.retrieve_page(...), client.list_children(...), client.append_children(...)
      - SDK-like style: client.pages.retrieve(...), client.blocks.children.list(...), client.blocks.children.append(...)
    """

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Notion-Version": NOTION_API_VERSION,
            "Content-Type": "application/json",
        }

        # --- Official SDK compatible adapters ---
        self.pages = _Pages(self)               # .retrieve(page_id=...)
        self.blocks = _Blocks(self)             # .children.list(...), .children.append(...)

    # -------------------------
    # Internal HTTP helpers
    # -------------------------
    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        r = requests.get(f"{NOTION_API_BASE}{path}", headers=self.headers, params=params, timeout=20)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, json: Dict[str, Any]) -> Dict[str, Any]:
        r = requests.post(f"{NOTION_API_BASE}{path}", headers=self.headers, json=json, timeout=30)
        r.raise_for_status()
        return r.json()

    # -------------------------
    # Search
    # -------------------------
    def search(
        self,
        query: str = "",
        filter_object: Optional[str] = None,   # "page" | "database"
        start_cursor: Optional[str] = None,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"query": query, "page_size": page_size}
        if filter_object in ("page", "database"):
            payload["filter"] = {"property": "object", "value": filter_object}
        if start_cursor:
            payload["start_cursor"] = start_cursor
        return self._post("/search", payload)

    # -------------------------
    # Pages (wrapper style)
    # -------------------------
    def retrieve_page(self, page_id: str) -> Dict[str, Any]:
        return self._get(f"/pages/{page_id}")

    def create_page(
        self,
        parent: Dict[str, Any],
        properties: Dict[str, Any],
        children: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"parent": parent, "properties": properties}
        if children:
            payload["children"] = children
        return self._post("/pages", payload)

    def update_page_properties(self, page_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        return self._post(f"/pages/{page_id}", {"properties": properties})

    # -------------------------
    # Blocks (wrapper style)
    # -------------------------
    def list_children(
        self,
        block_id: str,
        start_cursor: Optional[str] = None,
        page_size: int = 100,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page_size": page_size}
        if start_cursor:
            params["start_cursor"] = start_cursor
        return self._get(f"/blocks/{block_id}/children", params)

    def append_children(self, block_id: str, children: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self._post(f"/blocks/{block_id}/children", {"children": children})

    # -------------------------
    # Databases (wrapper style)
    # -------------------------
    def retrieve_database(self, database_id: str) -> Dict[str, Any]:
        return self._get(f"/databases/{database_id}")

    def query_database(
        self,
        database_id: str,
        filter: Optional[Dict[str, Any]] = None,
        sorts: Optional[List[Dict[str, Any]]] = None,
        start_cursor: Optional[str] = None,
        page_size: int = 25,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"page_size": page_size}
        if filter:
            payload["filter"] = filter
        if sorts:
            payload["sorts"] = sorts
        if start_cursor:
            payload["start_cursor"] = start_cursor
        return self._post(f"/databases/{database_id}/query", payload)


# ============================================================
# SDK-compatible adapters
# ============================================================

class _Pages:
    """
    Mimics official SDK: client.pages.retrieve(page_id=...)
    """
    def __init__(self, client: NotionClient):
        self._c = client

    def retrieve(self, page_id: str, **_: Any) -> Dict[str, Any]:
        # Ignore extra kwargs for compatibility
        return self._c.retrieve_page(page_id)


class _BlocksChildren:
    """
    Mimics official SDK: client.blocks.children.list(...), client.blocks.children.append(...)
    """
    def __init__(self, client: NotionClient):
        self._c = client

    def list(
        self,
        block_id: str,
        start_cursor: Optional[str] = None,
        page_size: int = 100,
        **_: Any,
    ) -> Dict[str, Any]:
        # Ignore extra kwargs for compatibility
        return self._c.list_children(block_id=block_id, start_cursor=start_cursor, page_size=page_size)

    def append(self, block_id: str, children: List[Dict[str, Any]], **_: Any) -> Dict[str, Any]:
        return self._c.append_children(block_id=block_id, children=children)


class _Blocks:
    """
    Mimics official SDK: client.blocks.children.[list|append]
    """
    def __init__(self, client: NotionClient):
        self.children = _BlocksChildren(client)
