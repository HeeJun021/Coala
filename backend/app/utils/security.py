import random
import string
from passlib.context import CryptContext

# 비밀번호 해싱을 위한 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """비밀번호를 bcrypt 방식으로 해싱"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """입력한 비밀번호가 저장된 해시와 일치하는지 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def generate_verification_token(length=6):
    """6자리 랜덤 인증 코드 생성"""
    return ''.join(random.choices(string.digits, k=length))