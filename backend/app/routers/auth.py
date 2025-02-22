# from fastapi import APIRouter, Depends, HTTPException, Request, Response
# from app.models.user import User  # User 모델 가져오기
# from app.database import get_db
# from sqlalchemy.orm import Session
# from app.schemas.auth import LoginRequest  # 로그인 요청 스키마

# router = APIRouter()

# @router.post("/login")
# def login(request: Request, response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
#     """
#     사용자가 로그인하면 세션을 생성하여 로그인 상태를 유지하는 API
#     """
#     user = db.query(User).filter(User.username == login_data.username).first()

#     if not user or user.password != login_data.password:  # 단순 비교 (추후 해싱 적용)
#         raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

#     # 세션에 사용자 정보 저장
#     request.session["user_id"] = user.id
#     request.session["username"] = user.username

#     return {"message": "로그인 성공!"}

# @router.post("/logout")
# def logout(request: Request, response: Response):
#     """
#     사용자가 로그아웃하면 세션을 삭제하는 API
#     """
#     request.session.clear()  # 세션 초기화
#     return {"message": "로그아웃 완료!"}

# @router.get("/me")
# def get_current_user(request: Request):
#     """
#     현재 로그인한 사용자의 정보를 반환하는 API
#     """
#     user_id = request.session.get("user_id")
#     username = request.session.get("username")

#     if not user_id:
#         raise HTTPException(status_code=401, detail="로그인 상태가 아닙니다.")

#     return {"user_id": user_id, "username": username}
