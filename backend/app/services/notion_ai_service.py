import os
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_PUBLISH_MODEL", "gpt-5")
TIMEOUT = int(os.getenv("OPENAI_TIMEOUT_SEC", "40"))

client = OpenAI(api_key=OPENAI_API_KEY)

def polish_with_ai(text: str, purpose: str = "") -> str:
    """
    사용자가 입력한 텍스트를 GPT-5로 다듬어 반환.
    - 자기소개: 간결하고 임팩트 있는 1~2문장
    - 경험/느낀점: 좀 더 길고 구체적인 3~5문장
    실패하면 원본 반환.
    """
    if not text:
        return ""

    try:
        if "자기소개" in purpose:
            prompt = (
                "다음 내용을 이력서/포트폴리오용 자기소개로 다듬어줘. "
                "간결하면서도 임팩트 있게 1~2문장으로 작성해. "
                "새로운 사실을 추가하지 말고, 사용자가 쓴 내용을 기반으로만 표현해.\n\n"
                f"{text}"
            )
        elif "경험" in purpose:
            prompt = (
                "다음 내용을 이력서/포트폴리오용 경험 서술로 다듬어줘. "
                "구체적이고 설득력 있게 3~5문장으로 풀어서 작성해. "
                "사용자가 입력한 경험을 기반으로만 확장하고, 불필요한 예시를 추가하지 마.\n\n"
                f"{text}"
            )
        else:
            prompt = (
                "다음 내용을 이력서/포트폴리오 용도로 자연스럽고 간결하게 다듬어줘. "
                "불필요한 예시는 추가하지 마.\n\n"
                f"{text}"
            )

        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "너는 전문 이력서/자기소개서 편집 어시스턴트야."},
                {"role": "user", "content": prompt},
            ],
            timeout=TIMEOUT,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        import logging
        logging.exception("AI polish 실패: %s", e)
        return text
