from app.database import Base, engine


# 사용되지 않는 import 문제 해결
def initialize_models():
    pass  # 필요 시 초기화 로직 추가 가능


# 테이블 생성
Base.metadata.create_all(engine, checkfirst=True)
