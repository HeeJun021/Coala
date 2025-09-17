from typing import List, Optional
from datetime import date
from pydantic import BaseModel, EmailStr, Field

class EduItem(BaseModel):
    school: str = Field(default="")
    major: str = Field(default="")
    period: str = Field(default="")  # 예: "2021.03~2025.02"
    desc: str = Field(default="")

class CareerItem(BaseModel):
    company: str = Field(default="")
    role: str = Field(default="")
    period: str = Field(default="")
    desc: str = Field(default="")

class PortfolioProfileBase(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    education: List[EduItem] = Field(default_factory=list)
    career: List[CareerItem] = Field(default_factory=list)

class PortfolioProfileOut(PortfolioProfileBase):
    user_id: int
    model_config = {"from_attributes": True}

class PortfolioProfileUpsert(PortfolioProfileBase):
    pass
