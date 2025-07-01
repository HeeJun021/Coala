import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser, getCurrentUser } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);           // 로그인한 유저 정보
  const [loading, setLoading] = useState(true);     // 로딩 상태 (앱 시작 시)

  // 앱 시작 시 로그인 유지 확인 (/auth/me 호출)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 로그인 처리 (ID, PW or 소셜)
  const handleLogin = async (email, password) => {
    await loginUser(email, password);       // 로그인 요청
    const userData = await getCurrentUser(); // 로그인 후 유저 정보 가져오기
    setUser(userData);                       // 상태 저장
  };

  // 로그아웃 처리 (access_token 쿠키 삭제 + 상태 초기화)
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("🚨 로그아웃 실패:", err);
    } finally {
      setUser(null); // 항상 상태 초기화
    }
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleLogout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
