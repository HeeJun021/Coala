import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { loginUser } from "../api/authApi"; // ✅ 로그인 API 경로 수정

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ 로그인 처리 함수
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      alert("로그인 성공!");
      navigate("/");  // ✅ 로그인 후 홈으로 이동
      window.location.reload();  // ✅ 네비게이션 업데이트 (JWT 적용)
    } catch (error) {
      alert("로그인 실패: " + (error.response?.data?.detail || "오류 발생"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen mt-[-70px]">
      <div className="bg-white p-16 rounded-lg shadow-lg w-full max-w-[450px] text-left">
        {/* 타이틀 */}
        <h2 className="text-3xl font-extrabold text-center mb-6 text-navbar">
          로그인
        </h2>
        <p className="text-center text-dark mb-8">
          Coala에 오신 것을 환영합니다!
        </p>

        {/* 로그인 폼 */}
        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
          {/* 이메일 입력 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaEnvelope className="text-dark mr-2" />
            <input
              type="text"
              name="email"
              placeholder="이메일"
              className="w-full p-2 h-10 outline-none text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaLock className="text-dark mr-2" />
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              className="w-full p-2 h-10 outline-none text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 로그인 버튼 */}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-green-400 shadow-lg w-full"
            >
              로그인
            </button>
          </div>
        </form>

        {/* 회원가입 | 비밀번호 찾기 */}
        <div className="flex justify-center gap-6 mt-8 text-dark text-sm">
          <Link to="/signup" className="hover:underline">
            회원가입
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/forgot-password" className="hover:underline">
            비밀번호 찾기
          </Link>
        </div>

        {/* 간편 로그인 구분선 */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500 text-sm">간편 로그인</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* 간편 로그인 아이콘 */}
        <div className="flex gap-5 justify-center">
          {/* 카카오 로그인 */}
          <button className="flex items-center justify-center w-12 h-12 bg-white p-2 rounded-lg shadow-md border">
            <img
              src="/assets/kakao_login.png"
              alt="카카오 로그인"
              className="w-8 h-8"
            />
          </button>

          {/* 구글 로그인 */}
          <button className="flex items-center justify-center w-12 h-12 bg-white p-2 rounded-lg shadow-md border">
            <img
              src="/assets/google_login.png"
              alt="구글 로그인"
              className="w-8 h-8"
            />
          </button>

          {/* 깃허브 로그인 */}
          <button className="flex items-center justify-center w-12 h-12 bg-white p-2 rounded-lg shadow-md">
            <img
              src="/assets/github_login.png"
              alt="깃허브 로그인"
              className="w-8 h-8"
            />
          </button>

          {/* 애플 로그인 */}
          <button className="flex items-center justify-center w-12 h-12 bg-white p-2 rounded-lg shadow-md border">
            <img
              src="/assets/apple_login.png"
              alt="애플 로그인"
              className="w-8 h-8"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
