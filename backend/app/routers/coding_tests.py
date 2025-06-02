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
    CodingTestSolutionViews,
)
from app.schemas.eucalyptus_schema import RewardActionType
from app.models.user import User
from app.utils.auth import get_current_user_object
from app.routers.coding_test_submission import update_correct_stats
from app.schemas.coding_tests import CodingTestSubmissionCreate, SolutionViewRequest
from app.services.coding_test_case_service import get_testcases
from app.services.code_executor import run_code_against_testcases
from app.services.user import reward_user_by_action

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
    query = db.query(CodingTests, stats_alias.correct_rate).outerjoin(
        stats_alias, CodingTests.test_id == stats_alias.test_id
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
                )
                .first()
            )
            solved = bool(submission)

        if status == "solved" and not solved:
            continue
        if status == "unsolved" and solved:
            continue

        problems.append(
            {
                "id": problem.test_id,
                "title": problem.title,
                "level": problem.difficulty,
                "category": problem.category,
                "created_at": problem.created_at,
                "solved": solved,
                "correct_rate": (
                    float(correct_rate) if correct_rate is not None else 0.0
                ),
            }
        )

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

    stats = (
        db.query(CorrectSubmissionStats)
        .filter(CorrectSubmissionStats.test_id == test_id)
        .first()
    )
    correct_rate = (
        float(stats.correct_rate) if stats and stats.correct_rate is not None else 0.0
    )
    total_submissions = (
        stats.total_submissions if stats and stats.total_submissions is not None else 0
    )

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

    testcases = (
        db.query(CodingTestCases)
        .filter(CodingTestCases.test_id == test_id, CodingTestCases.is_hidden == False)
        .all()
    )
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
        "total_submissions": total_submissions,
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


# 제출
@router.post("/submit")
async def submit_coding_test(
    submission: CodingTestSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_object),
):
    problem = (
        db.query(CodingTests).filter(CodingTests.test_id == submission.test_id).first()
    )
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    testcases = get_testcases(db, submission.test_id, type="all")
    results = await run_code_against_testcases(
        submission.code, submission.language, testcases
    )
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    is_correct = passed_count == total_count

    submission_count = (
        db.query(CodingTestSubmissions)
        .filter(
            CodingTestSubmissions.user_id == submission.user_id,
            CodingTestSubmissions.test_id == submission.test_id,
        )
        .count()
    )

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
        execution_result=results,
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    # ✅ 정답일 경우 → 점수 및 유칼립투스 계산
    rating_diff = 0
    eucalyptus_reward = 0

    if is_correct:
        level_score_map = {1: 20, 2: 30, 3: 40, 4: 50, 5: 70}
        eucalyptus_map = {1: 2, 2: 3, 3: 5, 4: 7, 5: 10}
        base_score = level_score_map.get(problem.difficulty, 0)
        eucalyptus_base = eucalyptus_map.get(problem.difficulty, 0)

        is_first_correct = (
            not db.query(CodingTestSubmissions)
            .filter(
                CodingTestSubmissions.user_id == submission.user_id,
                CodingTestSubmissions.test_id == submission.test_id,
                CodingTestSubmissions.is_correct == True,
                CodingTestSubmissions.ct_submission_id
                != new_submission.ct_submission_id,
            )
            .first()
        )

        # ✅ 다른 사람 풀이 열람 여부 조회
        viewed_solution = (
            db.query(CodingTestSolutionViews)
            .filter_by(test_id=submission.test_id, user_id=submission.user_id)
            .first()
        )

        if is_first_correct and not viewed_solution:
            # 👉 레이팅 및 유칼립투스 지급
            rating_diff = base_score
            user.rating += rating_diff
            eucalyptus_reward = reward_user_by_action(
                user=user,
                action=RewardActionType.coding_test_passed,
                db=db,
                amount=eucalyptus_base,  # ✅ 난이도 기반 외부 주입
            )

        db.commit()
        db.refresh(user)

    # 📊 통계 비동기 업데이트
    background_tasks.add_task(
        update_correct_stats, db=db, test_id=submission.test_id, is_correct=is_correct
    )

    return {
        "result": "success",
        "is_correct": is_correct,
        "submission_id": new_submission.ct_submission_id,
        "passed_test_cases": passed_count,
        "total_test_cases": total_count,
        "all_cases": results,
        "rating_diff": rating_diff,
        "current_rating": user.rating,
        "eucalyptus_reward": eucalyptus_reward,
        "is_first_correct": is_correct and is_first_correct and not viewed_solution,
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
        result.append(
            {
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
            }
        )

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
        result.append(
            {
                "user_id": sub.user_id,
                "nickname": nickname,
                "profile_image_url": profile_image_url,
                "code": sub.code,
                "language": sub.language,
                "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M"),
            }
        )

    return result


@router.get("/submissions/user/{user_id}")
def get_all_coding_test_submissions_by_user(
    user_id: int, db: Session = Depends(get_db)
):
    submissions = (
        db.query(CodingTestSubmissions)
        .filter(CodingTestSubmissions.user_id == user_id)
        .order_by(CodingTestSubmissions.submitted_at.desc())
        .all()
    )

    result = []
    for sub in submissions:
        result.append(
            {
                "submission_id": sub.ct_submission_id,
                "test_id": sub.test_id,
                "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M"),
                "language": sub.language,
                "is_correct": sub.is_correct,
                "memory": f"{len(sub.code.encode('utf-8'))}B",
                "passed_test_cases": sub.passed_test_cases,
                "total_test_cases": sub.total_test_cases,
                "title": sub.title or "",
                "code": sub.code,
                "execution_result": sub.execution_result or [],
            }
        )

    return {"submissions": result}


@router.post("/solution-view")
def record_solution_view(
    req: SolutionViewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_object),
):
    existing = (
        db.query(CodingTestSolutionViews)
        .filter_by(test_id=req.test_id, user_id=current_user.user_id)
        .first()
    )

    if existing:
        return {"message": "이미 기록됨"}

    new_view = CodingTestSolutionViews(
        test_id=req.test_id, user_id=current_user.user_id
    )
    db.add(new_view)
    db.commit()
    return {"message": "기록 완료"}

# 문제를 풀었는지 안 풀었는지 확인하는 함수
@router.get("/{test_id}/has-solved")
def has_solved_coding_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    solved = (
        db.query(CodingTestSubmissions)
        .filter_by(test_id=test_id, user_id=current_user.user_id, is_correct=True)
        .first()
    )
    return {"hasSolved": bool(solved)}