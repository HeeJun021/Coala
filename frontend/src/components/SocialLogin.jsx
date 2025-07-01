import React from "react";

const SOCIAL_LOGIN_URLS = {
    kakao: "http://127.0.0.1:8000/auth/social/kakao/login",
    naver: "http://127.0.0.1:8000/auth/social/naver/login",
    google: "http://127.0.0.1:8000/auth/social/google/login",
    github: "http://127.0.0.1:8000/auth/social/github/login",
};

const SocialLogin = () => {
    const handleSocialLogin = (provider) => {
        window.location.href = SOCIAL_LOGIN_URLS[provider];
    };

    return (
        <div className="flex gap-5 justify-center">
    {/* 카카오 로그인 (아이콘 크기 키움 + 보더 제거) */}
    <button onClick={() => handleSocialLogin("kakao")} className="w-12 h-12 bg-white p-2 rounded-2xl shadow-md">
        <img src="/assets/kakao_login.png" alt="카카오 로그인" className="w-8 h-8 rounded-full" />
    </button>

    {/* 네이버 로그인 (보더 제거) */}
    <button onClick={() => handleSocialLogin("naver")} className="w-12 h-12 bg-white p-2 rounded-2xl shadow-md">
        <img src="/assets/naver_login.png" alt="네이버 로그인" className="w-8 h-8 rounded-full" />
    </button>

    {/* 구글 로그인 (보더 제거) */}
    <button onClick={() => handleSocialLogin("google")} className="w-12 h-12 bg-white p-2 rounded-2xl shadow-md">
        <img src="/assets/google_login.png" alt="구글 로그인" className="w-8 h-8 rounded-full" />
    </button>

    {/* 깃허브 로그인 (보더 제거) */}
    <button onClick={() => handleSocialLogin("github")} className="w-12 h-12 bg-white p-2 rounded-2xl shadow-md">
        <img src="/assets/github_login.png" alt="깃허브 로그인" className="w-8 h-8 rounded-full" />
    </button>
</div>



    );
};

export default SocialLogin;
