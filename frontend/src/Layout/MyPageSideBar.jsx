import React from 'react';
import ProfileSummary from './ProfileSummary';
import { Link } from 'react-router-dom';
import koala from '../assets/koala.jpg'

const MyPageSidebar = ({ userData }) => {
    return (
        <aside className="w-64 min-h-screen bg-gray-50 p-6 shadow-md flex-shrink-0 absolute left-4">
            <h1 className="text-2xl font-bold text-center mb-4">마이페이지</h1>

            {/* ✅ 현재 사용자 정보 반영 */}
            <ProfileSummary 
                profile_image_url={userData?.profile_image_url || koala}
                nickname={userData?.nickname}
            />

            <nav className="text-gray-800">
                <ul className="space-y-4 ml-4 mt-6">
                    <li className="font-semibold">
                        <span className="block mb-2 text-gray-800">로그인 정보</span>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li><Link to="/mypage/modify">계정 정보 및 관리</Link></li>
                            <li><Link to="/mypage/setting">개인정보 보호 설정</Link></li>
                        </ul>
                    </li>
                    <li className="font-semibold">
                        <span className="block mb-2 text-gray-800">활동 내역</span>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li><Link to="/mypage/quiz-history">퀴즈 이력</Link></li>
                            <li><Link to="/mypage/userquiz-history">사용자 퀴즈 이력</Link></li>
                            <li><Link to="/mypage/codingtest">코딩 테스트 이력</Link></li>
                            <li><Link to="/mypage/community">커뮤니티 활동 내역</Link></li>
                        </ul>
                    </li>
                    <li className="font-semibold">
                        <span className="block mb-2 text-gray-800">학습 성과 및 기록</span>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li><Link to="/mypage/wrong-notes">오답노트</Link></li>
                            <li><Link to="/mypage/attendance">출석체크</Link></li>
                            <li><Link to="/mypage/rating">레이팅 점수 내역</Link></li>
                        </ul>
                    </li>
                    <li className="font-semibold">
                        <span className="block mb-2 text-gray-800">멘토링 및 프로젝트</span>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li><Link to="/mypage/mentoring">멘토링 이력</Link></li>
                            <li><Link to="/mypage/projects">팀 프로젝트 이력</Link></li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default MyPageSidebar;