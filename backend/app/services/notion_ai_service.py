# app/services/notion_ai_service.py
from typing import Dict, Any, List

def render_with_ai(template_blocks: List[dict], kv: Dict[str, Any]) -> List[dict]:
    """
    1) 템플릿 JSON 블록을 순회
    2) {{placeholder}} 부분을 사용자 데이터/AI 가공 텍스트로 교체
    3) GPT-5 호출 (현재는 mock, 추후 OpenAI API 연동)
    """
    processed = []
    for blk in template_blocks:
        blk_str = str(blk)
        for k, v in kv.items():
            blk_str = blk_str.replace(f"{{{{{k}}}}}", str(v))
        processed.append(eval(blk_str))  # ⚠️ 안전하게 json.loads를 쓰는 게 더 좋음
    return processed
