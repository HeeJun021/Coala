import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home"; // 홈 페이지
import Quiz from "./pages/Quiz"; // 퀴즈 페이지
import StudyMaterialsPage from "./pages/StudyMaterialsPage"; // 학습자료 페이지
import StudyMaterialsPageDetails from "./pages/StudyMaterialsPageDetails"; // 상세 페이지

const App = () => {
  return (
    <Router>
      <Layout>
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz" element={<Quiz />} />

            {/* 학습자료 및 예제 페이지 */}
            <Route path="/StudyMaterialsPage" element={<StudyMaterialsPage />} />

            {/* 학습자료 상세 페이지 */}
            <Route
              path="/StudyMaterialsPage/materials/:language/:id"
              element={<StudyMaterialsPageDetails />}
            />

            {/* 예제 상세 페이지 */}
            <Route
              path="/StudyMaterialsPage/examples/:language/:id"
              element={<StudyMaterialsPageDetails />}
            />
          </Routes>
        </div>
      </Layout>
    </Router>
  );
};

export default App;
