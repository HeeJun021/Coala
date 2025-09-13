import re, copy
from typing import Any, Dict, List

_PLACEHOLDER = re.compile(r"\{\{([\w\.\-]+)\}\}")

def _get(ctx: Dict[str, Any], path: str) -> str:
    cur = ctx
    for k in path.split("."):
        if not isinstance(cur, dict) or k not in cur: return ""
        cur = cur[k]
    return "" if cur is None else str(cur)

def _replace_text(text: str, ctx: Dict[str, Any]) -> str:
    return _PLACEHOLDER.sub(lambda m: _get(ctx, m.group(1)), text)

def fill_blocks(blocks: List[Dict[str, Any]], ctx: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for b in blocks:
        nb = copy.deepcopy(b)
        t = nb.get("type")
        if not t:
            out.append(nb); continue

        def process_rich_text():
            rt = nb[t].get("rich_text", [])
            for span in rt:
                if span.get("type") == "text":
                    span["text"]["content"] = _replace_text(span["text"].get("content",""), ctx)

        if t in ("paragraph","heading_1","heading_2","heading_3","quote","callout","to_do","bulleted_list_item","numbered_list_item","toggle"):
            process_rich_text()
        elif t == "code":
            rt = nb[t].get("rich_text", [])
            for span in rt:
                if span.get("type") == "text":
                    span["text"]["content"] = _replace_text(span["text"].get("content",""), ctx)

        if nb.get("has_children") and "children" in nb:
            nb["children"] = fill_blocks(nb["children"], ctx)

        out.append(nb)
    return out
