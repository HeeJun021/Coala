import React from 'react';
import { Outlet } from 'react-router-dom';
import MyPageSidebar from '../Layout/MyPageSideBar';

const MyPage = ({ userData, setUserData }) => {
  console.log("MyPage.js → userData:", userData);

  return (
    <div className="flex w-full items-start">
      {/* 왼쪽 사이드바 */}
      <MyPageSidebar userData={userData} />

      {/* 오른쪽 콘텐츠 (Outlet으로 중첩 경로 출력) */}
      <main className="flex-1 p-6">
        <Outlet context={{ userData, setUserData }} />
      </main>
    </div>
  );
};

export default MyPage;
