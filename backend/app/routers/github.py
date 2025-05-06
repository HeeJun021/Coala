from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.social_login import SocialLogin
from app.dependencies.auth import get_current_user
import requests

router = APIRouter(prefix="/freecode", tags=["GitHub"])

@router.get("/github/repos")
def get_github_repos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    social_login = db.query(SocialLogin).filter(
        SocialLogin.user_id == current_user.user_id,
        SocialLogin.provider == "github"
    ).first()
    
    if not social_login:
        print(f"No social login found for user_id: {current_user.user_id}")
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")
    
    if not social_login.access_token:
        print(f"No access_token found for social_login: {social_login.social_login_id}")
        raise HTTPException(status_code=401, detail="GitHub 액세스 토큰이 없습니다.")
    
    headers = {"Authorization": f"Bearer {social_login.access_token}"}
    response = requests.get("https://api.github.com/user/repos", headers=headers)
    if response.status_code != 200:
        print(f"GitHub API error: {response.status_code}, {response.text}")
        response.raise_for_status()
    
    repos = response.json()
    return [
        {
            "id": repo["id"],
            "full_name": repo["full_name"],
            "description": repo["description"],
            "html_url": repo["html_url"]
        }
        for repo in repos
    ]