from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    DATABASE_URL: str
    SECRET_KEY: str
    SESSION_COOKIE_NAME: str = "session_id"  # 기본값 설정 가능
    

    model_config = SettingsConfigDict(env_file=".env", extra="allow")  # 🔥 추가 설정

settings = Settings()
