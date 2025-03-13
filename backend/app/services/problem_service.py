import json  # JSON 변환을 위해 추가
from app.database import get_db
from app.models.coding_tests import CodingTests, CodingTestExamples, CodingTestConstraints, CodingTestTestCases

def save_coding_tests(problems):
    """문제 리스트를 DB에 저장"""
    db = next(get_db())
    for problem in problems:
        existing_problem = db.query(CodingTests).filter_by(source_id=problem["id"]).first()

        if existing_problem:
            print(f"⚠ 이미 존재하는 문제: {problem['title']} (ID: {problem['id']})")
            continue

        new_problem = CodingTests(
            source_id=problem["id"],
            title=problem["title"],
            level=problem["level"]
        )

        db.add(new_problem)
    
    db.commit()
    print("✅ 문제 리스트 저장 완료!")


def update_problem_details(source_id, details, db):
    """문제 상세 정보 업데이트"""
    problem = db.query(CodingTests).filter_by(source_id=source_id).first()
    if not problem:
        print(f"❌ 문제 {source_id} 찾을 수 없음")
        return

    # ✅ 문제 정보 업데이트
    problem.description = details.get("description", "")
    problem.input_format = details.get("input_format", "")
    problem.output_format = details.get("output_format", "")
    
    # ✅ 기본값 설정 (time_limit이 None이면 2, memory_limit이 None이면 256)
    problem.time_limit = details.get("time_limit") if details.get("time_limit") is not None else 2
    problem.memory_limit = details.get("memory_limit") if details.get("memory_limit") is not None else 256

    # ✅ 기존 데이터 삭제 후 새 데이터 삽입
    db.query(CodingTestConstraints).filter_by(source_id=source_id).delete()
    for constraint_text in details.get("constraints", []):  
        db.add(CodingTestConstraints(source_id=source_id, constraint_text=constraint_text))

    db.query(CodingTestTestCases).filter_by(source_id=source_id).delete()
    for test_case in details.get("test_cases_info", []):
        score_value = test_case.get("score", None)
        test_group_value = test_case.get("group", "")

        # ✅ 점수 필드가 리스트/딕셔너리라면 변환
        if isinstance(score_value, (list, dict)):
            score_value = None  # 변환할 방법이 없으면 NULL 처리
        
        # ✅ 너무 긴 문자열이면 20자로 제한
        elif isinstance(score_value, str) and len(score_value) > 20:
            score_value = score_value[:20]

        # ✅ test_group 필드 값 검증 (너무 길거나 리스트면 변환)
        if isinstance(test_group_value, (list, dict)):
            test_group_value = "Unknown"  # 리스트/딕셔너리라면 기본값 설정
        elif isinstance(test_group_value, str) and len(test_group_value) > 100:
            test_group_value = test_group_value[:100]  # 길이 제한

        db.add(CodingTestTestCases(
            source_id=source_id,
            test_group=test_group_value,
            score=score_value,
            description=test_case.get("description", "")
        ))

    db.query(CodingTestExamples).filter_by(source_id=source_id).delete()
    for example in details.get("examples", []):
        db.add(CodingTestExamples(
            source_id=source_id,
            example_input=example["example_input"],
            example_output=example["example_output"],
            example_explanation=example.get("example_explanation", None)
        ))

    db.commit()
    print(f"✅ 문제 {source_id} 상세 정보 업데이트 완료!")
