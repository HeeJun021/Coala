from sqlalchemy.orm import Session
from app.models.coding_tests_models import CodingTestCases

def get_testcases(db: Session, test_id: int, type: str):
    query = db.query(CodingTestCases).filter(CodingTestCases.test_id == test_id)

    if type == "public":
        query = query.filter(CodingTestCases.test_type.in_(["basic", "boundary"]))

    cases = query.all()

    return [
        {
            "input": case.example_input,
            "expected_output": case.example_output
        } for case in cases
    ]
