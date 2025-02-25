import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, getCurrentUser, logoutUser } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // ✅ 앱 시작 시 로그인 상태 확인
    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getCurrentUser();
            setUser(userData);
        };
        fetchUser();
    }, []);

    // ✅ 로그인 처리
    const handleLogin = async (email, password) => {
        try {
            const userData = await loginUser(email, password);
            setUser(userData); // ✅ 로그인 후 상태 업데이트
            console.log("로그인 성공, user 상태 업데이트:", userData);
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };
    

    // ✅ 로그아웃 처리 (useNavigate 제거)
    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, handleLogin, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Hook으로 사용
export const useAuth = () => useContext(AuthContext);
