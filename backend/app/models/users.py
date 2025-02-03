from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from app.database import Base

class User(Base):
    __tablename__ = "users"  # 기존에 생성된 테이블 이름과 동일해야 함

    user_id = Column(Integer, primary_key=True, index=True)  # 고유 ID
    username = Column(String(50), nullable=False)  # 사용자 이름
    email = Column(String(100), unique=True, nullable=False)  # 이메일
    password = Column(String(255), nullable=False)  # 비밀번호 (해싱된 상태로 저장)
    phone_number = Column(String(15))  # 전화번호
    birth_date = Column(Date)  # 생년월일
    role = Column(String(20), default="user")  # 사용자 역할 (기본값: user)
    profile_image_url = Column(Text)  # 프로필 이미지 URL
    bio = Column(Text)  # 사용자 소개
    tier_id = Column(Integer)  # 티어 ID (외래 키 대신 단순 필드로 유지)
    rating = Column(Integer, default=0)  # 레이팅 점수
    created_at = Column(DateTime)  # 생성일
    updated_at = Column(DateTime)  # 수정일
