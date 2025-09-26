import os
import logging
from typing import Optional, Dict, Any
from openai import OpenAI

# 환경변수 기반 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_PUBLISH_MODEL", "gpt-5")
TIMEOUT = int(os.getenv("OPENAI_TIMEOUT_SEC", "40"))

# OpenAI 클라이언트 생성
client = OpenAI(api_key=OPENAI_API_KEY)


def polish_with_ai(
    text: str,
    purpose: str = "",
    project_info: Optional[Dict[str, Any]] = None
) -> str:
    """
    사용자가 입력한 텍스트를 GPT로 다듬어 반환.
    - 자기소개: 간결하고 임팩트 있는 1~2문장
    - 경험/느낀점: 구체적이고 설득력 있게 3~5문장
    - 일반: 간결하고 자연스러운 문장
    - project_info: 선택적으로 프로젝트/작업/경력 정보(dict)를 함께 전달
    실패하면 원본 반환
    """
    if not text:
        return ""

    try:
        # 목적별 프롬프트 구성
        if "자기소개" in purpose:
            prompt = (
                "다음 내용을 이력서/포트폴리오용 자기소개로 다듬어줘. "
                "간결하면서도 임팩트 있게 1~2문장으로 작성해. "
                "새로운 사실을 추가하지 말고, 사용자가 쓴 내용을 기반으로만 표현해.\n\n"
                f"{text}"
            )
        elif "경험" in purpose:
            # 🔹 경험 원문이 없을 때 project_info만으로 임시 원문 생성
            if not text and project_info:
                text = " / ".join(f"{k}: {v}" for k, v in project_info.items() if v)

            prompt = (
                "다음 경험을 이력서/포트폴리오용으로 정리해줘. "
                "구체적이고 설득력 있게 3~5문장으로 작성해. "
                "사용자가 직접 입력한 경험이 있으면 그것을 기반으로 하고, "
                "없다면 DB 기반 정보만으로 초안을 작성해. "
                "불필요한 예시는 추가하지 마.\n\n"
                f"{text}"
            )

        else:
            prompt = (
                "다음 내용을 이력서/포트폴리오 용도로 자연스럽고 간결하게 다듬어줘. "
                "불필요한 예시는 추가하지 마.\n\n"
                f"{text}"
            )

        # 🔹 선택적으로 프로젝트/작업/경력 정보 추가
        if project_info:
            prompt += "\n\n[참고 프로젝트/작업/경력 정보]\n"
            for k, v in project_info.items():
                prompt += f"- {k}: {v}\n"

        # OpenAI API 호출
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
        logging.exception("AI polish 실패: %s", e)
        return text


# 🔧 유틸 함수: DB 쿼리 결과를 project_info dict로 변환하는 예시
def build_project_info(project_row, members, tasks) -> Dict[str, Any]:
    """
    DB 쿼리 결과를 기반으로 AI prompt에 넘길 project_info 딕셔너리 생성
    - project_row: Projects 테이블 단일 row
    - members: [{nickname, roles, is_leader}, ...]
    - tasks: [{title, start_date, due_date, creator, collaborators}, ...]
    """
    info = {
        "프로젝트명": project_row.name,
        "설명": project_row.description,
        "주제": getattr(project_row, "topic", None),
        "기술스택": getattr(project_row, "tech_stack", None),
        "상태": "종료" if project_row.is_closed else "진행중",
        "팀원": ", ".join(
            f"{m['nickname']}({ '팀장' if m['is_leader'] else '팀원' })"
            for m in members
        ),
        "작업 수": len(tasks),
    }

    # 주요 작업 몇 개만 예시로 넣기
    if tasks:
        task_summaries = []
        for t in tasks[:3]:  # 최대 3개만
            task_summaries.append(
                f"{t['title']} ({t['creator']}, {t['start_date']}~{t['due_date']})"
            )
        info["주요 작업"] = "; ".join(task_summaries)

    return {k: v for k, v in info.items() if v}  # None 값 제거
