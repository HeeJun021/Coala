import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings  # .env 설정 가져오기

def send_verification_email(to_email: str, token: str):
    """Gmail SMTP를 사용하여 이메일로 인증 코드 전송"""

    smtp_server = settings.SMTP_SERVER
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD

    subject = "이메일 인증 코드"
    body = f"인증 코드: {token}\n이 코드를 사용하여 이메일 인증을 완료하세요."

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        print(f"✅ 이메일이 {to_email}로 전송되었습니다!")
    except Exception as e:
        print(f"❌ 이메일 전송 실패: {e}")
