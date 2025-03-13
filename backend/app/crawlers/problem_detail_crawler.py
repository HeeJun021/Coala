import time
import requests
import re
from bs4 import BeautifulSoup
from app.database import get_db
from app.models.coding_tests import CodingTests, CodingTestExamples
from app.services.problem_service import update_problem_details

BASE_URL = "https://school.programmers.co.kr/learn/courses/30/lessons/"

import time
import requests
import re
from bs4 import BeautifulSoup
from app.database import get_db
from app.models.coding_tests import CodingTests, CodingTestExamples
from app.services.problem_service import update_problem_details

BASE_URL = "https://school.programmers.co.kr/learn/courses/30/lessons/"

def fetch_problem_details(problem_id):
    """ 프로그래머스 문제 상세 페이지 크롤링 """
    url = f"{BASE_URL}{problem_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"❌ 문제 {problem_id} 크롤링 실패 (HTTP {response.status_code})")
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # ✅ 문제 설명 크롤링
    description = "\n".join([p.text.strip() for p in soup.select(".markdown p")])

    # ✅ 입력 형식 & 출력 형식 크롤링
    input_format = output_format = ""
    format_sections = soup.select(".markdown h5, .markdown p")

    for i, section in enumerate(format_sections):
        section_text = section.text.strip()

        # ✅ "입력 형식" 찾기
        if section_text.startswith("입력 형식"):
            input_format = format_sections[i + 1].text.strip() if i + 1 < len(format_sections) else ""

        # ✅ "출력 형식" 찾기
        if section_text.startswith("출력 형식"):
            output_format = format_sections[i + 1].text.strip() if i + 1 < len(format_sections) else ""

    # ✅ 잘못된 값 필터링
    invalid_values = ["출력 #1", "출력 #2", "제한사항", "", "출력 예제"]
    if input_format in invalid_values:
        input_format = "입력 형식이 제공되지 않음"
    if output_format in invalid_values:
        output_format = "출력 형식이 제공되지 않음"

    print(f"✅ 입력 형식: {input_format}")
    print(f"✅ 출력 형식: {output_format}")

    # ✅ 실행 시간 제한 및 메모리 제한 크롤링
    time_limit = None
    memory_limit = None
    constraints_list = soup.select(".markdown ul li")
    
    for constraint in constraints_list:
        text = constraint.text.strip()
        if "초" in text:  # ✅ 실행 시간 제한 크롤링
            match = re.search(r'(\d+)초', text)
            if match:
                time_limit = int(match.group(1))
        
        if "MB" in text:  # ✅ 메모리 제한 크롤링
            match = re.search(r'(\d+)MB', text)
            if match:
                memory_limit = int(match.group(1))

    # ✅ 제한 사항 (JSON 형태로 저장)
    constraints_data = {}
    for constraint in constraints_list:
        parts = re.split(r'([<>≤≥])', constraint.text)  # 부등호 기준으로 분리
        key = parts[0].strip()
        value = "".join(parts[1:]).strip() if len(parts) > 1 else ""
        constraints_data[key] = value

    # ✅ 테스트 케이스 구성 안내
    test_cases_info = []
    tables = soup.select("table")

    for table in tables:
        rows = table.find_all("tr")
        for row in rows[1:]:  # 첫 번째 행(헤더) 제외
            cols = row.find_all("td")
            if len(cols) >= 2:
                test_cases_info.append({
                    "group": cols[0].text.strip(),
                    "score": cols[1].text.strip() if len(cols) == 3 else None,
                    "description": cols[-1].text.strip()
                })

    # ✅ 입출력 예제 크롤링
    examples = []
    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 2:
                examples.append({
                    "example_input": cols[0].text.strip(),
                    "example_output": cols[1].text.strip(),
                    "example_explanation": cols[2].text.strip() if len(cols) == 3 else "설명이 제공되지 않음"
                })

    return {
        "description": description,
        "input_format": input_format,
        "output_format": output_format,
        "time_limit": time_limit,  # ✅ 실행 시간 제한 추가
        "memory_limit": memory_limit,  # ✅ 메모리 제한 추가
        "constraints": constraints_data,
        "test_cases_info": test_cases_info,
        "examples": examples
    }



def crawl_and_update_problems():
    """ DB에 저장된 문제 리스트를 가져와 상세 정보를 크롤링 & 업데이트 """
    db = next(get_db())  
    problems = db.query(CodingTests).filter(CodingTests.description == None).all()
    
    for problem in problems:
        print(f"🔍 문제 {problem.source_id} 상세 정보 크롤링 중...")
        details = fetch_problem_details(problem.source_id)
        if details:
            update_problem_details(problem.source_id, details, db)
        time.sleep(1)


if __name__ == "__main__":
    crawl_and_update_problems()
