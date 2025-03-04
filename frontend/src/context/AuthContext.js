import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser, getCurrentUser } from "../api/authApi"; // ✅ 로그아웃 API 추가

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ 앱 시작 시 로그인 상태 확인
    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    // ✅ 로그인 처리
    const handleLogin = async (email, password) => {
        await loginUser(email, password);
        const userData = await getCurrentUser();
        setUser(userData);
    };

    // ✅ 로그아웃 처리 (logoutUser 호출 추가)
    const handleLogout = async () => {
        await logoutUser(); // ✅ 서버에 로그아웃 요청 (쿠키 삭제)
        setUser(null); // ✅ 상태 초기화
    };

    return (
        <AuthContext.Provider value={{ user, handleLogin, handleLogout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Hook으로 사용
export const useAuth = () => useContext(AuthContext);
