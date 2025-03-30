import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from typing import Optional
from sqlalchemy import func
from datetime import datetime
from fastapi import Query

from app.models.coding_tests import (
    CodingTests,
    CodingTestSubmissions,
    CodingTestCases,
    CodingTestConstraints,
    CorrectSubmissionStats,
    CodingTestSubmissions,
)
from app.schemas.coding_tests import CodingTestSubmissionCreate


router = APIRouter(prefix="/codingtest", tags=["Coding Test"])


@router.get("/list")
def get_coding_test_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    search: str = "",
    level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort: str = "desc",  # ✅ 유지
    user_id: Optional[str] = Query(None),
):
    query = db.query(CodingTests)

    # 검색
    if search:
        query = query.filter(CodingTests.title.ilike(f"%{search}%"))

    # 난이도 필터
    if level and level.isdigit():
        query = query.filter(CodingTests.difficulty == int(level))

    # 카테고리 필터
    if category:
        query = query.filter(CodingTests.category == category)

    # 상태 및 solved 여부 처리
    raw_problems = query.all()

    # 🔥 solved 처리
    result = []
    for p in raw_problems:
        solved = False
        if user_id and user_id.isdigit():
            submission = (
                db.query(CodingTestSubmissions)
                .filter(
                    CodingTestSubmissions.user_id == int(user_id),
                    CodingTestSubmissions.test_id == p.test_id,
                    CodingTestSubmissions.is_correct == True,
                )
                .first()
            )
            solved = bool(submission)

        if status == "solved" and not solved:
            continue
        if status == "unsolved" and solved:
            continue

        result.append(
            {
                "id": p.test_id,
                "title": p.title,
                "level": p.difficulty,
                "category": p.category,
                "created_at": p.created_at,
                "solved": solved if user_id else False,
                "correct_rate": 0,  # 추후 계산 예정
            }
        )

    # 🔥 고정 랜덤 순서
    random.seed(42)  # 원하는 seed값, seed 고정하면 항상 같은 순서
    random.shuffle(result)

    # 페이징
    total = len(result)
    start = (page - 1) * 20
    end = start + 20
    paginated_result = result[start:end]

    # 카테고리 통계
    category_stats = (
        db.query(CodingTests.category, func.count(CodingTests.test_id))
        .group_by(CodingTests.category)
        .all()
    )

    category_counts = [
        {"category": c[0], "count": c[1]} for c in category_stats if c[0] is not None
    ]

    return {
        "total": total,
        "page": page,
        "problems": paginated_result,
        "category_counts": category_counts,
    }


@router.get("/{test_id}")
def get_coding_test_detail(
    test_id: int, db: Session = Depends(get_db), user_id: int = None  # 선택적으로 받기
):
    problem = db.query(CodingTests).filter(CodingTests.test_id == test_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="해당 문제를 찾을 수 없습니다.")

    # 정답률 조회
    stats = (
        db.query(CorrectSubmissionStats)
        .filter(CorrectSubmissionStats.test_id == test_id)
        .first()
    )
    correct_rate = stats.correct_rate if stats else 0.0

    # 풀었는지 여부
    solved = False
    if user_id:
        submission = (
            db.query(CodingTestSubmissions)
            .filter(
                CodingTestSubmissions.user_id == user_id,
                CodingTestSubmissions.test_id == test_id,
                CodingTestSubmissions.is_correct == True,
            )
            .first()
        )
        solved = bool(submission)

    # 테스트케이스
    testcases = (
        db.query(CodingTestCases)
        .filter(CodingTestCases.test_id == test_id, CodingTestCases.is_hidden == False)
        .all()
    )

    # 제약조건
    constraints = (
        db.query(CodingTestConstraints)
        .filter(CodingTestConstraints.test_id == test_id)
        .all()
    )

    return {
        "id": problem.test_id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "category": problem.category,
        "input_format": problem.input_format,
        "output_format": problem.output_format,
        "time_limit": problem.time_limit,
        "memory_limit": problem.memory_limit,
        "created_at": problem.created_at,
        "correct_rate": correct_rate,
        "solved": solved,
        "testcases": [
            {
                "input": tc.example_input,
                "output": tc.example_output,
                "type": tc.test_type,
            }
            for tc in testcases
        ],
        "constraints": [
            {
                "variable": c.variable_name,
                "min": c.min_value,
                "max": c.max_value,
                "description": c.constraint_text,
            }
            for c in constraints
        ],
    }


# 코딩테스트 제출
@router.post("/submit")
def submit_coding_test(
    submission: CodingTestSubmissionCreate, db: Session = Depends(get_db)
):
    # 1. 문제 존재 확인
    problem = (
        db.query(CodingTests).filter(CodingTests.test_id == submission.test_id).first()
    )
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    # 2. 정답 확인 (임시로 '출력' 문자열 비교로 처리 → 추후 채점 서버와 연동 가능)
    # 여기선 간단하게 '정답 코드'는 DB에 없으니 항상 False 처리
    is_correct = False  # 임시 처리

    # 3. 제출 기록 저장
    new_submission = CodingTestSubmissions(
        user_id=submission.user_id,
        test_id=submission.test_id,
        code=submission.code,
        language=submission.language,  # ✅ 반드시 추가해야 함
        is_correct=is_correct,
        submitted_at=datetime.utcnow(),
    )
    db.add(new_submission)
    db.commit()

    return {
        "result": "success",
        "is_correct": is_correct,
        "language": submission.language,
    }


# 제출 내역 조회
@router.get("/submissions/{test_id}")
def get_coding_test_submissions(
    test_id: int, user_id: int = Query(...), db: Session = Depends(get_db)
):
    submissions = (
        db.query(CodingTestSubmissions)
        .filter(
            CodingTestSubmissions.test_id == test_id,
            CodingTestSubmissions.user_id == user_id,
        )
        .order_by(CodingTestSubmissions.submitted_at.desc())
        .all()
    )

    result = []
    for sub in submissions:
        result.append(
            {
                "submission_id": sub.ct_submission_id,
                "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M"),
                "language": (
                    sub.language if hasattr(sub, "language") else "python"
                ),  # 언어 칼럼 없으면 임시 처리
                "is_correct": sub.is_correct,
                "memory": f"{len(sub.code.encode('utf-8'))}B",  # 코드 크기 기준
                "passed_test_cases": sub.passed_test_cases,
                "total_test_cases": sub.total_test_cases,
                "code": sub.code,
            }
        )

    return {"submissions": result}
