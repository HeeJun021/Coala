import axios from "axios";
const BASE_URL = "http://127.0.0.1:8000"; // 🔥 백엔드 주소

// ✅ 회원가입
export async function registerUser(userData) {
    const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "회원가입 실패");
    }

    return data;
}

// ✅ 이메일 인증 코드 요청
export async function requestEmailVerification(email) {
    const response = await fetch(`${BASE_URL}/auth/email/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "이메일 전송 실패");
    }

    return data;
}

// ✅ 이메일 인증 코드 확인
export async function verifyEmail(email, token) {
    const response = await fetch(`${BASE_URL}/auth/email/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "인증 실패");
    }

    return data;
}

// ✅ 비밀번호 찾기 - 이메일 인증 코드 요청
export async function requestPasswordReset(email) {
    const response = await fetch(`${BASE_URL}/auth/password-reset/email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "비밀번호 재설정 이메일 전송 실패");
    }

    return data;
}

// ✅ 비밀번호 찾기 - 인증 코드 확인
export async function verifyPasswordReset(email, token) {
    const response = await fetch(`${BASE_URL}/auth/password-reset/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "인증 코드 검증 실패");
    }

    return data;
}

// ✅ 비밀번호 변경
export async function resetPassword(email, newPassword) {
    const response = await fetch(`${BASE_URL}/auth/password-reset/change`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, new_password: newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "비밀번호 변경 실패");
    }

    return data;
}

// ✅ 로그인 (세션 저장)
export const loginUser = async (email, password) => {
    const response = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true } // ✅ 쿠키 포함 필수
    );
    return response.data;
};




// ✅ 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:8000/auth/me", {
            withCredentials: true,  // ✅ 쿠키 포함 요청
        });
        console.log("🔍 [프론트] 로그인 상태 확인 응답:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ [프론트] 로그인 상태 확인 실패:", error);
        return null;
    }
};

  
  
// ✅ 로그아웃 API
export const logoutUser = async () => {
    await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
};

  