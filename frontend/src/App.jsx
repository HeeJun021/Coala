import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./Layout/MainLayout"; // 공통 레이아웃 (Sidebar, Navbar 포함)
import Home from "./pages/Home"; // 홈 페이지
import Quiz from "./pages/Quiz"; // 퀴즈 페이지
import StudyMaterialsPage from "./pages/StudyMaterialsPage"; // 학습자료 페이지
import StudyMaterialsPageDetails from "./pages/StudyMaterialsPageDetails"; // 학습자료 및 예제 상세 페이지

import { AuthProvider } from "./context/AuthContext"; // ✅ 로그인 상태 관리

// 페이지 컴포넌트 가져오기;
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyPage from "./pages/MyPage";
import MyPageModify from "./pages/MyPageModify";
import MyPageSetting from "./pages/MyPageSetting";

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ AuthProvider 적용 */}
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
            <Route path="/mypage/*" element={<MyPage />} />
            <Route path="/mypage/modify" element={<MyPageModify />} />
            <Route path="/mypage/setting" element={<MyPageSetting />} />
          </Routes>
        </MainLayout>
      </AuthProvider>
    </Router>
  );
};

export default App;
