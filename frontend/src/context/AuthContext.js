import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, getCurrentUser, logoutUser } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // ✅ 앱 시작 시 로그인 상태 확인
    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null));
    }, []);

    // ✅ 로그인 처리
    const handleLogin = async (email, password) => {
        await loginUser(email, password);
        const userData = await getCurrentUser();
        setUser(userData);
    };
    

    // ✅ 로그아웃 처리
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
