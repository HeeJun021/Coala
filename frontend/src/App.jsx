import React, {useState, useEffect} from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // ✅ 로그인 상태 관리
import Layout from "./components/Layout"; // 공통 레이아웃
import Navbar from "./components/Navbar"; // 네비게이션 바
import { getCurrentUser } from "./api/authApi";
import koala from "./assets/koala.jpg"

// 페이지 컴포넌트 가져오기
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyPage from "./pages/MyPage";
import MyPageModify from "./pages/MyPageModify";
import MyPageSetting from "./pages/MyPageSetting";

const App = () => {
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const fetchUserData = async() => {
      try {
        const user = await getCurrentUser(); // ✅ 로그인된 사용자 정보 가져오기

        console.log(user);

        setUserData(prevData => ({
          ...prevData,
          user_id: user.user_id,
          email: user.email,
          nickname: user.nickname || "사용자",
          profile_image_url: user.profile_image_url || koala,
          bio: user.bio !== undefined ? user.bio : prevData.bio, 
          rating: user.rating || 1000,
          tier_id: user.tier_id || 1,
          dailycheck: user.dailycheck || false,
          email_verified: user.email_verified || false,
          created_at: user.created_at,
          updated_at: user.updated_at,
          tier_name: user.tier?.tier_name,
        }));
      } catch (error) {
        console.error(error);
      }
    };
    console.log("🔍 ProfileCard useEffect → userData:", userData);
    fetchUserData();
  }, [])

  
  return (
    <Router>
      <AuthProvider> {/* ✅ AuthProvider를 Router 내부로 이동 */}
        <Layout>
          <Navbar /> {/* ✅ 네비게이션 바 (로그인 상태 자동 반영) */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mypage/*" element={<MyPage userData={userData} />} /> {/* ✅ MyPage에 userData 전달 */}
            <Route path="/mypage/modify" element={<MyPageModify userData={userData} setUserData={setUserData} />} /> {/* ✅ 수정 시 반영 */}
            <Route path="/mypage/setting" element={<MyPageSetting userData={userData} />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default App;
