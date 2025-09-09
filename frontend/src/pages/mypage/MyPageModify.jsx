// src/pages/mypage/MyPageModify.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";
import ProfileCard from "../../components/mypage/ProfileCard";
import InfoCard from "../../components/mypage/InfoCard";
import DeleteAccountDialog from "../../components/mypage/DeleteAccountDialog";
import { deleteUser, logoutUser } from "../../api/authApi";

// ✅ 고정 규격 사이드바 (left≈70px, w=260px, top=120px)
import MyPageSidebar from "../../Layout/MyPageSideBar";

const MyPageModify = () => {
  const { userData, setUserData } = useOutletContext();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 계정을 삭제하시겠습니까?")) return;
    try {
      await deleteUser(userData.user_id);
      await logoutUser();
      window.location.href = "/";
    } catch (error) {
      console.error("계정 탈퇴 실패:", error);
    }
  };

  return (
    // ✅ 전체 레이아웃 컨테이너
    <div className="relative min-h-screen">

      {/* ✅ 본문: 좌측 패딩으로 사이드바 공간 확보(pl-[164px]) */}
      <div className="w-full min-h-screen pt-4 pl-[164px]">
        {/* 본문 카드 컨테이너: 통일 규격 (max-w-6xl, pt-8 mt-8, white rounded-2xl) */}
        <div className="max-w-5xl mx-auto mt-3 bg-white shadow-xl rounded-2xl border border-gray-300 p-7">
          {/* 상단 제목 */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {userData?.nickname} 님의 페이지
            </h1>
          </header>

          {/* 콘텐츠 블럭들 */}
          <main className="flex flex-col gap-6">
            {/* 프로필 카드 */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <ProfileCard userData={userData} setUserData={setUserData} />
            </section>

            {/* 계정 정보 + 탈퇴 버튼 */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <InfoCard userData={userData} setUserData={setUserData} />

              {/* 우하단 링크 스타일 버튼 */}
              <div className="mt-4 flex justify-end">
                <button
                  className="text-gray-400 font-bold hover:text-red-500 text-sm"
                  onClick={() => setIsDialogOpen(true)}
                >
                  계정 탈퇴 &gt;
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* 계정 탈퇴 다이얼로그 */}
      <DeleteAccountDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default MyPageModify;
