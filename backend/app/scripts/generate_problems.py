# import openai
# import json
# import os
# import time
# from sqlalchemy.orm import Session
# from dotenv import load_dotenv
# from app.database import SessionLocal
# from app.models.coding_tests import CodingTests, CodingTestCases, CodingTestConstraints
# from openai import OpenAI
# from openai._exceptions import RateLimitError, APIError

# #   .env 파일 로드 (환경 변수 자동 불러오기)
# load_dotenv()

# #   OpenAI API 키 가져오기
# api_key = os.getenv("OPENAI_API_KEY")

# #   OpenAI 클라이언트 초기화
# client = OpenAI(api_key=api_key)

# def generate_problems(n=5, max_retries=3):
#     """
#     OpenAI API를 이용하여 한 번에 n개의 코딩 테스트 문제를 생성하는 함수.
#     - `max_retries` → 최대 재시도 횟수 (기본값: 3)
#     """
#     prompt = f"""
#     다음 조건을 만족하는 코딩 테스트 문제 {n}개를 JSON 형식으로 생성해줘:
#     [{{
#         "title": "문제 제목",
#         "description": "문제 설명",
#         "difficulty": 난이도 (0~5),
#         "category": "문제 유형 (예: 자료구조, DFS, 정렬 등)",
#         "input_format": "입력 형식 설명",
#         "output_format": "출력 형식 설명",
#         "test_cases": [
#             {{"type": "basic", "input": "예제 입력1", "output": "예제 출력1"}},
#             {{"type": "basic", "input": "예제 입력2", "output": "예제 출력2"}},
#             {{"type": "boundary", "input": "경계값 입력1", "output": "경계값 출력1"}},
#             {{"type": "hidden", "input": "숨겨진 입력1", "output": "숨겨진 출력1"}}
#         ],
#         "constraints": [
#             {{"variable": "N", "min": 1, "max": 1000, "text": "1 ≤ N ≤ 1000"}}
#         ]
#     }}]
#     """

#     retries = 0
#     while retries < max_retries:
#         try:
#             response = client.chat.completions.create(
#                 model="gpt-4o",
#                 messages=[
#                     {"role": "system", "content": "너는 코딩 테스트 문제를 생성하는 AI야."},
#                     {"role": "user", "content": prompt}
#                 ],
#                 temperature=0.7
#             )
#             problems = json.loads(response.choices[0].message.content)
#             return problems if isinstance(problems, list) else [problems]  # 리스트 형태로 변환
#         except RateLimitError:
#             retries += 1
#             print(f"API 사용량 초과! {retries}/{max_retries}회 재시도... (1분 대기)")
#             time.sleep(60)  # 1분 대기 후 재시도
#         except APIError as e:
#             print(f"OpenAI API 에러 발생: {e}")
#             return []
    
#     print("최대 재시도 횟수를 초과했습니다. API 할당량이 모두 소진된 것 같습니다.")
#     return []  # 더 이상 시도하지 않고 빈 리스트 반환

# def save_problem_to_db(db: Session, problem_data):
#     """
#     AI가 생성한 문제를 데이터베이스에 저장하는 함수
#     """
#     new_test = CodingTests(
#         title=problem_data["title"],
#         description=problem_data["description"],
#         difficulty=problem_data["difficulty"],
#         category=problem_data["category"],
#         input_format=problem_data["input_format"],
#         output_format=problem_data["output_format"],
#         time_limit=2000,
#         memory_limit=512
#     )
#     db.add(new_test)
#     db.commit()
#     db.refresh(new_test)

#     # 테스트 케이스 저장
#     for case in problem_data["test_cases"]:
#         db.add(CodingTestCases(
#             test_id=new_test.test_id,
#             test_type=case["type"],
#             example_input=case["input"],
#             example_output=case["output"],
#             is_hidden=(case["type"] == "hidden")
#         ))

#     # 제약 조건 저장
#     for constraint in problem_data["constraints"]:
#         db.add(CodingTestConstraints(
#             test_id=new_test.test_id,
#             variable_name=constraint["variable"],
#             min_value=constraint["min"],
#             max_value=constraint["max"],
#             constraint_text=constraint["text"]
#         ))

#     db.commit()

# def generate_and_save_problems(n=10):
#     """
#     n개의 코딩 테스트 문제를 생성하고 데이터베이스에 저장하는 함수 (기본값: 10개)
#     """
#     db = SessionLocal()
#     try:
#         batch_size = 5  # 한 번 요청에서 5문제씩 생성
#         for i in range(0, n, batch_size):
#             num_to_generate = min(batch_size, n - i)  # 마지막 요청 시 남은 개수만큼 생성
#             print(f"🔹 문제 {i+1} ~ {i+num_to_generate} 생성 중...")
            
#             problems = generate_problems(num_to_generate)
#             if not problems:
#                 print("문제 생성에 실패하여 중단합니다.")
#                 break  # 문제가 생성되지 않으면 중단
            
#             for problem in problems:
#                 save_problem_to_db(db, problem)

#             time.sleep(20)  # OpenAI API 과부하 방지를 위해 20초 대기
#         print(f"{n}개의 문제 생성 완료!")
#     finally:
#         db.close()

# if __name__ == "__main__":
#     generate_and_save_problems(10)  # 10개 문제만 생성
