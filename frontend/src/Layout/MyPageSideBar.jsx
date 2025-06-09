// src/components/MyPageSidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import ProfileSummary from "./ProfileSummary";
import {
  UserCog,
  ListTodo,
  BarChart3,
  Users2,
} from "lucide-react";

const MyPageSidebar = ({ userData }) => {
  return (
    <aside className="w-64 bg-gray-50 p-6 shadow-md flex-shrink-0 absolute left-4 rounded-xl border border-gray-200">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">마이페이지</h1>

      <ProfileSummary
        profile_image_url={userData?.profile_image_url || "/assets/koala.jpg"}
        nickname={userData?.nickname || "익명 사용자"}
        eucalyptus_balance={userData?.eucalyptus_balance ?? 0}
      />

      <nav className="text-gray-800 mt-8">
        <ul className="space-y-6 text-sm">
          {/* 로그인 정보 */}
          <li>
            <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <UserCog size={16} className="text-sky-500" />
              로그인 정보
            </div>
            <ul className="ml-6 space-y-1 text-gray-600">
              <li><Link to="/mypage/modify" className="hover:font-semibold hover:text-gray-800">계정 정보 및 관리</Link></li>

              <li><Link to="/mypage/setting" className="hover:font-semibold hover:text-gray-800">개인정보 보호 설정</Link></li>
            </ul>
          </li>

          {/* 활동 내역 */}
          <li>
            <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <ListTodo size={16} className="text-green-500" />
              활동 내역
            </div>
            <ul className="ml-6 space-y-1 text-gray-600">
              <li><Link to="/mypage/quiz-history" className="hover:font-semibold hover:text-gray-800">퀴즈 이력</Link></li>
              <li><Link to="/mypage/userquiz-history" className="hover:font-semibold hover:text-gray-800">사용자 퀴즈 이력</Link></li>
              <li><Link to="/mypage/codingtest" className="hover:font-semibold hover:text-gray-800">코딩 테스트 이력</Link></li>
              <li><Link to="/mypage/community" className="hover:font-semibold hover:text-gray-800">커뮤니티 활동 내역</Link></li>
            </ul>
          </li>

          {/* 학습 성과 및 기록 */}
          <li>
            <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <BarChart3 size={16} className="text-yellow-500" />
              학습 성과 및 기록
            </div>
            <ul className="ml-6 space-y-1 text-gray-600">
              <li><Link to="/mypage/wrong-notes" className="hover:font-semibold hover:text-gray-800">오답노트</Link></li>
              <li><Link to="/mypage/attendance" className="hover:font-semibold hover:text-gray-800">출석체크</Link></li>
              <li><Link to="/mypage/rating" className="hover:font-semibold hover:text-gray-800">레이팅 점수 내역</Link></li>
            </ul>
          </li>

          {/* 멘토링 및 프로젝트 */}
          <li>
            <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <Users2 size={16} className="text-purple-500" />
              멘토링 및 프로젝트
            </div>
            <ul className="ml-6 space-y-1 text-gray-600">
              <li><Link to="/mypage/mentoring" className="hover:font-semibold hover:text-gray-800">멘토링 이력</Link></li>
              <li><Link to="/mypage/projects" className="hover:font-semibold hover:text-gray-800">팀 프로젝트 이력</Link></li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default MyPageSidebar;
