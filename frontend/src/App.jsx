import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout"; // 공통 레이아웃
import Navbar from "./components/Navbar"; // 네비게이션 바

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
  return (
    <Router>
      <Layout>
        <Navbar /> {/* 네비게이션 바 (공통 UI) */}
        <Routes>
          {/* 메인 페이지 */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 마이페이지 관련 */}
          <Route path="/mypage/*" element={<MyPage />} />
          <Route path="/mypage/modify" element={<MyPageModify />} />
          <Route path="/mypage/setting" element={<MyPageSetting />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
