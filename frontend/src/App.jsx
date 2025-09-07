import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { getCurrentUser } from "./api/authApi";
import ScrollToTop from "./components/ScrollToTop";

// 전역 UI: 채팅 패널 열림/방 선택 상태
import { ChatUIProvider } from "./context/ChatUIContext";

// 레이아웃
import MainLayout from "./Layout/MainLayout";
import AdminLayout from "./Layout/AdminLayout";
import Home from "./pages/Home";

// 관리자 페이지
import AdminDashboardPage from "./admin/AdminDashboardPage";
import StudymaterialManagementPage from "./admin/StudymaterialManagementPage";
import QuizManagementPage from "./admin/QuizManagementPage";
import CodingtestManagementPage from "./admin/CodingtestManagementPage";
import AdminCodingTestDetailPage from "./admin/AdminCodingtestDetailPage";
import BoardManagementPage from "./admin/BoardManagementPage";
import UserManagementPage from "./admin/UserManagementPage";
import ProjectManagementPage from "./admin/ProjectManagementPage";
import BoardManagementDetailPage from "./admin/BoardManagementDetailPage";

// 채팅
import { ChatSocketProvider } from "./context/ChatSocketContext";

// 학습자료
import StudyMaterialsPage from "./pages/studymaterials/StudyMaterialsPage";
import StudyMaterialsPageDetails from "./pages/studymaterials/StudyMaterialsPageDetails";
import CodeTestPage from "./pages/studymaterials/CodeTestPage";
import CodeTestTerminalPage from "./pages/studymaterials/CodeTestTerminalPage";

// 퀴즈
import QuizPage from "./pages/quiz/QuizPage";
import QuizSolvePage from "./pages/quiz/QuizSolvePage";
import QuizResultPage from "./pages/quiz/QuizResultPage";
import CreateUserQuiz from "./pages/quiz/CreateUserQuiz";
import QuizStatsPage from "./pages/quiz/QuizStatsPage";
import QuizHistoryPage from "./pages/quiz/QuizHistoryPage";
import QuizReviewPage from "./pages/quiz/QuizReviewPage";
import UserQuizSolvePage from "./pages/quiz/UserQuizSolvePage";
import UserQuizResultPage from "./pages/quiz/UserQuizResultPage";

// 마이페이지
import MyPage from "./pages/mypage/MyPage";
import MyPageModify from "./pages/mypage/MyPageModify";
import MyPageSetting from "./pages/mypage/MyPageSetting";
import MyPageQuizHistory from "./pages/mypage/MyPageQuizHistory";
import MyPageUserQuizHistory from "./pages/mypage/MyPageUserQuizHistory";
import MyPageCTHistory from "./pages/mypage/MyPageCTHistory";
import MyPageCommunity from "./pages/mypage/MyPageCommunity";
import MyPageAttendance from "./pages/mypage/MyPageAttendance"; // 250817 김희준

// 인증
import Signup from "./pages/loginSignup/Signup";
import Login from "./pages/loginSignup/Login";
import ForgotPassword from "./pages/loginSignup/ForgotPassword";
import ResetPassword from "./pages/loginSignup/ResetPassword";

// 코딩 테스트
import CodingTestPage from "./pages/codingTest/CodingTestPage";
import CodingTestDetailPage from "./pages/codingTest/CodingTestDetailPage";
import CorrectSolutionsPage from "./pages/codingTest/CorrectSolutionsPage";
import MyCodingTestSubmissionsPage from "./pages/codingTest/MyCodingTestSubmissionsPage";

// 게시판
import "@toast-ui/editor/dist/toastui-editor.css";
import BoardPage from "./pages/board/BoardPage";
import BoardDetailPage from "./pages/board/BoardDetailPage";
import BoardWritePage from "./pages/board/BoardWritePage";
import BoardEditPage from "./pages/board/BoardEditPage";
import ProjectApplicantsPage from "./pages/board/ProjectApplicantsPage";

// 자율학습
import SelfCodingPage from "./pages/selfcoding/SelfCodingPage";
import SelfCodingTemplatePage from "./pages/selfcoding/SelfCodingTemplatePage";

// 팀프로젝트
import TeamProjectPage from "./pages/project/TeamProjectPage";
import ProjectDocPage from "./pages/project/Doc/ProjectDocPage";

// ERD UI
import ErdPage from "./pages/erd/ErdPage";


// 유저 뷰어 페이지 (새로 추가)
import UserProfileViewerPage from "./pages/user/UserProfileViewerPage";

// 프로젝트 템플릿
import TemplateWorkspace from "./pages/project/TemplateWorkspace";

const observerError = /ResizeObserver loop completed/;
window.addEventListener("error", (e) => {
  if (observerError.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

const BodyClassManager = () => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const isFullscreenRoute =
      (path.startsWith("/codingtest/") && path !== "/codingtest") ||
      path.startsWith("/codingtest/correct/") ||
      (path.startsWith("/team-project/") && path.includes("/erd/"));
    if (path === "/") document.body.className = "white-body";
    else if (isFullscreenRoute) document.body.className = "fullscreen-body";
    else document.body.className = "default-body";
  }, [location.pathname]);
  return null;
};

