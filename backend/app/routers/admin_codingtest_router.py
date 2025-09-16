# app/routers/admin_codingtest_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.admin_codingtest_service import (
    get_all_coding_tests,
    get_coding_test,
    create_coding_test,
    update_coding_test,
    delete_coding_test,
    upsert_starter_code,
    get_correct_stats,
    add_test_case,
    update_test_case,
    delete_test_case,
    add_constraint,
    update_constraint,
    delete_constraint,
    get_all_submissions_by_test,
)
from app.schemas.admin_codingtest_schema import (
    CodingTestCreate,
    CodingTestUpdate,
    StarterCodeCreate,
    CodingTestResponse,
    StarterCodeResponse,
    CodingTestStatsResponse,
    CodingTestCaseCreate,
    CodingTestCaseUpdate,
    CodingTestConstraintCreate,
    CodingTestConstraintUpdate,
)

router = APIRouter(prefix="/admin/codingtest", tags=["Admin Coding Test"])


# ✅ 문제 목록 조회
@router.get("/list", response_model=List[CodingTestResponse])
def get_all_tests(db: Session = Depends(get_db)):
    return get_all_coding_tests(db)


# ✅ 문제 단일 조회
@router.get("/{test_id}", response_model=CodingTestResponse)
def get_test_detail(test_id: int, db: Session = Depends(get_db)):
    return get_coding_test(db, test_id)


# ✅ 문제 생성
@router.post("/create", response_model=CodingTestResponse)
def create_test(payload: CodingTestCreate, db: Session = Depends(get_db)):
    return create_coding_test(db, payload)


# ✅ 문제 수정
@router.put("/{test_id}/update", response_model=CodingTestResponse)
def update_test(test_id: int, payload: CodingTestUpdate, db: Session = Depends(get_db)):
    return update_coding_test(db, test_id, payload)


# ✅ 문제 삭제
@router.delete("/{test_id}/delete")
def delete_test(test_id: int, db: Session = Depends(get_db)):
    delete_coding_test(db, test_id)
    return {"message": f"문제 {test_id}가 삭제되었습니다."}


# ✅ 스타터 코드 추가/수정
@router.post("/{test_id}/starter-code", response_model=StarterCodeResponse)
def set_starter_code(test_id: int, payload: StarterCodeCreate, db: Session = Depends(get_db)):
    return upsert_starter_code(db, test_id, payload)


# ✅ 정답률 통계 조회
@router.get("/{test_id}/stats", response_model=CodingTestStatsResponse)
def get_stats(test_id: int, db: Session = Depends(get_db)):
    return get_correct_stats(db, test_id)


# ✅ 테스트케이스 추가
@router.post("/{test_id}/testcases")
def add_testcase(test_id: int, payload: CodingTestCaseCreate, db: Session = Depends(get_db)):
    return add_test_case(db, test_id, payload)


# ✅ 테스트케이스 수정
@router.put("/testcases/{testcase_id}")
def update_testcase(testcase_id: int, payload: CodingTestCaseUpdate, db: Session = Depends(get_db)):
    return update_test_case(db, testcase_id, payload)


# ✅ 테스트케이스 삭제
@router.delete("/testcases/{testcase_id}")
def delete_testcase(testcase_id: int, db: Session = Depends(get_db)):
    return delete_test_case(db, testcase_id)


# ✅ 제약조건 추가
@router.post("/{test_id}/constraints")
def add_constraint_route(test_id: int, payload: CodingTestConstraintCreate, db: Session = Depends(get_db)):
    return add_constraint(db, test_id, payload)


# ✅ 제약조건 수정
@router.put("/constraints/{constraint_id}")
def update_constraint_route(constraint_id: int, payload: CodingTestConstraintUpdate, db: Session = Depends(get_db)):
    return update_constraint(db, constraint_id, payload)


# ✅ 제약조건 삭제
@router.delete("/constraints/{constraint_id}")
def delete_constraint_route(constraint_id: int, db: Session = Depends(get_db)):
    return delete_constraint(db, constraint_id)


# ✅ 특정 문제 제출 내역 조회 (관리자용)
@router.get("/{test_id}/submissions")
def get_test_submissions(test_id: int, db: Session = Depends(get_db)):
    return get_all_submissions_by_test(db, test_id)
