import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MyPageSidebar from '../Layout/MyPageSideBar';
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
            await deleteUser(userData.user_id); // ✅ 백엔드에 탈퇴 요청
            alert("계정이 성공적으로 삭제되었습니다.");

            // ✅ 탈퇴 후 로그아웃
            await logoutUser();
            window.location.href = "/"; // ✅ 홈으로 이동
        } catch (error) {
            console.error("계정 탈퇴 실패:", error);
            alert(error.response?.data?.detail || "계정 탈퇴에 실패했습니다.");
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className="w-[250px]">
                <MyPageSidebar userData={userData} />
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 p-6 ml-10">
                {/* 상단 제목 */}
                <header className="p-6">
                    <h1 className="text-2xl font-bold text-left">
                        {userData?.nickname} 님의 페이지
                    </h1>
                </header>

                {/* 사용자 정보와 계정 정보 섹션 */}
                <main className="flex flex-col items-start gap-6">
                    {/* 사용자 정보 섹션 */}
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-2xl">
                        <ProfileCard userData={userData} setUserData={setUserData} />
                    </div>
                    <div className="flex flex-col w-full max-w-2xl">
                        {/* 계정 정보 섹션 */}
                        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-2xl">
                            <InfoCard userData={userData} setUserData={setUserData} />
                        </div>
                        {/* ✅ 계정 탈퇴 버튼 추가 */}
                        <div className="mt-2 self-end">
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

            {/* ✅ 다이얼로그 컴포넌트 사용 */}
            <DeleteAccountDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={handleDeleteAccount}
            />
        </div>
    );
};

export default MyPageModify;
