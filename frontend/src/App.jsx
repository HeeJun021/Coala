import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./Layout/MainLayout"; // 공통 레이아웃 (Navbar, Sidebar 포함)
import Home from "./pages/Home"; // 홈 페이지
import Quiz from "./pages/Quiz.jsx"; // 퀴즈 페이지
import StudyMaterialsPage from "./pages/StudyMaterialsPage"; // 학습자료 페이지
import StudyMaterialsPageDetails from "./pages/StudyMaterialsPageDetails"; // 학습자료 및 예제 상세 페이지

// App 컴포넌트: 애플리케이션의 라우팅을 관리하는 최상위 컴포넌트
const App = () => {
  return (
    // Router: 전체 애플리케이션을 감싸서 클라이언트 사이드 라우팅을 가능하게 함
    <Router>
      {/* MainLayout: 모든 페이지에서 공통으로 적용될 레이아웃 (Sidebar, Navbar 등 포함) */}
      <MainLayout>
        <div className="flex-1"> {/* 페이지 컨텐츠 영역 */}
          {/* Routes: 여러 개의 Route를 감싸는 라우팅 컨테이너 */}
          <Routes>
            {/* 기본 홈 페이지 */}
            <Route path="/" element={<Home />} />

            {/* 퀴즈 페이지 */}
            <Route path="/quiz" element={<Quiz />} />

            {/* 학습자료 페이지 */}
            <Route path="/StudyMaterialsPage" element={<StudyMaterialsPage />} />

            {/* 학습자료 상세 페이지 (언어와 ID에 따라 동적으로 변경됨) */}
            <Route
              path="/StudyMaterialsPage/materials/:language/:id"
              element={<StudyMaterialsPageDetails />}
            />

            {/* 예제 상세 페이지 (언어와 ID에 따라 동적으로 변경됨) */}
            <Route
              path="/StudyMaterialsPage/examples/:language/:id"
              element={<StudyMaterialsPageDetails />}
            />
             {/* ✅ 개별 자료 조회 라우트 설정 확인 */}
        <Route path="/materials/:language/:id" element={<StudyMaterialsPageDetails />} />
        
        {/* ✅ 전체 자료 목록 */}
        <Route path="/materials" element={<StudyMaterialsPage />} />
          </Routes>
        </div>
      </MainLayout>
    </Router>
  );
};

export default App;
