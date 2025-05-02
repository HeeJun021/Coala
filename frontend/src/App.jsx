import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { getCurrentUser } from "./api/authApi";
import koala from "./assets/koala.jpg";

// 레이아웃 & 기본
import MainLayout from "./Layout/MainLayout";
import Home from "./pages/Home";

// 학습자료
import StudyMaterialsPage from "./pages/StudyMaterialsPage";
import StudyMaterialsPageDetails from "./pages/StudyMaterialsPageDetails";
import CodeTestPage from "./pages/CodeTestPage";
import CodeTestTerminalPage from "./pages/CodeTestTerminalPage";

// 퀴즈
import QuizPage from "./pages/QuizPage";
import QuizSolvePage from "./pages/QuizSolvePage";
import QuizResultPage from "./pages/QuizResultPage";
import CreateUserQuiz from "./pages/CreateUserQuiz";
import UserQuizSolvePage from "./pages/UserQuizSolvePage";
import UserQuizResultPage from "./pages/UserQuizResultPage";

// 마이페이지
import MyPage from "./pages/MyPage";
import MyPageModify from "./pages/MyPageModify";
import MyPageSetting from "./pages/MyPageSetting";
import MyPageQuizHistory from "./pages/MyPageQuizHistory";
import MyPageUserQuizHistory from "./pages/MyPageUserQuizHistory";

// 인증
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// 코딩 테스트
import CodingTestPage from "./pages/CodingTestPage";
import CodingTestDetailPage from "./pages/CodingTestDetailPage";
import CorrectSolutionsPage from "./pages/CorrectSolutionsPage";

// 게시판
import "@toast-ui/editor/dist/toastui-editor.css";
import BoardPage from "./pages/BoardPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import BoardWritePage from "./pages/BoardWritePage";
import BoardEditPage from "./pages/BoardEditPage";

// 자율학습
import SelfCodingPage from "./pages/SelfCodingPage";
import SelfCodingTemplatePage from "./pages/SelfCodingTemplatePage";

const observerError = /ResizeObserver loop completed/;
window.addEventListener("error", (e) => {
  if (observerError.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

const BodyClassManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (
      (location.pathname.startsWith("/codingtest/") && location.pathname !== "/codingtest") ||
      location.pathname.startsWith("/codingtest/correct/")
    ) {
      document.body.className = "fullscreen-body";
    } else {
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
      <AuthProvider>
        <BodyClassManager />
        <Routes>
          
                  {/* 자율코딩 */}
                  <Route path="/self-coding" element={<SelfCodingPage />} />
                  <Route path="/self-coding/templates" element={<SelfCodingTemplatePage />} />
                  
          {/* 코딩 테스트 전체화면 전용 */}
          <Route path="/codingtest/:id" element={<CodingTestDetailPage />} />
          <Route path="/codingtest/correct/:testId" element={<CorrectSolutionsPage />} />

          {/* 공통 레이아웃 포함 */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />

                  {/* 학습자료 */}
                  <Route path="/StudyMaterialsPage" element={<StudyMaterialsPage />} />
                  <Route path="/StudyMaterialsPage/materials/:language/:id" element={<StudyMaterialsPageDetails />} />
                  <Route path="/StudyMaterialsPage/examples/:language/:id" element={<StudyMaterialsPageDetails />} />
                  <Route path="/materials/:language/:id" element={<StudyMaterialsPageDetails />} />
                  <Route path="/materials" element={<StudyMaterialsPage />} />

                  {/* 퀴즈 */}
                  <Route path="/quizpage" element={<QuizPage userData={userData} />} />
                  <Route path="/quizsolve/:quizId" element={<QuizSolvePage userData={userData} />} />
                  <Route path="/quiz-result/:quizId" element={<QuizResultPage userData={userData} />} />
                  <Route path="/user-quiz/create" element={<CreateUserQuiz userData={userData} />} />
                  <Route path="/user-quiz-solve/:quizId" element={<UserQuizSolvePage userData={userData} />} />
                  <Route path="/user-quiz-result/:uq_submission_id" element={<UserQuizResultPage userData={userData} />} />

                  {/* 코딩 테스트 목록 */}
                  <Route path="/codingtest" element={<CodingTestPage />} />

                  {/* 실습 터미널 */}
                  <Route path="/codetest" element={<CodeTestPage />} />
                  <Route path="/terminal" element={<CodeTestTerminalPage />} />

                  {/* 인증 */}
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* 마이페이지 */}
                  <Route path="/mypage/*" element={<MyPage userData={userData} />} />
                  <Route path="/mypage/modify" element={<MyPageModify userData={userData} setUserData={setUserData} />} />
                  <Route path="/mypage/setting" element={<MyPageSetting userData={userData} />} />
                  <Route path="/mypage/quiz-history" element={<MyPageQuizHistory userData={userData} />} />
                  <Route path="/mypage/userquiz-history" element={<MyPageUserQuizHistory userData={userData} />} />

                  {/* 게시판 */}
                  <Route path="/board/:boardType" element={<BoardPage />} />
                  <Route path="/board/:boardType/write" element={<BoardWritePage />} />
                  <Route path="/board/:boardType/:postId" element={<BoardDetailPage />} />
                  <Route path="/board/:boardType/edit/:postId" element={<BoardEditPage />} />
                  <Route path="/board" element={<Navigate to="/board/free" />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
