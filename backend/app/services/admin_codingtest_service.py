# admin_codingtest_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.coding_tests import (
    CodingTests,
    CodingTestCases,
    CodingTestConstraints,
    problemstartercode,
    CorrectSubmissionStats,
    CodingTestSubmissions,
)
from app.models.user import User
from app.schemas.admin_codingtest_schema import *

# 문제 전체 목록 조회
def get_all_coding_tests(db: Session):
    return db.query(CodingTests).order_by(CodingTests.created_at.desc()).all()

# 문제 단일 조회
def get_coding_test(db: Session, test_id: int):
    test = db.query(CodingTests).filter(CodingTests.test_id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
    return test

# 문제 생성
def create_coding_test(db: Session, test_data: CodingTestCreate):
    new_test = CodingTests(**test_data.dict())
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    return new_test

# 문제 수정
def update_coding_test(db: Session, test_id: int, test_data: CodingTestUpdate):
    test = get_coding_test(db, test_id)
    for key, value in test_data.dict(exclude_unset=True).items():
        setattr(test, key, value)
    db.commit()
    return test

# 문제 삭제
def delete_coding_test(db: Session, test_id: int):
    test = get_coding_test(db, test_id)
    db.delete(test)
    db.commit()

# 테스트케이스 추가
def add_test_case(db: Session, test_id: int, case_data: CodingTestCaseCreate):
    new_case = CodingTestCases(test_id=test_id, **case_data.dict())
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

# 테스트케이스 수정
def update_test_case(db: Session, test_case_id: int, case_data: CodingTestCaseUpdate):
    case = db.query(CodingTestCases).filter(CodingTestCases.test_case_id == test_case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="테스트케이스를 찾을 수 없습니다.")
    for key, value in case_data.dict(exclude_unset=True).items():
        setattr(case, key, value)
    db.commit()
    return case

# 테스트케이스 삭제
def delete_test_case(db: Session, test_case_id: int):
    case = db.query(CodingTestCases).filter(CodingTestCases.test_case_id == test_case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="테스트케이스를 찾을 수 없습니다.")
    db.delete(case)
    db.commit()

# 제약조건 추가
def add_constraint(db: Session, test_id: int, constraint_data: CodingTestConstraintCreate):
    new_constraint = CodingTestConstraints(test_id=test_id, **constraint_data.dict())
    db.add(new_constraint)
    db.commit()
    db.refresh(new_constraint)
    return new_constraint

# 제약조건 수정
def update_constraint(db: Session, constraint_id: int, constraint_data: CodingTestConstraintUpdate):
    constraint = db.query(CodingTestConstraints).filter(CodingTestConstraints.constraint_id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="제약조건을 찾을 수 없습니다.")
    for key, value in constraint_data.dict(exclude_unset=True).items():
        setattr(constraint, key, value)
    db.commit()
    return constraint

# 제약조건 삭제
def delete_constraint(db: Session, constraint_id: int):
    constraint = db.query(CodingTestConstraints).filter(CodingTestConstraints.constraint_id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="제약조건을 찾을 수 없습니다.")
    db.delete(constraint)
    db.commit()

# 스타터 코드 추가/수정 (upsert)
def upsert_starter_code(db: Session, test_id: int, data: StarterCodeCreate):
    existing = db.query(problemstartercode).filter(
        problemstartercode.test_id == test_id,
        problemstartercode.language == data.language
    ).first()
    if existing:
        existing.code = data.code
        db.commit()
        return existing
    else:
        new_code = problemstartercode(test_id=test_id, **data.dict())
        db.add(new_code)
        db.commit()
        db.refresh(new_code)
        return new_code

# 정답률 통계 조회
def get_correct_stats(db: Session, test_id: int):
    stats = db.query(CorrectSubmissionStats).filter(CorrectSubmissionStats.test_id == test_id).first()
    if not stats:
        return {"correct_rate": 0.0, "total_submissions": 0, "correct_submissions": 0}
    return {
        "correct_rate": stats.correct_rate,
        "total_submissions": stats.total_submissions,
        "correct_submissions": stats.correct_submissions
    }
    
# 전체 제출 목록 조회 (관리자용)
def get_all_submissions_by_test(db: Session, test_id: int):
    submissions = (
        db.query(CodingTestSubmissions, User.nickname)
        .join(User, User.user_id == CodingTestSubmissions.user_id)
        .filter(CodingTestSubmissions.test_id == test_id)
        .order_by(CodingTestSubmissions.submitted_at.desc())
        .all()
    )
    return [
        {
            "submission_id": sub.ct_submission_id,
            "user_id": sub.user_id,
            "nickname": nickname,
            "is_correct": sub.is_correct,
            "submitted_at": sub.submitted_at,
            "title": sub.title,
            "code": sub.code,
            "language": sub.language,
            "execution_result": sub.execution_result,
        }
        for sub, nickname in submissions
    ]
