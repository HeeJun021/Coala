import React from 'react';
import MyPageSidebar from '../components/MyPageSideBar';
import ProfileCard from '../components/ProfileCard';
import InfoCard from '../components/InfoCard';
import koala from '../assets/koala.jpg';

const MyPageHome = () => {
    // 사용자 데이터
    const userData = {
        profile_image_url: koala,
        username: "김희준",
        bio: "안녕하세요.",
        role: "프론트 엔드",
    };

    const userInfo = {
        userId: "ABC1234",
        hashedPassword: "********",
        email: "LEE123@NAVER.COM",
        phone: "010-1234-1234",
    };

    return (
        <div className="flex bg-[#F8F3E2] min-h-screen">
            {/* 사이드바 */}
            <MyPageSidebar />

            {/* 메인 콘텐츠 */}
            <div className="flex-1 p-6 ml-10">
                {/* 상단 제목 */}
                <header className="p-6">
                    <h1 className="text-2xl font-bold text-left">
                        {userData.username} 님의 페이지
                    </h1>
                </header>

                {/* 사용자 정보와 계정 정보 섹션 */}
                <main className="flex flex-col items-start gap-6">
                    {/* 사용자 정보 섹션 */}
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-2xl">
                        <ProfileCard
                            username={userData.username}
                            bio={userData.bio}
                            role={userData.role}
                            profile_image_url={userData.profile_image_url}
                        />
                    </div>

                    {/* 계정 정보 섹션 */}
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-2xl">
                        <InfoCard
                            userId={userInfo.userId}
                            hashedPassword={userInfo.hashedPassword}
                            email={userInfo.email}
                            phone={userInfo.phone}
                            isEmailVerified={false}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MyPageHome;
