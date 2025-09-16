# app/services/ai_doc_rewriter.py
from __future__ import annotations
from typing import Dict, Any, List, Tuple, Optional
import re, copy, os, json, time, logging

# ===== Env & defaults =====
def _parse_model_list(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    out = []
    for tok in str(raw).split(","):
        tok = tok.split("#", 1)[0].strip()  # 인라인 주석/공백 제거
        if not tok:
            continue
        if re.match(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$", tok):
            out.append(tok)
    return out

PUBLISH_MODEL = (os.getenv("OPENAI_PUBLISH_MODEL") or "gpt-5").split("#", 1)[0].strip()
PUBLISH_FALLBACKS = _parse_model_list(os.getenv("OPENAI_PUBLISH_FALLBACKS"))
USE_RESPONSES = os.getenv("OPENAI_USE_RESPONSES") == "1"

# 기본: 기존 본문 "교체"(중복 방지). 1이면 append.
APPEND_SECTION_UPDATES = os.getenv("APPEND_SECTION_UPDATES", "0") == "1"

OPENAI_TIMEOUT = float(os.getenv("OPENAI_TIMEOUT_SEC") or 25)

# ========== OpenAI client ==========
_OPENAI_CLIENT = None
def _get_openai():
    global _OPENAI_CLIENT
    if _OPENAI_CLIENT is not None:
        return _OPENAI_CLIENT
    try:
        from openai import OpenAI  # openai>=1.x
    except Exception:
        logging.error("openai package not found (pip install openai>=1.x)")
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logging.error("OPENAI_API_KEY missing")
        return None
    org = os.getenv("OPENAI_ORG") or None
    _OPENAI_CLIENT = OpenAI(api_key=api_key, organization=org)
    return _OPENAI_CLIENT

# ========== Utils ==========
BRACKET_MARKER = re.compile(r"\[([^\[\]]+?)\]")  # [지원자 이름], [짧은 소개 문구] 등

def _rt_to_text(rt_list: List[dict]) -> str:
    if not isinstance(rt_list, list): return ""
    out = []
    for rt in rt_list:
        if isinstance(rt, dict) and rt.get("type") == "text":
            out.append(rt.get("text", {}).get("content", ""))
    return "".join(out)

def _text_to_rt(s: str, annotations: Optional[dict] = None) -> List[dict]:
    node: dict = {"type": "text", "text": {"content": s or ""}}
    if annotations and isinstance(annotations, dict):
        node["annotations"] = annotations
    return [node]

def _find_all_markers_in_block(block: dict) -> List[str]:
    texts: List[str] = []
    t = block.get("type")
    if not t: return []
    payload = block.get(t, {})
    if isinstance(payload.get("rich_text"), list):
        texts.append(_rt_to_text(payload["rich_text"]))
    if isinstance(payload.get("caption"), list):
        texts.append(_rt_to_text(payload["caption"]))
    if t == "table_row":
        cells = payload.get("cells", [])
        for row in cells:
            for cell_rt in (row or []):
                texts.append(_rt_to_text(cell_rt))
    found = []
    for s in texts:
        for m in BRACKET_MARKER.findall(s or ""):
            found.append(m.strip())
    return found

def extract_outline_and_markers(blocks: List[dict]) -> Tuple[List[Dict[str,str]], List[str]]:
    """outline: [{level:'h1|h2|h3', text:'...'}], markers: ['지원자 이름', ...]"""
    outline: List[Dict[str, str]] = []
    markers: List[str] = []
    for b in (blocks or []):
        t = b.get("type")
        if t in {"heading_1","heading_2","heading_3"}:
            lvl = "h1" if t=="heading_1" else ("h2" if t=="heading_2" else "h3")
            txt = _rt_to_text(b[t].get("rich_text", []))
            outline.append({"level": lvl, "text": txt})
        markers.extend(_find_all_markers_in_block(b))
        if "children" in b and isinstance(b["children"], list):
            child_outline, child_markers = extract_outline_and_markers(b["children"])
            outline.extend(child_outline)
            markers.extend(child_markers)
    seen = set(); uniq = []
    for m in markers:
        if m not in seen:
            seen.add(m); uniq.append(m)
    return outline, uniq

# ===== 섹션 본문 추출 (헤딩 아래 텍스트 컨텍스트 제공) =====
def extract_sections(blocks: List[dict], max_chars_per_section: int = 800) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    i = 0
    while i < len(blocks or []):
        b = blocks[i]
        t = b.get("type")
        if t in {"heading_1","heading_2","heading_3"}:
            lvl = "h1" if t=="heading_1" else ("h2" if t=="heading_2" else "h3")
            heading_text = _rt_to_text(b[t].get("rich_text", []))
            body_parts: List[str] = []
            j = i + 1
            while j < len(blocks):
                t2 = blocks[j].get("type")
                if t2 in {"heading_1","heading_2","heading_3"}:
                    break
                if t2 in {"paragraph","bulleted_list_item","numbered_list_item","quote"}:
                    payload = blocks[j][t2]
                    txt = _rt_to_text(payload.get("rich_text", []))
                    if txt:
                        if t2 in {"bulleted_list_item","numbered_list_item"}:
                            body_parts.append(f"- {txt}")
                        else:
                            body_parts.append(txt)
                j += 1
            body_text = "\n".join(body_parts)[:max_chars_per_section]
            out.append({"heading": heading_text, "level": lvl, "body_text": body_text})
            i = j
        else:
            i += 1
    return out

# ===== 마커 사전채움(prefill): 한국어 마커명을 DB 키로 매핑 =====
def _norm(s: str) -> str:
    return re.sub(r"\s+", "", (s or "")).lower()

_MARKER_TO_KV = {
    # 사용자
    "지원자이름": "user_name", "이름": "user_name", "성명": "user_name", "닉네임": "user_name",
    "이메일": "user_email",
    # 프로젝트
    "프로젝트이름": "project_name", "프로젝트명": "project_name", "제목": "project_name",
    "프로젝트설명": "project_description", "프로젝트개요": "project_description", "개요": "project_description",
    "주제": "topic", "topic": "topic",
    "기술스택": "tech_stack", "techstack": "tech_stack", "스택": "tech_stack",
    "프로젝트상태": "status", "진행상태": "status",
    "시작일": "start_date", "프로젝트시작일": "start_date",
    "종료일": "end_date", "프로젝트종료일": "end_date",
    "참여자": "members", "팀원": "members",
    "리더": "leaders", "담당자": "leaders",
    "작업요약": "tasks_summary", "핵심작업": "tasks_summary", "tasks요약": "tasks_summary",
}

def _prefill_from_kv(markers: List[str], base_kv: Dict[str, Any]) -> Dict[str, str]:
    mv: Dict[str, str] = {}
    for m in markers or []:
        key = _MARKER_TO_KV.get(_norm(m))
        if not key:
            continue
        val = base_kv.get(key)
        if isinstance(val, list):
            val = ", ".join(map(str, val))
        if val is None:
            continue
        s = str(val).strip()
        if s:
            mv[m] = s
    return mv

def _ai_preferred_marker(marker: str) -> bool:
    """소개/요약/문구 계열은 AI가 작성하도록 허용"""
    n = _norm(marker)
    return any(tok in n for tok in ["소개", "요약", "한줄", "문구", "slogan", "summary", "ai"])

# ===== JSON parsing helper =====
_JSON_SNIPPET = re.compile(r"\{.*\}", re.DOTALL)
def _parse_json_loose(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        pass
    m = _JSON_SNIPPET.search(text or "")
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return {}
    return {}

# ===== OpenAI call helpers (responses 우선, gpt-5는 temperature 미전송) =====
def _call_chat(client, model: str, system: str, user: str):
    kwargs = {
        "model": model,
        "timeout": OPENAI_TIMEOUT,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    if not str(model).lower().startswith("gpt-5"):
        kwargs["temperature"] = 0.3
    return client.chat.completions.create(**kwargs)

def _call_resp(client, model: str, system: str, user: str):
    return client.responses.create(
        model=model,
        input=[{"role":"system","content":system},{"role":"user","content":user}],
        timeout=OPENAI_TIMEOUT,
    )

def _chat_completion(client, model: str, system: str, user: str) -> Tuple[Optional[str], Optional[str]]:
    try:
        if USE_RESPONSES:
            try:
                r = _call_resp(client, model, system, user)
                text = getattr(r, "output_text", None)
                if text: return text.strip(), None
            except Exception as e1:
                body1 = getattr(getattr(e1, "response", None), "text", None) or str(e1)
                # responses 실패 → chat로 1회 스위치
                try:
                    r2 = _call_chat(client, model, system, user)
                    text2 = r2.choices[0].message.content if r2 and r2.choices else None
                    if text2: return text2.strip(), None
                except Exception as e2:
                    body2 = getattr(getattr(e2, "response", None), "text", None) or str(e2)
                    logging.warning(f"OpenAI call failed for model={model} (resp→chat): {body1} / {body2}")
                    return None, body2
        else:
            try:
                r = _call_chat(client, model, system, user)
                text = r.choices[0].message.content if r and r.choices else None
                if text: return text.strip(), None
            except Exception as e1:
                body1 = getattr(getattr(e1, "response", None), "text", None) or str(e1)
                # chat 실패 → responses로 1회 스위치
                try:
                    r2 = _call_resp(client, model, system, user)
                    text2 = getattr(r2, "output_text", None)
                    if text2: return text2.strip(), None
                except Exception as e2:
                    body2 = getattr(getattr(e2, "response", None), "text", None) or str(e2)
                    logging.warning(f"OpenAI call failed for model={model} (chat→resp): {body1} / {body2}")
                    return None, body2
        return None, "Empty completion"
    except Exception as e:
        body = getattr(getattr(e, "response", None), "text", None) or str(e)
        logging.warning(f"OpenAI call failed for model={model}: {body}")
        return None, body

def propose_edits_with_openai(
    *, outline: List[Dict[str,str]], markers: List[str], base_kv: Dict[str,Any],
    ai_prompt: Optional[str], sections: List[Dict[str,str]], prefilled: Dict[str, str],
) -> Dict[str, Any]:
    """
    기대 JSON:
    {
      "marker_values": { "지원자 이름": "홍길동", "짧은 소개 문구": "..." },
      "section_updates": [
        { "heading_contains": "소개", "paragraphs": ["문단1","문단2"] },
        ...
      ]
    }
    """
    client = _get_openai()
    if not client:
        return {"marker_values": {}, "section_updates": [], "ai_error": "OpenAI client not initialized", "ai_model_used": None}

    brief = {
        "project_name": base_kv.get("project_name"),
        "status": base_kv.get("status"),
        "topic": base_kv.get("topic"),
        "tech_stack": base_kv.get("tech_stack"),
        "project_description": (base_kv.get("project_description") or "")[:1000],
        "tasks_summary": (base_kv.get("tasks_summary") or "")[:2000],
        "members": base_kv.get("members"),
        "leaders": base_kv.get("leaders"),
        "user_name": base_kv.get("user_name"),
        "user_email": base_kv.get("user_email"),
    }

    system = (
        "You are a precise content editor for Notion resume pages. "
        "Given the page structure and current section bodies, produce JSON patches to fill bracket markers and rewrite section paragraphs based on the provided database brief. "
        "Return ONLY a JSON object with keys marker_values and section_updates. No markdown."
    )
    user = (
        "다음 정보를 기반으로 노션 템플릿을 채우세요.\n"
        "- outline: 헤딩 수준과 텍스트\n"
        "- markers: 대괄호 마커 목록(예: [지원자 이름])\n"
        "- sections: 각 헤딩 아래 현재 본문 텍스트(문단/리스트 포함)\n"
        "- brief: DB에서 가져온 프로젝트/사용자 요약\n"
        "- prefilled_marker_values: 이미 DB로 채워진 마커값(이 값은 가급적 유지)\n"
        "- ai_prompt: 사용자의 추가 지시사항\n\n"
        "요구사항:\n"
        "1) marker_values: 모든 마커를 채우되, prefilled에 값이 있으면 그대로 유지하고, 비어있는 마커만 채우세요.\n"
        "   - 특히 '소개/요약/한줄/문구/summary/slogan' 계열은 자연스러운 한두 문장으로 생성해도 됩니다.\n"
        "   - 빈 문자열을 반환하지 마세요.\n"
        "2) section_updates: 적절한 헤딩(heading_contains가 포함되는 가장 가까운 헤딩)을 골라 paragraphs(문장 1~3개)로 본문을 재작성.\n"
        "   - brief의 사실만 활용하고, 과장/추측/민감정보 금지.\n"
        "   - 문체는 간결한 포트폴리오 톤.\n\n"
        f"outline: {json.dumps(outline, ensure_ascii=False)}\n"
        f"markers: {json.dumps(markers, ensure_ascii=False)}\n"
        f"sections: {json.dumps(sections, ensure_ascii=False)}\n"
        f"brief: {json.dumps(brief, ensure_ascii=False)}\n"
        f"prefilled_marker_values: {json.dumps(prefilled, ensure_ascii=False)}\n"
        f"ai_prompt: {ai_prompt or ''}\n\n"
        '반환 JSON 예: {"marker_values":{"지원자 이름":"홍길동"}, "section_updates":[{"heading_contains":"소개","paragraphs":["문단1","- 불릿형 문장"]}]}'
    )

    models_to_try = [PUBLISH_MODEL] + [m for m in PUBLISH_FALLBACKS if m != PUBLISH_MODEL]
    last_err = None
    for model in models_to_try:
        text, err = _chat_completion(client, model, system, user)
        if err:
            last_err = f"[{model}] {err}"
            time.sleep(0.3)
            continue
        data = _parse_json_loose(text)
        mv = data.get("marker_values") or {}
        su = data.get("section_updates") or []
        if not isinstance(mv, dict): mv = {}
        if not isinstance(su, list): su = []
        return {"marker_values": mv, "section_updates": su, "ai_model_used": model}
    return {"marker_values": {}, "section_updates": [], "ai_error": last_err or "unknown_error", "ai_model_used": None}

# ===== Marker replacement (스타일 보존, 미채움시 [마커] 유지) =====
def _replace_markers_in_rt(rt_list: List[dict], marker_values: Dict[str, str]) -> List[dict]:
    if not isinstance(rt_list, list) or not rt_list:
        return rt_list

    runs: List[Tuple[str, dict]] = []
    for rt in rt_list:
        if isinstance(rt, dict) and rt.get("type") == "text":
            text = rt.get("text", {}).get("content", "") or ""
            ann = copy.deepcopy(rt.get("annotations", {})) if isinstance(rt.get("annotations"), dict) else {}
            runs.append((text, ann))
        else:
            return rt_list

    full = "".join(t for t, _ in runs)
    if not full:
        return rt_list

    matches = list(BRACKET_MARKER.finditer(full))
    if not matches:
        return rt_list

    boundaries = []
    acc = 0
    for i, (t, _) in enumerate(runs):
        boundaries.append((acc, acc + len(t), i))
        acc += len(t)

    def locate(pos: int) -> Tuple[int, int]:
        for s, e, idx in boundaries:
            if s <= pos <= e:
                return idx, pos - s
        return len(runs)-1, max(0, len(runs[-1][0]))

    out: List[dict] = []
    cursor = 0
    for m in matches:
        s, e = m.span()
        key = m.group(1).strip()
        repl_val = marker_values.get(key)
        repl_text = str(repl_val).strip() if (repl_val is not None) else ""

        # left segment
        if cursor < s:
            left_pos = cursor
            while left_pos < s:
                run_idx, off = locate(left_pos)
                run_text, run_ann = runs[run_idx]
                take = min(len(run_text) - off, s - left_pos)
                if take > 0:
                    piece = run_text[off:off+take]
                    out.append({"type":"text","text":{"content":piece},"annotations":run_ann})
                left_pos += take

        # replacement segment
        rep_run_idx, _ = locate(s)
        inherit_ann = runs[rep_run_idx][1] if runs else {}
        if not repl_text:
            # 값이 비면 [마커]를 그대로 유지
            out.append({"type":"text","text":{"content":f"[{key}]"},"annotations":inherit_ann})
        else:
            out.append({"type":"text","text":{"content":repl_text},"annotations":inherit_ann})

        cursor = e

    # tail
    if cursor < len(full):
        tail_pos = cursor
        while tail_pos < len(full):
            run_idx, off = locate(tail_pos)
            run_text, run_ann = runs[run_idx]
            take = min(len(run_text) - off, len(full) - tail_pos)
            if take > 0:
                piece = run_text[off:off+take]
                out.append({"type":"text","text":{"content":piece},"annotations":run_ann})
            tail_pos += take

    return out

def _apply_marker_replacements(blocks: List[dict], marker_values: Dict[str, str]) -> List[dict]:
    res = []
    for b in (blocks or []):
        nb = copy.deepcopy(b)
        t = nb.get("type")
        if not t:
            res.append(nb); continue
        payload = nb.get(t, {})
        if isinstance(payload.get("rich_text"), list):
            payload["rich_text"] = _replace_markers_in_rt(payload["rich_text"], marker_values)
        if isinstance(payload.get("caption"), list):
            payload["caption"] = _replace_markers_in_rt(payload["caption"], marker_values)
        if t == "table_row":
            cells = payload.get("cells", [])
            new_cells = []
            for row in cells:
                new_row = []
                for cell_rt in (row or []):
                    new_row.append(_replace_markers_in_rt(cell_rt, marker_values))
                new_cells.append(new_row)
            payload["cells"] = new_cells
        if "children" in nb and isinstance(nb["children"], list):
            nb["children"] = _apply_marker_replacements(nb["children"], marker_values)
        res.append(nb)
    return res

# ===== Section updates (replace by default) =====
_LIST_TYPES = {"bulleted_list_item","numbered_list_item"}
_REPLACEABLE_TYPES = {"paragraph","quote"} | _LIST_TYPES

def _find_heading_indices(blocks: List[dict], contains: str) -> List[int]:
    idxs = []
    key = (contains or "").strip()
    if not key: return idxs
    for i, b in enumerate(blocks or []):
        t = b.get("type")
        if t in {"heading_1","heading_2","heading_3"}:
            text = _rt_to_text(b[t].get("rich_text", []))
            if key in (text or ""):
                idxs.append(i)
    return idxs

def _clear_following_body(blocks: List[dict], start: int) -> int:
    i = start + 1
    if APPEND_SECTION_UPDATES:
        return i
    while i < len(blocks):
        t = blocks[i].get("type")
        if t in _REPLACEABLE_TYPES:
            del blocks[i]
            continue
        break
    return i

def _inject_paragraphs_after(blocks: List[dict], at_index: int, paragraphs: List[str]) -> None:
    insert_at = _clear_following_body(blocks, at_index)
    for p in reversed(paragraphs or []):
        text = p or ""
        if text.lstrip().startswith("- "):
            content = text.lstrip()[2:]
            blocks.insert(insert_at, {"type":"bulleted_list_item","bulleted_list_item":{"rich_text":_text_to_rt(content)}})
        else:
            blocks.insert(insert_at, {"type":"paragraph","paragraph":{"rich_text":_text_to_rt(text)}})

def _apply_section_updates(blocks: List[dict], section_updates: List[Dict[str,Any]]) -> List[dict]:
    nb = copy.deepcopy(blocks or [])
    for upd in (section_updates or []):
        heading_key = str(upd.get("heading_contains") or "").strip()
        paras = upd.get("paragraphs") or []
        if not heading_key or not isinstance(paras, list): continue
        idxs = _find_heading_indices(nb, heading_key)
        for idx in idxs:
            _inject_paragraphs_after(nb, idx, paras)
    return nb

# ========== Main entry ==========
def rewrite_doc_with_ai(
    template_blocks: List[dict],
    base_kv: Dict[str, Any],
    ai_prompt: Optional[str] = None,
) -> Tuple[List[dict], Dict[str,Any]]:
    """
    반환: (patched_blocks, meta)
      meta = {
        "ai_used": bool,
        "ai_prompt_len": int,
        "missing_keys": [ ... ],
        "marker_values": {...},
        "ai_error": Optional[str],
        "ai_model_used": Optional[str],
      }
    """
    blocks = copy.deepcopy(template_blocks or [])
    outline, markers = extract_outline_and_markers(blocks)
    sections = extract_sections(blocks)

    # 0) DB 기반 사전 채움
    prefilled = _prefill_from_kv(markers, base_kv)

    # 1) OpenAI 제안
    edits = propose_edits_with_openai(
        outline=outline, markers=markers, base_kv=base_kv,
        ai_prompt=ai_prompt, sections=sections, prefilled=prefilled
    )
    ai_marker_values = edits.get("marker_values") or {}
    section_updates = edits.get("section_updates") or []
    ai_error = edits.get("ai_error")
    ai_model_used = edits.get("ai_model_used")

    # 2) 최종 마커 결합: prefilled 우선, 단 소개/요약 계열은 AI 허용
    final_mv: Dict[str, str] = dict(prefilled)
    for k, v in ai_marker_values.items():
        if (k not in final_mv) or _ai_preferred_marker(k):
            if v is not None and str(v).strip():
                final_mv[k] = str(v).strip()

    # 3) 마커 치환(스타일 보존, 미채움시 [마커] 그대로)
    after_markers = _apply_marker_replacements(blocks, final_mv)

    # 4) 섹션 업데이트 (본문 교체/append 정책)
    patched = _apply_section_updates(after_markers, section_updates)

    # 5) 누락키: 여전히 값이 비어있는 마커
    missing_keys = [m for m in (markers or []) if not str(final_mv.get(m, "")).strip()]

    meta = {
        "ai_used": bool(os.getenv("OPENAI_API_KEY")) and (bool(final_mv) or bool(section_updates)),
        "ai_prompt_len": len(ai_prompt or ""),
        "missing_keys": missing_keys,
        "marker_values": final_mv,
        "ai_error": ai_error,
        "ai_model_used": ai_model_used,
    }
    if ai_error:
        logging.warning(f"AI edit fallback/err: {ai_error}")
    return patched, meta
