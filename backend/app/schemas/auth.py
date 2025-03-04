from pydantic import BaseModel, EmailStr
from datetime import datetime

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirm(BaseModel):
    email: EmailStr
    token: str

class EmailVerificationResponse(BaseModel):
    message: str

class EmailVerificationTokenSchema(BaseModel):
    email: EmailStr
    token: str
    expires_at: datetime
    
class PasswordResetConfirm(BaseModel):
    email: EmailStr
    new_password: str

# 로그인 요청 모델
class LoginRequest(BaseModel):
    email: EmailStr
    password: str