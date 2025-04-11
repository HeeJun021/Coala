# ✅ 최적화된 코딩 테스트 라우터
import random, json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session, aliased
from app.database import get_db
from typing import Optional
from sqlalchemy import func
from datetime import datetime
from app.models.coding_tests import (
    CodingTests,
    CodingTestSubmissions,
    CodingTestCases,
    CodingTestConstraints,
    CorrectSubmissionStats,
)
from app.models.user import User
from app.routers.coding_test_submission import update_correct_stats
from app.schemas.coding_tests import CodingTestSubmissionCreate
from app.services.coding_test_case_service import get_testcases
from app.services.code_executor import run_code_against_testcases

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
    stats_alias = aliased(CorrectSubmissionStats)

    # 기본 쿼리 + 정답률 조인
    query = (
        db.query(CodingTests, stats_alias.correct_rate)
        .outerjoin(stats_alias, CodingTests.test_id == stats_alias.test_id)
    )

    if search:
        query = query.filter(CodingTests.title.ilike(f"%{search}%"))

    if level and level.isdigit():
        query = query.filter(CodingTests.difficulty == int(level))

    if category:
        query = query.filter(CodingTests.category == category)

    if sort == "asc":
        query = query.order_by(stats_alias.correct_rate.asc().nullsfirst())
    elif sort == "desc":
        query = query.order_by(stats_alias.correct_rate.desc().nullslast())

    total = query.count()
    rows = query.offset((page - 1) * 20).limit(20).all()

    problems = []
    for problem, correct_rate in rows:
        solved = False
        if user_id and user_id.isdigit():
            submission = (
                db.query(CodingTestSubmissions)
                .filter(
                    CodingTestSubmissions.user_id == int(user_id),
                    CodingTestSubmissions.test_id == problem.test_id,
                    CodingTestSubmissions.is_correct == True,
                ).first()
            )
            solved = bool(submission)

        if status == "solved" and not solved:
            continue
        if status == "unsolved" and solved:
            continue

        problems.append({
            "id": problem.test_id,
            "title": problem.title,
            "level": problem.difficulty,
            "category": problem.category,
            "created_at": problem.created_at,
            "solved": solved,
            "correct_rate": float(correct_rate) if correct_rate is not None else 0.0,
        })

    category_stats = (
        db.query(CodingTests.category, func.count(CodingTests.test_id))
        .group_by(CodingTests.category).all()
    )
    category_counts = [
        {"category": c[0], "count": c[1]} for c in category_stats if c[0] is not None
    ]

    return {
        "total": total,
        "page": page,
        "problems": problems,
        "category_counts": category_counts,
    }


@router.get("/{test_id}")
def get_coding_test_detail(
    test_id: int, db: Session = Depends(get_db), user_id: int = None
):
    problem = db.query(CodingTests).filter(CodingTests.test_id == test_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="해당 문제를 찾을 수 없습니다.")

    stats = db.query(CorrectSubmissionStats).filter(CorrectSubmissionStats.test_id == test_id).first()
    correct_rate = float(stats.correct_rate) if stats and stats.correct_rate is not None else 0.0

    solved = False
    if user_id:
        submission = (
            db.query(CodingTestSubmissions)
            .filter(
                CodingTestSubmissions.user_id == user_id,
                CodingTestSubmissions.test_id == test_id,
                CodingTestSubmissions.is_correct == True,
            ).first()
        )
        solved = bool(submission)

    testcases = db.query(CodingTestCases).filter(CodingTestCases.test_id == test_id, CodingTestCases.is_hidden == False).all()
    constraints = db.query(CodingTestConstraints).filter(CodingTestConstraints.test_id == test_id).all()

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
            {"input": tc.example_input, "output": tc.example_output, "type": tc.test_type}
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


@router.post("/submit")
async def submit_coding_test(
    submission: CodingTestSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    problem = db.query(CodingTests).filter(CodingTests.test_id == submission.test_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    testcases = get_testcases(db, submission.test_id, type="all")
    results = await run_code_against_testcases(submission.code, submission.language, testcases)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    is_correct = passed_count == total_count
    
    # ✅ 자동 제목 지정
    # 🔍 title 자동 생성 처리
    submission_count = db.query(CodingTestSubmissions).filter(
        CodingTestSubmissions.user_id == submission.user_id,
        CodingTestSubmissions.test_id == submission.test_id
    ).count()

    title = submission.title or f"제출 {submission_count + 1}"


    new_submission = CodingTestSubmissions(
        user_id=submission.user_id,
        test_id=submission.test_id,
        title=title,
        code=submission.code,
        language=submission.language,
        is_correct=is_correct,
        passed_test_cases=passed_count,
        total_test_cases=total_count,
        submitted_at=datetime.utcnow(),
        execution_result=results
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    background_tasks.add_task(update_correct_stats, db=db, test_id=submission.test_id, is_correct=is_correct)

    return {
        "result": "success",
        "is_correct": is_correct,
        "submission_id": new_submission.ct_submission_id,
        "passed_test_cases": passed_count,
        "total_test_cases": total_count,
        "all_cases": results,
    }


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
        result.append({
            "submission_id": sub.ct_submission_id,
            "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M"),
            "language": sub.language,
            "is_correct": sub.is_correct,
            "memory": f"{len(sub.code.encode('utf-8'))}B",
            "passed_test_cases": sub.passed_test_cases,
            "total_test_cases": sub.total_test_cases,
            "title": sub.title if sub.title else "",  # ✅ 여기 수정!
            "code": sub.code,
            "execution_result": sub.execution_result or [],  # ✅ 바로 사용 가능
        })

    return {"submissions": result}

# 다른 사람의 정답 제출 목록 조회
@router.get("/solutions/{test_id}")
def get_solved_submissions_for_test(
    test_id: int,
    db: Session = Depends(get_db),
):
    submissions = (
        db.query(CodingTestSubmissions, User.nickname, User.profile_image_url)
        .join(User, User.user_id == CodingTestSubmissions.user_id)
        .filter(
            CodingTestSubmissions.test_id == test_id,
            CodingTestSubmissions.is_correct == True,
        )
        .order_by(CodingTestSubmissions.submitted_at.desc())
        .all()
    )

    result = []
    for sub, nickname, profile_image_url in submissions:
        result.append({
            "user_id": sub.user_id,
            "nickname": nickname,
            "profile_image_url": profile_image_url,
            "code": sub.code,
            "language": sub.language,
            "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M"),
        })

    return result