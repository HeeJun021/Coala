from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base
from app.models import user, email_verification,study_materials,study_example, language  # ✅ 모든 모델 불러오기
from app.routers import languages, user, auth, social_auth,study_example,code_runner,study_materials, code_terminal,code_execution # 사용자 관련 라우터 가져오기
from app.schemas.user import UserUpdateSchema
from datetime import datetime
from sqlalchemy import text
from app.config import settings  # ✅ 설정 불러오기

from fastapi.middleware.cors import CORSMiddleware

# DB 초기화
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ✅ 프론트엔드 주소 허용
    allow_credentials=True,
    allow_methods=["*"],  # ✅ 모든 HTTP 메소드 허용 (POST, GET, OPTIONS 등)
    allow_headers=["*"],  # ✅ 모든 헤더 허용
)

# 라우터 등록
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(languages.router)
app.include_router(social_auth.router)  # ✅ 소셜 로그인 API 추가
app.include_router(study_example.router)
app.include_router(study_materials.router)
app.include_router(code_runner.router)
app.include_router(code_terminal.router)
app.include_router(code_execution.router, prefix="/code")

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    """서버 상태 확인"""
    return {"message": "FastAPI is running!"}
    
# ✅ 기존: 카테고리별 자료 조회
# @app.get("/api/materials/{category}")
# def get_materials_by_category(category: str):
#     query = "SELECT * FROM study_materials WHERE language_id = (" \
#         "SELECT language_id FROM languages WHERE language = %s)"

#     cur.execute(query, (category,))
#     results = cur.fetchall()
#     return results


# # ✅ 기존: 카테고리별 예제 조회
# @app.get("/api/examples/{category}")
# def get_examples_by_category(category: str):
#     query = "SELECT * FROM study_example WHERE language_id = ( " \
#         "SELECT language_id FROM languages WHERE language = %s)"
#     cur.execute(query, (category,))
#     results = cur.fetchall()
#     return results


# # 🚀 **새로 추가: 개별 자료 조회 API**
# @app.get("/api/materials/{language}/{id}")
# def get_study_material(language: str, id: int):
#     query = "SELECT * FROM study_materials WHERE material_id = %s"
#     cur.execute(query, (id,))
#     result = cur.fetchone()

#     if result:
#         return result
#     else:
#         raise HTTPException(status_code=404, detail="Material not found")


# # 🚀 **새로 추가: 개별 예제 조회 API**
# @app.get("/api/examples/{language}/{id}")
# def get_study_example(language: str, id: int):
#     query = "SELECT * FROM study_example WHERE example_id = %s"
#     cur.execute(query, (id,))
#     result = cur.fetchone()

#     if result:
#         return result
#     else:
#         raise HTTPException(status_code=404, detail="Example not found")

# 



# ---------------------------------------------------------------------------------------------------------------------------



# from fastapi import FastAPI, HTTPException
# import psycopg2
# import psycopg2.extras


# # ✅ 기존: 카테고리별 자료 조회
# @app.get("/api/materials/{category}")
# def get_materials_by_category(category: str):
#     query = "SELECT * FROM study_materials WHERE language_id = (" \
#         "SELECT language_id FROM languages WHERE language = %s)"

#     cur.execute(query, (category,))
#     results = cur.fetchall()
#     return results


# # ✅ 기존: 카테고리별 예제 조회
# @app.get("/api/examples/{category}")
# def get_examples_by_category(category: str):
#     query = "SELECT * FROM study_example WHERE language_id = ( " \
#         "SELECT language_id FROM languages WHERE language = %s)"
#     cur.execute(query, (category,))
#     results = cur.fetchall()
#     return results


# # 🚀 **새로 추가: 개별 자료 조회 API**
# @app.get("/api/materials/{language}/{id}")
# def get_study_material(language: str, id: int):
#     query = "SELECT * FROM study_materials WHERE material_id = %s"
#     cur.execute(query, (id,))
#     result = cur.fetchone()

#     if result:
#         return result
#     else:
#         raise HTTPException(status_code=404, detail="Material not found")


# # 🚀 **새로 추가: 개별 예제 조회 API**
# @app.get("/api/examples/{language}/{id}")
# def get_study_example(language: str, id: int):
#     query = "SELECT * FROM study_example WHERE example_id = %s"
#     cur.execute(query, (id,))
#     result = cur.fetchone()

#     if result:
#         return result
#     else:
#         raise HTTPException(status_code=404, detail="Example not found")
