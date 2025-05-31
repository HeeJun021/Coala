import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import MyPageSidebar from '../Layout/MyPageSideBar';
import { getCurrentUser } from '../api/authApi';

const MyPage = ({ userData, setUserData }) => {
  useEffect(() => {
    const refetchUser = async () => {
      try {
        const freshUser = await getCurrentUser();
        setUserData({
          user_id: freshUser.user_id,
          email: freshUser.email,
          nickname: freshUser.nickname || "사용자",
          profile_image_url: freshUser.profile_image_url || "assets/koala.jpg",
          bio: freshUser.bio || "",
          rating: freshUser.rating || 1000,
          tier_id: freshUser.tier_id || 1,
          dailycheck: freshUser.dailycheck || false,
          email_verified: freshUser.email_verified || false,
          created_at: freshUser.created_at,
          updated_at: freshUser.updated_at,
          tier_name: freshUser.tier?.tier_name || "초급",
          is_admin: freshUser.is_admin || false,
          eucalyptus_balance: freshUser.eucalyptus_balance ?? 0,
        });
      } catch (err) {
        console.error("❌ 마이페이지 유저 갱신 실패:", err);
      }
    };

    refetchUser(); // 마이페이지 진입 시 유저 정보 갱신
  }, [setUserData]);

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
