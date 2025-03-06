import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MyPageSidebar from '../Layout/MyPageSideBar';
import MyPageHome from './MyPageHome';
import MyPageModify from './MyPageModify';
import MyPageSetting from './MyPageSetting';

const MyPage = ({ userData, setUserData }) => {
    console.log("MyPage.js → userData:", userData);

    return (
        <div className="flex w-full items-start ">  
            {/* 왼쪽 사이드바 */}
            <MyPageSidebar userData={userData}/>

            {/* 오른쪽 콘텐츠 (자동으로 확장됨) */}
            <main className="flex-1 p-6">  
                <Routes>
                    <Route path="/" element={<MyPageHome userData={userData} />} />
                    <Route path="/modify" element={<MyPageModify userData={userData} setUserData={setUserData} />} />
                    <Route path="/setting" element={<MyPageSetting userData={userData} />} />
                </Routes>
            </main>
        </div>
    );
    
};

export default MyPage;
