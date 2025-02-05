from fastapi import APIRouter

router = APIRouter()

users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
]

@router.get("/")
def get_users():
    return {"users": users}

@router.get("/{user_id}")
def get_user(user_id: int):
    for user in users:
        if user["id"] == user_id:
            return {"user": user}
    return {"error": "User not found"}