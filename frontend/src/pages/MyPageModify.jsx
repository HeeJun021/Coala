import React, { useState, useEffect } from 'react';
import MyPageSidebar from '../components/MyPageSideBar';
import ProfileCard from '../components/ProfileCard';
import InfoCard from '../components/InfoCard';
import koala from '../assets/koala.jpg';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import { getUserById } from '../api/user';

const MyPageModify = () => {
    const [userData, setUserData] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const userId = 1; // 테스트용 사용자 ID

    // 사용자 데이터
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = await getUserById(userId);
                
                console.log("API 응답 데이터 user", user)

                setUserData({
                    profile_image_url: koala, // 프로필 이미지 기본값
                    nickname: user.nickname,
                    bio: "안녕하세요.", // bio는 더미 데이터로 추가
                    role: "프론트 엔드", // 역할 기본값 추가
                });
                setUserInfo({
                    userId: user.user_id,
                    hashedPassword: "********", // 보안 상 비밀번호는 숨김 처리
                    email: user.email,
                    phone: user.phone_number,
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false); // 로딩 상태 해제
            }
        };
        fetchUserData();
    }, []);

    const handleDeleteAccount = (password) => { //여기에다가 계정 탈퇴 로직 넣으면 됨
        alert(`계정 탈퇴 요청! 입력한 비밀번호: ${password}`);
        setIsDialogOpen(false); // 다이얼로그 닫기
    };

    // 로딩 중일 때
    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex bg-[#F8F3E2] min-h-screen">
            {/* 사이드바 */}
            <MyPageSidebar />

            {/* 메인 콘텐츠 */}
            <div className="flex-1 p-6 ml-10">
                {/* 상단 제목 */}
                <header className="p-6">
                    <h1 className="text-2xl font-bold text-left">
                        {userData.nickname} 님의 페이지
                    </h1>
                </header>

                {/* 사용자 정보와 계정 정보 섹션 */}
                <main className="flex flex-col items-start gap-6">
                    {/* 사용자 정보 섹션 */}
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-2xl">
                        <ProfileCard
                            userId={userInfo.userId}
                            nickname={userData.nickname}
                            bio={userData.bio}
                            role={userData.role}
                            profile_image_url={userData.profile_image_url}
                        />
                    </div>
                    <div className="flex flex-col w-full max-w-2xl">
                        {/* 계정 정보 섹션 */}
                        <div className=" bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-2xl">
                            <InfoCard
                                userId={userInfo.userId}
                                hashedPassword={userInfo.hashedPassword}
                                email={userInfo.email}
                                phone={userInfo.phone}
                                isEmailVerified={false}
                            />  
                        </div>    
                        {/* ✅ 계정 탈퇴 버튼 추가 */}
                        <div className="mt-2 self-end">
                        <button
                                className="text-gray-400 font-bold hover:text-red-500 text-sm"
                                onClick={() => setIsDialogOpen(true)} // ✅ 클릭 시 다이얼로그 열기
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