const App = () => {
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        console.log("🔍 user:", user);
        setUserData({
          user_id: user.user_id,
          email: user.email,
          nickname: user.nickname || "사용자",
          profile_image_url: user.profile_image_url || "assets/koala.jpg",
          bio: user.bio || "",
          rating: user.rating || 1000,
          tier_id: user.tier_id || 1,
          dailycheck: user.dailycheck || false,
          email_verified: user.email_verified || false,
          created_at: user.created_at,
          updated_at: user.updated_at,
          tier_name: user.tier?.tier_name || "초급",
          is_admin: user.is_admin || false,
          eucalyptus_balance: user.eucalyptus_balance ?? 0,
        });
      } catch (error) {
        console.error("⚠️ 사용자 데이터를 가져오는 중 오류 발생:", error);
        setUserData(null);
      }
    };
    fetchUserData();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <ChatUIProvider>
        <AuthProvider>
          <ChatSocketProvider>
            <BodyClassManager />
            <Routes>
              {userData?.is_admin && (
                <>
                  <Route path="/" element={<Navigate to="/admin" replace />} />
                  <Route
                    path="/admin"
                    element={<AdminLayout userData={userData} setUser={setUserData} />}
                  >
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="materials" element={<StudymaterialManagementPage />} />
                    <Route path="projects" element={<ProjectManagementPage />} />
                    <Route path="quizzes" element={<QuizManagementPage />} />
                    <Route path="codingtest" element={<CodingtestManagementPage />} />
                    <Route path="codingtest/:testId" element={<AdminCodingTestDetailPage />} />
                    <Route path="board" element={<BoardManagementPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="posts/:postId" element={<BoardManagementDetailPage />} />
                  </Route>
                </>
              )}

              {/* 전체화면 페이지 */}
              <Route path="/self-coding" element={<SelfCodingPage />} />
              <Route path="/self-coding/templates" element={<SelfCodingTemplatePage />} />
              <Route path="/codingtest/:id" element={<CodingTestDetailPage />} />
              <Route path="/codingtest/correct/:testId" element={<CorrectSolutionsPage />} />

              {/* ERD 페이지 전체화면 */}
              <Route path="/team-project/:projectId/erd/:erdId" element={<ErdPage />} />
              <Route path="/erd" element={<ErdPage />} />

              {/* 공통 레이아웃 포함 영역 */}
              <Route
                path="/*"
                element={
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />

                      {/* 학습자료 */}
                      <Route path="/StudyMaterialsPage" element={<StudyMaterialsPage />} />
                      <Route
                        path="/StudyMaterialsPage/materials/:language/:id"
                        element={<StudyMaterialsPageDetails />}
                      />
                      <Route
                        path="/StudyMaterialsPage/examples/:language/:id"
                        element={<StudyMaterialsPageDetails />}
                      />
                      <Route path="/materials/:language/:id" element={<StudyMaterialsPageDetails />} />
                      <Route path="/materials" element={<StudyMaterialsPage />} />

                      {/* 퀴즈 */}
                      <Route path="/quizpage" element={<QuizPage userData={userData} />} />
                      <Route path="/quizsolve/:quizId" element={<QuizSolvePage userData={userData} />} />
                      <Route path="/quiz-result/:quizId" element={<QuizResultPage userData={userData} />} />
                      <Route path="/quiz-stats" element={<QuizStatsPage />} />
                      <Route path="/quiz-history" element={<QuizHistoryPage />} />
                      <Route path="/quiz-review" element={<QuizReviewPage />} />
                      <Route path="/user-quiz/create" element={<CreateUserQuiz userData={userData} />} />
                      <Route path="/user-quiz-solve/:quizId" element={<UserQuizSolvePage userData={userData} />} />
                      <Route
                        path="/user-quiz-result/:uq_submission_id"
                        element={<UserQuizResultPage userData={userData} />}
                      />

                      {/* 코딩 테스트 (서비스) */}
                      <Route path="/codingtest" element={<CodingTestPage />} />
                      <Route path="/codetest" element={<CodeTestPage />} />
                      <Route path="/terminal" element={<CodeTestTerminalPage />} />
                      <Route path="/my-submissions" element={<MyCodingTestSubmissionsPage />} />

                      {/* 인증 */}
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* 마이페이지 */}
                      <Route
                        path="mypage"
                        element={<MyPage userData={userData} setUserData={setUserData} />}
                      >
                        <Route index element={<MyPageModify />} />
                        <Route path="modify" element={<MyPageModify />} />
                        <Route path="setting" element={<MyPageSetting />} />
                        <Route path="quiz-history" element={<MyPageQuizHistory />} />
                        <Route path="userquiz-history" element={<MyPageUserQuizHistory />} />
                        <Route path="codingtest" element={<MyPageCTHistory />} />
                        <Route path="community" element={<MyPageCommunity />} />
                        <Route path="attendance" element={<MyPageAttendance />} /> 
                      </Route>

                      {/* 팀프로젝트 */}
                      <Route path="/team-project/:id/doc/:docId" element={<ProjectDocPage />} />
                      <Route path="/team-project" element={<TeamProjectPage />} />
                      <Route path="/team-project/:id" element={<TeamProjectPage />} />

                      {/* 템플릿 */}
                      <Route path="/team-project/:projectId/template/:templateId" element={<TemplateWorkspace />} />

                      {/* 게시판 */}
                      <Route path="/board/:boardType" element={<BoardPage />} />
                      <Route path="/board/:boardType/write" element={<BoardWritePage />} />
                      <Route path="/board/:boardType/:postId" element={<BoardDetailPage />} />
                      <Route path="/board/:boardType/edit/:postId" element={<BoardEditPage />} />
                      <Route
                        path="/board/:boardType/applicants/:postId"
                        element={<ProjectApplicantsPage />}
                      />
                      <Route path="/board" element={<Navigate to="/board/free" />} />

                      {/* 유저 뷰어 페이지 (추가됨) */}
                      <Route path="/user/:userId" element={<UserProfileViewerPage />} />
                    </Routes>
                  </MainLayout>
                }
              />
            </Routes>
          </ChatSocketProvider>
        </AuthProvider>
      </ChatUIProvider>
    </Router>
  );
};

export default App;
