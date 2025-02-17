import React from "react"; // React를 가져와 컴포넌트를 작성
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // React Router 관련 컴포넌트 가져오기
import Layout from "./components/Layout"; // Layout 컴포넌트 (공통 레이아웃) 가져오기
import Home from "./pages/Home"; // 홈 페이지 컴포넌트 가져오기
import Signup from "./pages/Signup"; // 회원가입 페이지 추가
import MyPage from "./pages/MyPage";
import MyPageModify from "./pages/MyPageModify";
import MyPageSetting from "./pages/MyPageSetting";

// App 컴포넌트: 애플리케이션의 루트 컴포넌트
const App = () => {
  return (
    // Router: React Router의 최상위 컴포넌트로 애플리케이션의 라우팅을 관리
    <Router>
      {/* Layout: 모든 페이지에 공통으로 적용되는 레이아웃 컴포넌트 */}
      <Layout>
        {/* Routes: 여러 Route를 그룹화하여 라우팅 처리 */}
        <Routes>
          {/* Route: 특정 경로에 따라 렌더링할 컴포넌트를 지정 */}
          <Route path="/" element={<Home />} />{" "}
          <Route path="/signup" element={<Signup />} /> {/* 회원가입 경로 */}
          <Route path="/mypage/*" element={<MyPage />} />{" "}
          <Route path="/mypage/modify" element={<MyPageModify />} />{" "}
          <Route path="/mypage/setting" element={<MyPageSetting />} />{" "}
          {/* "/" 경로에서 Home 컴포넌트를 렌더링 */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App; // App 컴포넌트를 외부에서 사용할 수 있도록 내보내기
