import os
import logging
from typing import Optional, Dict, Any, List
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_PUBLISH_MODEL", "gpt-4o")  # 기본값도 4o
TIMEOUT = int(os.getenv("OPENAI_TIMEOUT_SEC", "40"))
USE_RESPONSES = str(os.getenv("OPENAI_USE_RESPONSES", "1")).strip().lower() not in {"", "0", "false"}

client = OpenAI(api_key=OPENAI_API_KEY)

def _build_prompt(text: str, purpose: str, project_info: Optional[Dict[str, Any]]) -> str:
    if "자기소개" in purpose:
        prompt = (
            "다음 내용을 이력서/포트폴리오용 자기소개로 다듬어줘. "
            "간결하면서도 임팩트 있게 1~2문장으로 작성해. "
            "새로운 사실을 추가하지 말고, 사용자가 쓴 내용을 기반으로만 표현해.\n\n"
            f"{text}"
        )
    elif "경험" in purpose:
        prompt = (
            "다음 경험을 이력서/포트폴리오용으로 정리해줘. "
            "구체적이고 설득력 있게 3~5문장으로 작성해. "
            "불필요한 예시는 추가하지 마.\n\n"
            f"{text}"
        )
    else:
        prompt = (
            "다음 내용을 이력서/포트폴리오 용도로 자연스럽고 간결하게 다듬어줘. "
            "불필요한 예시는 추가하지 마.\n\n"
            f"{text}"
        )
    if project_info:
        prompt += "\n\n[참고 정보]\n"
        for k, v in project_info.items():
            prompt += f"- {k}: {v}\n"
    return prompt

def _messages_for_chat(prompt: str) -> List[Dict[str, str]]:
    return [
        {"role": "system", "content": "너는 전문 이력서/자기소개서 편집 어시스턴트야."},
        {"role": "user", "content": prompt},
    ]

def _input_for_responses(prompt: str):
    return [
        {
            "role": "system",
            "content": [
                {"type": "input_text", "text": "너는 전문 이력서/자기소개서 편집 어시스턴트야."}
            ],
        },
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": prompt}
            ],
        },
    ]


def _extract_from_responses(resp) -> Optional[str]:
    try:
        if hasattr(resp, "output_text") and resp.output_text:
            return resp.output_text.strip()
    except Exception:
        pass
    try:
        if hasattr(resp, "output") and isinstance(resp.output, list):
            parts = []
            for blk in resp.output:
                contents = getattr(blk, "content", None) or blk.get("content")
                if not contents: 
                    continue
                for item in contents:
                    if item.get("type") in {"output_text", "text"}:
                        parts.append(item.get("text", ""))
            text = "\n".join(p for p in parts if p).strip()
            if text:
                return text
    except Exception:
        pass
    return None

def polish_with_ai(
    text: str,
    purpose: str = "",
    project_info: Optional[Dict[str, Any]] = None,
    temperature: float = 0.6,
) -> str:
    if not text and not project_info:
        return ""
    prompt = _build_prompt(text or "", purpose, project_info)

    if USE_RESPONSES:
        try:
            resp = client.responses.create(
                model=MODEL,
                input=_input_for_responses(prompt),
                timeout=TIMEOUT,
            )
            out = _extract_from_responses(resp)
            if out:
                return out
        except Exception as e:
            logging.warning("Responses API 실패, Chat Completions로 폴백: %s", e)

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=_messages_for_chat(prompt),
            temperature=temperature,
            timeout=TIMEOUT,
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception as e:
        logging.exception("AI polish 실패: %s", e)
        return text or ""
