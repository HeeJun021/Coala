import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MyPageSidebar from '../Layout/MyPageSideBar';
import MyPageHome from './MyPageHome';
import MyPageModify from './MyPageModify';
import MyPageSetting from './MyPageSetting';

const MyPage = () => {
    return (
        <div className="flex">
            {/* 공통 사이드바 */}
            <MyPageSidebar />
                
            {/* 라우팅 영역 */}
            <main className="flex-1 p-6">
                <Routes>
                    {/* 상대 경로 사용 */}
                    <Route path="/" element={<MyPageHome />} />
                    <Route path="/modify" element={<MyPageModify />} />
                    <Route path="/setting" element={<MyPageSetting />} />
                    {/* 다른 경로 추가 가능 */}
                </Routes>
            </main>
        </div>
    );
};

export default MyPage;
