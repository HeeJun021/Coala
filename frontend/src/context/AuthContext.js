// import { createContext, useContext, useState, useEffect } from "react";
// import { loginUser, getCurrentUser, logoutUser } from "../api/api"; // 🔥 API 연결

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);

//     // ✅ 로그인 상태 확인 (앱 시작 시 실행)
//     useEffect(() => {
//         getCurrentUser().then(setUser).catch(() => setUser(null));
//     }, []);

//     // ✅ 로그인 함수
//     const handleLogin = async (email, password) => {
//         const userData = await loginUser(email, password);
//         setUser(userData);
//     };

//     // ✅ 로그아웃 함수
//     const handleLogout = async () => {
//         await logoutUser(setUser);
//     };

//     return (
//         <AuthContext.Provider value={{ user, handleLogin, handleLogout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// // ✅ Hook으로 사용
// export const useAuth = () => useContext(AuthContext);
