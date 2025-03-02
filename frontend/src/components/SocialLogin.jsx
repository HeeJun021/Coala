import React from "react";

const SOCIAL_LOGIN_URLS = {
    google: "http://127.0.0.1:8000/auth/social/google/login",
    kakao: "http://127.0.0.1:8000/auth/social/kakao/login",
    github: "http://127.0.0.1:8000/auth/social/github/login",
    apple: "http://127.0.0.1:8000/auth/social/apple/login",
};

const SocialLogin = () => {
    const handleSocialLogin = (provider) => {
        window.location.href = SOCIAL_LOGIN_URLS[provider];
    };

    return (
        <div className="flex gap-5 justify-center">
            {/* 카카오 로그인 */}
            <button onClick={() => handleSocialLogin("kakao")} className="w-12 h-12 bg-white p-2 rounded-lg shadow-md border">
                <img src="/assets/kakao_login.png" alt="카카오 로그인" className="w-8 h-8" />
            </button>

            {/* 구글 로그인 */}
            <button onClick={() => handleSocialLogin("google")} className="w-12 h-12 bg-white p-2 rounded-lg shadow-md border">
                <img src="/assets/google_login.png" alt="구글 로그인" className="w-8 h-8" />
            </button>

            {/* 깃허브 로그인 */}
            <button onClick={() => handleSocialLogin("github")} className="w-12 h-12 bg-white p-2 rounded-lg shadow-md">
                <img src="/assets/github_login.png" alt="깃허브 로그인" className="w-8 h-8" />
            </button>

            {/* 애플 로그인 */}
            <button onClick={() => handleSocialLogin("apple")} className="w-12 h-12 bg-white p-2 rounded-lg shadow-md border">
                <img src="/assets/apple_login.png" alt="애플 로그인" className="w-8 h-8" />
            </button>
        </div>
    );
};

export default SocialLogin;
