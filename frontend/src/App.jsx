import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // ✅ 로그인 상태 관리
import { getCurrentUser } from "./api/authApi";
import koala from "./assets/koala.jpg";
import MainLayout from "./Layout/MainLayout"; // 공통 레이아웃 (Sidebar, Navbar 포함)
import Home from "./pages/Home"; // 홈 페이지
import Quiz from "./pages/Quiz"; // 퀴즈 페이지
import StudyMaterialsPage from "./pages/StudyMaterialsPage"; // 학습자료 페이지
import StudyMaterialsPageDetails from "./pages/StudyMaterialsPageDetails"; // 학습자료 및 예제 상세 페이지

// 페이지 컴포넌트 가져오기
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyPage from "./pages/MyPage";
import MyPageModify from "./pages/MyPageModify";
import MyPageSetting from "./pages/MyPageSetting";

// 코딩 테스트 페이지 가져오기
import CodingTestPage from "./pages/CodingTestPage";
import CodingTestDetailPage from "./pages/CodingTestDetailPage";

const BodyClassManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/codingtest/") && location.pathname !== "/codingtest") {
      // ✅ 상세페이지일 때
      document.body.className = "fullscreen-body";
    } else {
      // ✅ 나머지 페이지
      document.body.className = "default-body";
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        setUserData({
          user_id: user.user_id,
          email: user.email,
          nickname: user.nickname || "사용자",
          profile_image_url: user.profile_image_url || koala,
          bio: user.bio || "",
          rating: user.rating || 1000,
          tier_id: user.tier_id || 1,
          dailycheck: user.dailycheck || false,
          email_verified: user.email_verified || false,
          created_at: user.created_at,
          updated_at: user.updated_at,
          tier_name: user.tier?.tier_name || "초급",
        });
        console.log("✅ 로그인된 사용자:", user);
      } catch (error) {
        console.error("⚠️ 사용자 데이터를 가져오는 중 오류 발생:", error);
        setUserData(null);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Router>
      <AuthProvider> {/* ✅ AuthProvider 적용 */}
        <BodyClassManager /> {/* ✅ 바디 클래스 상태 관리 */}
        <Routes>
          {/* ✅ Layout 적용되는 페이지들 */}
          <Route
            path="/*"
            element={
              <MainLayout> {/* ✅ MainLayout 내부에서 Route 적용 */}
                <Routes>
                  {/* 홈 페이지 */}
                  <Route path="/" element={<Home />} />

                  {/* 퀴즈 페이지 */}
                  <Route path="/quiz" element={<Quiz />} />

                  {/* 학습자료 관련 페이지 */}
                  <Route path="/StudyMaterialsPage" element={<StudyMaterialsPage />} />
                  <Route path="/StudyMaterialsPage/materials/:language/:id" element={<StudyMaterialsPageDetails />} />
                  <Route path="/StudyMaterialsPage/examples/:language/:id" element={<StudyMaterialsPageDetails />} />
                  <Route path="/materials/:language/:id" element={<StudyMaterialsPageDetails />} />
                  <Route path="/materials" element={<StudyMaterialsPage />} />

                  {/* 인증 관련 페이지 */}
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* 마이페이지 관련 */}
                  <Route path="/mypage/*" element={<MyPage userData={userData} />} /> {/* ✅ MyPage에 userData 전달 */}
                  <Route path="/mypage/modify" element={<MyPageModify userData={userData} setUserData={setUserData} />} /> {/* ✅ 수정 시 반영 */}
                  <Route path="/mypage/setting" element={<MyPageSetting userData={userData} />} />

                  {/* 코딩테스트 목록 */}
                  <Route path="/codingtest" element={<CodingTestPage />} />
                </Routes>
              </MainLayout>
            }
          />

          {/* ✅ Layout 제외: 코딩테스트 상세 페이지 (풀화면) */}
          <Route path="/codingtest/:id" element={<CodingTestDetailPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
