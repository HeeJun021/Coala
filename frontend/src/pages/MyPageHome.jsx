import React from 'react';
//import ProfileCard from '../components/ProfileCard';
import koala from '../assets/koala.jpg'

const MyPageHome = () => {
    //명시적 설정
    const userData = {
        profile_image_url:koala,
        username: "김희준",
        bio: "안녕하세요.",
        role: "프론트 엔드"
        
    };
    
    return (
        <div>
        {/* 상단 제목 */}
        <header className="p-6 ml-10">
            <h1 className="text-2xl font-bold text-left">
                {userData.username} 님의 페이지
            </h1>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex items-center justify-start ml-10">
                
        </main>
    </div>
    );
};

export default MyPageHome;
