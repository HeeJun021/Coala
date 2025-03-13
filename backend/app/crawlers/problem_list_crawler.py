from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from app.services.problem_service import save_coding_tests  # DB 저장 함수 가져오기

# 크롬 옵션 설정
chrome_options = Options()
chrome_options.add_argument("--headless")  # 백그라운드 실행
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# 자동으로 ChromeDriver 설치 및 실행
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

# 크롤링할 URL
url = "https://school.programmers.co.kr/learn/challenges?order=recent"
driver.get(url)
driver.implicitly_wait(5)  # 페이지 로드 대기

# 문제 리스트 크롤링
problems = []
problem_elements = driver.find_elements("css selector", "td.title a")
level_elements = driver.find_elements("css selector", "td.level span")  # 난이도 크롤링

for problem, level in zip(problem_elements, level_elements):
    title = problem.text.strip()
    link = problem.get_attribute("href")
    problem_id = link.split("/")[-1]  # URL에서 문제 ID 추출
    level_text = level.text.strip() if level else "알 수 없음"

    problems.append({
        "id": int(problem_id),
        "title": title,
        "level": int(level_text.replace("Lv. ", "")) if "Lv." in level_text else None,
        "link": link
    })

# 크롤링한 데이터 DB 저장
save_coding_tests(problems)

# 브라우저 종료
driver.quit()
