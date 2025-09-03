from __future__ import annotations
from typing import Annotated, Generic, TypeVar
from pydantic import BaseModel, Field, StringConstraints

# ---- Reusable constrained types (v2 style) ----
ShaStr = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=7, max_length=40, pattern=r"^[0-9a-fA-F]{7,40}$"),
]

BranchStr = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=120),
]

NameStr = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]

MsgStr = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]

T = TypeVar("T")

class ApiOK(BaseModel, Generic[T]):
    ok: bool = True
    data: T

class ApiErr(BaseModel):
    ok: bool = False
    error: str

class PageMeta(BaseModel):
    total: int
    limit: int
    offset: int
