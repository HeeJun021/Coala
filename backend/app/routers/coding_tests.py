from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from typing import Optional
from app.models.coding_tests import (
    CodingTests,
    CodingTestSubmissions,
    CodingTestCases,
    CodingTestConstraints,
    CorrectSubmissionStats,
)


router = APIRouter(prefix="/codingtest", tags=["Coding Test"])

@router.get("/list")
def get_coding_test_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    search: str = "",
    level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort: str = "desc",
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

    # 정렬
    if sort == "asc":
        query = query.order_by(CodingTests.difficulty.asc())
    else:
        query = query.order_by(CodingTests.difficulty.desc())

    # 상태 및 solved 여부 처리
    raw_problems = query.all()  # 일단 다 가져오기

    result = []
    for p in raw_problems:
        solved = False
        if user_id and user_id.isdigit():
            submission = db.query(CodingTestSubmissions).filter(
                CodingTestSubmissions.user_id == int(user_id),
                CodingTestSubmissions.test_id == p.test_id,
                CodingTestSubmissions.is_correct == True
            ).first()
            solved = bool(submission)

        # 상태 필터
        if status == "solved" and not solved:
            continue
        if status == "unsolved" and solved:
            continue

        result.append({
            "id": p.test_id,
            "title": p.title,
            "level": p.difficulty,
            "category": p.category,
            "created_at": p.created_at,
            "solved": solved if user_id else False,
            "correct_rate": 0,  # 추후 추가 예정
        })

    # 페이징
    total = len(result)
    start = (page - 1) * 20
    end = start + 20
    paginated_result = result[start:end]

    return {
        "total": total,
        "page": page,
        "problems": paginated_result
    }



@router.get("/{test_id}")
def get_coding_test_detail(
    test_id: int,
    db: Session = Depends(get_db),
    user_id: int = None  # 선택적으로 받기
):
    problem = db.query(CodingTests).filter(CodingTests.test_id == test_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="해당 문제를 찾을 수 없습니다.")

    # 정답률 조회
    stats = db.query(CorrectSubmissionStats).filter(
        CorrectSubmissionStats.test_id == test_id
    ).first()
    correct_rate = stats.correct_rate if stats else 0.0

    # 풀었는지 여부
    solved = False
    if user_id:
        submission = db.query(CodingTestSubmissions).filter(
            CodingTestSubmissions.user_id == user_id,
            CodingTestSubmissions.test_id == test_id,
            CodingTestSubmissions.is_correct == True
        ).first()
        solved = bool(submission)

    # 테스트케이스
    testcases = db.query(CodingTestCases).filter(
        CodingTestCases.test_id == test_id,
        CodingTestCases.is_hidden == False
    ).all()

    # 제약조건
    constraints = db.query(CodingTestConstraints).filter(
        CodingTestConstraints.test_id == test_id
    ).all()

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
                "type": tc.test_type
            } for tc in testcases
        ],
        "constraints": [
            {
                "variable": c.variable_name,
                "min": c.min_value,
                "max": c.max_value,
                "description": c.constraint_text
            } for c in constraints
        ]
    }