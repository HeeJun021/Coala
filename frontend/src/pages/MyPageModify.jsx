import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import InfoCard from '../components/InfoCard';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import { deleteUser, logoutUser } from '../api/authApi';

const MyPageModify = () => {
  const { userData, setUserData } = useOutletContext();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 계정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteUser(userData.user_id);
      await logoutUser();
      window.location.href = "/";
    } catch (error) {
      console.error("계정 탈퇴 실패:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 사이드바 자리 (비워두기 가능) */}
      <div className="w-[250px]"></div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-4xl">
          {/* 상단 제목 */}
          <header className="p-6">
            <h1 className="text-2xl font-bold text-left">
              {userData?.nickname} 님의 페이지
            </h1>
          </header>

          {/* 사용자 정보 및 계정 정보 */}
          <main className="flex flex-col items-start gap-6">
            {/* 프로필 카드 */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full">
              <ProfileCard userData={userData} setUserData={setUserData} />
            </div>

            {/* 계정 정보 카드 */}
            <div className="flex flex-col w-full">
              <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full">
                <InfoCard userData={userData} setUserData={setUserData} />
              </div>

              {/* 계정 탈퇴 버튼 */}
              <div className="mt-4 self-end">
                <button
                  className="text-gray-400 font-bold hover:text-red-500 text-sm"
                  onClick={() => setIsDialogOpen(true)}
                >
                  계정 탈퇴 &gt;
                </button>
              </div>
            </div>
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
