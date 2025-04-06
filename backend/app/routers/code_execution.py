from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.code_executor import execute_code
from app.services.coding_test_case_service import get_testcases

router = APIRouter(prefix="/code-exec", tags=["Code Execution"])


class CodeRequest(BaseModel):
    code: str
    language: str


# 샌드박스로 test_id 문제 실행 후 결과 출력(basic + boundary만)
@router.post("/run/{test_id}")
async def run_code_with_testcases(
    test_id: int, request: CodeRequest, db: Session = Depends(get_db)
):
    testcases = get_testcases(db, test_id, type="public")
    results = []

    for case in testcases:
        result = await execute_code(
            request.code, request.language, input_data=case["input"]
        )
        results.append(
            {
                "input": case["input"],
                "expected_output": case["expected_output"],
                "actual_output": result["stdout"].strip(),
                "passed": result["stdout"].strip() == case["expected_output"].strip(),
                "stderr": result["stderr"],
            }
        )

    return {"results": results}
