from fastapi import FastAPI, HTTPException
import psycopg2
import psycopg2.extras

app = FastAPI()

# PostgreSQL 연결 설정
conn = psycopg2.connect(
    dbname="coala_db",
    user="coala_user",
    password="1234",
    host="localhost",
    port="5432"
)
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


# ✅ 기존: 카테고리별 자료 조회
@app.get("/api/materials/{category}")
def get_materials_by_category(category: str):
    query = "SELECT * FROM study_materials WHERE language_id = (" \
        "SELECT language_id FROM languages WHERE language = %s)"

    cur.execute(query, (category,))
    results = cur.fetchall()
    return results


# ✅ 기존: 카테고리별 예제 조회
@app.get("/api/examples/{category}")
def get_examples_by_category(category: str):
    query = "SELECT * FROM study_example WHERE language_id = ( " \
        "SELECT language_id FROM languages WHERE language = %s)"
    cur.execute(query, (category,))
    results = cur.fetchall()
    return results


# 🚀 **새로 추가: 개별 자료 조회 API**
@app.get("/api/materials/{language}/{id}")
def get_study_material(language: str, id: int):
    query = "SELECT * FROM study_materials WHERE material_id = %s"
    cur.execute(query, (id,))
    result = cur.fetchone()

    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="Material not found")


# 🚀 **새로 추가: 개별 예제 조회 API**
@app.get("/api/examples/{language}/{id}")
def get_study_example(language: str, id: int):
    query = "SELECT * FROM study_example WHERE example_id = %s"
    cur.execute(query, (id,))
    result = cur.fetchone()

    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="Example not found")
